# Zero Scroll Backend

REST API for the Zero Scroll productivity app. Handles user authentication, task management, focus session tracking, and analytics.

## What It Does

This is the backend that for Zero Scroll. It manages user accounts with JWT authentication, stores tasks and focus sessions in MongoDB, and provides analytics endpoints to track productivity over time.

### Main Features

**Dual-Token Authentication**  
Uses both access tokens (15 min expiry) and refresh tokens (30 day expiry) for secure authentication. Access tokens live in memory on the frontend, while refresh tokens are stored in HTTP-only cookies to prevent XSS attacks.

**Session Tracking**  
Records every focus session with planned vs actual duration. Only sessions longer than 5 minutes count toward stats, so quick tests don't skew your analytics.

**Task Management**  
Simple CRUD operations for tasks with priority levels (low, medium, high) completion tracking, and updating / deleting abilities.

**Email Verification**  
Sends verification emails on signup and supports resending if needed. Also handles password reset flows via email.

**User Preferences**  
Stores custom timer settings (focus/break/recover durations) and preferences like auto-start timer, sound effects, and daily session goals.

**Rate Limiting**  
Protects authentication endpoints from brute force attacks. Login is limited to 5 attempts per 15 minutes, signup to 3 attempts per hour (per IP address).

## Tech Stack

- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing
- Nodemailer for email verification and password resets

## API Routes

### Authentication `/api/auth`

- `POST /signup` - Create new user account
- `POST /login` - Login with email/password
- `POST /logout` - Clear refresh token
- `GET /verify-email` - Verify email with token
- `POST /resend-verification` - Resend verification email
- `POST /refresh` - Get new access token
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token
- `POST /change-password` - Change password (authenticated)
- `DELETE /delete-account` - Delete user account (authenticated)
- `GET /settings` - Get user settings (authenticated)
- `PATCH /settings/timer` - Update timer settings (authenticated)
- `PATCH /settings/preferences` - Update preferences (authenticated)

### Tasks `/api/tasks`

All routes require authentication.

- `POST /` - Create task
- `GET /` - Get all user tasks
- `GET /completed-today` - Get tasks completed today
- `GET /:id` - Get specific task
- `PATCH /:id` - Update task
- `DELETE /:id` - Delete task

### Sessions `/api/sessions`

All routes require authentication.

- `POST /` - Start new session
- `GET /` - Get all user sessions
- `GET /today` - Get today's sessions
- `GET /:id` - Get specific session
- `PATCH /:id` - Stop/complete session
- `DELETE /:id` - Delete session

### Analytics `/api/analytics`

All routes require authentication.

- `GET /daily-stats` - Get daily focus stats (7, 14, or 30 days)
- `GET /time-of-day` - Get best focus hours
- `GET /completion-rate` - Get session completion stats

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

1. Clone the repo

```bash
git clone https://github.com/matthewhaines12/zero-scroll-backend.git
cd zero-scroll-backend
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file

```env
MONGO_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
EMAIL_TOKEN_SECRET=your_email_token_secret
RESET_TOKEN_SECRET=your_reset_token_secret
CLIENT_URL=http://localhost:5173
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

4. Start the server

```bash
npm run dev
```

The API will be running at `http://localhost:3001`

## Project Structure

```
src/
├── config/          # Database connection
├── controllers/     # Request handlers
├── middleware/      # Auth verification
├── models/          # Mongoose schemas (User, Task, Session)
├── routes/          # API route definitions
└── utils/           # Email utilities
```

## How Authentication Works

When you sign up, your password gets hashed with bcrypt and stored. On login, you receive:

- An access token (valid for 15 minutes)
- A refresh token (valid for 30 days, stored in HTTP-only cookie)

When the access token expires, the frontend automatically calls `/api/auth/refresh` to get a new one using the refresh token. This happens behind the scenes, so you stay logged in.

## Environment Variables

| Variable               | Description                          |
| ---------------------- | ------------------------------------ |
| `MONGO_URI`            | MongoDB connection string            |
| `ACCESS_TOKEN_SECRET`  | Secret for signing access tokens     |
| `REFRESH_TOKEN_SECRET` | Secret for signing refresh tokens    |
| `EMAIL_TOKEN_SECRET`   | Secret for email verification tokens |
| `RESET_TOKEN_SECRET`   | Secret for password reset tokens     |
| `CLIENT_URL`           | Frontend URL for email links         |
| `EMAIL_USER`           | Email address for sending emails     |
| `EMAIL_PASS`           | Email password/app password          |

## Password Requirements

Passwords must be:

- At least 10 characters long
- Contain one uppercase letter
- Contain one lowercase letter
- Contain one number
- Contain one special character

## Frontend Repository

The React frontend is in a separate repo. This API is designed to work with it.
