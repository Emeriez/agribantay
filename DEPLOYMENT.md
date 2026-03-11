# Agribantay Deployment Guide

## Overview

Your app is now ready to deploy to the cloud! Here's the step-by-step process.

## ✅ Completed Steps

1. ✅ PostgreSQL database schema created
2. ✅ Server code updated to use PostgreSQL
3. ✅ `.env.example` template created
4. ✅ Packages added (pg, dotenv)

## 📋 Next Steps (FREE)

### Step 1: Set up Git and Push to GitHub

```bash
# Navigate to your project folder
cd d:\AGRIBANTAY\Agribantay

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Add PostgreSQL database setup"

# Add remote (replace YOUR_USERNAME and YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/agribantay.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 2: Deploy Backend to Railway.app (FREE)

1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Create a new project
4. Select "Deploy from GitHub repo"
5. Choose your agribantay repository
6. Railway will auto-detect it's a Node.js app
7. **Add PostgreSQL plugin:**
   - Click "Add Plugin" → PostgreSQL
   - Railway will automatically set DATABASE_URL
8. Deploy!

**Railway will give you:**
- A production database (PostgreSQL)
- A backend URL like: `https://agribantay-prod.railway.app`

### Step 3: Deploy Frontend to Vercel.com (FREE)

1. Go to [Vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "Add New Project"
4. Select your agribantay repository
5. **Important - Set Environment Variable:**
   - Go to Settings → Environment Variables
   - Add: `VITE_API_URL=https://agribantay-prod.railway.app` (use your actual Railway URL)
6. Deploy!

**Vercel will give you:**
- A production frontend URL like: `https://agribantay.vercel.app`

### Step 4: Update Frontend API Configuration

In `src/api/apiClient.js`, add logic to use the correct API URL:

```javascript
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000';
```

### Step 5: Buy Domain (ONLY COSTS ~$10/year)

1. Go to [Domain.ph](https://domain.ph) or [Namecheap](https://namecheap.com)
2. Search for your domain (e.g., `agribantay.ph`)
3. Check if GCash/PayPal accepted
4. Buy the domain
5. Point it to your apps:
   - Vercel frontend (CNAME)
   - Railway backend (subdomain or separate domain)

---

## 🚀 After Deployment Workflow

When you make changes locally:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Both Railway and Vercel will auto-redeploy from GitHub!

---

## 📱 Test Accounts (Same as Before)

- **Admin:** admin@example.com / admin123
- **Member 1:** member1@example.com / member123
- **Member 2:** member2@example.com / member123
- **Member 3:** member3@example.com / member123

---

## ⚠️ Important Notes

1. **Local Testing:** If you want to test locally before deploying, you need PostgreSQL installed. We can set that up separately.
2. **Passwords:** Currently using plaintext for demo. In production, use `bcrypt` to hash passwords.
3. **CORS:** The backend allows requests from any origin (`*`). In production, specify your frontend domain.
4. **Database:** Railway's free tier PostgreSQL includes 10GB storage and should be plenty for a cooperative.

---

## 🆘 Troubleshooting

- **Railway deployment fails:** Check if `package.json` scripts are correct
- **Frontend can't reach backend:** Verify `VITE_API_URL` environment variable is set correctly
- **Database connection error:** Check DATABASE_URL in Railway environment variables
