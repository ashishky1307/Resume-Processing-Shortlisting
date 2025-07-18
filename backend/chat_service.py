import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import logging
import os
import uuid
import re
from groq import Groq
from dotenv import load_dotenv
from pydantic import BaseModel
from database import get_db, Candidate, Education, Skill, WorkExperience
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import json

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Groq client
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

# Database setup for chat history
Base = declarative_base()

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)  # For future user system integration
    session_id = Column(String(36), unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to chat messages
    messages = relationship("ChatMessage", back_populates="session")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(36), ForeignKey("chat_sessions.session_id"))    
    role = Column(String(20))  # 'user', 'assistant', 'system'
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    message_metadata = Column(Text)  # JSON string for additional data
    
    # Relationship to chat session
    session = relationship("ChatSession", back_populates="messages")

# Pydantic models
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_id: Optional[int] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    sources: List[Dict[str, Any]] = []
    candidates_mentioned: List[int] = []

class ChatHistory(BaseModel):
    session_id: str
    messages: List[Dict[str, Any]]
    created_at: datetime
    last_activity: datetime

class CandidateRAGService:
    """
    Service to retrieve and format candidate data for RAG
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_all_candidates_data(self, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Get all candidate data for RAG context, filtered by user_id
        """
        try:
            # Get candidates filtered by user_id
            query = self.db.query(Candidate)
            if user_id is not None:
                query = query.filter(Candidate.user_id == user_id)
            
            candidates = query.all()
            
            candidates_data = []
            for candidate in candidates:
                # Get education
                education = self.db.query(Education).filter(Education.candidate_id == candidate.candidate_id).all()
                education_list = [
                    {
                        "degree": edu.degree,
                        "institution": edu.institution,
                        "graduation_year": edu.graduation_year
                    }
                    for edu in education
                ]
                
                # Get skills
                skills = self.db.query(Skill).filter(Skill.candidate_id == candidate.candidate_id).all()
                skills_list = [skill.skill_name for skill in skills]
                
                # Get work experience
                work_experience = self.db.query(WorkExperience).filter(WorkExperience.candidate_id == candidate.candidate_id).all()
                work_exp_list = [
                    {
                        "company": exp.company,
                        "position": exp.position,
                        "duration": exp.duration,
                        "start_date": str(exp.start_date) if exp.start_date else None,
                        "end_date": str(exp.end_date) if exp.end_date else None
                    }
                    for exp in work_experience
                ]
                
                candidate_data = {
                    "candidate_id": candidate.candidate_id,
                    "full_name": candidate.full_name,
                    "email": candidate.email,
                    "phone": candidate.phone,
                    "location": candidate.location,
                    "years_experience": candidate.years_experience,
                    "status": candidate.status.value if candidate.status else "pending",
                    "education": education_list,
                    "skills": skills_list,
                    "work_experience": work_exp_list                }
                candidates_data.append(candidate_data)
            
            return candidates_data
        
        except Exception as e:
            logger.error(f"Error getting candidates data for RAG: {str(e)}")
            return []
    
    def search_candidates_by_criteria(self, criteria: Dict[str, Any], user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Search candidates based on specific criteria, filtered by user_id
        """
        try:
            query = self.db.query(Candidate)
            
            # Filter by user_id first
            if user_id is not None:
                query = query.filter(Candidate.user_id == user_id)
            
            # Apply filters based on criteria
            if criteria.get('skills'):
                # This would need a more sophisticated join query
                pass
            
            if criteria.get('location'):
                query = query.filter(Candidate.location.ilike(f"%{criteria['location']}%"))
            
            if criteria.get('min_experience'):
                query = query.filter(Candidate.years_experience >= criteria['min_experience'])
            
            if criteria.get('max_experience'):
                query = query.filter(Candidate.years_experience <= criteria['max_experience'])
            
            candidates = query.all()
            return [{"candidate_id": c.candidate_id, "full_name": c.full_name} for c in candidates]
        
        except Exception as e:
            logger.error(f"Error searching candidates: {str(e)}")
            return []

class ChatService:
    """
    Main chat service that handles conversations and RAG
    """
    
    def __init__(self):
        try:
            # Use the same database configuration as the main module
            from database import DATABASE_URL
            self.engine = create_engine(DATABASE_URL)
            
            # Create tables if they don't exist
            Base.metadata.create_all(bind=self.engine)
            
            # Create session factory
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
            self.chat_db = SessionLocal()
            
            # Create main database session for candidate data
            self.main_db = next(get_db())
            
            # Initialize RAG service
            self.rag_service = CandidateRAGService(self.main_db)
            
            self.db_connected = True
            logger.info("Chat service initialized successfully with database connection")
            
        except Exception as e:
            logger.error(f"Failed to initialize chat service with database: {str(e)}")
            logger.warning("Chat service will operate in limited mode without database persistence")
            
            # Initialize with minimal functionality
            self.engine = None
            self.chat_db = None
            self.main_db = None
            self.rag_service = None
            self.db_connected = False
    def create_session(self, user_id: Optional[int] = None) -> str:
        """
        Create a new chat session
        """
        session_id = str(uuid.uuid4())
        
        if not self.db_connected or not self.chat_db:
            logger.warning("Database not connected, returning session ID without persistence")
            return session_id
        
        try:
            session = ChatSession(
                session_id=session_id,
                user_id=user_id
            )
            
            self.chat_db.add(session)
            self.chat_db.commit()
            
        except Exception as e:
            logger.error(f"Failed to save session to database: {str(e)}")
        
        return session_id
    def save_message(self, session_id: str, role: str, content: str, metadata: Optional[Dict] = None):
        """
        Save a message to chat history
        """
        if not self.db_connected or not self.chat_db:
            logger.warning("Database not connected, message not persisted")
            return
        
        try:
            message = ChatMessage(
                session_id=session_id,
                role=role,
                content=content,
                message_metadata=json.dumps(metadata) if metadata else None
            )
            
            self.chat_db.add(message)
            
            # Update session last activity
            session = self.chat_db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
            if session:
                session.last_activity = datetime.utcnow()
            
            self.chat_db.commit()
        except Exception as e:
            logger.error(f"Failed to save message to database: {str(e)}")
    def get_chat_history(self, session_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get chat history for a session
        """
        if not self.db_connected or not self.chat_db:
            return []
        
        try:
            messages = (
                self.chat_db.query(ChatMessage)
                .filter(ChatMessage.session_id == session_id)
                .order_by(ChatMessage.timestamp.desc())
                .limit(limit)
                .all()
            )
            return [
                {
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat() if msg.timestamp else None,
                    "metadata": json.loads(msg.message_metadata) if msg.message_metadata else None
                }
                for msg in reversed(messages)
            ]
        except Exception as e:
            logger.error(f"Error getting chat history: {str(e)}")
            return []
    def prepare_rag_context(self, user_message: str, user_id: Optional[int] = None) -> str:
        """
        Prepare RAG context based on user message and candidate data
        """
        # Check if RAG service is available
        if not self.rag_service:
            return """=== CANDIDATE DATABASE ===
No candidates found in your database.

It looks like you haven't uploaded any resumes yet. To get started:
1. Use the file uploader to upload resume files (PDF, DOCX, or TXT)
2. The system will extract and parse candidate information
3. Once uploaded, you can ask me questions about your candidates

I'll be ready to help you find the perfect candidates once you have some resumes in your database!
"""
        
        # Get user-specific candidates data
        candidates_data = self.rag_service.get_all_candidates_data(user_id)
        
        if not candidates_data:
            return """=== CANDIDATE DATABASE ===
No candidates found in your database.

It looks like you haven't uploaded any resumes yet. To get started:
1. Use the file uploader to upload resume files (PDF, DOCX, or TXT)
2. The system will extract and parse candidate information
3. Once uploaded, you can ask me questions about your candidates

I'll be ready to help you find the perfect candidates once you have some resumes in your database!
"""
        
        # Create a comprehensive context about the candidates
        context_parts = [
            "=== CANDIDATE DATABASE ===",
            f"Total candidates available: {len(candidates_data)}",
            ""
        ]
        
        for candidate in candidates_data:
            context_parts.extend([
                f"CANDIDATE ID: {candidate['candidate_id']}",
                f"Name: {candidate['full_name']}",
                f"Email: {candidate.get('email', 'Not provided')}",
                f"Phone: {candidate.get('phone', 'Not provided')}",
                f"Location: {candidate.get('location', 'Not provided')}",
                f"Years of Experience: {candidate.get('years_experience', 'Not specified')}",
                f"Status: {candidate.get('status', 'pending')}",
                "",
                "Education:",
                *[f"  - {edu.get('degree', 'Unknown')} from {edu.get('institution', 'Unknown')} ({edu.get('graduation_year', 'Unknown')})" 
                  for edu in candidate.get('education', [])],
                "",
                f"Skills: {', '.join(candidate.get('skills', ['No skills listed']))}",
                "",
                "Work Experience:",
                *[f"  - {exp.get('position', 'Unknown')} at {exp.get('company', 'Unknown')} ({exp.get('duration', 'Unknown')})" 
                  for exp in candidate.get('work_experience', [])],
                "",
                "=" * 50,
                ""
            ])
        
        return "\n".join(context_parts)
    
    def generate_response(self, user_message: str, session_id: str, user_id: Optional[int] = None) -> ChatResponse:
        """
        Generate AI response using RAG and conversation history
        """
        try:
            # Get conversation history
            history = self.get_chat_history(session_id, limit=5)
            
            # Prepare RAG context
            rag_context = self.prepare_rag_context(user_message, user_id)
            
            # Build conversation history for the LLM
            conversation = [
                {
                    "role": "system",
                    "content": f"""You are an expert HR assistant helping users find the perfect candidates from their resume database. 

You have access to a database of candidates with their complete information including:
- Personal details (name, contact info, location)
- Education background
- Skills (technical and soft skills)
- Work experience
- Years of experience
- Current status

CANDIDATE DATA:
{rag_context}

Your role is to:
1. Help users find candidates that match specific criteria
2. Compare candidates and provide recommendations
3. Answer questions about candidate qualifications
4. Suggest the best candidates for specific roles or requirements
5. Provide insights about the candidate pool

Guidelines:
- Always reference specific candidate IDs when mentioning candidates
- Provide detailed explanations for your recommendations
- Be helpful and conversational
- If asked about candidates not in the database, clearly state they are not available
- When comparing candidates, highlight their strengths and differences
- Be specific about skills, experience, and qualifications

Remember: You can only recommend candidates from the provided database."""
                }
            ]
            
            # Add conversation history
            for msg in history:
                if msg['role'] in ['user', 'assistant']:
                    conversation.append({
                        "role": msg['role'],
                        "content": msg['content']
                    })
            
            # Add current user message
            conversation.append({
                "role": "user",
                "content": user_message
            })
            
            # Generate response using Groq
            chat_completion = client.chat.completions.create(
                messages=conversation,
                model="llama3-70b-8192",
                temperature=0.7,
                max_tokens=1500
            )
            
            response_content = chat_completion.choices[0].message.content
            
            # Extract mentioned candidate IDs (simple regex approach)
            import re
            candidate_ids = re.findall(r'candidate[:\s]+(\d+)', response_content.lower())
            candidate_ids = [int(id) for id in candidate_ids]
            
            # Save messages to history
            self.save_message(session_id, "user", user_message)
            self.save_message(session_id, "assistant", response_content, 
                            {"candidates_mentioned": candidate_ids})
            
            return ChatResponse(
                response=response_content,
                session_id=session_id,
                candidates_mentioned=candidate_ids,
                sources=[{"type": "candidate_database", "count": len(self.rag_service.get_all_candidates_data(user_id))}]
            )
        
        except Exception as e:
            logger.error(f"Error generating chat response: {str(e)}")
            error_response = "I apologize, but I encountered an error while processing your request. Please try again."
            
            self.save_message(session_id, "user", user_message)
            self.save_message(session_id, "assistant", error_response)
            
            return ChatResponse(
                response=error_response,
                session_id=session_id
            )
    
    def get_session_info(self, session_id: str) -> Optional[ChatHistory]:
        """
        Get session information and history
        """
        try:
            session = self.chat_db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
            if not session:
                return None
            
            messages = self.get_chat_history(session_id, limit=50)
            
            return ChatHistory(
                session_id=session_id,
                messages=messages,
                created_at=session.created_at,
                last_activity=session.last_activity
            )
        
        except Exception as e:
            logger.error(f"Error getting session info: {str(e)}")
            return None
        
    def get_user_sessions(self, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Get all chat sessions for a user
        """
        if not self.db_connected or not self.chat_db:
            return []
        
        try:
            sessions = (
                self.chat_db.query(ChatSession)
                .filter(ChatSession.user_id == user_id)
                .order_by(ChatSession.last_activity.desc())
                .all()
            )
            
            return [
                {
                    "session_id": session.session_id,
                    "created_at": session.created_at.isoformat() if session.created_at else None,
                    "last_activity": session.last_activity.isoformat() if session.last_activity else None,
                    "message_count": len(session.messages) if session.messages else 0
                }
                for session in sessions
            ]
        
        except Exception as e:
            logger.error(f"Error getting user sessions: {str(e)}")
            return []

# Global chat service instance
chat_service = ChatService()
