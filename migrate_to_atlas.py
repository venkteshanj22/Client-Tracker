#!/usr/bin/env python3
"""
MongoDB Atlas Migration Script
Migrates data from local backup to MongoDB Atlas
"""

import asyncio
import json
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

class AtlasMigration:
    def __init__(self):
        # MongoDB Atlas connection
        self.atlas_url = "mongodb+srv://clientadmin:Google%40123@vjobsync-cluster.8kiw4.mongodb.net/?retryWrites=true&w=majority&appName=VJobSync-cluster"
        self.atlas_db = "clienttracker"

    async def migrate_from_backup(self, backup_file):
        """Migrate data from JSON backup to Atlas"""
        print("🔄 Connecting to MongoDB Atlas...")
        atlas_client = AsyncIOMotorClient(self.atlas_url)
        atlas_db = atlas_client[self.atlas_db]
        
        try:
            # Load backup data
            with open(backup_file, 'r') as f:
                data = json.load(f)
            
            print(f"📥 Loaded backup data:")
            print(f"   - Users: {len(data.get('users', []))}")
            print(f"   - Clients: {len(data.get('clients', []))}")
            print(f"   - Tasks: {len(data.get('tasks', []))}")
            
            # Migrate users (skip if super admin already exists)
            if data.get('users'):
                print("\n📤 Migrating users...")
                existing_users = await atlas_db.users.count_documents({})
                if existing_users > 1:  # More than just super admin
                    print("   ⚠️  Users already exist in Atlas. Skipping user migration.")
                else:
                    users_to_import = []
                    for user in data['users']:
                        user_copy = user.copy()
                        if '_id' in user_copy:
                            del user_copy['_id']
                        # Skip super admin (already created)
                        if user_copy.get('email') != 'admin@crm.com':
                            users_to_import.append(user_copy)
                    
                    if users_to_import:
                        await atlas_db.users.insert_many(users_to_import)
                        print(f"   ✅ Migrated {len(users_to_import)} users")
                    else:
                        print("   ℹ️  No additional users to migrate")
            
            # Migrate clients
            if data.get('clients'):
                print("\n📤 Migrating clients...")
                existing_clients = await atlas_db.clients.count_documents({})
                if existing_clients > 0:
                    print("   ⚠️  Clients already exist in Atlas. Checking for duplicates...")
                    
                clients_to_import = []
                for client in data['clients']:
                    client_copy = client.copy()
                    if '_id' in client_copy:
                        del client_copy['_id']
                    
                    # Check if client already exists
                    existing = await atlas_db.clients.find_one({"id": client_copy["id"]})
                    if not existing:
                        clients_to_import.append(client_copy)
                
                if clients_to_import:
                    await atlas_db.clients.insert_many(clients_to_import)
                    print(f"   ✅ Migrated {len(clients_to_import)} clients")
                else:
                    print("   ℹ️  All clients already exist in Atlas")
            
            # Migrate tasks
            if data.get('tasks'):
                print("\n📤 Migrating tasks...")
                existing_tasks = await atlas_db.tasks.count_documents({})
                if existing_tasks > 0:
                    print("   ⚠️  Tasks already exist in Atlas. Checking for duplicates...")
                
                tasks_to_import = []
                for task in data['tasks']:
                    task_copy = task.copy()
                    if '_id' in task_copy:
                        del task_copy['_id']
                    
                    # Check if task already exists
                    existing = await atlas_db.tasks.find_one({"id": task_copy["id"]})
                    if not existing:
                        tasks_to_import.append(task_copy)
                
                if tasks_to_import:
                    await atlas_db.tasks.insert_many(tasks_to_import)
                    print(f"   ✅ Migrated {len(tasks_to_import)} tasks")
                else:
                    print("   ℹ️  All tasks already exist in Atlas")
            
            print("\n🎉 Migration completed successfully!")
            
            # Verify migration
            print("\n🔍 Verifying Atlas database:")
            users_count = await atlas_db.users.count_documents({})
            clients_count = await atlas_db.clients.count_documents({})
            tasks_count = await atlas_db.tasks.count_documents({})
            
            print(f"   📊 Atlas database now contains:")
            print(f"      - Users: {users_count}")
            print(f"      - Clients: {clients_count}")
            print(f"      - Tasks: {tasks_count}")
            
            atlas_client.close()
            return True
            
        except Exception as e:
            print(f"❌ Migration failed: {str(e)}")
            atlas_client.close()
            return False

    async def verify_connection(self):
        """Test MongoDB Atlas connection"""
        print("🔍 Testing MongoDB Atlas connection...")
        
        try:
            atlas_client = AsyncIOMotorClient(self.atlas_url)
            # Test connection
            await atlas_client.admin.command('ping')
            print("   ✅ MongoDB Atlas connection successful!")
            
            atlas_db = atlas_client[self.atlas_db]
            collections = await atlas_db.list_collection_names()
            print(f"   📁 Available collections: {collections}")
            
            atlas_client.close()
            return True
        except Exception as e:
            print(f"   ❌ Connection failed: {str(e)}")
            return False

async def main():
    print("="*60)
    print("🚀 MONGODB ATLAS MIGRATION")
    print("="*60)
    
    migration = AtlasMigration()
    
    # Test connection first
    if not await migration.verify_connection():
        print("❌ Cannot proceed with migration due to connection issues")
        return
    
    # Find the latest backup file
    backup_files = [f for f in os.listdir('/app') if f.startswith('data_backup_') and f.endswith('.json')]
    if not backup_files:
        print("❌ No backup files found. Run the data export first.")
        return
    
    latest_backup = sorted(backup_files)[-1]
    backup_path = f"/app/{latest_backup}"
    
    print(f"📁 Using backup file: {backup_path}")
    
    # Perform migration
    success = await migration.migrate_from_backup(backup_path)
    
    if success:
        print("\n" + "="*60)
        print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
        print("="*60)
        print("🎯 Your data is now safely stored in MongoDB Atlas")
        print("🔒 Data will persist across all future deployments")
        print("📈 You can now deploy to production without data loss")
    else:
        print("\n" + "="*60)
        print("❌ MIGRATION FAILED")
        print("="*60)

if __name__ == "__main__":
    asyncio.run(main())
