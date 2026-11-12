import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import passport from '../config/passport.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../validations/auth.validation.js';

const router = Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ success: false, message: 'Too many sign-in attempts. Try again later.' })
});
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ success: false, message: 'Too many account registration attempts. Try again later.' })
});

function publicUser(user) {
  return {
    id: user.id,
    fname: user.fname,
    mname: user.mname,
    lname: user.lname,
    email: user.email,
    username: user.username,
    role: user.role,
    status: user.status,
    office: user.office,
    region: user.region,
    phone: user.phone,
    createdAt: user.createdAt
  };
}

router.get('/csrf', (req, res) => {
  res.status(200).json({ success: true, data: { csrfToken: req.csrfToken() } });
});

router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(200).json({ success: true, data: { user: null } });
  }
  return res.status(200).json({ success: true, data: { user: publicUser(req.user) } });
});

router.post('/register', registrationLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const user = await User.create({ ...req.body, role: 'booking_officer', status: 'Active' });
    req.logIn(user, (error) => {
      if (error) return next(error);
      return req.session.save((saveError) => {
        if (saveError) return next(saveError);
        return res.status(201).json({
          success: true,
          message: 'Account created successfully.',
          data: { user: publicUser(user) }
        });
      });
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', loginLimiter, validate(loginSchema), (req, res, next) => {
  passport.authenticate('local', (error, user, info) => {
    if (error) return next(error);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message ?? 'Unable to sign in.'
      });
    }

    req.logIn(user, (loginError) => {
      if (loginError) return next(loginError);
      return req.session.save((saveError) => {
        if (saveError) return next(saveError);
        return res.status(200).json({
          success: true,
          message: 'Signed in successfully.',
          data: { user: publicUser(user) }
        });
      });
    });
  })(req, res, next);
});

router.post('/logout', requireAuth, (req, res, next) => {
  req.logout((logoutError) => {
    if (logoutError) return next(logoutError);
    const cookieName = process.env.SESSION_COOKIE_NAME || 'aics.sid';
    req.session.destroy((sessionError) => {
      if (sessionError) return next(sessionError);
      res.clearCookie(cookieName, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.COOKIE_SECURE === 'true',
        path: '/'
      });
      return res.status(200).json({ success: true, message: 'Signed out successfully.' });
    });
  });
});

export default router;
