# Deployment Guide

This guide covers deploying the Creator Connect application to Firebase, including both the frontend (React app) and backend (Cloud Functions).

## Overview

The application consists of:

1. **Frontend** - React + Vite app hosted on Firebase Hosting
2. **Cloud Functions** - Firebase Functions for social media follower count fetching
3. **Firestore** - Database and security rules
4. **Storage** - File storage for profile images and media kits

## Prerequisites

### Required Accounts

- [Firebase Account](https://firebase.google.com/) - With Blaze (Pay-as-you-go) plan
- [GitHub Account](https://github.com/) - For CI/CD
- [Apify Account](https://console.apify.com/) - For social media data fetching

### Required Tools

```bash
npm install -g firebase-tools
npm install -g gh cli
```

### GitHub Secrets

Configure these secrets in your GitHub repository settings:

**Firebase Configuration:**
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
FIREBASE_SERVICE_ACCOUNT_CREATOR_CONNECT_C19BA
```

**Apify Configuration:**
```
APIFY_API_KEY
```

## Initial Setup

### 1. Firebase Project Setup

```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Select:
# - Functions: Configure
# - Hosting: Configure
# - Firestore: Configure
# - Storage: Configure
```

### 2. Configure Apify API Key

**Local Development:**
Create a `.env` file in the `functions/` directory:

```bash
cd functions
echo "APIFY_API_KEY=your_actual_api_key_here" > .env
cd ..
```

**GitHub Actions (CI/CD):**
The `APIFY_API_KEY` secret is already configured in GitHub Secrets.
The workflow will automatically create a `.env` file during deployment.

### 3. Install Functions Dependencies

```bash
cd functions
npm install
cd ..
```

## Deployment Methods

### Method 1: GitHub Actions (Recommended)

The project uses GitHub Actions for automated deployment on:
- **Pull Requests** → Preview deployments
- **Merge to main** → Production deployment

#### Workflow Files

**[`.github/workflows/firebase-hosting-merge.yml`](../.github/workflows/firebase-hosting-merge.yml)** - Production deployment (main branch)

**[`.github/workflows/firebase-hosting-pull-request.yml`](../.github/workflows/firebase-hosting-pull-request.yml)** - Preview deployment (PRs)

#### Creating Functions Deployment Workflow

Create `.github/workflows/firebase-functions-merge.yml`:

```yaml
name: Deploy Firebase Functions on merge
on:
  push:
    branches:
      - main
    paths:
      - 'functions/**'
      - 'firebase.firestore.rules'

jobs:
  deploy_functions:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      # Install functions dependencies
      - name: Install Functions Dependencies
        run: |
          cd functions
          npm ci

      # Build functions
      - name: Build Functions
        run: |
          cd functions
          npm run build

      # Deploy functions
      - name: Deploy to Firebase Functions
        uses: w9jds/firebase-action@master
        with:
          args: deploy --only functions,firestore:rules
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
          APIFY_API_KEY: ${{ secrets.APIFY_API_KEY }}
```

### Method 2: Manual Deployment

#### Deploy Frontend Only

```bash
# Build the app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

#### Deploy Cloud Functions Only

```bash
# Build functions
cd functions
npm run build
cd ..

# Deploy functions
firebase deploy --only functions
```

#### Deploy Firestore Rules Only

```bash
firebase deploy --only firestore:rules
```

#### Deploy Everything

```bash
# Full deployment
firebase deploy
```

## Deployment Checklist

### Before Deploying

- [ ] All tests pass
- [ ] Environment variables are set
- [ ] Firestore rules are updated
- [ ] Functions are built successfully
- [ ] Apify API key is configured
- [ ] Security rules are tested

### After Deploying

- [ ] Test the live application
- [ ] Verify Cloud Functions are working
- [ ] Check Firebase Console logs
- [ ] Monitor Firestore rules in Console
- [ ] Verify rate limiting is working
- [ ] Test Apify integrations

## Environment-Specific Deployments

### Production

```bash
# Deploy to production
firebase deploy --only hosting,functions,firestore:rules

# Or push to main branch (triggers GitHub Actions)
git push origin main
```

### Preview/Staging

```bash
# Deploy to preview channel
firebase hosting:channel:deploy preview --only hosting

# Or create a PR (triggers GitHub Actions)
git push origin feature-branch
```

## CI/CD Pipeline

### Pull Request Flow

1. Developer creates PR
2. GitHub Actions triggers
3. Builds and tests the application
4. Deploys to Firebase Hosting preview channel
5. Posts preview URL as comment on PR

### Main Branch Flow

1. PR is merged to main
2. GitHub Actions triggers
3. Builds and tests the application
4. Deploys frontend to Firebase Hosting (production)
5. Deploys Cloud Functions to Firebase Functions
6. Updates Firestore security rules
7. Production is live at `https://creator-connect-c19ba.web.app`

## Monitoring and Logs

### Firebase Console

- **Hosting**: https://console.firebase.google.com/project/creator-connect-c19ba/hosting
- **Functions**: https://console.firebase.google.com/project/creator-connect-c19ba/functions
- **Firestore**: https://console.firebase.google.com/project/creator-connect-c19ba/firestore
- **Storage**: https://console.firebase.google.com/project/creator-connect-c19ba/storage

### Viewing Logs

```bash
# View function logs
firebase functions:log

# Stream logs in real-time
firebase functions:log --only fetchFollowerCountFunction
```

### Monitoring Tools

- **Firebase Console** → Functions → Logs
- **Apify Console** → Runs history
- **GitHub Actions** → Workflow runs tab

## Rollback Procedures

### Rollback Frontend

```bash
# List previous deployments
firebase hosting:rollback

# Rollback to specific version
firebase deploy --only hosting --config hosting.rewrites=[...]
```

### Rollback Functions

```bash
# Deploy previous version from git
git checkout <previous-commit>
firebase deploy --only functions
```

### Rollback Firestore Rules

```bash
# Revert to previous rules
firebase deploy --only firestore:rules --message "Rollback rules"
```

## Troubleshooting

### Build Failures

**Problem**: Build fails in CI/CD
```bash
# Test locally first
npm ci
npm run build

# Check Node version (must be 20)
node --version
```

### Functions Not Deploying

**Problem**: Functions fail to deploy
```bash
# Check functions logs
firebase functions:log

# Verify API key is set
firebase functions:config:get

# Test locally
cd functions
npm run build
firebase serve --only functions
```

### Environment Variables Missing

**Problem**: App can't connect to Firebase
- Check GitHub Secrets are set correctly
- Verify `.env` file is created during CI
- Test locally with `.env.example`

### Rate Limiting Issues

**Problem**: Rate limits not working
- Check Firestore `rateLimits` collection exists
- Verify rules are deployed
- Check function logs for errors

## Best Practices

1. **Test Locally First**
   ```bash
   firebase emulators:start
   ```

2. **Use Preview Channels**
   - Always test in preview before merging

3. **Monitor Costs**
   - Check Firebase usage dashboard
   - Monitor Apify API calls
   - Set up billing alerts

4. **Version Control**
   - Tag releases: `git tag v1.0.0`
   - Keep changelog

5. **Security**
   - Never commit `.env` files
   - Rotate API keys regularly
   - Review security rules

6. **Performance**
   - Use caching where possible
   - Monitor function cold starts
   - Optimize bundle sizes

## Cost Optimization

### Firebase Functions
- Minimize function execution time
- Use appropriate memory allocation
- Enable caching (1-hour cache implemented)

### Apify API
- Rate limiting prevents abuse (5 calls/platform/user)
- Caching reduces redundant calls
- Monitor usage in Apify Console

### Firebase Hosting
- Assets are cached automatically
- Use CDN for static files
- Optimize images before upload

## Maintenance

### Regular Tasks

- **Weekly**: Check Firebase usage and costs
- **Monthly**: Review and update dependencies
- **Quarterly**: Security audit and review
- **As Needed**: Update Apify actors

### Updating Functions

```bash
# 1. Update code in functions/src/
# 2. Build functions
cd functions && npm run build

# 3. Test locally
firebase serve --only functions

# 4. Deploy
firebase deploy --only functions

# 5. Monitor logs
firebase functions:log
```

### Updating Firestore Rules

```bash
# 1. Edit firebase.firestore.rules
# 2. Test rules in Firebase Console
# 3. Deploy
firebase deploy --only firestore:rules

# 4. Verify in Console
```

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Cloud Functions Documentation](https://firebase.google.com/docs/functions)
- [Apify Documentation](https://docs.apify.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Project Brief](./project-brief.md)
- [Security Guidelines](./security.md)
