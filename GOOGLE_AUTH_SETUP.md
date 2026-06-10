# Google authentication setup

## Google Cloud

1. Open Google Cloud Console and configure the OAuth consent screen.
2. Create an OAuth 2.0 Client ID with application type **Web application**.
3. Add these authorized JavaScript origins:
   - `http://localhost:5173`
   - Your production Vercel URL, for example `https://gramify.vercel.app`
4. Copy the generated client ID.

This integration uses the Google Identity Services popup flow, so it does not
need an authorized redirect URI.

## Local environment

Add the client ID to `FrontEnd/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Add the same client ID to `server/.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Restart both development servers after changing environment variables.

## Production environment

Set this in Vercel:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Set these in Render:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
NODE_ENV=production
FRONTEND_URL=https://your-vercel-domain.vercel.app
```

The Vercel domain in `FRONTEND_URL` and Google Cloud must exactly match the
domain used by the browser.
