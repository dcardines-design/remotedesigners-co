# RemoteDesigners.co

A remote design job board with AI-powered resume builder, cover letter generator, and smart job matching.

## Features

- **Job Board** - Browse remote design jobs with filters for experience level, job type, and skills
- **AI Resume Builder** - Create ATS-optimized resumes with AI-enhanced bullet points
- **AI Cover Letter Generator** - Generate personalized cover letters for each job application
- **Job Matching** - AI analyzes how well your profile matches each job
- **Application Tracking** - Track all your job applications in one place

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **AI**: OpenRouter (Claude, GPT-4, etc.)
- **Icons**: Lucide React

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema in `supabase/schema.sql`
3. Copy your project URL and anon key from Settings > API

### 3. Set up OpenRouter

1. Create an account at [openrouter.ai](https://openrouter.ai)
2. Generate an API key from the dashboard

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENROUTER_API_KEY=sk-or-v1-your-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── api/ai/           # AI API routes (cover letter, resume enhance, job match)
│   ├── cover-letter/     # Cover letter generator page
│   ├── dashboard/        # User dashboard
│   ├── jobs/             # Job listings and detail pages
│   ├── resume-builder/   # Resume builder page
│   ├── layout.tsx        # Root layout with navbar
│   └── page.tsx          # Homepage
├── components/
│   └── navbar.tsx        # Navigation component
├── lib/
│   ├── openrouter.ts     # OpenRouter API helpers
│   └── supabase.ts       # Supabase client
└── types/
    └── index.ts          # TypeScript types
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

## License

MIT
