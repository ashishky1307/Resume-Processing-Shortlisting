import os
from dotenv import load_dotenv
import mysql.connector

# Load environment variables
load_dotenv()

# Get database connection details
DB_HOST = os.environ.get("DB_HOST")
DB_PORT = os.environ.get("DB_PORT")
DB_USER = os.environ.get("DB_USER")
DB_PASS = os.environ.get("DB_PASS")
DB_NAME = os.environ.get("DB_NAME")

print(f"Connecting to: {DB_HOST}:{DB_PORT} as {DB_USER}")

try:
    # Try direct connection with mysql-connector
    conn = mysql.connector.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME
    )
    print("Database connection successful!")
    conn.close()
except Exception as e:
    print(f"Database connection failed: {e}")
