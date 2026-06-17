const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
  initiateDigilocker,
  getDigilockerData,
  setPasswordAndRegister,
  loginUser,
} = require('../controllers/authController');

// KYC and Registration Flow from your logic
router.post('/initiate-digilocker', initiateDigilocker);
router.post('/get-digilocker-data', getDigilockerData);
router.post('/set-password', setPasswordAndRegister);

// Standard Login from your logic
router.post('/login', loginUser);

// Google OAuth Initiation
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth Callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/api/v1/auth/google/failure' }),
  async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.redirect((process.env.FRONTEND_URL || 'http://localhost:3000') + '/auth?error=Unauthorized');
      }

      // Generate JWT Token using authService
      const authService = require('../services/authService');
      const token = authService.generateToken(user);

      // Redirect back to frontend auth endpoint with token and patientId as query params
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth?token=${token}&patientId=${user._id}`);
    } catch (err) {
      console.error('OAuth callback error:', err);
      res.redirect((process.env.FRONTEND_URL || 'http://localhost:3000') + '/auth?error=ServerError');
    }
  }
);

// Google OAuth Failure
router.get('/google/failure', (req, res) => {
  res.redirect((process.env.FRONTEND_URL || 'http://localhost:3000') + '/auth?error=AuthenticationFailed');
});

module.exports = router;