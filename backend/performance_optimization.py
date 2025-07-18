"""
Performance Optimization Script for Sen AI
This script implements database indexing, query optimizations, and caching mechanisms
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from sqlalchemy import text, Index, inspect
from sqlalchemy.orm import sessionmaker
from database import engine, SessionLocal, Candidate, Skill, WorkExperience, Education
import json
import hashlib
from functools import wraps
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# In-memory cache for API responses
_cache = {}
_cache_ttl = {}

class PerformanceOptimizer:
    """
    Class to handle all performance optimization tasks
    """
    
    def __init__(self):
        self.db = SessionLocal()
        
    def create_database_indexes(self):
        """
        Create indexes on frequently queried fields for better query performance
        """
        logger.info("Creating database indexes for performance optimization...")
        
        try:
            with engine.connect() as conn:
                # Check if indexes already exist
                inspector = inspect(engine)
                existing_indexes = inspector.get_indexes('candidates')
                existing_index_names = [idx['name'] for idx in existing_indexes]
                
                # Define indexes to create
                indexes_to_create = [
                    # Candidates table indexes
                    ("idx_candidates_user_id", "candidates", "user_id"),
                    ("idx_candidates_status", "candidates", "status"),
                    ("idx_candidates_years_experience", "candidates", "years_experience"),
                    ("idx_candidates_location", "candidates", "location"),
                    ("idx_candidates_email", "candidates", "email"),
                    ("idx_candidates_created_at", "candidates", "created_at"),
                    ("idx_candidates_file_hash", "candidates", "file_hash"),
                    
                    # Composite indexes for common query patterns
                    ("idx_candidates_user_status", "candidates", "user_id, status"),
                    ("idx_candidates_user_experience", "candidates", "user_id, years_experience"),
                ]
                
                # Skills table indexes
                skills_indexes = inspector.get_indexes('skills')
                skills_index_names = [idx['name'] for idx in skills_indexes]
                
                skills_indexes_to_create = [
                    ("idx_skills_candidate_id", "skills", "candidate_id"),
                    ("idx_skills_skill_name", "skills", "skill_name"),
                    ("idx_skills_category", "skills", "skill_category"),
                ]
                
                # Work Experience table indexes
                work_exp_indexes = inspector.get_indexes('work_experiences')
                work_exp_index_names = [idx['name'] for idx in work_exp_indexes]
                
                work_exp_indexes_to_create = [
                    ("idx_work_exp_candidate_id", "work_experiences", "candidate_id"),
                    ("idx_work_exp_company", "work_experiences", "company"),
                    ("idx_work_exp_position", "work_experiences", "position"),
                ]
                
                # Education table indexes
                education_indexes = inspector.get_indexes('education')
                education_index_names = [idx['name'] for idx in education_indexes]
                
                education_indexes_to_create = [
                    ("idx_education_candidate_id", "education", "candidate_id"),
                    ("idx_education_degree", "education", "degree"),
                    ("idx_education_institution", "education", "institution"),
                    ("idx_education_graduation_year", "education", "graduation_year"),
                ]
                
                # Create indexes if they don't exist
                all_indexes = (
                    indexes_to_create + 
                    skills_indexes_to_create + 
                    work_exp_indexes_to_create + 
                    education_indexes_to_create
                )
                
                for index_name, table_name, columns in all_indexes:
                    # Check the appropriate existing indexes list based on table
                    if table_name == 'candidates':
                        existing_names = existing_index_names
                    elif table_name == 'skills':
                        existing_names = skills_index_names
                    elif table_name == 'work_experiences':
                        existing_names = work_exp_index_names
                    elif table_name == 'education':
                        existing_names = education_index_names
                    else:
                        existing_names = []
                    
                    if index_name not in existing_names:
                        try:
                            sql = f"CREATE INDEX {index_name} ON {table_name} ({columns})"
                            conn.execute(text(sql))
                            conn.commit()
                            logger.info(f"✅ Created index: {index_name} on {table_name}({columns})")
                        except Exception as e:
                            logger.warning(f"⚠️ Could not create index {index_name}: {str(e)}")
                    else:
                        logger.info(f"ℹ️ Index {index_name} already exists")
                
                logger.info("✅ Database indexing completed successfully!")
                
        except Exception as e:
            logger.error(f"❌ Error creating database indexes: {str(e)}")
            raise
    
    def optimize_queries(self):
        """
        Implement query optimizations for common database operations
        """
        logger.info("Implementing query optimizations...")
        
        try:
            with engine.connect() as conn:
                # Analyze table statistics for MySQL optimizer
                tables = ['candidates', 'skills', 'work_experiences', 'education']
                
                for table in tables:
                    try:
                        conn.execute(text(f"ANALYZE TABLE {table}"))
                        logger.info(f"✅ Analyzed table: {table}")
                    except Exception as e:
                        logger.warning(f"⚠️ Could not analyze table {table}: {str(e)}")
                
                conn.commit()
                logger.info("✅ Query optimization completed!")
                
        except Exception as e:
            logger.error(f"❌ Error optimizing queries: {str(e)}")
    
    def implement_caching(self):
        """
        Set up caching mechanisms for API responses
        """
        logger.info("Setting up caching mechanisms...")
        
        # Cache decorator implementation is below as standalone functions
        logger.info("✅ Caching system implemented!")
    
    def close(self):
        """Close database session"""
        if self.db:
            self.db.close()

# Cache decorator for API responses
def cache_response(ttl_seconds: int = 300):
    """
    Decorator to cache API responses
    
    Args:
        ttl_seconds: Time to live for cached responses in seconds (default: 5 minutes)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            global _cache_hits, _cache_misses
            # Create cache key from function name and arguments
            cache_key = f"{func.__name__}:{hashlib.md5(str(args + tuple(sorted(kwargs.items()))).encode()).hexdigest()}"
            
            # Check if we have a cached response that's still valid
            if cache_key in _cache and cache_key in _cache_ttl:
                if datetime.now() < _cache_ttl[cache_key]:
                    _cache_hits += 1
                    logger.debug(f"Cache hit for {func.__name__}")
                    return _cache[cache_key]
                else:
                    # Cache expired, remove it
                    del _cache[cache_key]
                    del _cache_ttl[cache_key]
            
            # Cache miss - execute function and cache result
            _cache_misses += 1
            result = func(*args, **kwargs)
            _cache[cache_key] = result
            _cache_ttl[cache_key] = datetime.now() + timedelta(seconds=ttl_seconds)
            
            logger.debug(f"Cached response for {func.__name__}")
            return result
        
        return wrapper
    return decorator

