#!/bin/bash
set -e

# Your existing Docker commands
DOCKER_TAG=$(cat $(System.DefaultWorkingDirectory)/_pipeline-bi-miznon/bi_miznon/tag.txt)

echo "Pulling Docker image with tag: $DOCKER_TAG"
docker pull <your-registry>/dbt-bi_miznon:$DOCKER_TAG

echo "Tagging as latest"
docker tag <your-registry>/dbt-bi_miznon:$DOCKER_TAG <your-registry>/dbt-bi_miznon:latest

echo "Deploying to DBT Portal"
python3 /home/bi_linux/bi-dbt-portal/scripts/deploy.py bi_miznon

echo "✅ Release completed successfully"
