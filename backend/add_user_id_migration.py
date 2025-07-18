#!/usr/bin/env python3
"""
Migration script to add user_id column to candidates table
"""

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database connection details
DB_HOST = os.environ.get("DB_HOST")
DB_PORT = os.environ.get("DB_PORT")
DB_USER = os.environ.get("DB_USER")
DB_PASS = os.environ.get("DB_PASS")
DB_NAME = os.environ.get("DB_NAME")

# Construct the database URL
DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def run_migration():
    """Add user_id column to candidates table"""
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # Check if user_id column already exists
            result = conn.execute(text("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = :db_name 
                AND TABLE_NAME = 'candidates' 
                AND COLUMN_NAME = 'user_id'
            """), {"db_name": DB_NAME})
            
            if result.fetchone():
                print("✅ user_id column already exists in candidates table")
                return True
            
            print("🔧 Adding user_id column to candidates table...")
            
            # Add user_id column
            conn.execute(text("""
                ALTER TABLE candidates 
                ADD COLUMN user_id INT NOT NULL DEFAULT 1
            """))
            
            # Create index for better performance
            conn.execute(text("""
                CREATE INDEX idx_candidates_user_id ON candidates(user_id)
            """))
            
            conn.commit()
            print("✅ Successfully added user_id column to candidates table")
            
            # Update existing records to have user_id = 1 (default user)
            result = conn.execute(text("UPDATE candidates SET user_id = 1 WHERE user_id IS NULL"))
            conn.commit()
            print(f"✅ Updated {result.rowcount} existing candidates with default user_id = 1")
            
            return True
            
    except Exception as e:
        print(f"❌ Error running migration: {str(e)}")
        return False

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
