from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import bcrypt
from jose import JWTError, jwt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Stage definitions
STAGES = {
    1: {"name": "First Contact"},
    2: {"name": "Technical Discussion"},
    3: {"name": "Pricing Proposal"},
    4: {"name": "Negotiation"},
    5: {"name": "Converted Client"}
}

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Import Google services after loading env
try:
    import sys
    sys.path.append(str(ROOT_DIR))
    from google_services import google_service
    GOOGLE_ENABLED = True
    print("Google services loaded successfully")
except ImportError as e:
    print(f"Google services not available: {e}")
    GOOGLE_ENABLED = False
    google_service = None

# Enums
class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    BDE = "bde"

class ClientStage(int, Enum):
    FIRST_CONTACT = 1
    TECHNICAL_DISCUSSION = 2
    PRICING_PROPOSAL = 3
    NEGOTIATION = 4
    CONVERTED_CLIENT = 5

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    role: UserRole
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    google_credentials: Optional[Dict[str, Any]] = None
    google_connected: bool = False

class UserCreate(BaseModel):
    email: str
    name: str
    password: str
    role: UserRole

class UserLogin(BaseModel):
    email: str
    password: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class Client(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_name: str
    contact_person: str
    email: str
    phone: str
    industry: str
    company_size: str
    source: str = "Direct"  # How they found us
    referrer_name: Optional[str] = None  # When source is referral
    budget: Optional[float] = None
    budget_currency: str = "USD"
    requirements: Optional[str] = None  # Changed from technology_needs
    estimated_timeline: Optional[str] = None
    decision_maker_details: Optional[str] = None
    stage: ClientStage = ClientStage.FIRST_CONTACT
    assigned_bde: str  # User ID
    notes: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_interaction: datetime = Field(default_factory=datetime.utcnow)
    is_dropped: bool = False
    drop_reason: Optional[str] = None

class ClientCreate(BaseModel):
    company_name: str
    contact_person: str
    email: str
    phone: str
    industry: str
    company_size: str
    source: str = "Direct"
    referrer_name: Optional[str] = None
    budget: Optional[float] = None
    budget_currency: str = "USD"
    requirements: Optional[str] = None
    estimated_timeline: Optional[str] = None
    decision_maker_details: Optional[str] = None
    assigned_bde: str
    notes: List[str] = []

class ClientUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    source: Optional[str] = None
    referrer_name: Optional[str] = None
    budget: Optional[float] = None
    budget_currency: Optional[str] = None
    requirements: Optional[str] = None
    estimated_timeline: Optional[str] = None
    decision_maker_details: Optional[str] = None
    stage: Optional[ClientStage] = None
    assigned_bde: Optional[str] = None
    is_dropped: Optional[bool] = None
    drop_reason: Optional[str] = None

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    client_id: str
    assigned_to: str  # User ID
    created_by: str  # User ID
    deadline: datetime
    status: str = "pending"  # pending, done, overdue
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    client_id: str
    assigned_to: str
    deadline: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class DashboardStats(BaseModel):
    total_clients: int
    clients_by_stage: Dict[int, int]
    dropped_clients: int
    pending_tasks: int
    overdue_tasks: int

# Utility functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user_doc = await db.users.find_one({"id": user_id})
    if user_doc is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)

def check_permissions(required_roles: List[UserRole]):
    def decorator(current_user: User = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return decorator

# Authentication Routes
@api_router.get("/")
async def root():
    return {"message": "Client Tracker CRM API"}

@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate, current_user: User = Depends(check_permissions([UserRole.SUPER_ADMIN, UserRole.ADMIN]))):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Admin can't create other admins or super admins
    if current_user.role == UserRole.ADMIN and user_data.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Admins cannot create admin users")
    
    # Create user
    user_dict = user_data.dict()
    user_dict["password"] = hash_password(user_data.password)
    user = User(**{k: v for k, v in user_dict.items() if k != "password"})
    
    await db.users.insert_one({**user.dict(), "password": user_dict["password"]})
    return user

