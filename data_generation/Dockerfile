FROM python:3.9-slim

# Install dependencies once during the build process
RUN pip install --no-cache-dir mysql-connector-python faker

# Copy the python script into the container
COPY seeder.py /app/seeder.py

# Run the script when the container starts
CMD ["python", "/app/seeder.py"]