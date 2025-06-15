import requests
import sys
import json
from datetime import datetime

class UserManagementTester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.token = None
        self.user = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self, email, password):
        """Test login and get token"""
        success, response = self.run_test(
            "Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user = response['user']
            print(f"Logged in as {self.user['name']} with role {self.user['role']}")
            return True
        return False

    def test_get_users(self):
        """Test getting all users"""
        success, response = self.run_test(
            "Get All Users",
            "GET",
            "users",
            200
        )
        if success:
            print(f"Found {len(response)} users")
            for user in response:
                print(f"  - {user['name']} ({user['email']}) - {user['role']}")
        return success

    def test_create_user(self, role="bde"):
        """Test creating a new user"""
        timestamp = datetime.now().strftime('%H%M%S')
        new_user = {
            "email": f"testuser{timestamp}@example.com",
            "name": f"Test User {timestamp}",
            "password": "testpassword123",
            "role": role
        }
        
        success, response = self.run_test(
            f"Create New {role.upper()} User",
            "POST",
            "auth/register",
            200,
            data=new_user
        )
        
        if success and 'id' in response:
            print(f"Created new {role} user with ID: {response['id']}")
            return response['id']
        return None

    def test_get_user(self, user_id):
        """Test getting a specific user"""
        success, response = self.run_test(
            "Get User Details",
            "GET",
            f"users/{user_id}",
            200
        )
        
        if success:
            print(f"Retrieved user: {response['name']} ({response['email']}) - {response['role']}")
        return success

    def test_update_user(self, user_id):
        """Test updating a user"""
        timestamp = datetime.now().strftime('%H%M%S')
        update_data = {
            "name": f"Updated User {timestamp}",
            "email": f"updated{timestamp}@example.com",
            "is_active": True
        }
        
        success, response = self.run_test(
            "Update User",
            "PUT",
            f"users/{user_id}",
            200,
            data=update_data
        )
        
        if success:
            print(f"Updated user: {response['name']} ({response['email']})")
            
            # Verify the update
            verify_success, verify_response = self.run_test(
                "Verify User Update",
                "GET",
                f"users/{user_id}",
                200
            )
            
            if verify_success:
                if verify_response['name'] == update_data['name'] and verify_response['email'] == update_data['email']:
                    print("✅ User update verified successfully")
                    return True
                else:
                    print(f"❌ User update verification failed. Expected name: {update_data['name']}, got: {verify_response['name']}")
        
        return False

    def test_delete_user(self, user_id):
        """Test deleting a user"""
        success, response = self.run_test(
            "Delete User",
            "DELETE",
            f"users/{user_id}",
            200
        )
        
        if success:
            print(f"Deleted user with ID: {user_id}")
            
            # Verify the deletion
            verify_success, verify_response = self.run_test(
                "Verify User Deletion",
                "GET",
                f"users/{user_id}",
                404
            )
            
            if verify_success:
                print("✅ User deletion verified successfully")
                return True
            else:
                print("❌ User deletion verification failed")
        
        return False

def main():
    # Use the local backend URL
    backend_url = "http://localhost:8001"
    
    print(f"Testing User Management API at {backend_url}")
    tester = UserManagementTester(backend_url)
    
    # Login as super admin
    if not tester.test_login("admin@crm.com", "admin123"):
        print("❌ Login failed, stopping tests")
        return 1
    
    # Test getting all users
    tester.test_get_users()
    
    # Test creating a new user
    user_id = tester.test_create_user()
    if not user_id:
        print("❌ Failed to create user, stopping tests")
        return 1
    
    # Test getting the user
    if not tester.test_get_user(user_id):
        print("❌ Failed to get user, stopping tests")
        return 1
    
    # Test updating the user
    if not tester.test_update_user(user_id):
        print("❌ Failed to update user")
    
    # Test deleting the user (commented out to avoid deleting the user if we want to check it manually)
    # if not tester.test_delete_user(user_id):
    #     print("❌ Failed to delete user")
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())