@api_router.post("/auth/login", response_model=Token)
async def login(login_data: UserLogin):
    user_doc = await db.users.find_one({"email": login_data.email})
    if not user_doc or not verify_password(login_data.password, user_doc["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    user = User(**{k: v for k, v in user_doc.items() if k != "password"})
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Inactive user")
    
    access_token = create_token(data={"sub": user.id})
    return Token(access_token=access_token, token_type="bearer", user=user)

# Create initial super admin if none exists
@api_router.post("/auth/init-super-admin")
async def init_super_admin():
    existing_super_admin = await db.users.find_one({"role": UserRole.SUPER_ADMIN})
    if existing_super_admin:
        raise HTTPException(status_code=400, detail="Super admin already exists")
    
    super_admin = User(
        email="admin@crm.com",
        name="Super Admin",
        role=UserRole.SUPER_ADMIN
    )
    
    await db.users.insert_one({
        **super_admin.dict(),
        "password": hash_password("admin123")
    })
    
    return {"message": "Super admin created", "email": "admin@crm.com", "password": "admin123"}

# Client Routes
@api_router.post("/clients", response_model=Client)
async def create_client(client_data: ClientCreate, current_user: User = Depends(get_current_user)):
    client = Client(**client_data.dict())
    await db.clients.insert_one(client.dict())
    
    # Send notification
    await send_notification(f"🎉 New client added: {client.company_name} by {current_user.name}")
    
    return client

@api_router.get("/clients", response_model=List[Client])
async def get_clients(current_user: User = Depends(get_current_user)):
    query = {}
    
    # BDE can only see their clients
    if current_user.role == UserRole.BDE:
        query["assigned_bde"] = current_user.id
    
    clients = await db.clients.find(query).to_list(1000)
    return [Client(**client) for client in clients]

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str, current_user: User = Depends(get_current_user)):
    client_doc = await db.clients.find_one({"id": client_id})
    if not client_doc:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client = Client(**client_doc)
    
    # BDE can only see their clients
    if current_user.role == UserRole.BDE and client.assigned_bde != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return client

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, update_data: ClientUpdate, current_user: User = Depends(get_current_user)):
    client_doc = await db.clients.find_one({"id": client_id})
    if not client_doc:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client = Client(**client_doc)
    
    # BDE can only update their clients
    if current_user.role == UserRole.BDE and client.assigned_bde != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    update_dict["last_interaction"] = datetime.utcnow()
    
    await db.clients.update_one({"id": client_id}, {"$set": update_dict})
    
    # Send notification for important updates
    if "stage" in update_dict:
        stage_name = STAGES.get(update_dict["stage"], {}).get("name", f"Stage {update_dict['stage']}")
        await send_notification(f"📈 {client.company_name} moved to {stage_name} by {current_user.name}")
    elif "is_dropped" in update_dict and update_dict["is_dropped"]:
        await send_notification(f"❌ {client.company_name} marked as dropped by {current_user.name}")
    else:
        await send_notification(f"✏️ {client.company_name} updated by {current_user.name}")
    
    updated_client_doc = await db.clients.find_one({"id": client_id})
    return Client(**updated_client_doc)

@api_router.post("/clients/{client_id}/notes")
async def add_note(client_id: str, note: dict, current_user: User = Depends(get_current_user)):
    client_doc = await db.clients.find_one({"id": client_id})
    if not client_doc:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client = Client(**client_doc)
    
    # BDE can only add notes to their clients
    if current_user.role == UserRole.BDE and client.assigned_bde != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    new_note = f"{datetime.utcnow().strftime('%Y-%m-%d %H:%M')} - {current_user.name}: {note['text']}"
    
    # Add note to the beginning (latest first)
    await db.clients.update_one(
        {"id": client_id}, 
        {"$push": {"notes": {"$each": [new_note], "$position": 0}}, "$set": {"last_interaction": datetime.utcnow()}}
    )
    
    # Send notification
    await send_notification(f"📝 Note added to {client.company_name} by {current_user.name}")
    
    return {"message": "Note added successfully"}

