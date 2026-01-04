import express from 'express';
import verifyAccessToken from '../middleware/verifyAccessToken.js';
import * as controller from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/signup', controller.signup);
router.post('/login', controller.login);
router.post('/logout', controller.logout);
router.get('/verify-email', controller.verifyEmail);
router.post('/resend-verification', controller.resendVerification);
router.post('/refresh', controller.refresh);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);

// Protected routes
router.use(verifyAccessToken);
router.post('/change-password', controller.changePassword);
router.delete('/delete-account', controller.deleteAccount);

// User settings and preferences
router.get('/settings', controller.getSettings);
router.patch('/settings/timer', controller.updateTimerSettings);
router.patch('/settings/preferences', controller.updatePreferences);

export default router;