# Cache statistics tracking
_cache_hits = 0
_cache_misses = 0

def clear_cache():
    """Clear all cached responses"""
    global _cache, _cache_ttl, _cache_hits, _cache_misses
    _cache.clear()
    _cache_ttl.clear()
    _cache_hits = 0
    _cache_misses = 0
    logger.info("Cache cleared")

def get_cache_stats():
    """Get cache statistics"""
    global _cache_hits, _cache_misses
    total_requests = _cache_hits + _cache_misses
    hit_rate = (_cache_hits / total_requests) if total_requests > 0 else 0
    
    # Convert datetime objects to ISO format strings
    oldest_entry = min(_cache_ttl.values()) if _cache_ttl else None
    newest_entry = max(_cache_ttl.values()) if _cache_ttl else None
    
    if oldest_entry:
        oldest_entry = oldest_entry.isoformat() if hasattr(oldest_entry, 'isoformat') else str(oldest_entry)
    
    if newest_entry:
        newest_entry = newest_entry.isoformat() if hasattr(newest_entry, 'isoformat') else str(newest_entry)
    
    # Ensure all numeric values are serializable
    return {
        "cached_items": int(len(_cache)),
        "hits": int(_cache_hits),
        "misses": int(_cache_misses),
        "hit_rate": float(hit_rate),
        "cache_size_mb": float(sum(len(str(v)) for v in _cache.values()) / 1024 / 1024),
        "oldest_entry": oldest_entry,
        "newest_entry": newest_entry
    }

