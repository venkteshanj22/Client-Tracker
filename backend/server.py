from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime
from enum import Enum


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Enums
class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    USER = "user"

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class StatusCategory(str, Enum):
    ACTIVE = "active"
    PENDING = "pending"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"


# Define User Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    role: UserRole = UserRole.USER
    phone: Optional[str] = None
    status: UserStatus = UserStatus.ACTIVE
    created_date: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    role: UserRole = UserRole.USER
    phone: Optional[str] = None
    status: UserStatus = UserStatus.ACTIVE

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    phone: Optional[str] = None
    status: Optional[UserStatus] = None


# Define Enhanced StatusCheck Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    status_category: StatusCategory = StatusCategory.ACTIVE
    description: Optional[str] = None
    assigned_user_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    updated_date: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    status_category: StatusCategory = StatusCategory.ACTIVE
    description: Optional[str] = None
    assigned_user_id: Optional[str] = None

class StatusCheckUpdate(BaseModel):
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    status_category: Optional[StatusCategory] = None
    description: Optional[str] = None
    assigned_user_id: Optional[str] = None


# Helper function to check if user exists and has required role
async def get_user_by_id(user_id: str) -> Optional[User]:
    user_data = await db.users.find_one({"id": user_id})
    if user_data:
        return User(**user_data)
    return None


# User Management Routes
@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    """Create a new user (requires super_admin role in real app)"""
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user_data.dict()
    user_obj = User(**user_dict)
    await db.users.insert_one(user_obj.dict())
    return user_obj

@api_router.get("/users", response_model=List[User])
async def get_users():
    """Get all users (requires super_admin role in real app)"""
    users = await db.users.find().to_list(1000)
    return [User(**user) for user in users]

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    """Get user by ID"""
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, user_update: UserUpdate):
    """Update user (requires super_admin role in real app)"""
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if email is being updated and already exists
    if user_update.email and user_update.email != user.email:
        existing_user = await db.users.find_one({"email": user_update.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    update_data = {k: v for k, v in user_update.dict().items() if v is not None}
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    # Return updated user
    updated_user = await get_user_by_id(user_id)
    return updated_user

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    """Delete user (requires super_admin role in real app)"""
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}


# Enhanced Status Check Routes
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    """Create a new status check"""
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks(
    category: Optional[StatusCategory] = None,
    assigned_user_id: Optional[str] = None,
    client_name: Optional[str] = None
):
    """Get status checks with optional filtering"""
    filter_query = {}
    
    if category:
        filter_query["status_category"] = category
    if assigned_user_id:
        filter_query["assigned_user_id"] = assigned_user_id
    if client_name:
        filter_query["client_name"] = {"$regex": client_name, "$options": "i"}
    
    status_checks = await db.status_checks.find(filter_query).sort("timestamp", -1).to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

@api_router.get("/status/{status_id}", response_model=StatusCheck)
async def get_status_check(status_id: str):
    """Get status check by ID"""
    status_check = await db.status_checks.find_one({"id": status_id})
    if not status_check:
        raise HTTPException(status_code=404, detail="Status check not found")
    return StatusCheck(**status_check)

@api_router.put("/status/{status_id}", response_model=StatusCheck)
async def update_status_check(status_id: str, status_update: StatusCheckUpdate):
    """Update status check"""
    existing_status = await db.status_checks.find_one({"id": status_id})
    if not existing_status:
        raise HTTPException(status_code=404, detail="Status check not found")
    
    update_data = {k: v for k, v in status_update.dict().items() if v is not None}
    if update_data:
        update_data["updated_date"] = datetime.utcnow()
        await db.status_checks.update_one({"id": status_id}, {"$set": update_data})
    
    # Return updated status check
    updated_status = await db.status_checks.find_one({"id": status_id})
    return StatusCheck(**updated_status)

@api_router.delete("/status/{status_id}")
async def delete_status_check(status_id: str):
    """Delete status check"""
    result = await db.status_checks.delete_one({"id": status_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Status check not found")
    
    return {"message": "Status check deleted successfully"}


# Analytics Routes
@api_router.get("/analytics/summary")
async def get_analytics_summary():
    """Get summary analytics"""
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"status": "active"})
    total_status_checks = await db.status_checks.count_documents({})
    
    # Status checks by category
    status_by_category = {}
    for category in StatusCategory:
        count = await db.status_checks.count_documents({"status_category": category.value})
        status_by_category[category.value] = count
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_status_checks": total_status_checks,
        "status_by_category": status_by_category
    }


# Basic Routes
@api_router.get("/")
async def root():
    return {"message": "ClientTracker API - User Management & Status Tracking"}

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