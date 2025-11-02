# Deployment Guide

## Local Development

### Prerequisites

- Node.js 18+ and npm 9+
- Git

### Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd mera-dost
   ```

2. **Install dependencies:**
   ```bash
   npm run install:all
   ```

3. **Create environment files:**

   Backend `.env`:
   ```env
   PORT=3000
   NODE_ENV=development
   MAX_FILE_SIZE=52428800
   TMP_DIR=./tmp
   CLEANUP_INTERVAL=7200000
   ADMIN_SECRET=dev-secret-key
   ```

   Frontend `.env`:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

4. **Start development servers:**
   ```bash
   npm run dev
   ```

   This starts:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000

## Docker Deployment

### Using Docker Compose

1. **Build and start:**
   ```bash
   docker-compose up --build
   ```

2. **Access:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000

3. **Stop:**
   ```bash
   docker-compose down
   ```

### Manual Docker Build

**Backend:**
```bash
cd backend
docker build -t mera-dost-backend .
docker run -p 3000:3000 -e PORT=3000 mera-dost-backend
```

**Frontend:**
```bash
cd frontend
docker build -t mera-dost-frontend .
docker run -p 5173:80 mera-dost-frontend
```

## Production Deployment

### Environment Variables

**Backend:**

```env
PORT=3000
NODE_ENV=production
MAX_FILE_SIZE=52428800
TMP_DIR=/app/tmp
CLEANUP_INTERVAL=7200000
ADMIN_SECRET=<strong-random-secret>
```

**Frontend:**

```env
VITE_API_URL=https://api.mera-dost.com
```

### Build for Production

**Frontend:**
```bash
cd frontend
npm run build
# Output in frontend/dist/
```

**Backend:**
```bash
cd backend
npm run build
# Output in backend/dist/
```

### Deploy to Vercel (Frontend)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   cd frontend
   vercel
   ```

3. Set environment variables in Vercel dashboard:
   - `VITE_API_URL`

### Deploy to Render/Heroku (Backend)

**Render:**

1. Create new Web Service
2. Connect repository
3. Set build command: `cd backend && npm install && npm run build`
4. Set start command: `cd backend && npm start`
5. Add environment variables:
   - `PORT`
   - `NODE_ENV=production`
   - `MAX_FILE_SIZE`
   - `TMP_DIR`
   - `CLEANUP_INTERVAL`
   - `ADMIN_SECRET`

**Heroku:**

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create mera-dost-api`
4. Deploy: `git push heroku main`
5. Set config vars:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MAX_FILE_SIZE=52428800
   heroku config:set ADMIN_SECRET=<secret>
   ```

### Nginx Configuration (if self-hosting)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/mera-dost/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL/HTTPS

For production, use:
- Let's Encrypt (free)
- Cloudflare (free tier)
- Your hosting provider's SSL

### Monitoring

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Admin Stats:**
```bash
curl -H "X-Admin-Secret: your-secret" http://localhost:3000/admin/stats
```

### Scaling Considerations

- Use external storage (S3) for file handling at scale
- Add Redis for session/file metadata
- Use database (PostgreSQL) instead of JSON files
- Implement rate limiting
- Add CDN for static assets

### Backup & Recovery

- Backup file metadata (if using database)
- Implement file backup to external storage
- Monitor disk space
- Set up alerts for cleanup service failures

