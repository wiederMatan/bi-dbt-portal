#!/bin/bash
# Start Flask backend for DBT Model Analyzer

cd /home/bi_linux/bi-dbt-portal/backend

# Check if already running
if pgrep -f "python3 app.py" > /dev/null; then
    echo "Backend is already running"
    exit 0
fi

# Check if dependencies are installed
if ! python3 -c "import flask" 2>/dev/null; then
    echo "Installing dependencies..."
    pip3 install -r requirements.txt --user
fi

# Start Flask backend
echo "Starting Flask backend..."
export PORTAL_DIR=/home/bi_linux/bi-dbt-portal
nohup python3 app.py > /tmp/flask-backend.log 2>&1 &

sleep 2

if pgrep -f "python3 app.py" > /dev/null; then
    echo "✅ Flask backend started successfully"
    echo "   PID: $(pgrep -f 'python3 app.py')"
    echo "   Logs: /tmp/flask-backend.log"
    echo "   API: http://localhost:5001/api/projects"
else
    echo "❌ Failed to start backend"
    echo "Check logs: tail -f /tmp/flask-backend.log"
    exit 1
fi
