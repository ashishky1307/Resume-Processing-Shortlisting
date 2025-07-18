import mysql.connector

def check_table_structure():
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='Senyar@2003',
            database='resume_processing'
        )
        cursor = conn.cursor()
        cursor.execute('DESCRIBE candidates')
        
        print('Current candidates table structure:')
        for row in cursor.fetchall():
            print(row)
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_table_structure()
