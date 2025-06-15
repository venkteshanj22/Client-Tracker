import requests
import sys
import json
from datetime import datetime, timedelta

class CRMAPITester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.token = None
        self.user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.client_id = None

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

    def test_init_super_admin(self):
        """Test initializing super admin"""
        success, response = self.run_test(
            "Initialize Super Admin",
            "POST",
            "auth/init-super-admin",
            200
        )
        return success

    def test_get_dashboard_stats(self):
        """Test getting dashboard stats"""
        success, response = self.run_test(
            "Get Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        if success:
            print(f"Dashboard Stats: {json.dumps(response, indent=2)}")
        return success

    def test_get_clients(self):
        """Test getting all clients"""
        success, response = self.run_test(
            "Get All Clients",
            "GET",
            "clients",
            200
        )
        if success:
            print(f"Found {len(response)} clients")
            if len(response) > 0:
                self.client_id = response[0]['id']
                print(f"Using client ID: {self.client_id}")
        return success

    def test_create_client(self):
        """Test creating a new client with new fields"""
        test_client = {
            "company_name": f"Test Company {datetime.now().strftime('%H%M%S')}",
            "contact_person": "Test Contact",
            "email": "test@example.com",
            "phone": "123-456-7890",
            "industry": "Technology",
            "company_size": "1-10",
            "source": "LinkedIn",
            "budget": 10000,
            "budget_currency": "USD",
            "requirements": "Testing requirements",
            "assigned_bde": self.user['id']
        }
        
        success, response = self.run_test(
            "Create Client",
            "POST",
            "clients",
            200,
            data=test_client
        )
        
        if success and 'id' in response:
            self.client_id = response['id']
            print(f"Created client with ID: {self.client_id}")
        return success

    def test_get_client_details(self):
        """Test getting client details"""
        if not self.client_id:
            print("❌ No client ID available for testing")
            return False
            
        success, response = self.run_test(
            "Get Client Details",
            "GET",
            f"clients/{self.client_id}",
            200
        )
        return success

    def test_update_client(self):
        """Test updating a client with new fields"""
        if not self.client_id:
            print("❌ No client ID available for testing")
            return False
            
        update_data = {
            "stage": 2,
            "requirements": "Updated requirements",
            "budget": 15000,
            "budget_currency": "EUR",
            "source": "Referral",
            "referrer_name": "John Doe"
        }
        
        success, response = self.run_test(
            "Update Client",
            "PUT",
            f"clients/{self.client_id}",
            200,
            data=update_data
        )
        return success

    def test_add_note(self):
        """Test adding a note to a client"""
        if not self.client_id:
            print("❌ No client ID available for testing")
            return False
            
        note_data = {
            "text": f"Test note added at {datetime.now().strftime('%H:%M:%S')}"
        }
        
        success, response = self.run_test(
            "Add Note to Client",
            "POST",
            f"clients/{self.client_id}/notes",
            200,
            data=note_data
        )
        return success

    def test_get_bdes(self):
        """Test getting all BDEs"""
        success, response = self.run_test(
            "Get BDEs",
            "GET",
            "users/bdes",
            200
        )
        if success:
            print(f"Found {len(response)} BDEs")
        return success
        
    # Google Workspace Integration Tests
    def test_google_auth_url(self):
        """Test getting Google OAuth URL"""
        success, response = self.run_test(
            "Get Google Auth URL",
            "GET",
            "google/auth-url",
            200
        )
        if success and 'authorization_url' in response:
            print(f"Got Google authorization URL: {response['authorization_url'][:50]}...")
        return success
        
    def test_google_calendar_event(self):
        """Test creating a Google Calendar event"""
        event_data = {
            "summary": "Test Event",
            "description": "Created from CRM API Test",
            "start": {
                "dateTime": (datetime.now() + timedelta(hours=1)).isoformat(),
                "timeZone": "UTC"
            },
            "end": {
                "dateTime": (datetime.now() + timedelta(hours=2)).isoformat(),
                "timeZone": "UTC"
            }
        }
        
        success, response = self.run_test(
            "Create Google Calendar Event",
            "POST",
            "google/create-calendar-event",
            200,
            data=event_data
        )
        return success
        
    def test_google_client_folder(self):
        """Test creating a Google Drive client folder"""
        folder_data = {
            "client_name": f"Test Client {datetime.now().strftime('%H%M%S')}"
        }
        
        success, response = self.run_test(
            "Create Google Drive Client Folder",
            "POST",
            "google/create-client-folder",
            200,
            data=folder_data
        )
        return success
        
    def test_google_send_email(self):
        """Test sending an email via Gmail"""
        email_data = {
            "to": "test@example.com",
            "subject": f"Test Email {datetime.now().strftime('%H%M%S')}",
            "body": "This is a test email from the CRM API test."
        }
        
        success, response = self.run_test(
            "Send Gmail",
            "POST",
            "google/send-email",
            200,
            data=email_data
        )
        return success
        
    def test_google_send_notification(self):
        """Test sending a Google Chat notification"""
        notification_data = {
            "message": f"Test notification from CRM API test at {datetime.now().strftime('%H:%M:%S')}"
        }
        
        success, response = self.run_test(
            "Send Google Chat Notification",
            "POST",
            "google/send-notification",
            200,
            data=notification_data
        )
        return success

def test_drag_and_drop_functionality(tester):
    """Test the drag and drop functionality for client stage updates"""
    print("\n🔍 Testing Drag & Drop Kanban Functionality...")
    
    # First, create a test client
    test_client = {
        "company_name": f"Drag Test Company {datetime.now().strftime('%H%M%S')}",
        "contact_person": "Drag Test Contact",
        "email": "dragtest@example.com",
        "phone": "123-456-7890",
        "industry": "Technology",
        "company_size": "1-10",
        "requirements": "Testing drag and drop",
        "budget": 5000,
        "budget_currency": "USD",
        "assigned_bde": tester.user['id']
    }
    
    success, response = tester.run_test(
        "Create Client for Drag Test",
        "POST",
        "clients",
        200,
        data=test_client
    )
    
    if not success or 'id' not in response:
        print("❌ Failed to create test client for drag test")
        return False
    
    client_id = response['id']
    print(f"Created test client with ID: {client_id}")
    
    # Test moving client from stage 1 to stage 2
    update_data = {"stage": 2}
    success, response = tester.run_test(
        "Update Client Stage (Drag Simulation)",
        "PUT",
        f"clients/{client_id}",
        200,
        data=update_data
    )
    
    if not success:
        print("❌ Failed to update client stage")
        return False
    
    # Verify the stage was updated
    success, response = tester.run_test(
        "Verify Client Stage Update",
        "GET",
        f"clients/{client_id}",
        200
    )
    
    if success and response.get('stage') == 2:
        print("✅ Client stage successfully updated to 2")
        return True
    else:
        print(f"❌ Client stage not updated correctly. Current stage: {response.get('stage')}")
        return False

def test_user_management(tester):
    """Test user management functionality"""
    print("\n🔍 Testing User Management Functionality...")
    
    # Get current BDEs
    success, bdes_before = tester.run_test(
        "Get BDEs Before Adding",
        "GET",
        "users/bdes",
        200
    )
    
    if not success:
        print("❌ Failed to get current BDEs")
        return False
    
    # Create a new BDE user
    new_bde = {
        "email": f"testbde{datetime.now().strftime('%H%M%S')}@example.com",
        "name": "Test BDE User",
        "password": "testpassword123",
        "role": "bde"
    }
    
    success, response = tester.run_test(
        "Create New BDE User",
        "POST",
        "auth/register",
        200,
        data=new_bde
    )
    
    if not success:
        print("❌ Failed to create new BDE user")
        return False
    
    # Get updated BDEs list
    success, bdes_after = tester.run_test(
        "Get BDEs After Adding",
        "GET",
        "users/bdes",
        200
    )
    
    if not success:
        print("❌ Failed to get updated BDEs")
        return False
    
    # Verify the new BDE was added
    if len(bdes_after) > len(bdes_before):
        print(f"✅ New BDE user added successfully. BDEs before: {len(bdes_before)}, BDEs after: {len(bdes_after)}")
        return True
    else:
        print(f"❌ BDE user count did not increase. BDEs before: {len(bdes_before)}, BDEs after: {len(bdes_after)}")
        return False

def test_user_profile_and_password(tester):
    """Test user profile and password change functionality"""
    print("\n🔍 Testing User Profile and Password Change...")
    
    # Get user profile
    success, profile = tester.run_test(
        "Get User Profile",
        "GET",
        "auth/profile",
        200
    )
    
    if not success:
        print("❌ Failed to get user profile")
        return False
    
    # Test password change
    password_data = {
        "current_password": "admin123",
        "new_password": "admin123"  # Using same password to avoid changing it
    }
    
    success, response = tester.run_test(
        "Change Password",
        "POST",
        "auth/change-password",
        200,
        data=password_data
    )
    
    if success:
        print("✅ Password change functionality working")
        return True
    else:
        print("❌ Password change failed")
        return False

def test_task_assignment(tester):
    """Test task assignment to different user types"""
    print("\n🔍 Testing Task Assignment...")
    
    if not tester.client_id:
        print("❌ No client ID available for task testing")
        return False
    
    # Get all users
    success, users = tester.run_test(
        "Get All Users for Task Assignment",
        "GET",
        "users/all",
        200
    )
    
    if not success or not users:
        print("❌ Failed to get users for task assignment")
        return False
    
    # Create a task assigned to a user
    tomorrow = datetime.now() + timedelta(days=1)
    task_data = {
        "title": f"Test Task {datetime.now().strftime('%H%M%S')}",
        "description": "This is a test task created by the API tester",
        "client_id": tester.client_id,
        "assigned_to": users[0]['id'],
        "deadline": tomorrow.isoformat()
    }
    
    success, response = tester.run_test(
        "Create Task",
        "POST",
        "tasks",
        200,
        data=task_data
    )
    
    if not success:
        print("❌ Failed to create task")
        return False
    
    # Get tasks to verify
    success, tasks = tester.run_test(
        "Get Tasks",
        "GET",
        "tasks",
        200
    )
    
    if success and tasks:
        print(f"✅ Found {len(tasks)} tasks, task assignment working")
        return True
    else:
        print("❌ Task verification failed")
        return False

def test_notification_system(tester):
    """Test notification system APIs"""
    print("\n🔍 Testing Notification System...")
    
    # For this test, we'll add a note which should trigger a notification
    if not tester.client_id:
        print("❌ No client ID available for notification testing")
        return False
    
    note_data = {
        "text": f"Notification test note at {datetime.now().strftime('%H:%M:%S')}"
    }
    
    success, response = tester.run_test(
        "Add Note to Trigger Notification",
        "POST",
        f"clients/{tester.client_id}/notes",
        200,
        data=note_data
    )
    
    if success:
        print("✅ Note added successfully, notification should be triggered")
        return True
    else:
        print("❌ Failed to add note for notification test")
        return False

def test_dropped_client_functionality(tester):
    """Test the dropped client functionality"""
    print("\n🔍 Testing Dropped Client Functionality...")
    
    # First, create a test client
    test_client = {
        "company_name": f"Drop Test Company {datetime.now().strftime('%H%M%S')}",
        "contact_person": "Drop Test Contact",
        "email": "droptest@example.com",
        "phone": "123-456-7890",
        "industry": "Technology",
        "company_size": "1-10",
        "requirements": "Testing drop functionality",
        "budget": 5000,
        "budget_currency": "USD",
        "assigned_bde": tester.user['id']
    }
    
    success, response = tester.run_test(
        "Create Client for Drop Test",
        "POST",
        "clients",
        200,
        data=test_client
    )
    
    if not success or 'id' not in response:
        print("❌ Failed to create test client for drop test")
        return False
    
    client_id = response['id']
    print(f"Created test client with ID: {client_id}")
    
    # Mark client as dropped
    drop_data = {
        "is_dropped": True,
        "drop_reason": "Test drop reason"
    }
    
    success, response = tester.run_test(
        "Mark Client as Dropped",
        "PUT",
        f"clients/{client_id}",
        200,
        data=drop_data
    )
    
    if not success:
        print("❌ Failed to mark client as dropped")
        return False
    
    # Verify the client is marked as dropped
    success, response = tester.run_test(
        "Verify Client Dropped Status",
        "GET",
        f"clients/{client_id}",
        200
    )
    
    if not success:
        print("❌ Failed to get client details")
        return False
    
    if response.get('is_dropped') == True and response.get('drop_reason') == "Test drop reason":
        print("✅ Client successfully marked as dropped with correct reason")
    else:
        print(f"❌ Client not marked as dropped correctly. is_dropped: {response.get('is_dropped')}, reason: {response.get('drop_reason')}")
        return False
    
    # Get all clients and verify dropped client appears in the list
    success, clients = tester.run_test(
        "Get All Clients Including Dropped",
        "GET",
        "clients",
        200
    )
    
    if not success:
        print("❌ Failed to get clients list")
        return False
    
    # Check if our dropped client is in the list
    dropped_client = next((c for c in clients if c['id'] == client_id), None)
    if dropped_client and dropped_client['is_dropped']:
        print("✅ Dropped client appears in the clients list with is_dropped=true")
        return True
    else:
        print("❌ Dropped client not found in clients list or not marked as dropped")
        return False

def test_delete_permissions(tester):
    """Test that only Super Admin can delete clients"""
    print("\n🔍 Testing Delete Permissions...")
    
    # First, create a test client
    test_client = {
        "company_name": f"Delete Test Company {datetime.now().strftime('%H%M%S')}",
        "contact_person": "Delete Test Contact",
        "email": "deletetest@example.com",
        "phone": "123-456-7890",
        "industry": "Technology",
        "company_size": "1-10",
        "requirements": "Testing delete permissions",
        "budget": 5000,
        "budget_currency": "USD",
        "assigned_bde": tester.user['id']
    }
    
    success, response = tester.run_test(
        "Create Client for Delete Test",
        "POST",
        "clients",
        200,
        data=test_client
    )
    
    if not success or 'id' not in response:
        print("❌ Failed to create test client for delete test")
        return False
    
    client_id = response['id']
    print(f"Created test client with ID: {client_id}")
    
    # Create a BDE user
    bde_email = f"testbde{datetime.now().strftime('%H%M%S')}@example.com"
    new_bde = {
        "email": bde_email,
        "name": "Test BDE User",
        "password": "testpassword123",
        "role": "bde"
    }
    
    success, bde_user = tester.run_test(
        "Create BDE User for Delete Test",
        "POST",
        "auth/register",
        200,
        data=new_bde
    )
    
    if not success:
        print("❌ Failed to create BDE user")
        return False
    
    # Save current token and user
    super_admin_token = tester.token
    super_admin_user = tester.user
    
    # Login as BDE
    bde_tester = CRMAPITester(tester.base_url)
    if not bde_tester.test_login(bde_email, "testpassword123"):
        print("❌ Failed to login as BDE")
        # Restore super admin session
        tester.token = super_admin_token
        tester.user = super_admin_user
        return False
    
    # Try to delete client as BDE (should fail)
    try:
        response = requests.delete(
            f"{bde_tester.base_url}/api/clients/{client_id}",
            headers={'Authorization': f'Bearer {bde_tester.token}'}
        )
        
        if response.status_code == 403:
            print("✅ BDE correctly prevented from deleting client")
        else:
            print(f"❌ BDE was able to delete client with status code {response.status_code} - this is a security issue!")
            # Restore super admin session
            tester.token = super_admin_token
            tester.user = super_admin_user
            return False
    except Exception as e:
        print(f"❌ Error testing BDE delete permission: {str(e)}")
        # Restore super admin session
        tester.token = super_admin_token
        tester.user = super_admin_user
        return False
    
    # Restore super admin session
    tester.token = super_admin_token
    tester.user = super_admin_user
    
    # Delete client as Super Admin (should succeed)
    success, response = tester.run_test(
        "Delete Client as Super Admin",
        "DELETE",
        f"clients/{client_id}",
        200
    )
    
    if success:
        print("✅ Super Admin successfully deleted client")
        return True
    else:
        print("❌ Super Admin failed to delete client")
        return False

def main():
    # Get the backend URL from the frontend .env file
    backend_url = "https://c01ead0d-4330-4937-b86c-c3ce768fbe26.preview.emergentagent.com"
    
    print(f"Testing CRM API at {backend_url}")
    tester = CRMAPITester(backend_url)
    
    # Initialize super admin if needed
    tester.test_init_super_admin()
    
    # Login as super admin
    if not tester.test_login("admin@crm.com", "admin123"):
        print("❌ Login failed, stopping tests")
        return 1
    
    # Run basic tests
    tester.test_get_dashboard_stats()
    tester.test_get_clients()
    
    # Test client details and notes
    tester.test_create_client()
    tester.test_get_client_details()
    tester.test_update_client()
    tester.test_add_note()
    
    # Test priority features from review request
    print("\n🔍 Testing Priority Features from Review Request...")
    dropped_client_success = test_dropped_client_functionality(tester)
    delete_permissions_success = test_delete_permissions(tester)
    
    # Test other features
    print("\n🔍 Testing Other Features...")
    profile_success = test_user_profile_and_password(tester)
    task_success = test_task_assignment(tester)
    notification_success = test_notification_system(tester)
    drag_drop_success = test_drag_and_drop_functionality(tester)
    user_management_success = test_user_management(tester)
    
    # Google Workspace Integration Tests
    print("\n🔍 Testing Google Workspace Integration...")
    tester.test_google_auth_url()
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print("\n📋 Priority Feature Test Results:")
    print(f"Dropped Client Functionality: {'✅ PASSED' if dropped_client_success else '❌ FAILED'}")
    print(f"Delete Permissions: {'✅ PASSED' if delete_permissions_success else '❌ FAILED'}")
    
    print("\n📋 Other Feature Test Results:")
    print(f"User Profile & Password: {'✅ PASSED' if profile_success else '❌ FAILED'}")
    print(f"Task Assignment: {'✅ PASSED' if task_success else '❌ FAILED'}")
    print(f"Notification System: {'✅ PASSED' if notification_success else '❌ FAILED'}")
    print(f"Drag & Drop Functionality: {'✅ PASSED' if drag_drop_success else '❌ FAILED'}")
    print(f"User Management: {'✅ PASSED' if user_management_success else '❌ FAILED'}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())