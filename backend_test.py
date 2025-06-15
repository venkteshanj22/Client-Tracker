import requests
import unittest
import json
from datetime import datetime

# Use the public endpoint for testing
BACKEND_URL = "https://551aa138-9fb3-4388-af72-3057cadd375e.preview.emergentagent.com"
API_URL = f"{BACKEND_URL}/api"

class ClientTrackerAPITest(unittest.TestCase):
    def setUp(self):
        # Generate unique test data
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        self.test_user = {
            "name": f"Test User {timestamp}",
            "email": f"test{timestamp}@example.com",
            "role": "admin",
            "phone": "123-456-7890",
            "status": "active"
        }
        self.test_client = {
            "client_name": f"Test Client {timestamp}",
            "client_email": f"client{timestamp}@example.com",
            "client_phone": "987-654-3210",
            "status_category": "active",
            "description": "Test client description"
        }
        
        # Store created resources for cleanup
        self.created_user_id = None
        self.created_client_id = None

    def test_01_api_root(self):
        """Test API root endpoint"""
        print("\n🔍 Testing API root endpoint...")
        response = requests.get(f"{API_URL}/")
        self.assertEqual(response.status_code, 200)
        print("✅ API root endpoint is working")

    def test_02_analytics_summary(self):
        """Test analytics summary endpoint"""
        print("\n🔍 Testing analytics summary endpoint...")
        response = requests.get(f"{API_URL}/analytics/summary")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify the structure of the response
        self.assertIn("total_users", data)
        self.assertIn("active_users", data)
        self.assertIn("total_status_checks", data)
        self.assertIn("status_by_category", data)
        print("✅ Analytics summary endpoint is working")

    def test_03_user_crud(self):
        """Test user CRUD operations"""
        # Create user
        print("\n🔍 Testing user creation...")
        response = requests.post(f"{API_URL}/users", json=self.test_user)
        self.assertEqual(response.status_code, 200)
        user_data = response.json()
        self.created_user_id = user_data["id"]
        self.assertEqual(user_data["name"], self.test_user["name"])
        self.assertEqual(user_data["email"], self.test_user["email"])
        print(f"✅ User created with ID: {self.created_user_id}")
        
        # Get all users
        print("\n🔍 Testing get all users...")
        response = requests.get(f"{API_URL}/users")
        self.assertEqual(response.status_code, 200)
        users = response.json()
        self.assertIsInstance(users, list)
        print(f"✅ Retrieved {len(users)} users")
        
        # Get specific user
        print("\n🔍 Testing get specific user...")
        response = requests.get(f"{API_URL}/users/{self.created_user_id}")
        self.assertEqual(response.status_code, 200)
        user = response.json()
        self.assertEqual(user["id"], self.created_user_id)
        print(f"✅ Retrieved user: {user['name']}")
        
        # Update user
        print("\n🔍 Testing user update...")
        update_data = {"name": f"Updated {self.test_user['name']}"}
        response = requests.put(f"{API_URL}/users/{self.created_user_id}", json=update_data)
        self.assertEqual(response.status_code, 200)
        updated_user = response.json()
        self.assertEqual(updated_user["name"], update_data["name"])
        print(f"✅ User updated: {updated_user['name']}")
        
        # Test email duplicate validation
        print("\n🔍 Testing email duplicate validation...")
        duplicate_user = self.test_user.copy()
        response = requests.post(f"{API_URL}/users", json=duplicate_user)
        self.assertEqual(response.status_code, 400)
        print("✅ Email duplicate validation working")

    def test_04_client_crud(self):
        """Test client status CRUD operations"""
        # Create client
        print("\n🔍 Testing client creation...")
        response = requests.post(f"{API_URL}/status", json=self.test_client)
        self.assertEqual(response.status_code, 200)
        client_data = response.json()
        self.created_client_id = client_data["id"]
        self.assertEqual(client_data["client_name"], self.test_client["client_name"])
        print(f"✅ Client created with ID: {self.created_client_id}")
        
        # Get all clients
        print("\n🔍 Testing get all clients...")
        response = requests.get(f"{API_URL}/status")
        self.assertEqual(response.status_code, 200)
        clients = response.json()
        self.assertIsInstance(clients, list)
        print(f"✅ Retrieved {len(clients)} clients")
        
        # Test client filtering by status
        print("\n🔍 Testing client filtering by status...")
        response = requests.get(f"{API_URL}/status?category=active")
        self.assertEqual(response.status_code, 200)
        active_clients = response.json()
        print(f"✅ Retrieved {len(active_clients)} active clients")
        
        # Test client filtering by name
        print("\n🔍 Testing client filtering by name...")
        response = requests.get(f"{API_URL}/status?client_name={self.test_client['client_name']}")
        self.assertEqual(response.status_code, 200)
        filtered_clients = response.json()
        self.assertTrue(len(filtered_clients) > 0)
        print(f"✅ Client name filtering working")
        
        # Get specific client
        print("\n🔍 Testing get specific client...")
        response = requests.get(f"{API_URL}/status/{self.created_client_id}")
        self.assertEqual(response.status_code, 200)
        client = response.json()
        self.assertEqual(client["id"], self.created_client_id)
        print(f"✅ Retrieved client: {client['client_name']}")
        
        # Update client
        print("\n🔍 Testing client update...")
        update_data = {
            "client_name": f"Updated {self.test_client['client_name']}",
            "status_category": "pending"
        }
        response = requests.put(f"{API_URL}/status/{self.created_client_id}", json=update_data)
        self.assertEqual(response.status_code, 200)
        updated_client = response.json()
        self.assertEqual(updated_client["client_name"], update_data["client_name"])
        self.assertEqual(updated_client["status_category"], update_data["status_category"])
        print(f"✅ Client updated: {updated_client['client_name']}")
        
        # Test client assignment
        if self.created_user_id:
            print("\n🔍 Testing client assignment to user...")
            update_data = {"assigned_user_id": self.created_user_id}
            response = requests.put(f"{API_URL}/status/{self.created_client_id}", json=update_data)
            self.assertEqual(response.status_code, 200)
            updated_client = response.json()
            self.assertEqual(updated_client["assigned_user_id"], self.created_user_id)
            print(f"✅ Client assigned to user")

    def tearDown(self):
        # Clean up created resources
        if self.created_client_id:
            print(f"\n🧹 Cleaning up test client: {self.created_client_id}")
            requests.delete(f"{API_URL}/status/{self.created_client_id}")
            
        if self.created_user_id:
            print(f"🧹 Cleaning up test user: {self.created_user_id}")
            requests.delete(f"{API_URL}/users/{self.created_user_id}")

if __name__ == "__main__":
    print("🚀 Starting ClientTracker API Tests")
    print(f"🔗 Testing against API URL: {API_URL}")
    
    # Run the tests
    unittest.main(argv=['first-arg-is-ignored'], exit=False)
    
    print("\n✨ API Testing Complete")