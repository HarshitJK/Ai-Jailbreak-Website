# AI Jailbreak Backend

Express + TypeScript backend for the AI Jailbreak Competition.

## Features

- Team login with JWT session tokens
- Chat endpoint `/api/chat` that handles stage-based AI interactions
- Redis-backed conversation history
- Admin endpoints for monitoring team progress and transcripts
- Stage prompt management

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
PORT=3000
JWT_SECRET=your-jwt-secret
ANTHROPIC_API_KEY=your-anthropic-key
REDIS_URL=redis://localhost:6379
```

## API Endpoints

- `POST /api/auth/login` - Team login, returns JWT token
- `POST /api/chat` - Send a message, get AI response (requires auth)
- `GET /api/admin` - Admin dashboard data (requires auth)