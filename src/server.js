import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import authRoute from './routes/authRoute.js';
import taskRoute from './routes/taskRoute.js';
import sessionRoute from './routes/sessionRoute.js';
import analyticRoute from './routes/analyticRoute.js';
import dotenv from 'dotenv';
dotenv.config();
const app = express();

const PORT = 3001;

const corsOptions = {
  origin: `http://localhost:5173`,
  credentials: true,
};

connectDB();

app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.use('/api/auth', authRoute);
app.use('/api/tasks', taskRoute);
app.use('/api/sessions', sessionRoute);
app.use('/api/analytics', analyticRoute);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
