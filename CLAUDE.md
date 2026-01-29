# RemoteDesigners.co - Project Configuration

## Cron Jobs (cron-job.org)

**Primary cron service: cron-job.org** (NOT Vercel crons)

### Why cron-job.org over Vercel Crons
- No timeout limits (Vercel Hobby = 10s, Pro = 60s)
- Cheaper ($5/mo vs $20/mo for unlimited)
- External monitoring and failure alerts
- Already configured with all job syncs

### API Access
```
API Key: xx24f1n3Qyj1BFXS8ET3o4FyUSbabnbZrK4ThwoTWCQ=
Folder ID: 55290
```

### Active Cron Jobs

#### Job Sync - Primary Sources
| Job | URL | Schedule |
|-----|-----|----------|
| Remotive | /api/jobs/sync/remotive | Every hour :15 |
| Remote OK | /api/jobs/sync/remoteok | Every hour :10 |
| Greenhouse 1/3 | /api/jobs/sync/greenhouse?batch=1 | Every hour :00 |
| Greenhouse 2/3 | /api/jobs/sync/greenhouse?batch=2 | Every hour :02 |
| Greenhouse 3/3 | /api/jobs/sync/greenhouse?batch=3 | Every hour :04 |
| Lever | /api/jobs/sync/lever | Every hour :20 |
| Others | /api/jobs/sync/others | Every hour :05 |
| LinkedIn | /api/jobs/sync/linkedin | 6:45 AM & 6:45 PM ET |
| Asia | /api/jobs/sync/asia | Every hour :25 |
| Asia 2 | /api/jobs/sync/asia-2 | Every hour :27 |
| RapidAPI Remote | /api/jobs/sync/rapidapi-remote | Every hour :35 |

#### Indeed Regional Sync (Granular)
Base URL: `/api/cron/sync-indeed-query?region=XX&type=YY`

**Schedule:** Every 2 hours (to stay within Indeed API rate limits)
**Hours:** 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22

| Region | Types | Minutes |
|--------|-------|---------|
| US | ui, ux, product, graphic | :00, :02, :04, :06 |
| PH | ui, ux, product, graphic | :10, :12, :14, :16 |
| CA | ui, ux, product | :20, :22, :24 |
| GB | ui, ux, product | :30, :32, :34 |
| AU | ui, ux, product | :40, :42, :44 |
| IN | ui, ux, product | :50, :52, :54 |

**API Usage:** 20 jobs × 4 calls × 12 runs/day = 960 calls/day

#### Other Jobs
| Job | URL | Schedule |
|-----|-----|----------|
| Daily Digest | /api/cron/daily-digest | 9:00 AM Manila |
| Backfill Company Info | /api/cron/backfill-company-info | 2:00 AM Manila |

### Adding New Cron Jobs

```bash
curl -X PUT "https://api.cron-job.org/jobs" \
  -H "Authorization: Bearer xx24f1n3Qyj1BFXS8ET3o4FyUSbabnbZrK4ThwoTWCQ=" \
  -H "Content-Type: application/json" \
  -d '{
    "job": {
      "url": "https://remotedesigners.co/api/your-endpoint",
      "title": "Job Name",
      "enabled": true,
      "saveResponses": true,
      "requestMethod": 0,
      "schedule": {
        "timezone": "Asia/Manila",
        "hours": [-1],
        "minutes": [0],
        "mdays": [-1],
        "months": [-1],
        "wdays": [-1]
      },
      "extendedData": {
        "headers": {
          "Authorization": "Bearer CRON_SECRET_HERE"
        }
      },
      "folderId": 55290
    }
  }'
```

### Listing All Jobs

```bash
curl -s "https://api.cron-job.org/jobs" \
  -H "Authorization: Bearer xx24f1n3Qyj1BFXS8ET3o4FyUSbabnbZrK4ThwoTWCQ=" | jq
```

---

## RapidAPI Configuration

**API Key:** `38599ce5a3msha770cf6e1356f79p13b1d3jsnb4ea6f7c6f08`

### Indeed API (indeed12.p.rapidapi.com)
- Used for regional job searches (US, PH, CA, GB, AU, IN)
- Endpoints: `/jobs/search` and `/job/{id}`
- Rate limit: PRO plan (~100 requests/hour)
- Schedule: Every 2 hours to avoid rate limits

### Remote Jobs API (remote-jobs1.p.rapidapi.com)
- Aggregates remote jobs from multiple sources
- Endpoint: `/jobs?country=us&employment_type=fulltime&limit=50`
- Filters for design jobs automatically
- Schedule: Every hour at :35

```bash
# Test Remote Jobs API
curl --request GET \
  --url 'https://remote-jobs1.p.rapidapi.com/jobs?country=us&employment_type=fulltime&limit=50' \
  --header 'x-rapidapi-host: remote-jobs1.p.rapidapi.com' \
  --header 'x-rapidapi-key: 38599ce5a3msha770cf6e1356f79p13b1d3jsnb4ea6f7c6f08'
```

---

## Environment Variables

Key variables in `.env.local`:
- `CRON_SECRET` - Auth token for cron endpoints
- `RAPIDAPI_KEY` - RapidAPI access (Indeed + Remote Jobs)
- `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` - Database
- `OPENROUTER_API_KEY` - AI categorization
- `STRIPE_*` - Payment processing
- `TWITTER_*` - Auto-posting (@co_remote50851)

---

## Indeed Sync Architecture

Split into granular endpoints to avoid Vercel timeouts:

```
/api/cron/sync-indeed-query?region=us&type=ui
                           ?region=us&type=ux
                           ?region=ph&type=product
                           etc.
```

Each job:
- 1 search query
- Up to 5 job detail fetches
- Completes in ~5-10 seconds
- Never timeouts

Regions: us, ph, ca, gb, au, in, sg, id
Types: ui, ux, product, graphic