# Simple notification system (can be replaced with Slack/Discord webhook)
async def send_notification(message: str):
    """Send notification to Slack webhook"""
    try:
        import requests
        import json
        
        slack_webhook_url = os.environ.get('SLACK_WEBHOOK_URL')
        
        if slack_webhook_url:
            # Send to Slack
            payload = {
                "text": f"🚀 *Client Tracker CRM* | {message}",
                "username": "CRM Bot",
                "icon_emoji": ":briefcase:"
            }
            
            response = requests.post(
                slack_webhook_url,
                data=json.dumps(payload),
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                logger.info(f"Slack notification sent: {message}")
            else:
                logger.error(f"Failed to send Slack notification: {response.status_code}")
        
        # Also log the notification
        logger.info(f"NOTIFICATION: {message}")
        
    except Exception as e:
        logger.error(f"Failed to send notification: {e}")

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, current_user: User = Depends(get_current_user)):
    """Delete a client (only Super Admin can delete)"""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can delete clients")
    
    client_doc = await db.clients.find_one({"id": client_id})
    if not client_doc:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Delete the client
    await db.clients.delete_one({"id": client_id})
    
    # Also delete related tasks
    await db.tasks.delete_many({"client_id": client_id})
    
    # Send notification
    await send_notification(f"🗑️ Client {client_doc['company_name']} deleted by {current_user.name}")
    
    return {"message": "Client deleted successfully"}

# Task Routes
@api_router.post("/tasks", response_model=Task)
async def create_task(task_data: TaskCreate, current_user: User = Depends(get_current_user)):
    task = Task(**task_data.dict(), created_by=current_user.id)
    await db.tasks.insert_one(task.dict())
    
    # Get client info for notification
    client_doc = await db.clients.find_one({"id": task.client_id})
    client_name = client_doc["company_name"] if client_doc else "Unknown Client"
    
    # Get assigned user info
    assigned_user_doc = await db.users.find_one({"id": task.assigned_to})
    assigned_user_name = assigned_user_doc["name"] if assigned_user_doc else "Unknown User"
    
    # Send notification
    await send_notification(f"📋 New task '{task.title}' assigned to {assigned_user_name} for {client_name} by {current_user.name}")
    
    return task

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(current_user: User = Depends(get_current_user)):
    query = {}
    
    # BDE can see tasks assigned to them and tasks for their clients
    if current_user.role == UserRole.BDE:
        client_ids = [doc["id"] for doc in await db.clients.find({"assigned_bde": current_user.id}).to_list(1000)]
        query = {
            "$or": [
                {"assigned_to": current_user.id},
                {"client_id": {"$in": client_ids}},
                {"created_by": current_user.id}  # Also see tasks they created
            ]
        }
    
    tasks = await db.tasks.find(query).to_list(1000)
    return [Task(**task) for task in tasks]

@api_router.get("/users/all", response_model=List[User])
async def get_all_users(current_user: User = Depends(get_current_user)):
    """Get all users for task assignment"""
    users = await db.users.find({"is_active": True}, {"password": 0}).to_list(1000)
    return [User(**user) for user in users]

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_user)):
    """Delete a user (only Super Admin can delete)"""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can delete users")
    
    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    # Find the user to delete
    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_to_delete = User(**{k: v for k, v in user_doc.items() if k != "password"})
    
    # Check if user has assigned clients
    assigned_clients = await db.clients.find({"assigned_bde": user_id}).to_list(1000)
    if assigned_clients:
        client_names = [client["company_name"] for client in assigned_clients]
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete user. User has {len(assigned_clients)} assigned clients: {', '.join(client_names[:3])}{'...' if len(client_names) > 3 else ''}"
        )
    
    # Check if user has assigned tasks
    assigned_tasks = await db.tasks.find({"assigned_to": user_id}).to_list(1000)
    if assigned_tasks:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete user. User has {len(assigned_tasks)} assigned tasks. Please reassign tasks first."
        )
    
    # Delete the user
    await db.users.delete_one({"id": user_id})
    
    # Delete tasks created by this user
    await db.tasks.delete_many({"created_by": user_id})
    
    # Send notification
    await send_notification(f"👤 User {user_to_delete.name} ({user_to_delete.email}) deleted by {current_user.name}")
    
    return {"message": f"User {user_to_delete.name} deleted successfully"}

