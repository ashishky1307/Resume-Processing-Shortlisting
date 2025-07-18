from database import SessionLocal, Candidate

def check_database():
    db = SessionLocal()
    try:
        candidates = db.query(Candidate).all()
        print(f'Number of candidates: {len(candidates)}')
        for c in candidates:
            print(f'- {c.full_name} (ID: {c.candidate_id}, Email: {c.email})')
    finally:
        db.close()

if __name__ == "__main__":
    check_database()
