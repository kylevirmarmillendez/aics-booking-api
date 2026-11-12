import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { csrfSync } from 'csrf-sync';
import passport from './config/passport.js';
import authRoutes from './routes/auth.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import publicBookingRoutes from './routes/publicBooking.routes.js';
import { requireRoles } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import userRoutes from './routes/user.routes.js';
import officeRoutes from './routes/office.routes.js';
import assistanceTypeRoutes from './routes/assistanceType.routes.js';

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3002,http://localhost:3003')
  .split(',')
  .map((origin) => origin.trim());
const cookieName = process.env.SESSION_COOKIE_NAME || 'aics.sid';

app.disable('x-powered-by');
if (process.env.COOKIE_SECURE === 'true') app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(session({
  name: cookieName,
  secret: process.env.SESSION_SECRET || 'local-development-secret-change-before-deployment-32',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 60 * 60 * 4,
    autoRemove: 'native'
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 4
  }
}));
app.use(passport.initialize());
app.use(passport.session());

const { generateToken, csrfSynchronisedProtection } = csrfSync({
  getTokenFromRequest: (req) => req.get('x-csrf-token') ?? req.body?._csrf
});
app.use((req, _res, next) => {
  req.csrfToken = () => generateToken(req);
  next();
});
app.use(csrfSynchronisedProtection);

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'API is healthy' });
});
app.use('/api/auth', authRoutes);
app.use('/api/public-booking', publicBookingRoutes);
app.use('/api/appointments', requireRoles('super_admin', 'admin', 'booking_officer'), appointmentRoutes);
app.use('/api/users', requireRoles('super_admin'), userRoutes);
app.use('/api/offices', requireRoles('super_admin', 'admin'), officeRoutes);
app.use('/api/assistance-types', requireRoles('super_admin', 'admin'), assistanceTypeRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
