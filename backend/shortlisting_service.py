import os
import logging
from typing import List, Dict, Any, Optional
from groq import Groq
from dotenv import load_dotenv
from pydantic import BaseModel
from database import get_db, Candidate, Education, Skill, WorkExperience
from sqlalchemy.orm import Session

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Groq client
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

class CandidateScore(BaseModel):
    candidate_id: int
    candidate_name: str
    score: int  # Score out of 100
    reasoning: str
    strengths: List[str]
    weaknesses: List[str]

class ShortlistingResult(BaseModel):
    job_description: str
    total_candidates: int
    shortlisted_candidates: List[CandidateScore]
    all_candidates: List[CandidateScore]  # New field for all candidates with scores
    scoring_criteria: str

def get_candidate_resume_data(candidate_id: int, db: Session) -> Optional[Dict[str, Any]]:
    """
    Get comprehensive resume data for a candidate from the database
    """
    try:
        # Get candidate basic info
        candidate = db.query(Candidate).filter(Candidate.candidate_id == candidate_id).first()
        if not candidate:
            return None
        
        # Get education
        education = db.query(Education).filter(Education.candidate_id == candidate_id).all()
        education_list = []
        for edu in education:
            education_list.append({
                "degree": edu.degree,
                "institution": edu.institution,
                "graduation_year": edu.graduation_year
            })
        
        # Get skills
        skills = db.query(Skill).filter(Skill.candidate_id == candidate_id).all()
        skills_list = [skill.skill_name for skill in skills]
        
        # Get work experience
        work_experience = db.query(WorkExperience).filter(WorkExperience.candidate_id == candidate_id).all()
        work_exp_list = []
        for exp in work_experience:
            work_exp_list.append({
                "company": exp.company,
                "position": exp.position,
                "duration": exp.duration,
                "start_date": exp.start_date,
                "end_date": exp.end_date
            })
        
        return {
            "candidate_id": candidate.candidate_id,
            "full_name": candidate.full_name,
            "email": candidate.email,
            "phone": candidate.phone,
            "location": candidate.location,
            "years_experience": candidate.years_experience,
            "education": education_list,
            "skills": skills_list,
            "work_experience": work_exp_list
        }
    
    except Exception as e:
        logger.error(f"Error getting candidate resume data: {str(e)}")
        return None

def score_candidate_against_job(candidate_data: Dict[str, Any], job_description: str) -> CandidateScore:
    """
    Score a single candidate against the job description using LLM
    """
    try:
        # Prepare candidate summary for LLM
        candidate_summary = f"""
Candidate: {candidate_data['full_name']}
Years of Experience: {candidate_data.get('years_experience', 'Unknown')}
Location: {candidate_data.get('location', 'Unknown')}

Education:
{chr(10).join([f"- {edu.get('degree', 'Unknown')} from {edu.get('institution', 'Unknown')} ({edu.get('graduation_year', 'Unknown')})" for edu in candidate_data.get('education', [])])}

Skills:
{', '.join(candidate_data.get('skills', []))}

Work Experience:
{chr(10).join([f"- {exp.get('position', 'Unknown')} at {exp.get('company', 'Unknown')} ({exp.get('duration', 'Unknown')})" for exp in candidate_data.get('work_experience', [])])}
"""

        prompt = f"""You are an expert HR recruiter. Analyze the following candidate's resume against the job description and provide a comprehensive scoring.

JOB DESCRIPTION:
{job_description}

CANDIDATE RESUME:
{candidate_summary}

Evaluate the candidate on the following criteria:
1. Technical Skills Match (30%)
2. Experience Level and Relevance (25%)
3. Education Background (15%)
4. Industry Experience (20%)
5. Overall Fit (10%)

Provide your response in this EXACT format:

SCORE: [0-100]

REASONING:
[2-3 sentences explaining the overall assessment]

STRENGTHS:
- [Strength 1]
- [Strength 2]
- [Strength 3]

WEAKNESSES:
- [Weakness 1]
- [Weakness 2]
- [Weakness 3]

Be specific and constructive in your feedback. Consider both hard skills and soft skills mentioned in the job description.
"""

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert HR recruiter with 10+ years of experience in candidate evaluation. Be thorough, fair, and constructive in your assessments."
                },
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama3-70b-8192",
            temperature=0.3,  # Slightly higher for more nuanced evaluation
            max_tokens=800
        )
        
        response = chat_completion.choices[0].message.content
        
        # Parse the response
        score, reasoning, strengths, weaknesses = parse_scoring_response(response)
        
        return CandidateScore(
            candidate_id=candidate_data['candidate_id'],
            candidate_name=candidate_data['full_name'],
            score=score,
            reasoning=reasoning,
            strengths=strengths,
            weaknesses=weaknesses
        )
    
    except Exception as e:
        logger.error(f"Error scoring candidate {candidate_data.get('candidate_id')}: {str(e)}")
        return CandidateScore(
            candidate_id=candidate_data['candidate_id'],
            candidate_name=candidate_data['full_name'],
            score=0,
            reasoning="Error occurred during scoring",
            strengths=[],
            weaknesses=["Could not evaluate due to technical error"]
        )

