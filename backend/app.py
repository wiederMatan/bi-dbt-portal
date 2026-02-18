#!/usr/bin/env python3
import os
import json
import subprocess
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

PORTAL_DIR = os.getenv('PORTAL_DIR', '/app/portal')

@app.route('/api/projects', methods=['GET'])
def get_projects():
    """List all available dbt projects with manifest.json"""
    try:
        projects = []
        for item in os.listdir(PORTAL_DIR):
            item_path = os.path.join(PORTAL_DIR, item)
            manifest_path = os.path.join(item_path, 'manifest.json')
            
            if os.path.isdir(item_path) and os.path.exists(manifest_path):
                # Read manifest to get project info
                try:
                    with open(manifest_path, 'r') as f:
                        manifest = json.load(f)
                        metadata = manifest.get('metadata', {})
                        nodes = manifest.get('nodes', {})
                        model_count = sum(1 for node in nodes.values() 
                                        if node.get('resource_type') == 'model')
                        
                        projects.append({
                            'name': item,
                            'display_name': ' '.join(word.capitalize() for word in item.split('_')),
                            'model_count': model_count,
                            'dbt_version': metadata.get('dbt_version', 'unknown')
                        })
                except Exception as e:
                    print(f"Error reading manifest for {item}: {e}")
                    continue
        
        projects.sort(key=lambda x: x['name'])
        return jsonify({'projects': projects})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat requests with Kiro CLI"""
    try:
        data = request.json
        project_name = data.get('project_name')
        message = data.get('message')
        conversation_history = data.get('conversation_history', [])
        
        if not project_name or not message:
            return jsonify({'error': 'project_name and message are required'}), 400
        
        # Load manifest.json
        manifest_path = os.path.join(PORTAL_DIR, project_name, 'manifest.json')
        if not os.path.exists(manifest_path):
            return jsonify({'error': f'Manifest not found for project {project_name}'}), 404
        
        # Read manifest
        with open(manifest_path, 'r') as f:
            manifest_content = f.read()
        
        # Invoke Kiro CLI
        response = invoke_kiro(project_name, message, manifest_content, conversation_history)
        
        return jsonify({'response': response})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def invoke_kiro(project_name, message, manifest_content, conversation_history):
    """Invoke Kiro CLI with manifest context and user query"""
    
    # Check if user is trying to create/write files
    create_keywords = ['create', 'write', 'save', 'generate file', 'make file', 'צור', 'כתוב', 'שמור', 'יצור']
    if any(keyword in message.lower() for keyword in create_keywords):
        return "אני צ'אט, לא קבלן שיפוצים. שאלות בלבד !👷‍♂️"
    
    # Check manifest size and chunk if needed
    manifest_size = len(manifest_content)
    max_chunk_size = 100000  # ~100KB chunks
    
    if manifest_size > max_chunk_size:
        # Parse manifest and extract key information
        manifest_data = json.loads(manifest_content)
        manifest_summary = create_manifest_summary(manifest_data)
        context_content = manifest_summary
    else:
        context_content = manifest_content
    
    # Build context message
    context = f"""### ROLE
You are the "KIRO Analytics Architect," a Senior Analytics Engineer and Security Researcher. Your mission is to analyze dbt projects and explain complex SQL logic to business users in a clean, Gemini-like interface.

### OPERATIONAL RULES
1. **Language:** Default response language is HEBREW. Use English for technical terms, SQL code, and model names.
2. **Source of Truth:** Always prioritize `compiled_sql` over metadata descriptions. If the SQL logic contradicts the documentation, follow the SQL.
3. **Security First (Critical):** 
   - Never use `eval()` or dynamic execution
   - Sanitize all outputs to prevent XSS (CWE-79)
   - Avoid leaking full server paths in error messages

### FORMATTING PROTOCOL (GEMINI STYLE)
You MUST format every response using the following Markdown structure:

1. **### שורה תחתונה (Bottom Line)**
   A concise, 2-3 sentence business summary of the answer in Hebrew.

2. **---** (Horizontal Rule)

3. **### ניתוח לוגי (Logic Analysis)**
   - Use **bold** for metrics and table names (e.g., **dwh_fact_tik_achifa**)
   - Use bullet points for business rules extracted from the SQL
   - If comparing columns or models, use a **Markdown Table**

4. **### לוגיקת SQL מקומפלת (Compiled SQL)**
   Provide the relevant snippet of the `compiled_sql` inside:
   ```sql
   [Insert SQL here]
   ```

5. **---** (Horizontal Rule)

6. **### צעדים הבאים (Next Steps)**
   Suggest 2 relevant follow-up questions based on the current context.

### DBT PROJECT CONTEXT
Project: {project_name}

Manifest Content:
{context_content}

IMPORTANT: You can only READ and DISPLAY information. You CANNOT create, write, or save any files. Only provide analysis and display output.

Please answer questions about the dbt models, their dependencies, columns, SQL logic, and relationships based on this manifest data."""
    
    # Build full prompt with conversation history
    prompt_parts = [context]
    
    for msg in conversation_history:
        role = msg.get('role')
        content = msg.get('content')
        if role == 'user':
            prompt_parts.append(f"\nUser: {content}")
        elif role == 'assistant':
            prompt_parts.append(f"\nAssistant: {content}")
    
    prompt_parts.append(f"\nUser: {message}")
    
    full_prompt = "\n".join(prompt_parts)
    
    # Call kiro-cli via HTTP proxy on host
    try:
        import requests
        import re
        import html
        
        response = requests.post(
            'http://111.27.0.1:5002/kiro',
            json={'prompt': full_prompt},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('returncode') == 0:
                output = data.get('stdout', '').strip()
                # Remove ANSI escape codes
                ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
                clean_output = ansi_escape.sub('', output)
                # Remove the "> " prefix and any leading/trailing whitespace
                clean_output = re.sub(r'^>\s*', '', clean_output).strip()
                # Unescape HTML entities
                clean_output = html.unescape(clean_output)
                return clean_output
            else:
                return f"Error: {data.get('stderr', 'Unknown error')}"
        else:
            return f"HTTP Error: {response.status_code}"
    
    except Exception as e:
        return f"Error: {str(e)}"

def create_manifest_summary(manifest_data):
    """Create a condensed summary of large manifest files"""
    summary = {
        'metadata': manifest_data.get('metadata', {}),
        'nodes': {}
    }
    
    # Extract only model information
    nodes = manifest_data.get('nodes', {})
    for node_id, node_data in nodes.items():
        if node_data.get('resource_type') == 'model':
            summary['nodes'][node_id] = {
                'name': node_data.get('name'),
                'resource_type': node_data.get('resource_type'),
                'depends_on': node_data.get('depends_on', {}),
                'columns': node_data.get('columns', {}),
                'description': node_data.get('description', ''),
                'schema': node_data.get('schema', ''),
                'database': node_data.get('database', ''),
                'tags': node_data.get('tags', [])
            }
    
    return json.dumps(summary, indent=2)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
