const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Patient = require('../models/patientModel');
const bcrypt = require('bcryptjs');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: (process.env.BASE_URL || 'http://localhost:5000') + '/api/v1/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      if (!profile.emails || !profile.emails.length) {
        return done(new Error('No email found in your Google profile'), null);
      }
      const email = profile.emails[0].value;

      // Find patient by Google ID or by email
      let patient = await Patient.findOne({ $or: [{ googleId: profile.id }, { email }] });

      if (patient) {
        // Link Google ID if the patient had registered via DigiLocker with the same email
        if (!patient.googleId) {
          patient.googleId = profile.id;
          await patient.save();
        }
        return done(null, patient);
      }

      // Generate a unique username
      let username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      let usernameExists = await Patient.findOne({ username });
      if (usernameExists) {
        username = `${username}_${Math.random().toString(36).substring(2, 6)}`;
      }

      // Generate a safe dummy password
      const salt = await bcrypt.genSalt(10);
      const dummyPassword = await bcrypt.hash(Math.random().toString(36), salt);

      // Create new Patient account (Aadhaar, age, gender, address are left blank/undefined)
      patient = await Patient.create({
        googleId: profile.id,
        fullName: profile.displayName || 'Google User',
        username: username,
        password: dummyPassword,
        email: email,
        status: 'registered'
      });

      return done(null, patient);
    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((patient, done) => {
  done(null, patient.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const patient = await Patient.findById(id);
    done(null, patient);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
