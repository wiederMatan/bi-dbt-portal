# BI DBT Portal

A web portal for browsing and analyzing DBT (Data Build Tool) project documentation with AI-powered chat assistance.

## Features

- **DBT Documentation Viewer**: Browse multiple DBT projects and their documentation
- **AI Chat Assistant**: Ask questions about DBT models using Kiro CLI integration
- **Project Analytics**: View model counts, dependencies, and relationships
- **Hebrew Support**: Full RTL support with Hebrew interface

## Architecture

- **Frontend**: Static HTML/CSS/JS with Nginx
- **Backend**: Flask API for chat functionality
- **AI Integration**: Kiro CLI via HTTP proxy for intelligent analysis
- **Containerized**: Docker Compose deployment

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Kiro CLI installed and authenticated on host

### Run the Project

```bash
docker compose up -d
```

Access the portal at: `http://localhost:5000`

### Services

- **Frontend (Nginx)**: Port 5000
- **Backend (Flask)**: Port 5001
- **Kiro Proxy**: Port 5002 (host)

## Project Structure

```
bi-dbt-portal/
├── backend/              # Flask API
│   ├── app.py           # Main application
│   └── Dockerfile
├── assets/              # Static assets (CSS, JS, images)
├── kiro_sessions/       # Kiro CLI proxy
│   └── kiro_proxy.py   # HTTP proxy for host Kiro CLI
├── static/              # Static configuration
├── docker-compose.yml   # Container orchestration
├── nginx.conf          # Nginx configuration
└── index.html          # Main portal page
```

## Configuration

### Adding DBT Projects

Place DBT project artifacts in the root directory:
```
bi_<project_name>/
├── manifest.json
├── catalog.json
├── static_index.html
└── ...
```

Projects starting with `bi_*` are automatically discovered and displayed.

### Kiro CLI Setup

The backend uses a host-side Kiro CLI proxy. Ensure Kiro is authenticated:

```bash
kiro-cli login --use-device-flow
```

Start URL: `<your-aws-sso-url>`  
Region: Ireland

## Development

### Backend Development

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Kiro Proxy

```bash
python3 kiro_sessions/kiro_proxy.py
```

## Security

- CORS enabled for same-origin requests
- Security headers configured (CSP, X-Frame-Options, etc.)
- Read-only file operations in chat
- No file creation/modification allowed via chat

## License

Matan Wieder:)

