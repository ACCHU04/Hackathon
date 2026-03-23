FROM python:3.11-slim

WORKDIR /app

# System deps for newspaper3k / lxml
RUN apt-get update && apt-get install -y --no-install-recommends \
    libxml2-dev libxslt-dev libjpeg-dev zlib1g-dev build-essential curl \
 && rm -rf /var/lib/apt/lists/*

# Install Python deps from root requirements.txt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY backend/app ./app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
