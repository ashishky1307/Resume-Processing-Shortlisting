const express = require('express');
const passport = require('passport');
const router = express.Router();

// Middleware to check if user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ 
    error: 'Unauthorized',
    message: 'Please log in to access this resource'
  });
};

// Google OAuth login route
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

// Google OAuth callback route
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: process.env.FRONTEND_URL + '/login?error=auth_failed'
  }),
  (req, res) => {
    // Successful authentication, redirect to frontend
    res.redirect(process.env.FRONTEND_URL + '/dashboard');
  }
);

// Logout route
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ 
        error: 'Logout failed',
        message: err.message 
      });
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ 
          error: 'Session cleanup failed',
          message: err.message 
        });
      }
      
      res.clearCookie('resume_session_cookie_name');
      res.json({ 
        success: true,
        message: 'Logged out successfully' 
      });
    });
  });
});

// Get current user profile
router.get('/profile', ensureAuthenticated, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      profilePicture: req.user.profile_picture,
      lastLogin: req.user.last_login
    }
  });
});

// Check authentication status
router.get('/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        profilePicture: req.user.profile_picture
      }
    });
  } else {
    res.json({
      authenticated: false,
      user: null
    });
  }
});

// Login page route (for development)
router.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect(process.env.FRONTEND_URL + '/dashboard');
  }
  
  res.json({
    message: 'Please authenticate with Google',
    loginUrl: '/auth/google',
    authenticated: false
  });
});

// Protected test route
router.get('/test-protected', ensureAuthenticated, (req, res) => {
  res.json({
    message: 'This is a protected route',
    user: req.user.email,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
