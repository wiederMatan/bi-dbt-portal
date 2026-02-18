#!/usr/bin/env python3
"""
Test script for DBT Model Analyzer backend
"""
import requests
import json

API_BASE = "http://localhost:5001/api"

def test_projects():
    """Test GET /api/projects endpoint"""
    print("Testing GET /api/projects...")
    try:
        response = requests.get(f"{API_BASE}/projects")
        if response.status_code == 200:
            data = response.json()
            projects = data.get('projects', [])
            print(f"✅ Success! Found {len(projects)} projects:")
            for project in projects[:3]:  # Show first 3
                print(f"   - {project['display_name']} ({project['model_count']} models)")
            return projects
        else:
            print(f"❌ Failed with status {response.status_code}")
            print(response.text)
            return []
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def test_chat(project_name):
    """Test POST /api/chat endpoint"""
    print(f"\nTesting POST /api/chat with project '{project_name}'...")
    try:
        payload = {
            "project_name": project_name,
            "message": "How many models are in this project?",
            "conversation_history": []
        }
        response = requests.post(
            f"{API_BASE}/chat",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Response:")
            print(f"   {data.get('response', '')[:200]}...")
        else:
            print(f"❌ Failed with status {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("DBT Model Analyzer Backend Test")
    print("=" * 60)
    
    # Test projects endpoint
    projects = test_projects()
    
    # Test chat endpoint with first project
    if projects:
        test_chat(projects[0]['name'])
    
    print("\n" + "=" * 60)
    print("Test complete!")
    print("=" * 60)
