import express from 'express';
import verifyAccessToken from '../middleware/verifyAccessToken.js';
import * as controller from '../controllers/sessionController.js';

const router = express.Router();

// Protected routes
router.use(verifyAccessToken);
router.get('/', controller.getSessions);
router.post('/', controller.startSession);
router.get('/today', controller.getTodaysSessions);
router.get('/:id', controller.getSession);
router.patch('/:id', controller.stopSession);
router.delete('/:id', controller.deleteSession);
router.get('/task/:id', controller.getSessionsForTasks);

export default router;
