import express from "express";
import verifyAccessToken from "../middleware/verifyAccessToken.js";
const router = express.Router();

router.use(verifyAccessToken);

// create a task

// get all tasks for a user

// get a specific task ?

// Update a task

// Delete a task

export default router;
