import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import {
  cancelPublicBooking,
  createPublicBooking,
  getAvailableBookingSlots,
  getBookingCalendarRules,
  lookupPublicBooking
} from '../controllers/publicBooking.controller.js';
import { validate } from '../middleware/validate.js';
import {
  cancelPublicBookingSchema,
  createPublicBookingSchema,
  lookupPublicBookingSchema
} from '../validations/publicBooking.validation.js';

const router = Router();
const publicRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ success: false, message: 'Too many booking requests. Please try again later.' })
});
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ success: false, message: 'Too many booking attempts. Please try again later.' })
});

router.use(publicRequestLimiter);
router.get('/calendar-rules', getBookingCalendarRules);
router.get('/availability', getAvailableBookingSlots);
router.post('/', bookingLimiter, validate(createPublicBookingSchema), createPublicBooking);
router.post('/lookup', validate(lookupPublicBookingSchema), lookupPublicBooking);
router.post('/cancel', bookingLimiter, validate(cancelPublicBookingSchema), cancelPublicBooking);

export default router;
