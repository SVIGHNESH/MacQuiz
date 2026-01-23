import requests
login_response = requests.post("http://localhost:8000/api/v1/auth/login", json={"email": "ritik.kumar@example.com", "password": "student123"})
if login_response.status_code == 200:
    token = login_response.json()["access_token"]
    print("Logged in as Ritik")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get("http://localhost:8000/api/v1/attempts/my-attempts", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        attempts = response.json()
        print(f"Found {len(attempts)} attempts")
        for a in attempts:
            print(f"  Quiz: {a['quiz_title']}, Score: {a['score']}/{a['total_marks']}")
    else:
        print(f"Error: {response.text}")
