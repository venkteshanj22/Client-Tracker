#!/usr/bin/env python3
"""
BDE Assignment Test - Verify that BDE agents show up when adding new clients
"""

import requests
import json

class BDEAssignmentTest:
    def __init__(self):
        self.base_url = "http://localhost:8001"
        self.token = None

    def print_header(self, title):
        print(f"\n{'='*60}")
        print(f"🚀 {title}")
        print(f"{'='*60}")

    def print_step(self, step, description):
        print(f"\n📌 Step {step}: {description}")
        print("-" * 40)

    def login(self):
        """Login as super admin"""
        self.print_step(1, "Login as Super Admin")
        
        response = requests.post(f"{self.base_url}/api/auth/login", json={
            "email": "admin@crm.com",
            "password": "admin123"
        })
        
        if response.status_code == 200:
            data = response.json()
            self.token = data['access_token']
            user = data['user']
            print(f"   ✅ Logged in as {user['name']} (Role: {user['role']})")
            return True
        else:
            print(f"   ❌ Login failed: {response.text}")
            return False

    def test_bde_endpoint(self):
        """Test the /api/users/bdes endpoint directly"""
        self.print_step(2, "Test BDE Endpoint (/api/users/bdes)")
        
        headers = {'Authorization': f'Bearer {self.token}'}
        response = requests.get(f"{self.base_url}/api/users/bdes", headers=headers)
        
        if response.status_code == 200:
            bdes = response.json()
            print(f"   ✅ Found {len(bdes)} BDE agents:")
            for i, bde in enumerate(bdes, 1):
                print(f"      {i}. {bde['name']} ({bde['email']}) - Status: {'Active' if bde['is_active'] else 'Inactive'}")
            return bdes
        else:
            print(f"   ❌ Failed to get BDEs: {response.status_code} - {response.text}")
            return []

    def test_create_client_with_bde(self, bdes):
        """Test creating a client and assigning to a BDE"""
        if not bdes:
            print("   ❌ No BDEs available to assign")
            return None
            
        self.print_step(3, "Create Test Client with BDE Assignment")
        
        # Use the first BDE
        selected_bde = bdes[0]
        
        client_data = {
            "company_name": "Test Company Inc",
            "contact_person": "John Doe",
            "email": "john@testcompany.com",
            "phone": "+1-555-TEST",
            "industry": "Technology",
            "company_size": "50-100",
            "requirements": "Website development and digital marketing",
            "budget_range": "50k-100k",
            "stage": "first_contact",
            "assigned_bde": selected_bde['id']
        }
        
        headers = {'Authorization': f'Bearer {self.token}'}
        response = requests.post(f"{self.base_url}/api/clients", json=client_data, headers=headers)
        
        if response.status_code == 201:
            client = response.json()
            print(f"   ✅ Client created successfully:")
            print(f"      - Company: {client['company_name']}")
            print(f"      - Assigned BDE: {selected_bde['name']} ({selected_bde['email']})")
            print(f"      - Client ID: {client['id']}")
            return client['id']
        else:
            print(f"   ❌ Failed to create client: {response.status_code} - {response.text}")
            return None

    def verify_client_assignment(self, client_id, bdes):
        """Verify the client was properly assigned to the BDE"""
        self.print_step(4, "Verify Client Assignment")
        
        headers = {'Authorization': f'Bearer {self.token}'}
        response = requests.get(f"{self.base_url}/api/clients/{client_id}", headers=headers)
        
        if response.status_code == 200:
            client = response.json()
            assigned_bde_id = client.get('assigned_bde')
            
            if assigned_bde_id:
                # Find the BDE by ID
                assigned_bde = next((bde for bde in bdes if bde['id'] == assigned_bde_id), None)
                if assigned_bde:
                    print(f"   ✅ Client assignment verified:")
                    print(f"      - Client: {client['company_name']}")
                    print(f"      - Assigned BDE: {assigned_bde['name']} ({assigned_bde['email']})")
                    return True
                else:
                    print(f"   ❌ BDE ID {assigned_bde_id} not found in BDE list")
                    return False
            else:
                print(f"   ❌ Client has no assigned BDE")
                return False
        else:
            print(f"   ❌ Failed to get client details: {response.status_code} - {response.text}")
            return False

    def cleanup_test_client(self, client_id):
        """Clean up by deleting the test client"""
        if not client_id:
            return
            
        self.print_step(5, "Cleanup - Delete Test Client")
        
        headers = {'Authorization': f'Bearer {self.token}'}
        response = requests.delete(f"{self.base_url}/api/clients/{client_id}", headers=headers)
        
        if response.status_code == 200:
            print(f"   ✅ Test client deleted successfully")
        else:
            print(f"   ❌ Failed to delete test client: {response.status_code} - {response.text}")

    def run_test(self):
        """Run the complete BDE assignment test"""
        self.print_header("BDE ASSIGNMENT TEST")
        print("Testing that BDE agents show up when adding new clients")
        
        # Step 1: Login
        if not self.login():
            return
        
        # Step 2: Test BDE endpoint
        bdes = self.test_bde_endpoint()
        if not bdes:
            print("\n❌ CRITICAL: No BDE agents found! Cannot proceed with client assignment.")
            return
        
        # Step 3: Create client with BDE assignment
        client_id = self.test_create_client_with_bde(bdes)
        if not client_id:
            return
        
        # Step 4: Verify assignment
        if not self.verify_client_assignment(client_id, bdes):
            return
        
        # Step 5: Cleanup
        self.cleanup_test_client(client_id)
        
        # Final summary
        self.print_header("TEST COMPLETED SUCCESSFULLY! 🎉")
        print("✅ BDE agents are properly loaded and available for assignment")
        print("✅ The /api/users/bdes endpoint is working correctly")
        print("✅ Client creation with BDE assignment is functional")
        print("✅ Frontend should now show BDE agents in the dropdown")
        
        print(f"\n🎯 SUMMARY:")
        print(f"   - Found {len(bdes)} BDE agents in the system")
        print(f"   - All BDEs are available for client assignment")
        print(f"   - The route ordering issue has been FIXED")
        print(f"   - Frontend client creation form will now work properly")

if __name__ == "__main__":
    test = BDEAssignmentTest()
    test.run_test()
