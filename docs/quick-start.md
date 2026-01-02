# Quick Start Guide

Get up and running with Creator Connect in 5 minutes!

## 📋 Prerequisites Checklist

- [ ] Node.js 20+ installed
- [ ] Firebase account created (Blaze plan)
- [ ] Apify account created
- [ ] GitHub account (for deployment)

## ⚡ 5-Minute Setup

### 1. Clone & Install (2 min)

```bash
git clone <your-repo-url>
cd influencer-marketplace
npm install
```

### 2. Environment Setup (1 min)

Create `.env` file:

```bash
cp .env.example .env
# Edit .env with your Firebase credentials
```

### 3. Functions Setup (2 min)

```bash
cd functions
npm install
npm run build
cd ..

# Create .env file for Apify API key
echo "APIFY_API_KEY=your_apify_api_key" > functions/.env
```

### 4. Run & Test (30 sec)

```bash
# Terminal 1: Start frontend
npm run dev

# Terminal 2: Start Firebase emulator (optional)
firebase emulators:start
```

Visit `http://localhost:5173` 🎉

## 🚀 First Deployment

### Option A: GitHub Actions (Recommended)

Just push to `main` branch:
```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

That's it! GitHub Actions handles everything.

### Option B: Manual Deployment

```bash
# Deploy frontend
npm run build
firebase deploy --only hosting

# Deploy functions
firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

## ✅ Verify Deployment

1. **Frontend**: Visit your Firebase hosting URL
2. **Functions**: Check Firebase Console > Functions
3. **Rules**: Check Firebase Console > Firestore > Rules

## 🐛 Troubleshooting

### "Functions not found"
```bash
cd functions && npm run build && cd ..
firebase deploy --only functions
```

### "Apify API key not configured"
```bash
# Create .env file in functions directory
echo "APIFY_API_KEY=your_key" > functions/.env

# For CI/CD, add APIFY_API_KEY to GitHub Secrets
```

### "Environment variables missing"
- Check `.env` file exists
- Verify all `VITE_FIREBASE_*` variables are set
- Restart dev server

## 📚 Next Steps

1. Read full [Deployment Guide](./deploy.md)
2. Review [Security Guidelines](./security.md)
3. Check [Project Brief](./project-brief.md)
4. Explore [UI Screens](./ui-screens.md)

## 💡 Tips

- Use Firebase emulator for local testing
- Test functions before deploying
- Monitor costs in Firebase Console
- Check Apify dashboard for API usage
- Keep dependencies updated

## 🔗 Useful Links

- Firebase Console: https://console.firebase.google.com
- Apify Console: https://console.apify.com
- GitHub Actions: https://github.com/<your-org>/<your-repo>/actions

---

**Need Help?** Check the [full documentation](./deploy.md) or open an issue.