# Performance monitoring decorator
def monitor_performance(func):
    """
    Decorator to monitor function performance
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            end_time = time.time()
            execution_time = end_time - start_time
            
            if execution_time > 1.0:  # Log slow operations (>1 second)
                logger.warning(f"Slow operation detected: {func.__name__} took {execution_time:.2f} seconds")
            else:
                logger.debug(f"Performance: {func.__name__} took {execution_time:.3f} seconds")
            
            return result
        except Exception as e:
            end_time = time.time()
            execution_time = end_time - start_time
            logger.error(f"Error in {func.__name__} after {execution_time:.3f} seconds: {str(e)}")
            raise
    
    return wrapper

# Optimized query functions
@cache_response(ttl_seconds=180)  # Cache for 3 minutes
@monitor_performance
def get_candidates_optimized(page=1, limit=5, **filters):
    """
    Optimized version of get_candidates with caching and performance monitoring
    """
    from database import get_all_candidates
    return get_all_candidates(page=page, limit=limit, **filters)

@cache_response(ttl_seconds=600)  # Cache for 10 minutes
@monitor_performance
def get_skills_summary():
    """
    Get summary of skills across all candidates (cached)
    """
    db = SessionLocal()
    try:
        # Optimized query using indexes
        query = text("""
            SELECT skill_name, COUNT(*) as count 
            FROM skills 
            GROUP BY skill_name 
            ORDER BY count DESC 
            LIMIT 50
        """)
        
        result = db.execute(query).fetchall()
        return [{"skill_name": row[0], "count": row[1]} for row in result]
    
    finally:
        db.close()

@cache_response(ttl_seconds=900)  # Cache for 15 minutes
@monitor_performance
def get_dashboard_stats():
    """
    Get dashboard statistics (cached)
    """
    db = SessionLocal()
    try:
        # Use indexes for fast counting
        stats = {}
        
        # Total candidates
        total_candidates = db.query(Candidate).count()
        stats['total_candidates'] = total_candidates
        
        # Candidates by status
        status_query = text("""
            SELECT status, COUNT(*) as count 
            FROM candidates 
            GROUP BY status
        """)
        status_results = db.execute(status_query).fetchall()
        status_counts = {row[0]: int(row[1]) for row in status_results}  # Convert to int to ensure serializable
        
        # Extract specific status counts for the frontend
        stats['active_candidates'] = status_counts.get('pending', 0) + status_counts.get('shortlisted', 0)
        stats['shortlisted_candidates'] = status_counts.get('shortlisted', 0)
        stats['pending_candidates'] = status_counts.get('pending', 0)
        stats['rejected_candidates'] = status_counts.get('rejected', 0)
        stats['by_status'] = status_counts  # Add by_status to match frontend interface
        
        # Average experience
        avg_exp_query = text("""
            SELECT AVG(years_experience) as avg_exp 
            FROM candidates 
            WHERE years_experience IS NOT NULL
        """)
        avg_exp_result = db.execute(avg_exp_query).fetchone()
        stats['avg_experience'] = float(round(avg_exp_result[0], 1)) if avg_exp_result and avg_exp_result[0] else 0.0
        
        # Recent uploads (last 7 days)
        recent_query = text("""
            SELECT COUNT(*) 
            FROM candidates 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        """)
        recent_result = db.execute(recent_query).fetchone()
        stats['recent_uploads'] = int(recent_result[0]) if recent_result else 0
        
        return stats
    
    finally:
        db.close()

def run_optimization():
    """
    Main function to run all performance optimizations
    """
    logger.info("🚀 Starting performance optimization process...")
    
    optimizer = PerformanceOptimizer()
    
    try:
        # 1. Create database indexes
        optimizer.create_database_indexes()
        
        # 2. Optimize queries
        optimizer.optimize_queries()
        
        # 3. Set up caching
        optimizer.implement_caching()
        
        logger.info("✅ Performance optimization completed successfully!")
        
        # Test the optimizations
        logger.info("🧪 Testing optimizations...")
        
        # Test cached queries
        start_time = time.time()
        stats = get_dashboard_stats()
        end_time = time.time()
        logger.info(f"Dashboard stats query took {end_time - start_time:.3f} seconds")
        logger.info(f"Dashboard stats: {stats}")
        
        # Test skills summary
        start_time = time.time()
        skills = get_skills_summary()
        end_time = time.time()
        logger.info(f"Skills summary query took {end_time - start_time:.3f} seconds")
        logger.info(f"Found {len(skills)} unique skills")
        
        # Show cache stats
        cache_stats = get_cache_stats()
        logger.info(f"Cache statistics: {cache_stats}")
        
    except Exception as e:
        logger.error(f"❌ Error during optimization: {str(e)}")
        raise
    
    finally:
        optimizer.close()

if __name__ == "__main__":
    run_optimization()
