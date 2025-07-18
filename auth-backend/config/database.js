const mysql = require('mysql2/promise');

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'resume_db'
};

// Initialize database and create users table if it doesn't exist
async function initializeDatabase() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Create users table if it doesn't exist
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        profile_picture VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_google_id (google_id),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createUsersTable);
    console.log('✅ Users table created/verified successfully');

    // Check if we need to add user_id column to existing tables (for linking user data)
    try {
      const [candidatesTable] = await connection.execute(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'candidates' AND COLUMN_NAME = 'user_id'",
        [process.env.DB_NAME || 'resume_db']
      );

      if (candidatesTable.length === 0) {
        // Add user_id column to candidates table if it doesn't exist
        await connection.execute(
          'ALTER TABLE candidates ADD COLUMN user_id INT, ADD INDEX idx_user_id (user_id)'
        );
        console.log('✅ Added user_id column to candidates table');
      }
    } catch (error) {
      // Table might not exist yet, which is fine
      console.log('ℹ️  Candidates table not found or already has user_id column');
    }

    await connection.end();
    console.log('✅ Database initialization completed');
    
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

// Export the initialization function and db config
module.exports = {
  initializeDatabase,
  dbConfig
};

// Initialize database when this module is loaded
initializeDatabase();
