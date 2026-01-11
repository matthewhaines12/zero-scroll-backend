import express from 'express';
import verifyAccessToken from '../middleware/verifyAccessToken.js';
import * as controller from '../controllers/taskController.js';

const router = express.Router();

// Protected routes
router.use(verifyAccessToken);
router.post('/', controller.createTask);
router.get('/', controller.getTasks);
router.get('/completed-today', controller.getTodaysTasks);
router.get('/:id', controller.getTask);
router.patch('/:id', controller.updateTask);
router.delete('/:id', controller.deleteTask);

export default router;
