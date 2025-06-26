FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Make startup script executable
RUN chmod +x start.sh

# Create database directory
RUN mkdir -p /app/data

# Set environment variables
ENV DATABASE_URL=sqlite:///./data/app.db
ENV PYTHONPATH=/app

# Initialize database
RUN python -c "from database import create_tables; create_tables()"

# Expose port (Railway will set the PORT environment variable)
EXPOSE 8000

# Start the application using our startup script
CMD ["./start.sh"] 