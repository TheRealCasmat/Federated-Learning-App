FROM python:3.10.12-slim

# Set the working directory
WORKDIR /backend

# Install environment dependencies
RUN apt-get update && apt-get install -y pkg-config gcc g++ libhdf5-dev

# Install Python dependencies
RUN pip install --upgrade pip setuptools wheel

# Install project dependencies
RUN pip install --no-cache-dir flask flask-sqlalchemy psycopg2-binary python-dotenv flask-cors pillow tensorflowjs tensorflow==2.15.0 tensorflow_decision_forests==1.8.1

# Clean up APT
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Expose port 5000 for Flask
EXPOSE 5000

# Set the environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=development

# Start the Flask development server
CMD ["flask", "run", "--host=0.0.0.0", "--debug"]
