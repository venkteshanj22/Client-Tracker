# Supabase Migration Guide for Client Tracker CRM

## Step 1: Create Supabase Tables

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    password_hash VARCHAR NOT NULL,
    role VARCHAR NOT NULL CHECK (role IN ('super_admin', 'admin', 'bde')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    google_credentials JSONB,
    google_connected BOOLEAN DEFAULT false
);

-- Clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR NOT NULL,
    contact_person VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone VARCHAR NOT NULL,
    industry VARCHAR NOT NULL,
    company_size VARCHAR NOT NULL,
    source VARCHAR DEFAULT 'Direct',
    referrer_name VARCHAR,
    budget DECIMAL,
    budget_currency VARCHAR(3) DEFAULT 'USD',
    requirements TEXT,
    estimated_timeline VARCHAR,
    decision_maker_details TEXT,
    stage INTEGER DEFAULT 1 CHECK (stage >= 1 AND stage <= 5),
    assigned_bde UUID REFERENCES users(id),
    notes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_dropped BOOLEAN DEFAULT false,
    drop_reason TEXT
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    description TEXT,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'overdue')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_clients_assigned_bde ON clients(assigned_bde);
CREATE INDEX idx_clients_stage ON clients(stage);
CREATE INDEX idx_clients_is_dropped ON clients(is_dropped);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_client_id ON tasks(client_id);
CREATE INDEX idx_tasks_status ON tasks(status);
```

## Step 2: Update Backend to Use Supabase

```python
# requirements.txt - Add these dependencies
supabase==2.3.0
postgrest==0.13.2

# supabase_client.py
import os
from supabase import create_client, Client
from typing import List, Dict, Any

class SupabaseService:
    def __init__(self):
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_ANON_KEY")
        self.supabase: Client = create_client(url, key)
    
    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        result = self.supabase.table('users').insert(user_data).execute()
        return result.data[0] if result.data else None
    
    async def get_user_by_email(self, email: str) -> Dict[str, Any]:
        result = self.supabase.table('users').select("*").eq('email', email).execute()
        return result.data[0] if result.data else None
    
    async def get_clients(self, assigned_bde: str = None) -> List[Dict[str, Any]]:
        query = self.supabase.table('clients').select("*")
        if assigned_bde:
            query = query.eq('assigned_bde', assigned_bde)
        result = query.execute()
        return result.data
    
    async def create_client(self, client_data: Dict[str, Any]) -> Dict[str, Any]:
        result = self.supabase.table('clients').insert(client_data).execute()
        return result.data[0] if result.data else None
    
    async def update_client(self, client_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        result = self.supabase.table('clients').update(update_data).eq('id', client_id).execute()
        return result.data[0] if result.data else None
    
    async def create_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        result = self.supabase.table('tasks').insert(task_data).execute()
        return result.data[0] if result.data else None

# Usage in server.py
# Replace MongoDB operations with Supabase calls
```

## Step 3: Environment Variables

Add to your .env file:
```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 4: Data Migration Script

```python
# migrate_to_supabase.py
import asyncio
import json
from motor.motor_asyncio import AsyncIOMotorClient
from supabase_client import SupabaseService

async def migrate_data():
    # Connect to MongoDB
    mongo_client = AsyncIOMotorClient("mongodb://localhost:27017")
    mongo_db = mongo_client["test_database"]
    
    # Connect to Supabase
    supabase = SupabaseService()
    
    # Migrate Users
    users = await mongo_db.users.find({}).to_list(1000)
    for user in users:
        user_data = {
            'id': user['id'],
            'email': user['email'],
            'name': user['name'],
            'password_hash': user['password'],
            'role': user['role'],
            'created_at': user['created_at'],
            'is_active': user['is_active'],
            'google_credentials': user.get('google_credentials'),
            'google_connected': user.get('google_connected', False)
        }
        await supabase.create_user(user_data)
    
    # Migrate Clients
    clients = await mongo_db.clients.find({}).to_list(1000)
    for client in clients:
        client_data = {
            'id': client['id'],
            'company_name': client['company_name'],
            'contact_person': client['contact_person'],
            'email': client['email'],
            'phone': client['phone'],
            'industry': client['industry'],
            'company_size': client['company_size'],
            'source': client.get('source', 'Direct'),
            'referrer_name': client.get('referrer_name'),
            'budget': client.get('budget'),
            'budget_currency': client.get('budget_currency', 'USD'),
            'requirements': client.get('requirements'),
            'stage': client['stage'],
            'assigned_bde': client['assigned_bde'],
            'notes': client.get('notes', []),
            'created_at': client['created_at'],
            'last_interaction': client['last_interaction'],
            'is_dropped': client.get('is_dropped', False),
            'drop_reason': client.get('drop_reason')
        }
        await supabase.create_client(client_data)
    
    print("Migration completed successfully!")

if __name__ == "__main__":
    asyncio.run(migrate_data())
```

## Step 5: Benefits of Supabase Migration

1. **Better Reliability**: PostgreSQL is more robust than MongoDB for structured data
2. **Built-in Authentication**: Supabase provides auth out of the box
3. **Real-time Features**: Built-in real-time subscriptions
4. **Better Performance**: Optimized for relational queries
5. **Automatic Backups**: Daily backups included
6. **Better Scaling**: Easier to scale PostgreSQL
7. **SQL Queries**: More familiar for most developers

## Step 6: Testing Migration

1. Run migration script on a copy of your data
2. Test all API endpoints
3. Verify data integrity
4. Test performance
5. Update frontend if needed (should work without changes)
6. Deploy and test in production

## Step 7: Rollback Plan

Keep your MongoDB instance running until you're confident the migration is successful. You can always switch back if needed.