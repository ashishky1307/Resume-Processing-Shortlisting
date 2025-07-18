from database import get_db, engine
from sqlalchemy import text

def fix_skill_name_column():
    print("Fixing skill_name column length...")
    try:
        with engine.connect() as conn:
            # Check current column definition
            result = conn.execute(text("DESCRIBE skills"))
            columns = {row[0]: row[1] for row in result.fetchall()}
            print(f"Current skill_name type: {columns.get('skill_name', 'NOT FOUND')}")
            
            # Update skill_name column to TEXT to handle longer skill lists
            print("Updating skill_name column to TEXT...")
            conn.execute(text("ALTER TABLE skills MODIFY COLUMN skill_name TEXT"))
            conn.commit()
            print("skill_name column updated to TEXT successfully!")
            
            # Also update skill_category to handle longer categories if needed
            print("Updating skill_category column to VARCHAR(100)...")
            conn.execute(text("ALTER TABLE skills MODIFY COLUMN skill_category VARCHAR(100)"))
            conn.commit()
            print("skill_category column updated successfully!")
            
            print("Database schema updated successfully!")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    fix_skill_name_column()
