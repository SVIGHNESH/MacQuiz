"""Test script to check the my-attempts endpoint error"""
import requests
import json

# First login to get a token
login_response = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    json={"email": "student@example.com", "password": "student123"}
)

if login_response.status_code == 200:
    token = login_response.json()["access_token"]
    print(f"✓ Login successful, token: {token[:20]}...")
    
    # Now try to get my-attempts
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        "http://localhost:8000/api/v1/attempts/my-attempts",
        headers=headers
    )
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
else:
    print(f"✗ Login failed: {login_response.status_code}")
    print(f"Response: {login_response.text}")
