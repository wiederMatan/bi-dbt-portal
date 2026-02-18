#!/bin/bash
cd "$(dirname "$0")"
export PORTAL_DIR=/home/bi_linux/bi-dbt-portal
export FLASK_APP=app.py
export FLASK_ENV=production
nohup python3 -m flask run --host=0.0.0.0 --port=5001 > /tmp/flask-backend.log 2>&1 &
echo "Backend started on port 5001. Logs: /tmp/flask-backend.log"
echo "PID: $!"
