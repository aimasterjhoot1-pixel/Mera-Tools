# Render Deployment Guide

## Backend Deployment on Render

### Configuration Settings

**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
npm start
```

**Environment Variables:**
Add these in Render's Environment tab:

```
NODE_ENV=production
PORT=10000
MAX_FILE_SIZE=52428800
TMP_DIR=./tmp
CLEANUP_INTERVAL=7200000
ADMIN_SECRET=your-secret-key-here-change-me
```

**Important Notes:**
- Render automatically provides a `PORT` environment variable - your app will use it automatically
- The `TMP_DIR` will be created automatically in Render's filesystem
- Make sure to set a strong `ADMIN_SECRET` for the admin endpoint
- Files in `/tmp` are ephemeral and will be cleared on deploy/redeploy

### Render Service Settings

1. **Name:** mera-tool-backend (or your preferred name)
2. **Environment:** Node
3. **Region:** Choose closest to your users
4. **Branch:** main (or your default branch)
5. **Root Directory:** backend
6. **Build Command:** `npm install && npm run build`
7. **Start Command:** `npm start`
8. **Plan:** Free tier works for MVP, upgrade as needed

### After Deployment

1. Get your backend URL (e.g., `https://mera-tool-backend.onrender.com`)
2. Update your frontend `.env` or Netlify environment variables:
   ```
   VITE_API_URL=https://mera-tool-backend.onrender.com
   ```
3. Redeploy frontend with the new API URL

### Health Check

Your backend has a health check endpoint at `/health`:
```
GET https://your-backend-url.onrender.com/health
```

### Admin Endpoint

Access admin stats (requires header):
```
GET https://your-backend-url.onrender.com/admin/stats
Header: X-Admin-Secret: your-secret-key-here
```

### Troubleshooting

**Build fails:**
- Ensure Node.js version is 18+ (Render detects automatically)
- Check that all dependencies install correctly

**Server won't start:**
- Verify PORT environment variable is set
- Check Render logs for errors
- Ensure `dist/index.js` exists after build

**File uploads failing:**
- Check `TMP_DIR` exists (created automatically)
- Verify `MAX_FILE_SIZE` is set correctly