@api_router.put("/tasks/{task_id}/status")
async def update_task_status(task_id: str, status_data: dict, current_user: User = Depends(get_current_user)):
    task_doc = await db.tasks.find_one({"id": task_id})
    if not task_doc:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = Task(**task_doc)
    
    # Check permissions
    if current_user.role == UserRole.BDE:
        if task.assigned_to != current_user.id:
            # Check if task is for their client
            client_doc = await db.clients.find_one({"id": task.client_id})
            if not client_doc or client_doc["assigned_bde"] != current_user.id:
                raise HTTPException(status_code=403, detail="Access denied")
    
    await db.tasks.update_one({"id": task_id}, {"$set": {"status": status_data["status"]}})
    return {"message": "Task status updated"}

# Dashboard Routes
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    query = {}
    
    # BDE can only see their stats
    if current_user.role == UserRole.BDE:
        query["assigned_bde"] = current_user.id
    
    # Get clients
    clients = await db.clients.find(query).to_list(1000)
    
    # Calculate stats
    total_clients = len([c for c in clients if not c.get("is_dropped", False)])
    dropped_clients = len([c for c in clients if c.get("is_dropped", False)])
    
    clients_by_stage = {}
    for stage in ClientStage:
        clients_by_stage[stage.value] = len([c for c in clients if c.get("stage") == stage.value and not c.get("is_dropped", False)])
    
    # Get tasks
    task_query = {}
    if current_user.role == UserRole.BDE:
        client_ids = [c["id"] for c in clients]
        task_query = {
            "$or": [
                {"assigned_to": current_user.id},
                {"client_id": {"$in": client_ids}}
            ]
        }
    
    tasks = await db.tasks.find(task_query).to_list(1000)
    pending_tasks = len([t for t in tasks if t.get("status") == "pending"])
    
    # Safe datetime parsing for overdue tasks
    overdue_tasks = 0
    for task in tasks:
        if task.get("status") == "pending":
            try:
                # Parse deadline safely
                deadline_str = task.get("deadline", "")
                if isinstance(deadline_str, str):
                    # Handle different datetime formats
                    if deadline_str.endswith("Z"):
                        deadline_str = deadline_str.replace("Z", "+00:00")
                    deadline = datetime.fromisoformat(deadline_str.replace("Z", ""))
                elif hasattr(deadline_str, 'isoformat'):
                    deadline = deadline_str
                else:
                    continue
                
                if deadline < datetime.utcnow():
                    overdue_tasks += 1
            except (ValueError, TypeError, AttributeError):
                # Skip invalid datetime entries
                continue
    
    return DashboardStats(
        total_clients=total_clients,
        clients_by_stage=clients_by_stage,
        dropped_clients=dropped_clients,
        pending_tasks=pending_tasks,
        overdue_tasks=overdue_tasks
    )

# User management routes
@api_router.get("/users", response_model=List[User])
async def get_users(current_user: User = Depends(check_permissions([UserRole.SUPER_ADMIN, UserRole.ADMIN]))):
    users = await db.users.find({}, {"password": 0}).to_list(1000)
    return [User(**user) for user in users]

@api_router.get("/users/bdes", response_model=List[User])
async def get_bdes(current_user: User = Depends(get_current_user)):
    bdes = await db.users.find({"role": UserRole.BDE}, {"password": 0}).to_list(1000)
    return [User(**user) for user in bdes]

