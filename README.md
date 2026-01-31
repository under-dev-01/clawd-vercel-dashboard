# Clawd Dashboard

A modern Next.js dashboard for monitoring Clawd - file management, system stats, and AI analytics.

## Features

- 📁 **File Manager**: Browse, search, preview, and download files
- 📊 **System Monitor**: Real-time disk, memory, and uptime stats  
- 🤖 **AI Analytics**: Track token usage, costs, and model performance
- 🔒 **Secure**: Password-protected with secure authentication
- 🎨 **Modern UI**: Clean, minimalist design with Tailwind CSS v4

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API URL

# Run development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL |

## Deployment

This project is configured for Vercel deployment:

```bash
npm i -g vercel
vercel --prod
```

Or deploy with Git integration through the Vercel dashboard.

## Project Structure

```
src/
├── app/
│   ├── page.tsx        # Main dashboard
│   ├── layout.tsx      # Root layout
│   ├── globals.css     # Global styles
│   └── error.tsx       # Error boundary
├── components/         # Shared components
├── hooks/             # Custom React hooks
├── lib/               # Utilities
└── types/             # TypeScript types
```

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Vercel

## License

MIT
# Deployed at Sat Jan 31 21:59:04 UTC 2026
