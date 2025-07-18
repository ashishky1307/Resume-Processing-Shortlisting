from database import get_db, engine
from sqlalchemy import text

def check_table_and_add_columns():
    print("Starting database schema update...")
    try:
        print("Connecting to database...")
        # Check current table structure
        with engine.connect() as conn:
            print("Connected successfully!")
            result = conn.execute(text("DESCRIBE candidates"))
            columns = [row[0] for row in result.fetchall()]
            print("Current columns:", columns)
            
            # Check if our new columns exist
            has_file_hash = 'file_hash' in columns
            has_batch_id = 'batch_id' in columns
            
            print(f"Has file_hash column: {has_file_hash}")
            print(f"Has batch_id column: {has_batch_id}")
            
            # Add missing columns
            if not has_file_hash:
                print("Adding file_hash column...")
                conn.execute(text("ALTER TABLE candidates ADD COLUMN file_hash VARCHAR(64) UNIQUE"))
                conn.commit()
                print("file_hash column added!")
                
            if not has_batch_id:
                print("Adding batch_id column...")
                conn.execute(text("ALTER TABLE candidates ADD COLUMN batch_id VARCHAR(36)"))
                conn.commit()
                print("batch_id column added!")
            
            if has_file_hash and has_batch_id:
                print("All columns already exist!")
                
            print("Database schema updated successfully!")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_table_and_add_columns()
