# Use the official Python image
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install python-dotenv

# Copy the rest of the application code
COPY . .

# Expose the correct port
EXPOSE 8000

# Start the FastAPI server using Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
