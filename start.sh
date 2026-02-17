#!/bin/bash
# Quick start script for DBT Model Analyzer

echo "=========================================="
echo "DBT Model Analyzer - Quick Start"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install docker-compose."
    exit 1
fi

echo "✅ docker-compose is available"
echo ""

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ Services started successfully!"
    echo "=========================================="
    echo ""
    echo "Portal URL: http://localhost:5000/home"
    echo "Analyzer URL: http://localhost:5000/analyze.html"
    echo ""
    echo "To view logs:"
    echo "  docker-compose logs -f"
    echo ""
    echo "To stop services:"
    echo "  docker-compose down"
    echo ""
else
    echo ""
    echo "❌ Failed to start services"
    echo "Check logs with: docker-compose logs"
    exit 1
fi
