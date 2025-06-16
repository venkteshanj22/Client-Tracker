#!/usr/bin/env python3
"""
Data Migration Script for Client Tracker CRM
Migrates data from local MongoDB to production MongoDB Atlas
"""

import asyncio
import os
import json
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

class DataMigration:
    def __init__(self):
        # Source (current local database)
        self.source_url = "mongodb://localhost:27017"
        self.source_db = "test_database"
        
        # Target (production database - you'll need to update this)
        self.target_url = None  # Set this to your MongoDB Atlas URL
        self.target_db = "clienttracker_production"

    def set_target_database(self, atlas_url):
        """Set the MongoDB Atlas connection URL"""
        self.target_url = atlas_url

    async def export_data(self):
        """Export data from source database"""
        print("🔄 Connecting to source database...")
        source_client = AsyncIOMotorClient(self.source_url)
        source_db = source_client[self.source_db]
        
        # Export collections
        data = {}
        
        # Export users
        print("📥 Exporting users...")
        users = await source_db.users.find({}).to_list(1000)
        data['users'] = users
        print(f"   ✅ Exported {len(users)} users")
        
        # Export clients
        print("📥 Exporting clients...")
        clients = await source_db.clients.find({}).to_list(1000)
        data['clients'] = clients
        print(f"   ✅ Exported {len(clients)} clients")
        
        # Export tasks if they exist
        print("📥 Exporting tasks...")
        tasks = await source_db.tasks.find({}).to_list(1000)
        data['tasks'] = tasks
        print(f"   ✅ Exported {len(tasks)} tasks")
        
        source_client.close()
        
        # Save to file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = f"/app/data_backup_{timestamp}.json"
        
        # Convert ObjectId to string for JSON serialization
        def convert_objectid(obj):
            if hasattr(obj, '_id') and hasattr(obj['_id'], '__str__'):
                obj['_id'] = str(obj['_id'])
            return obj
        
        for collection in data:
            data[collection] = [convert_objectid(doc) for doc in data[collection]]
        
        with open(backup_file, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        
        print(f"💾 Data backed up to: {backup_file}")
        return backup_file, data

    async def import_data(self, data):
        """Import data to target database"""
        if not self.target_url:
            print("❌ Target database URL not set. Use set_target_database() first.")
            return False
        
        print("🔄 Connecting to target database...")
        target_client = AsyncIOMotorClient(self.target_url)
        target_db = target_client[self.target_db]
        
        try:
            # Import users
            if data['users']:
                print(f"📤 Importing {len(data['users'])} users...")
                # Remove _id field to avoid conflicts
                users_to_import = []
                for user in data['users']:
                    user_copy = user.copy()
                    if '_id' in user_copy:
                        del user_copy['_id']
                    users_to_import.append(user_copy)
                
                await target_db.users.insert_many(users_to_import)
                print("   ✅ Users imported successfully")
            
            # Import clients
            if data['clients']:
                print(f"📤 Importing {len(data['clients'])} clients...")
                clients_to_import = []
                for client in data['clients']:
                    client_copy = client.copy()
                    if '_id' in client_copy:
                        del client_copy['_id']
                    clients_to_import.append(client_copy)
                
                await target_db.clients.insert_many(clients_to_import)
                print("   ✅ Clients imported successfully")
            
            # Import tasks
            if data['tasks']:
                print(f"📤 Importing {len(data['tasks'])} tasks...")
                tasks_to_import = []
                for task in data['tasks']:
                    task_copy = task.copy()
                    if '_id' in task_copy:
                        del task_copy['_id']
                    tasks_to_import.append(task_copy)
                
                await target_db.tasks.insert_many(tasks_to_import)
                print("   ✅ Tasks imported successfully")
            
            target_client.close()
            print("🎉 Data migration completed successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Migration failed: {str(e)}")
            target_client.close()
            return False

    async def verify_migration(self):
        """Verify data was migrated correctly"""
        if not self.target_url:
            print("❌ Target database URL not set.")
            return False
        
        print("🔍 Verifying migration...")
        target_client = AsyncIOMotorClient(self.target_url)
        target_db = target_client[self.target_db]
        
        users_count = await target_db.users.count_documents({})
        clients_count = await target_db.clients.count_documents({})
        tasks_count = await target_db.tasks.count_documents({})
        
        print(f"   📊 Target database contains:")
        print(f"      - Users: {users_count}")
        print(f"      - Clients: {clients_count}")
        print(f"      - Tasks: {tasks_count}")
        
        target_client.close()
        return True

def main():
    print("="*60)
    print("🚀 CLIENT TRACKER CRM - DATA MIGRATION")
    print("="*60)
    print("This script helps you migrate data to a persistent database.")
    print()
    
    migration = DataMigration()
    
    # Step 1: Export current data
    print("STEP 1: Export current data")
    print("-" * 30)
    
    async def run_export():
        return await migration.export_data()
    
    backup_file, data = asyncio.run(run_export())
    
    # Step 2: Instructions for user
    print("\nSTEP 2: Set up MongoDB Atlas")
    print("-" * 30)
    print("1. Go to https://www.mongodb.com/atlas")
    print("2. Create a free account and cluster")
    print("3. Get your connection string")
    print("4. Update your production environment variables")
    print()
    
    print("STEP 3: Import data to production database")
    print("-" * 30)
    print("⚠️  Manual step required:")
    print("1. Set up your MongoDB Atlas database")
    print("2. Update the connection string in your production environment")
    print("3. Use the data backup file for import:", backup_file)
    print()
    
    print("="*60)
    print("✅ DATA BACKUP COMPLETED")
    print("="*60)
    print(f"📁 Backup file: {backup_file}")
    print(f"📊 Backed up: {len(data['users'])} users, {len(data['clients'])} clients, {len(data['tasks'])} tasks")
    print()
    print("Next steps:")
    print("1. Set up MongoDB Atlas database")
    print("2. Update production environment variables") 
    print("3. Deploy with new database configuration")
    print("4. Your data will persist across all future deployments!")

if __name__ == "__main__":
    main()
