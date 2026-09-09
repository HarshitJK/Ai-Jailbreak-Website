# AI Jailbreak Competition

A competition site for AI jailbreak challenges with team login, multi-round challenges, and admin monitoring.

## Project Structure

- **app/** - Next.js 13+ app router pages
  - `login/` - Team login page
  - `round1/` - Round 1: 6 sequential chat-based challenge stages (5 stateless + 1 memory-based)
  - `round2/` - Round 2: 5 chained bot stages where each bot's output feeds the next
  - `admin/` - Admin dashboard for monitoring team progress and transcripts

- **components/** - Reusable React components
  - `ChatWindow.tsx` - Chat interface that calls the backend `/api/chat` endpoint
  - `StageProgress.tsx` - Progress indicator showing current stage
  - `ProtectedRoute.tsx` - Route protection for authenticated teams

- **lib/** - Utility modules
  - `apiClient.ts` - API client for backend communication

- **public/** - Static assets

- **.env.example** - Environment variables template

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```