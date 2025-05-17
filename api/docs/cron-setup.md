# Cron Job Setup Guide

This guide explains how to set up cron jobs to automatically update the police events database.

## Overview

The API includes two protected endpoints for automated event updates:

1. `/api/cron/update-events` - Polls the RSS feed for new events
2. `/api/cron/backfill-events` - Recovers missed events from a specified time period

Both endpoints require authentication with a secret token.

## Security

### Environment Variables

Set the `CRON_SECRET` environment variable to a secure, random string:

```bash
# In your .env file or server environment
CRON_SECRET=your-secure-random-string
```

For production, use a strong, randomly generated string (at least 32 characters).

## Setting Up Cron Jobs

### Option 1: Traditional Cron (Linux/Unix)

Add these to your crontab (`crontab -e`):

```bash
# Update events every 15 minutes
*/15 * * * * curl -X POST https://your-api-domain.com/api/cron/update-events -H "Authorization: Bearer your-cron-secret" -H "Content-Type: application/json"

# Run backfill once a day at 03:00 AM
0 3 * * * curl -X POST https://your-api-domain.com/api/cron/backfill-events -H "Authorization: Bearer your-cron-secret" -H "Content-Type: application/json" -d '{"daysBack": 7, "maxEvents": 500}'
```

### Option 2: Serverless Functions (Vercel)

If deploying on Vercel, use their Cron Jobs feature:

1. Create a `vercel.json` file in your project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/update-events",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/backfill-events",
      "schedule": "0 3 * * *"
    }
  ]
}
```

2. Create wrapper endpoints to handle the authentication:

```javascript
// pages/api/cron/update-events-wrapper.js
export default async function handler(req, res) {
  // Add Vercel Cron authentication check here
  const { authorization } = req.headers;
  
  if (!isValidVercelCronRequest(authorization)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Forward to the actual update endpoint with proper auth
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cron/update-events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  return res.status(response.status).json(data);
}
```

### Option 3: Cloud Services

You can also use cloud services that support scheduled tasks:

- **AWS CloudWatch Events/EventBridge** with Lambda functions
- **Google Cloud Scheduler** with Cloud Functions
- **Azure Logic Apps** with timer triggers

## Monitoring

Set up monitoring for your cron jobs to ensure they're running successfully:

1. Add logging to track job execution
2. Set up alerts for job failures
3. Monitor the database for data freshness

## Testing

Use the provided test script to verify your cron setup:

```bash
# From the api directory
node scripts/test-cron.js
```

## Parameters for Backfill

The backfill endpoint accepts these parameters:

- `daysBack` (1-30): Number of days to look back for missing events
- `maxEvents` (1-1000): Maximum number of events to process in one run

## Troubleshooting

If your cron jobs aren't working:

1. Check that the `CRON_SECRET` matches in both your environment and requests
2. Verify that your server is accessible from where the cron job is running
3. Check logs for any error messages
4. Ensure the API is running and endpoints are accessible

## Lock System

The API uses a file-based locking system to prevent concurrent updates. If an update is already in progress when another is attempted, the endpoint will return a 409 Conflict status.

For production environments with multiple instances, consider implementing a distributed locking system using Redis or a similar service. 