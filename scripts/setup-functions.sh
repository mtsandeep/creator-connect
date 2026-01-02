#!/bin/bash

# Firebase Functions Setup Script
# This script helps set up the Firebase Functions for the first time

echo "🔥 Firebase Functions Setup"
echo "============================"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

echo "✅ Firebase CLI is installed"
echo ""

# Check if user is logged in
echo "🔐 Checking Firebase login status..."
if firebase login --list 2>&1 | grep -q "No"; then
    echo "Please login to Firebase:"
    firebase login
else
    echo "✅ Already logged in to Firebase"
fi
echo ""

# Install functions dependencies
echo "📦 Installing functions dependencies..."
cd functions
if [ -f "package.json" ]; then
    npm install
    echo "✅ Dependencies installed"
else
    echo "❌ No package.json found in functions directory"
    exit 1
fi
cd ..
echo ""

# Build functions
echo "🔨 Building functions..."
cd functions
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Functions built successfully"
else
    echo "❌ Build failed"
    exit 1
fi
cd ..
echo ""

# Prompt for Apify API key
echo "🔑 Apify Configuration"
echo "======================"
echo "You need an Apify API key to fetch social media follower counts."
echo "Get your API key from: https://console.apify.com/"
echo ""
read -p "Enter your Apify API key (or press Enter to skip): " API_KEY

if [ ! -z "$API_KEY" ]; then
    echo "Setting Apify API key..."
    firebase functions:config:set apify.api_key="$API_KEY"
    echo "✅ Apify API key configured"
else
    echo "⚠️  Skipped Apify API key configuration"
    echo "You can set it later with: firebase functions:config:set apify.api_key=\"YOUR_KEY\""
fi
echo ""

# Ask about deployment
echo "🚀 Deployment"
echo "============="
read -p "Do you want to deploy the functions now? (y/N): " DEPLOY

if [[ $DEPLOY =~ ^[Yy]$ ]]; then
    echo "Deploying functions to Firebase..."
    firebase deploy --only functions,firestore:rules
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Functions deployed successfully!"
        echo ""
        echo "🎉 Setup complete!"
        echo ""
        echo "Next steps:"
        echo "1. Test the functions in Firebase Console"
        echo "2. Check the logs: firebase functions:log"
        echo "3. Monitor usage: https://console.firebase.google.com"
    else
        echo "❌ Deployment failed"
        echo "Check the error messages above and try again"
    fi
else
    echo "Skipped deployment"
    echo "Deploy later with: firebase deploy --only functions"
fi
echo ""

echo "✨ Setup complete!"
