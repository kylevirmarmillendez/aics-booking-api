import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/User.js';

passport.use(new LocalStrategy(
  { usernameField: 'login', passwordField: 'password' },
  async (login, password, done) => {
    try {
      const normalized = String(login ?? '').trim().toLowerCase();
      const user = await User.findOne({ $or: [{ email: normalized }, { username: normalized }] }).select('+password');
      if (!user || user.status !== 'Active' || !(await user.comparePassword(password))) {
        return done(null, false, { message: 'Email/username or password is incorrect.' });
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Store only the MongoDB ID in the session; never serialize a password hash.
passport.serializeUser((user, done) => done(null, user.id));

// Re-read the current user so disabled/deleted accounts lose access immediately.
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (!user || user.status !== 'Active') return done(null, false);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
