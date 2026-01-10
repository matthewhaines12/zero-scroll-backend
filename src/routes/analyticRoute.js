import express from 'express';
import verifyAccessToken from '../middleware/verifyAccessToken.js';
import * as controller from '../controllers/analyticController.js';

const router = express.Router();

// Protected routes
router.use(verifyAccessToken);

router.get('/focus-days/:days', controller.getFocusConsistency);
router.get('/focus-hours/:days', controller.getFocusHours);
router.get('/session-outcomes/:days', controller.getSessionOutcomes);

export default router;
