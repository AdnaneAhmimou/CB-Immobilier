const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const rateLimit = require('../middlewares/rateLimitMiddleware');

const router = express.Router();

// Two limits: a tight one per email (slows a targeted guess) and a looser one per IP
// (slows someone spraying many accounts from one place).
const loginLimit = [
    rateLimit({ max: 8,  windowMs: 15 * 60 * 1000, keyOn: req => String(req.body?.email || '').toLowerCase() }),
    rateLimit({ max: 30, windowMs: 15 * 60 * 1000 }),
];

router.post('/login', ...loginLimit, authController.login);
router.post('/logout', authController.logout);

router.get('/me', protect, authController.me);
router.post('/change-password', protect, authController.changePassword);

// No public sign-up: an account can only be created by someone already signed in.
router.post('/register', protect, authController.register);

module.exports = router;
