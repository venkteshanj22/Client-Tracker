#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment
ROOT_DIR = Path(__file__).parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

async def test_user_query():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    user_id = '032ea7a9-41f6-4298-849a-3e54b9e51d00'
    print(f"Looking for user with ID: {user_id}")
    
    user_doc = await db.users.find_one({"id": user_id})
    print(f"Found user: {user_doc}")
    
    if user_doc:
        print("User document fields:")
        for key, value in user_doc.items():
            print(f"  {key}: {value} (type: {type(value)})")
    
    # Test the exact query that get_current_user does
    user_doc = await db.users.find_one({"id": user_id})
    if user_doc is None:
        print("❌ User not found with exact query")
    else:
        print("✅ User found with exact query")
        
        # Try to create User model
        try:
            # Remove _id and password fields
            user_data = {k: v for k, v in user_doc.items() if k not in ['_id', 'password']}
            print(f"User data for model: {user_data}")
            
            # Import the User model
            import sys
            sys.path.append(str(ROOT_DIR))
            from server import User
            
            user = User(**user_data)
            print(f"✅ User model created successfully: {user}")
        except Exception as e:
            print(f"❌ Error creating User model: {e}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(test_user_query())
