import os
import logging
import hashlib
import uuid
import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Enum, ForeignKey, DateTime, Text, Boolean, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from dotenv import load_dotenv
import enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get database connection details from environment variables
DB_HOST = os.environ.get("DB_HOST")
DB_PORT = os.environ.get("DB_PORT")
DB_USER = os.environ.get("DB_USER")
DB_PASS = os.environ.get("DB_PASS")
DB_NAME = os.environ.get("DB_NAME")

# Construct the database URL
DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Create the SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Create a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# Define Enums
class Status(enum.Enum):
    PENDING = "pending"
    SHORTLISTED = "shortlisted"
    REJECTED = "rejected"

class SkillCategory(enum.Enum):
    TECHNICAL = "technical"
    SOFT = "soft"
    LANGUAGE = "language"
    OTHER = "other"

class ProficiencyLevel(enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"
    UNKNOWN = "unknown"

# Define Models
class Candidate(Base):
    __tablename__ = "candidates"

    candidate_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)  # Foreign key to users table
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)  # Removed unique constraint
    phone = Column(String(50))
    location = Column(String(255))
    years_experience = Column(Integer)
    resume_file_path = Column(String(1000))  # S3 object key or path
    resume_s3_url = Column(String(1000))     # Full S3 URL or presigned URL
    original_filename = Column(String(255))  # Original filename for reference
    file_hash = Column(String(64), unique=True, nullable=True)  # SHA256 hash for duplicate detection
    batch_id = Column(String(36), nullable=True)  # UUID for batch uploads
    status = Column(Enum(Status), default=Status.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    education = relationship("Education", back_populates="candidate", cascade="all, delete-orphan")
    skills = relationship("Skill", back_populates="candidate", cascade="all, delete-orphan")
    work_experiences = relationship("WorkExperience", back_populates="candidate", cascade="all, delete-orphan")

class Education(Base):
    __tablename__ = "education"

    education_id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(Integer, ForeignKey("candidates.candidate_id", ondelete="CASCADE"))
    degree = Column(String(255))
    institution = Column(String(255))
    graduation_year = Column(Integer)
    gpa = Column(Float, nullable=True)

    # Relationship
    candidate = relationship("Candidate", back_populates="education")

class Skill(Base):
    __tablename__ = "skills"

    skill_id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(Integer, ForeignKey("candidates.candidate_id", ondelete="CASCADE"))
    skill_name = Column(String(255))
    skill_category = Column(Enum(SkillCategory), default=SkillCategory.TECHNICAL)
    proficiency_level = Column(Enum(ProficiencyLevel), default=ProficiencyLevel.UNKNOWN)

    # Relationship
    candidate = relationship("Candidate", back_populates="skills")

class WorkExperience(Base):
    __tablename__ = "work_experiences"

    experience_id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(Integer, ForeignKey("candidates.candidate_id", ondelete="CASCADE"))
    company = Column(String(255))
    position = Column(String(255))
    start_date = Column(String(50))  # Storing as string since we may not have exact dates
    end_date = Column(String(50))    # Could be "Present" or a date
    duration = Column(String(100))   # e.g., "2 years 3 months"
    description = Column(Text, nullable=True)

    # Relationship
    candidate = relationship("Candidate", back_populates="work_experiences")

# Database operations functions
def get_db():
    """Get a database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all tables in the database"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")

def save_candidate_data(parsed_data, resume_file_path=None, resume_s3_url=None, original_filename=None, user_id=None):
    """
    Save parsed resume data to database (legacy function for backward compatibility)
    
    Args:
        parsed_data (dict): The parsed resume data
        resume_file_path (str, optional): Path or key to the resume in S3
        resume_s3_url (str, optional): Full S3 URL to the resume
        original_filename (str, optional): Original filename of the uploaded resume
        user_id (int, optional): ID of the user uploading the resume
    
    Returns:
        int: The ID of the inserted candidate
    """
    return save_candidate_data_with_hash(
        parsed_data, 
        resume_file_path, 
        resume_s3_url, 
        original_filename, 
        file_hash=None, 
        batch_id=None,
        user_id=user_id
    )

def get_all_candidates(page=1, limit=5, status=None, user_id=None, min_experience=None, max_experience=None, 
                      skills=None, location=None, company=None, position=None, education=None):
    """
    Get all candidates with comprehensive filtering options
    
    Args:
        limit (int): Maximum number of candidates to return
        status (Status, optional): Filter by candidate status
        user_id (int, optional): Filter by user ID (for user-specific data)
        min_experience (int, optional): Minimum years of experience
        max_experience (int, optional): Maximum years of experience
        skills (list, optional): List of skills to filter by
        location (str, optional): Location to filter by (partial match)
        company (str, optional): Company name to filter by (partial match)
        position (str, optional): Position/title to filter by (partial match)
        education (str, optional): Education/degree to filter by (partial match)
        
    Returns:
        list: List of candidate objects with relationships loaded
    """
    from sqlalchemy import and_, or_, func
    
    db = SessionLocal()
    try:
        query = db.query(Candidate)
        
        # Basic filters
        if status:
            query = query.filter(Candidate.status == status)
            
        if user_id:
            query = query.filter(Candidate.user_id == user_id)
            
        # Experience filters
        if min_experience is not None:
            query = query.filter(Candidate.years_experience >= min_experience)
            
        if max_experience is not None:
            query = query.filter(Candidate.years_experience <= max_experience)
            
        # Location filter
        if location:
            query = query.filter(Candidate.location.ilike(f"%{location}%"))
        
        # Skills filter
        if skills and len(skills) > 0:
            # Join with skills table and filter by skill names
            query = query.join(Skill).filter(
                or_(*[Skill.skill_name.ilike(f"%{skill.strip()}%") for skill in skills])
            ).distinct()
        
        # Work experience filters
        if company or position:
            query = query.join(WorkExperience)
            
            if company:
                query = query.filter(WorkExperience.company.ilike(f"%{company}%"))
                
            if position:
                query = query.filter(WorkExperience.position.ilike(f"%{position}%"))
                
            query = query.distinct()
        
        # Education filter
        if education:
            query = query.join(Education).filter(
                or_(
                    Education.degree.ilike(f"%{education}%"),
                    Education.institution.ilike(f"%{education}%")
                )
            ).distinct()        # Calculate pagination
        offset = (page - 1) * limit
        
        # Get total count for pagination info - create a separate count query
        count_query = db.query(func.count(Candidate.candidate_id))
        
        # Apply the same filters to count query
        if status:
            count_query = count_query.filter(Candidate.status == status)
            
        if user_id:
            count_query = count_query.filter(Candidate.user_id == user_id)
            
        # Experience filters
        if min_experience is not None:
            count_query = count_query.filter(Candidate.years_experience >= min_experience)
            
        if max_experience is not None:
            count_query = count_query.filter(Candidate.years_experience <= max_experience)
            
        # Location filter
        if location:
            count_query = count_query.filter(Candidate.location.ilike(f"%{location}%"))
        
        # Skills filter
        if skills and len(skills) > 0:
            count_query = count_query.join(Skill).filter(
                or_(*[Skill.skill_name.ilike(f"%{skill.strip()}%") for skill in skills])
            ).distinct()
        
        # Work experience filters
        if company or position:
            count_query = count_query.join(WorkExperience)
            
            if company:
                count_query = count_query.filter(WorkExperience.company.ilike(f"%{company}%"))
                
            if position:
                count_query = count_query.filter(WorkExperience.position.ilike(f"%{position}%"))
                
            count_query = count_query.distinct()
        
        # Education filter
        if education:
            count_query = count_query.join(Education).filter(
                or_(
                    Education.degree.ilike(f"%{education}%"),
                    Education.institution.ilike(f"%{education}%")
                )
            ).distinct()
        
        # Get the total count
        total_count = count_query.scalar()
        
        # Apply pagination to main query
        candidates = query.offset(offset).limit(limit).all()
        
        # Load relationships explicitly to avoid lazy loading issues
        for candidate in candidates:
            _ = candidate.skills
            _ = candidate.education
            _ = candidate.work_experiences
            
        # Calculate pagination metadata
        total_pages = (total_count + limit - 1) // limit  # Ceiling division
        has_next = page < total_pages
        has_prev = page > 1
        
        return {
            'candidates': candidates,
            'pagination': {
                'page': page,
                'limit': limit,
                'total_count': total_count,
                'total_pages': total_pages,
                'has_next': has_next,
                'has_prev': has_prev
            }
        }
    except Exception as e:
        logger.error(f"Error fetching candidates: {str(e)}")
        raise  # Re-raise the exception to see what's going wrong
    finally:
        db.close()

def shortlist_candidate(candidate_id):
    """
    Mark a candidate as shortlisted
    
    Args:
        candidate_id (int): The ID of the candidate to shortlist
        
    Returns:
        bool: True if successful, False otherwise
    """
    db = SessionLocal()
    try:
        candidate = db.query(Candidate).filter(Candidate.candidate_id == candidate_id).first()
        if candidate:
            candidate.status = Status.SHORTLISTED
            candidate.updated_at = datetime.utcnow()
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"Error shortlisting candidate: {e}")
        return False
    finally:
        db.close()

def calculate_file_hash(file_path):
    """
    Calculate SHA256 hash of a file
    
    Args:
        file_path (str): Path to the file
        
    Returns:
        str: SHA256 hash of the file
    """
    sha256_hash = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            # Read file in chunks to handle large files
            for chunk in iter(lambda: f.read(4096), b""):
                sha256_hash.update(chunk)
        return sha256_hash.hexdigest()
    except Exception as e:
        logger.error(f"Error calculating file hash: {e}")
        return None

def check_duplicate_file(file_hash, user_id=None):
    """
    Check if a file with the given hash already exists in the database for the specific user
    
    Args:
        file_hash (str): SHA256 hash of the file
        user_id (int, optional): ID of the user to check duplicates for
        
    Returns:
        dict: Information about existing candidate if duplicate, None otherwise
    """
    if not file_hash:
        return None
        
    db = SessionLocal()
    try:
        # Build query with user_id filter if provided
        query = db.query(Candidate).filter(Candidate.file_hash == file_hash)
        
        if user_id is not None:
            query = query.filter(Candidate.user_id == user_id)
        
        existing_candidate = query.first()
        
        if existing_candidate:
            return {
                "candidate_id": existing_candidate.candidate_id,
                "candidate_name": existing_candidate.full_name,
                "upload_date": existing_candidate.created_at.isoformat(),
                "original_filename": existing_candidate.original_filename,
                "user_id": existing_candidate.user_id
            }
        return None
    except Exception as e:
        logger.error(f"Error checking duplicate file: {e}")
        return None
    finally:
        db.close()

def generate_batch_id():
    """
    Generate a unique batch ID for batch uploads
    
    Returns:
        str: UUID string for batch identification
    """
    return str(uuid.uuid4())

def save_candidate_data_with_hash(parsed_data, resume_file_path=None, resume_s3_url=None, 
                                 original_filename=None, file_hash=None, batch_id=None, user_id=None):
    """
    Save parsed resume data to database with file hash and batch ID
    
    Args:
        parsed_data (dict): The parsed resume data
        resume_file_path (str, optional): Path or key to the resume in S3
        resume_s3_url (str, optional): Full S3 URL to the resume
        original_filename (str, optional): Original filename of the uploaded resume
        file_hash (str, optional): SHA256 hash of the file
        batch_id (str, optional): Batch ID for batch uploads
        user_id (int, optional): ID of the user uploading the resume
    
    Returns:
        int: The ID of the inserted candidate
    """
    db = SessionLocal()
    
    try:
        # Check for existing file hash (exact same file)
        if file_hash:
            existing_by_hash = db.query(Candidate).filter(
                Candidate.file_hash == file_hash,
                Candidate.user_id == user_id
            ).first()
            
            if existing_by_hash:
                logger.info(f"File with hash {file_hash} already exists (Candidate ID: {existing_by_hash.candidate_id}). Updating candidate information.")
                
                # Update existing candidate with new information if provided
                if 'full_name' in parsed_data:
                    existing_by_hash.full_name = parsed_data.get('full_name')
                if 'email' in parsed_data and parsed_data.get('email'):
                    existing_by_hash.email = parsed_data.get('email')
                if 'phone' in parsed_data and parsed_data.get('phone'):
                    existing_by_hash.phone = parsed_data.get('phone')
                if 'location' in parsed_data and parsed_data.get('location'):
                    existing_by_hash.location = parsed_data.get('location')
                if 'years_experience' in parsed_data:
                    existing_by_hash.years_experience = parsed_data.get('years_experience', 0)
                
                # Update metadata
                existing_by_hash.batch_id = batch_id or existing_by_hash.batch_id
                existing_by_hash.updated_at = datetime.utcnow()
                
                db.commit()
                return existing_by_hash.candidate_id

        # Check for existing email if one is provided
        email = parsed_data.get('email')
        if email:
            existing_by_email = db.query(Candidate).filter(
                Candidate.email == email,
                Candidate.user_id == user_id
            ).first()
            
            if existing_by_email:
                logger.info(f"Candidate with email {email} already exists (ID: {existing_by_email.candidate_id}). Updating with new information.")
                
                # Update existing candidate with new information
                existing_by_email.full_name = parsed_data.get('full_name', existing_by_email.full_name)
                existing_by_email.phone = parsed_data.get('phone', existing_by_email.phone)
                existing_by_email.location = parsed_data.get('location', existing_by_email.location)
                existing_by_email.years_experience = parsed_data.get('years_experience', existing_by_email.years_experience)
                
                # Only update resume file info if provided
                if resume_file_path and resume_s3_url and file_hash:
                    existing_by_email.resume_file_path = resume_file_path
                    existing_by_email.resume_s3_url = resume_s3_url
                    existing_by_email.original_filename = original_filename
                    existing_by_email.file_hash = file_hash
                    existing_by_email.batch_id = batch_id
                
                existing_by_email.updated_at = datetime.utcnow()
                
                # Remove existing education, skills, and work experiences
                db.query(Education).filter(Education.candidate_id == existing_by_email.candidate_id).delete()
                db.query(Skill).filter(Skill.candidate_id == existing_by_email.candidate_id).delete()
                db.query(WorkExperience).filter(WorkExperience.candidate_id == existing_by_email.candidate_id).delete()
                
                candidate_id = existing_by_email.candidate_id
            else:
                # Create new candidate
                candidate = Candidate(
                    full_name=parsed_data.get('full_name', 'Unknown'),
                    email=email,
                    phone=parsed_data.get('phone'),
                    location=parsed_data.get('location'),
                    years_experience=parsed_data.get('years_experience', 0),
                    resume_file_path=resume_file_path,
                    resume_s3_url=resume_s3_url,
                    original_filename=original_filename,
                    file_hash=file_hash,
                    batch_id=batch_id,
                    user_id=user_id,
                    status=Status.PENDING
                )
                
                db.add(candidate)
                db.flush()  # Get the ID without committing
                candidate_id = candidate.candidate_id
        else:
            # No email provided, just create a new candidate
            candidate = Candidate(
                full_name=parsed_data.get('full_name', 'Unknown'),
                email=email,
                phone=parsed_data.get('phone'),
                location=parsed_data.get('location'),
                years_experience=parsed_data.get('years_experience', 0),
                resume_file_path=resume_file_path,
                resume_s3_url=resume_s3_url,
                original_filename=original_filename,
                file_hash=file_hash,
                batch_id=batch_id,
                user_id=user_id,
                status=Status.PENDING
            )
            
            db.add(candidate)
            db.flush()  # Get the ID without committing
            candidate_id = candidate.candidate_id
        
        # Add education entries
        for edu in parsed_data.get('education', []):
            # Safely convert year to integer, default to None if invalid
            graduation_year = None
            year_str = edu.get('year', '').strip()
            if year_str:
                try:
                    # Extract 4-digit year if it exists
                    import re
                    year_match = re.search(r'\b(19|20)\d{2}\b', year_str)
                    if year_match:
                        graduation_year = int(year_match.group())
                    else:
                        # Try to convert the whole string to int
                        graduation_year = int(year_str)
                except (ValueError, TypeError):
                    graduation_year = None
            
            education = Education(
                candidate_id=candidate_id,
                degree=edu.get('degree'),
                institution=edu.get('institution'),
                graduation_year=graduation_year
            )
            db.add(education)
        
        # Add skills
        for skill_name in parsed_data.get('skills', []):
            skill = Skill(
                candidate_id=candidate_id,
                skill_name=skill_name,
                # Default values for category and proficiency
                skill_category=SkillCategory.TECHNICAL,
                proficiency_level=ProficiencyLevel.UNKNOWN
            )
            db.add(skill)
            
        # Add work experiences
        for exp in parsed_data.get('work_experience', []):
            work_exp = WorkExperience(
                candidate_id=candidate_id,
                company=exp.get('company'),
                position=exp.get('position'),
                duration=exp.get('duration'),
                # Additional fields could be parsed if available
                start_date=exp.get('start_date', ''),
                end_date=exp.get('end_date', '')
            )
            db.add(work_exp)
            
        db.commit()
        return candidate_id
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving candidate data: {e}")
        return None
    finally:
        db.close()

def check_duplicate_candidate_content(parsed_data, user_id):
    """
    Check if a candidate with very similar content already exists for the user
    This helps identify updated resumes vs completely new candidates
    
    Args:
        parsed_data (dict): The parsed resume data to check
        user_id (int): ID of the user to check duplicates for
        
    Returns:
        dict: Information about similar candidate if found, None otherwise
    """
    if not parsed_data or not user_id:
        return None
        
    db = SessionLocal()
    try:
        full_name = parsed_data.get('full_name', '').strip()
        email = parsed_data.get('email', '').strip() if parsed_data.get('email') else None
        phone = parsed_data.get('phone', '').strip() if parsed_data.get('phone') else None
        
        # If we don't have at least a name, we can't check for duplicates
        if not full_name or full_name.lower() == 'unknown':
            return None
        
        # Start with candidates for this user with the same name
        query = db.query(Candidate).filter(
            Candidate.user_id == user_id,
            Candidate.full_name.ilike(f'%{full_name}%')
        )
        
        # If we have email, add it as additional filter
        if email:
            query = query.filter(Candidate.email == email)
        
        # If we have phone, add it as additional filter  
        if phone:
            query = query.filter(Candidate.phone == phone)
            
        existing_candidate = query.first()
        
        if existing_candidate:
            # Calculate similarity score based on matching fields
            similarity_score = 0
            total_fields = 0
            
            # Check name similarity
            if existing_candidate.full_name and full_name:
                if existing_candidate.full_name.lower() == full_name.lower():
                    similarity_score += 3  # Name is most important
                elif full_name.lower() in existing_candidate.full_name.lower():
                    similarity_score += 2
                total_fields += 3
            
            # Check email match
            if existing_candidate.email and email:
                if existing_candidate.email.lower() == email.lower():
                    similarity_score += 2
                total_fields += 2
            
            # Check phone match
            if existing_candidate.phone and phone:
                if existing_candidate.phone == phone:
                    similarity_score += 2
                total_fields += 2
            
            # Calculate similarity percentage
            similarity_percentage = (similarity_score / total_fields * 100) if total_fields > 0 else 0
            
            return {
                "candidate_id": existing_candidate.candidate_id,
                "candidate_name": existing_candidate.full_name,
                "email": existing_candidate.email,
                "phone": existing_candidate.phone,
                "upload_date": existing_candidate.created_at.isoformat(),
                "similarity_percentage": similarity_percentage,
                "is_likely_same_person": similarity_percentage >= 70  # 70% or higher suggests same person
            }
        
        return None
    except Exception as e:
        logger.error(f"Error checking duplicate candidate content: {e}")
        return None
    finally:
        db.close()

if __name__ == "__main__":
    # Initialize the database when run directly
    init_db()
