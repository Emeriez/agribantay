# Quick Start: Push to GitHub (Windows PowerShell)

## Prerequisites
- GitHub.com account (you have this ✅)
- Git installed on Windows (download from git-scm.com if needed)

## Step 1: Create an empty repository on GitHub

1. Go to https://github.com/new
2. Repository name: `agribantay`
3. Description: "Agricultural Cooperative Management System"
4. Choose Public (free) 
5. Do NOT initialize with README (we already have one)
6. Click "Create repository"
7. You'll see a page with a URL like `https://github.com/YOUR_USERNAME/agribantay.git`

## Step 2: Run these commands in PowerShell

```powershell
# Go to your project folder
cd d:\AGRIBANTAY\Agribantay

# Check if git is already initialized
git status

# If above command fails, initialize git:
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Agribantay with PostgreSQL setup"

# Add remote repository (REPLACE YOUR_USERNAME with your actual GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/agribantay.git

# Verify remote was added
git remote -v

# Push to GitHub (This will ask for your GitHub credentials)
git branch -M main
git push -u origin main
```

## Step 3: Verify on GitHub

1. Go to https://github.com/YOUR_USERNAME/agribantay
2. You should see all your project files
3. Look for the green "Code" button - if it's there, you're good!

## Common Issues

**Error: "fatal: not a git repository"**
- Run: `git init`

**Error: "remote origin already exists"**
- Run: `git remote remove origin` then try again

**Error: "Authentication failed"**
- You may need to set up a Personal Access Token:
  - Go to GitHub → Settings → Developer settings → Personal access tokens
  - Create a token with "repo" scope
  - Use the token as your password when git asks

---

Once this is done, you can proceed to deploy on Railway! 🚀
