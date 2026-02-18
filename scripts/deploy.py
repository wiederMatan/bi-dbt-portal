#!/usr/bin/env python3
import os
import sys
import json
import subprocess
import re

PORTAL_DIR = "/home/bi_linux/bi-dbt-portal"

def main():
    if len(sys.argv) < 2:
        print("❌ Error: PROJECT_NAME is required")
        print("Usage: python3 deploy.py <project_name>")
        sys.exit(1)
    
    project_name = sys.argv[1]
    print(f"🚀 Deploying {project_name} to DBT Portal...")
    
    # Create project directory
    project_dir = f"{PORTAL_DIR}/{project_name}"
    os.makedirs(project_dir, exist_ok=True)
    
    # Run Docker command
    cmd = [
        "docker", "run", "--rm",
        "--env", f"SQLSERVER_UID={os.getenv('SQLSERVER_UID', '')}",
        "--env", f"SQLSERVER_PWD={os.getenv('SQLSERVER_PWD', '')}",
        "-v", f"{project_dir}:/app/projects/{project_name}/target",
        f"<your-registry>/dbt-{project_name}:latest",
        "docs", "generate", "--static", "--target", "sqlserver_prd"
    ]
    
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True)
    if result.returncode != 0:
        print(f"❌ Error running Docker command:")
        print(result.stderr)
        sys.exit(1)
    
    # Update config
    config_file = f"{PORTAL_DIR}/static/cards-config.json"
    
    if os.path.exists(config_file) and os.path.getsize(config_file) > 0:
        with open(config_file, 'r') as f:
            config = json.load(f)
    else:
        config = []
    
    # Count models
    model_count = 0
    manifest_file = f"{project_dir}/manifest.json"
    if os.path.exists(manifest_file):
        with open(manifest_file, 'r') as f:
            manifest = json.load(f)
            model_count = sum(1 for node in manifest.get('nodes', {}).values() 
                            if node.get('resource_type') == 'model')
    
    # Format display name
    display_name = ' '.join(word.capitalize() for word in project_name.split('_'))
    
    # Check if project exists
    url = f"{project_name}/static_index.html"
    existing = next((i for i, p in enumerate(config) if p.get('url') == url), None)
    
    if existing is not None:
        config[existing]['lastUpdated'] = '1m'
        config[existing]['models'] = model_count
        print(f"✅ Updated {project_name} in portal")
    else:
        config.append({
            "title": display_name,
            "description": f"{project_name} DBT documentation",
            "url": url,
            "status": "active",
            "icon": "📊",
            "category": "active",
            "lastUpdated": "1m",
            "models": model_count,
            "priority": 999
        })
        print(f"✅ Added {project_name} to portal")
    
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"✅ Deployed {project_name} to portal: http://localhost:5000")

if __name__ == "__main__":
    main()