@api_router.post("/auth/change-password")
async def change_password(password_data: PasswordChange, current_user: User = Depends(get_current_user)):
    """Change user password"""
    # Get current user with password
    user_doc = await db.users.find_one({"id": current_user.id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not verify_password(password_data.current_password, user_doc["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    new_password_hash = hash_password(password_data.new_password)
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"password": new_password_hash}}
    )
    
    return {"message": "Password changed successfully"}

@api_router.get("/auth/profile", response_model=User)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return current_user

@api_router.put("/auth/profile", response_model=User)
async def update_profile(profile_data: dict, current_user: User = Depends(get_current_user)):
    """Update user profile"""
    # Only allow updating name and email
    allowed_fields = {"name", "email"}
    update_dict = {k: v for k, v in profile_data.items() if k in allowed_fields and v is not None}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    # Check if email is already taken by another user
    if "email" in update_dict:
        existing_user = await db.users.find_one({"email": update_dict["email"], "id": {"$ne": current_user.id}})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already in use")
    
    # Update user
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": update_dict}
    )
    
    # Get updated user
    updated_user_doc = await db.users.find_one({"id": current_user.id}, {"password": 0})
    return User(**updated_user_doc)

# Google Workspace Integration Routes
@api_router.get("/google/auth-url")
async def get_google_auth_url(current_user: User = Depends(get_current_user)):
    """Get Google OAuth authorization URL"""
    if not GOOGLE_ENABLED:
        raise HTTPException(status_code=503, detail="Google integration not available")
    
    try:
        auth_url = google_service.get_authorization_url()
        return {"authorization_url": auth_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting auth URL: {str(e)}")

@api_router.post("/google/callback")
async def google_callback(code_data: dict, current_user: User = Depends(get_current_user)):
    """Handle Google OAuth callback"""
    if not GOOGLE_ENABLED:
        raise HTTPException(status_code=503, detail="Google integration not available")
    
    try:
        code = code_data.get("code")
        if not code:
            raise HTTPException(status_code=400, detail="Authorization code required")
        
        # Exchange code for tokens
        credentials = google_service.exchange_code_for_tokens(code)
        
        # Store credentials in user document
        await db.users.update_one(
            {"id": current_user.id},
            {
                "$set": {
                    "google_credentials": credentials,
                    "google_connected": True
                }
            }
        )
        
        # Create "Client Tracker" folder in Google Drive
        drive_folder_url = await google_service.create_drive_folder(
            credentials, 
            "Client Tracker"
        )
        
        return {
            "message": "Google Workspace connected successfully",
            "drive_folder_url": drive_folder_url
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error connecting Google: {str(e)}")

@api_router.post("/google/send-notification")
async def send_google_notification(
    notification_data: dict, 
    current_user: User = Depends(get_current_user)
):
    """Send notification to Google Chat"""
    if not GOOGLE_ENABLED:
        raise HTTPException(status_code=503, detail="Google integration not available")
    
    try:
        # Get user's Google credentials
        user_doc = await db.users.find_one({"id": current_user.id})
        if not user_doc or not user_doc.get("google_credentials"):
            raise HTTPException(status_code=400, detail="Google Workspace not connected")
        
        credentials = user_doc["google_credentials"]
        message = notification_data.get("message", "")
        
        # For now, we'll use a webhook URL or direct space name
        # In a real implementation, you'd store the space ID
        space_name = "spaces/YOUR_SPACE_ID"  # This needs to be configured
        
        success = await google_service.send_chat_notification(
            credentials, 
            space_name, 
            message
        )
        
        if success:
            return {"message": "Notification sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send notification")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending notification: {str(e)}")

@api_router.post("/google/create-calendar-event")
async def create_calendar_event(
    event_data: dict, 
    current_user: User = Depends(get_current_user)
):
    """Create a Google Calendar event"""
    if not GOOGLE_ENABLED:
        raise HTTPException(status_code=503, detail="Google integration not available")
    
    try:
        # Get user's Google credentials
        user_doc = await db.users.find_one({"id": current_user.id})
        if not user_doc or not user_doc.get("google_credentials"):
            raise HTTPException(status_code=400, detail="Google Workspace not connected")
        
        credentials = user_doc["google_credentials"]
        
        # Create calendar event
        event_url = await google_service.create_calendar_event(credentials, event_data)
        
        if event_url:
            return {"message": "Calendar event created", "event_url": event_url}
        else:
            raise HTTPException(status_code=500, detail="Failed to create calendar event")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating calendar event: {str(e)}")

@api_router.post("/google/send-email")
async def send_email(
    email_data: dict, 
    current_user: User = Depends(get_current_user)
):
    """Send email via Gmail"""
    if not GOOGLE_ENABLED:
        raise HTTPException(status_code=503, detail="Google integration not available")
    
    try:
        # Get user's Google credentials
        user_doc = await db.users.find_one({"id": current_user.id})
        if not user_doc or not user_doc.get("google_credentials"):
            raise HTTPException(status_code=400, detail="Google Workspace not connected")
        
        credentials = user_doc["google_credentials"]
        
        to_email = email_data.get("to")
        subject = email_data.get("subject")
        body = email_data.get("body")
        
        if not all([to_email, subject, body]):
            raise HTTPException(status_code=400, detail="Email requires to, subject, and body")
        
        success = await google_service.send_gmail(credentials, to_email, subject, body)
        
        if success:
            return {"message": "Email sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending email: {str(e)}")

@api_router.post("/google/create-client-folder")
async def create_client_folder(
    folder_data: dict, 
    current_user: User = Depends(get_current_user)
):
    """Create a client-specific folder in Google Drive"""
    if not GOOGLE_ENABLED:
        raise HTTPException(status_code=503, detail="Google integration not available")
    
    try:
        # Get user's Google credentials
        user_doc = await db.users.find_one({"id": current_user.id})
        if not user_doc or not user_doc.get("google_credentials"):
            raise HTTPException(status_code=400, detail="Google Workspace not connected")
        
        credentials = user_doc["google_credentials"]
        client_name = folder_data.get("client_name", "")
        
        if not client_name:
            raise HTTPException(status_code=400, detail="Client name required")
        
        # Create client folder
        folder_url = await google_service.create_drive_folder(
            credentials, 
            client_name
        )
        
        if folder_url:
            return {"message": "Client folder created", "folder_url": folder_url}
        else:
            raise HTTPException(status_code=500, detail="Failed to create client folder")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating client folder: {str(e)}")

# Enhanced client creation with Google integration
async def notify_client_activity(user_id: str, activity: str, client_name: str = ""):
    """Helper function to send notifications for client activities"""
    if not GOOGLE_ENABLED:
        return
    
    try:
        user_doc = await db.users.find_one({"id": user_id})
        if user_doc and user_doc.get("google_credentials"):
            message = f"🔔 CRM Activity: {activity}"
            if client_name:
                message += f" for {client_name}"
            
            # This would send to a configured chat space
            # For demo purposes, we'll just log it
            logger.info(f"Would send notification: {message}")
            
    except Exception as e:
        logger.error(f"Error sending notification: {e}")

# Override the original client creation to include notifications
@api_router.post("/clients/enhanced", response_model=Client)
async def create_client_enhanced(client_data: ClientCreate, current_user: User = Depends(get_current_user)):
    """Create client with Google Workspace integration"""
    client = Client(**client_data.dict())
    await db.clients.insert_one(client.dict())
    
    # Send notification
    await notify_client_activity(
        current_user.id, 
        "New client added", 
        client.company_name
    )
    
    # Create client folder in Google Drive
    if GOOGLE_ENABLED:
        try:
            user_doc = await db.users.find_one({"id": current_user.id})
            if user_doc and user_doc.get("google_credentials"):
                credentials = user_doc["google_credentials"]
                await google_service.create_drive_folder(
                    credentials, 
                    f"Client - {client.company_name}"
                )
        except Exception as e:
            logger.error(f"Error creating client folder: {e}")
    
    return client

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
