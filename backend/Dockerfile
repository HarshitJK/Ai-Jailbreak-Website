# ── Backend Dockerfile ────────────────────────────────────────────────────────
# Base: python:3.12-slim — smaller than the full image, no unnecessary tools
FROM python:3.12-slim

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /backend

# Install dependencies first (layer is cached unless requirements.txt changes)
COPY requirements.txt .
RUN pip install --default-timeout=100 --no-cache-dir -r requirements.txt

# Copy the application source
COPY . .

# Expose the port the backend listens on
EXPOSE 4000

# Production startup — no --reload, bind to all interfaces
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "4000"]
