FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY kiro-cli /usr/local/bin/kiro-cli
RUN chmod +x /usr/local/bin/kiro-cli

ENV FLASK_APP=app.py
ENV PYTHONUNBUFFERED=1

EXPOSE 5001

CMD ["python", "-m", "flask", "run", "--host=0.0.0.0", "--port=5001"]
