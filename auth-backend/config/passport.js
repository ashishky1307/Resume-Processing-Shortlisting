const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mysql = require('mysql2/promise');

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'resume_db'
};

module.exports = function(passport) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.AUTH_BACKEND_URL || 'http://localhost:4000'}/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const connection = await mysql.createConnection(dbConfig);
      
      // Check if user already exists
      const [existingUsers] = await connection.execute(
        'SELECT * FROM users WHERE google_id = ?',
        [profile.id]
      );

      if (existingUsers.length > 0) {
        // User exists, update last login
        await connection.execute(
          'UPDATE users SET last_login = NOW() WHERE google_id = ?',
          [profile.id]
        );
        await connection.end();
        return done(null, existingUsers[0]);
      } else {
        // Create new user
        const [result] = await connection.execute(
          'INSERT INTO users (google_id, email, name, profile_picture, created_at, last_login) VALUES (?, ?, ?, ?, NOW(), NOW())',
          [
            profile.id,
            profile.emails[0].value,
            profile.displayName,
            profile.photos[0].value
          ]
        );

        // Fetch the created user
        const [newUsers] = await connection.execute(
          'SELECT * FROM users WHERE id = ?',
          [result.insertId]
        );

        await connection.end();
        return done(null, newUsers[0]);
      }
    } catch (error) {
      console.error('Error in Google Strategy:', error);
      return done(error, null);
    }
  }));

  // Serialize user for the session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id, done) => {
    try {
      const connection = await mysql.createConnection(dbConfig);
      const [users] = await connection.execute(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      await connection.end();
      
      if (users.length > 0) {
        done(null, users[0]);
      } else {
        done(null, false);
      }
    } catch (error) {
      console.error('Error deserializing user:', error);
      done(error, null);
    }
  });
};
