import express from 'express';
import verifyAccessToken from '../middleware/verifyAccessToken.js';
import * as controller from '../controllers/analyticController.js';

const router = express.Router();

// Protected routes
router.use(verifyAccessToken);

router.get('/focus-consistency/:days', controller.focusConsistency);

export default router;
