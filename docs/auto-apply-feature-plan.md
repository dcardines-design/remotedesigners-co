# Auto-Apply Feature Implementation Plan

> Saved: January 2026 | Status: Future Implementation

## Overview
Browser automation system to auto-apply for design jobs on Greenhouse, Lever, and Ashby ATS platforms.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS APP (Vercel)                     │
│  Dashboard UI ──► API Routes ──► Supabase Real-time         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       SUPABASE                              │
│  auto_apply_jobs (queue) │ auto_apply_logs │ settings       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              BROWSER WORKER (Modal.com)                     │
│  Job Poller ──► Playwright ──► ATS Handlers                 │
│                                 ├── GreenhouseHandler       │
│                                 ├── LeverHandler            │
│                                 └── AshbyHandler            │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema (New Tables)

### `auto_apply_jobs` - Queue table
- `id`, `user_id`, `job_id`, `job_url`, `job_title`, `company_name`
- `ats_type` (greenhouse/lever/ashby)
- `resume_id`, `cover_letter_content`, `custom_answers` (JSONB)
- `status` (pending/queued/processing/completed/failed/captcha_required)
- `progress`, `current_step`, `fields_total`, `fields_filled`
- `result` (JSONB), `error_message`, `screenshots` (JSONB), `action_log` (JSONB)

### `user_auto_apply_settings` - User preferences
- `default_answers` (JSONB) - work authorization, salary, start date, etc.
- `max_applications_per_hour`, `max_applications_per_day`
- `auto_generate_cover_letter`, `notify_on_completion`

## File Structure

```
/src/lib/auto-apply/
├── index.ts              # Types, main orchestration
├── ai-responder.ts       # AI question answering (enhance existing)
├── ats-detector.ts       # Detect ATS from URL
├── field-mapper.ts       # Map user data to form fields
└── question-classifier.ts # Classify custom questions

/src/app/api/applications/auto-apply/
├── route.ts              # POST: queue job, GET: list jobs
├── [jobId]/route.ts      # GET: status, DELETE: cancel
├── settings/route.ts     # GET/PUT: user settings
└── webhook/route.ts      # POST: worker progress updates

/src/components/auto-apply/
├── AutoApplyButton.tsx   # Button for job cards
├── AutoApplyModal.tsx    # Review before submission
├── AutoApplyProgress.tsx # Real-time progress
└── AutoApplySettings.tsx # User preferences

/worker/ (separate Modal.com app)
├── modal_app.py          # Entry point, polling
├── handlers/
│   ├── base.py           # BaseATSHandler
│   ├── greenhouse.py     # Greenhouse handler
│   ├── lever.py          # Lever handler
│   └── ashby.py          # Ashby handler
└── ai/responder.py       # AI integration
```

## ATS Handler Design

Each handler implements:
1. `canHandle(url)` - URL pattern detection
2. `detectFormFields()` - Find form fields
3. `fillStandardFields()` - Fill name, email, phone
4. `uploadResume()` / `uploadCoverLetter()`
5. `detectCustomQuestions()` - Find custom questions
6. `answerCustomQuestions()` - Use AI for complex answers
7. `submitApplication()` - Submit and detect confirmation

## AI Integration

1. **Question Classifier** - Pattern-based for common questions (fast)
   - work_authorization, salary, start_date, relocation, etc.

2. **AI Responder** - OpenRouter/Claude for complex questions
   - "Why do you want to work here?"
   - "Describe relevant experience"

## Implementation Phases

### Phase 1: Foundation
- [ ] Create database tables and migrations
- [ ] Enhance API endpoints (queue, status, webhook)
- [ ] Implement ATS URL detection
- [ ] Set up Modal.com account and worker skeleton

### Phase 2: Greenhouse Handler
- [ ] Implement GreenhouseHandler with Playwright
- [ ] Multi-step form navigation
- [ ] File upload handling
- [ ] Progress reporting via webhook

### Phase 3: Additional Handlers
- [ ] LeverHandler (single-page forms)
- [ ] AshbyHandler (React-based forms)
- [ ] AI question answering integration

### Phase 4: Frontend
- [ ] AutoApplyButton on job cards
- [ ] AutoApplyModal for review
- [ ] Real-time progress with Supabase subscriptions
- [ ] Settings page for default answers

### Phase 5: Polish
- [ ] CAPTCHA detection and user notification
- [ ] Retry logic and error handling
- [ ] Testing across ATS platforms

## Cost Estimates

| Service | Purpose | Est. Monthly Cost |
|---------|---------|-------------------|
| Modal.com | Browser worker | $5-20 |
| OpenRouter | AI responses | $5-15 |
| Total | | ~$10-35/month |

## Security

- User data in Supabase with RLS
- Worker uses service role (no client exposure)
- Webhook authenticated with secret
- Rate limiting per user
- Full audit trail with screenshots

## Verification

1. Queue a test application via API
2. Verify worker picks up and processes
3. Check real-time progress updates in UI
4. Confirm successful submission on ATS
5. Test error scenarios (CAPTCHA, validation errors)

---

## Why Modal.com?

Vercel serverless functions have a 60-second timeout, which is insufficient for browser automation that may need to:
- Navigate multi-step forms
- Wait for dynamic content to load
- Handle file uploads
- Deal with slow ATS platforms

Modal.com provides:
- Long-running containers (up to 24 hours)
- Built-in Playwright support
- Pay-per-use pricing (~$0.0001/second)
- Easy Python integration