def parse_scoring_response(response: str) -> tuple:
    """
    Parse the LLM response to extract score, reasoning, strengths, and weaknesses
    """
    try:
        lines = response.strip().split('\n')
        score = 0
        reasoning = ""
        strengths = []
        weaknesses = []
        
        current_section = None
        
        for line in lines:
            line = line.strip()
            
            if line.startswith('SCORE:'):
                score_text = line.replace('SCORE:', '').strip()
                # Extract number from score text
                import re
                score_match = re.search(r'\d+', score_text)
                if score_match:
                    score = min(100, max(0, int(score_match.group())))
            
            elif line.startswith('REASONING:'):
                current_section = 'reasoning'
                reasoning_text = line.replace('REASONING:', '').strip()
                if reasoning_text:
                    reasoning = reasoning_text
            
            elif line.startswith('STRENGTHS:'):
                current_section = 'strengths'
            
            elif line.startswith('WEAKNESSES:'):
                current_section = 'weaknesses'
            
            elif line.startswith('- ') and current_section:
                item = line[2:].strip()
                if current_section == 'strengths':
                    strengths.append(item)
                elif current_section == 'weaknesses':
                    weaknesses.append(item)
            
            elif current_section == 'reasoning' and line and not line.startswith(('STRENGTHS:', 'WEAKNESSES:')):
                if reasoning:
                    reasoning += " " + line
                else:
                    reasoning = line
        
        return score, reasoning, strengths, weaknesses
    
    except Exception as e:
        logger.error(f"Error parsing scoring response: {str(e)}")
        return 0, "Error parsing response", [], ["Could not parse evaluation"]

def shortlist_candidates(job_description: str, min_score: int = 70, limit: Optional[int] = None, user_id: Optional[int] = None) -> ShortlistingResult:
    """
    Shortlist candidates based on job description
    """
    db = next(get_db())
    
    try:
        # Get candidates from database (optionally filtered by user)
        query = db.query(Candidate)
        if user_id:
            query = query.filter(Candidate.user_id == user_id)
        
        candidates = query.all()
        
        if not candidates:
            return ShortlistingResult(
                job_description=job_description,
                total_candidates=0,
                shortlisted_candidates=[],
                scoring_criteria="No candidates found in database"
            )
        
        scored_candidates = []
        
        # Score each candidate
        for candidate in candidates:
            candidate_data = get_candidate_resume_data(candidate.candidate_id, db)
            if candidate_data:
                candidate_score = score_candidate_against_job(candidate_data, job_description)
                scored_candidates.append(candidate_score)
          # Filter by minimum score and sort by score (highest first)
        shortlisted = [c for c in scored_candidates if c.score >= min_score]
        shortlisted.sort(key=lambda x: x.score, reverse=True)
        
        # Sort all candidates by score for display
        all_candidates_sorted = sorted(scored_candidates, key=lambda x: x.score, reverse=True)
        
        # Apply limit if specified (only to shortlisted)
        if limit:
            shortlisted = shortlisted[:limit]
        
        scoring_criteria = f"""
Scoring Criteria:
- Technical Skills Match (30%)
- Experience Level and Relevance (25%)
- Education Background (15%)
- Industry Experience (20%)
- Overall Fit (10%)

Minimum Score: {min_score}/100
"""
        
        return ShortlistingResult(
            job_description=job_description,
            total_candidates=len(candidates),
            shortlisted_candidates=shortlisted,
            all_candidates=all_candidates_sorted,
            scoring_criteria=scoring_criteria
        )
    
    except Exception as e:
        logger.error(f"Error in shortlisting candidates: {str(e)}")
        return ShortlistingResult(
            job_description=job_description,
            total_candidates=0,
            shortlisted_candidates=[],
            scoring_criteria=f"Error occurred: {str(e)}"
        )
    
    finally:
        db.close()
