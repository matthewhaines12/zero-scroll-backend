import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import authRoute from './routes/authRoute.js';
import taskRoute from './routes/taskRoute.js';
import sessionRoute from './routes/sessionRoute.js';
import analyticRoute from './routes/analyticRoute.js';

const app = express();

// Connect DB ONCE per cold start
connectDB();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.use('/api/auth', authRoute);
app.use('/api/tasks', taskRoute);
app.use('/api/sessions', sessionRoute);
app.use('/api/analytics', analyticRoute);

export default app;
