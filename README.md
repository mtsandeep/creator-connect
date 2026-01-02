# Creator Connect

A marketplace connecting content creators (influencers) with brands for promotional collaborations.

## 🚀 Features

- **Role-Based Access**: Separate flows for influencers and promoters
- **Smart Profile Management**: Complete influencer profiles with social media integration
- **Real-Time Proposals**: Live proposal tracking and messaging
- **Secure Payments**: Escrow-based payment system with advance payment support
- **Admin Dashboard**: User management, ban/unban, and verification badges
- **Auto-Fetch Follower Counts**: Automatically fetch follower/subscriber counts from Instagram, YouTube, and Facebook using Apify
- **Rate Limiting**: Built-in rate limiting to prevent API abuse
- **Smart Caching**: Reduce API costs with intelligent caching

## 🏗️ Architecture

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Routing**: React Router v7
- **UI**: Tailwind CSS + Framer Motion
- **Icons**: React Icons, Lucide React
- **Firebase**: React Firebase Hooks

### Backend
- **Authentication**: Firebase Auth (Google OAuth)
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Serverless**: Firebase Cloud Functions (Node.js 20)
- **External APIs**: Apify for social media data

## 📁 Project Structure

```
influencer-marketplace/
├── src/
│   ├── components/       # Reusable components
│   ├── pages/            # Route pages
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Firebase config
│   ├── stores/           # Zustand stores
│   └── types/            # TypeScript types
├── functions/            # Firebase Cloud Functions
│   └── src/
│       ├── apifyClient.ts      # Apify API integration
│       ├── rateLimiter.ts      # Rate limiting logic
│       ├── index.ts            # Cloud Functions entry point
│       └── config.ts           # Configuration
├── docs/                 # Documentation
├── .github/workflows/    # CI/CD pipelines
└── firebase.json         # Firebase configuration
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 20+
- npm or yarn
- Firebase account (Blaze plan)
- Apify account

### 1. Clone and Install

```bash
git clone <repository-url>
cd influencer-marketplace
npm install
```

### 2. Firebase Setup

```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Set Apify API key
firebase functions:config:set apify.api_key="YOUR_APIFY_API_KEY"
```

### 3. Install Functions Dependencies

```bash
cd functions
npm install
cd ..
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 5. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 6. Run Firebase Emulator (Optional)

```bash
firebase emulators:start
```

## 🚢 Deployment

### Automated Deployment (GitHub Actions)

The project uses GitHub Actions for CI/CD:

- **Pull Requests**: Automatic preview deployments
- **Main Branch**: Automatic production deployments

See [Deployment Guide](./docs/deploy.md) for detailed instructions.

### Manual Deployment

```bash
# Deploy frontend only
npm run build
firebase deploy --only hosting

# Deploy functions only
cd functions && npm run build && cd ..
firebase deploy --only functions

# Deploy everything
firebase deploy
```

## 📖 Documentation

- [Deployment Guide](./docs/deploy.md) - Complete deployment instructions
- [Project Brief](./docs/project-brief.md) - Project overview and requirements
- [UI Screens](./docs/ui-screens.md) - Screen-by-screen design
- [Security Guidelines](./docs/security.md) - Security best practices
- [Progress Tracker](./docs/progress-tracker.md) - Development progress
- [Functions README](./functions/README.md) - Cloud Functions documentation

## 🔐 Security

- **Authentication**: Required for all protected routes
- **Firestore Rules**: Comprehensive security rules for all collections
- **Rate Limiting**: 5 API calls per platform per user (24-hour window)
- **Input Validation**: Zod schemas for all user inputs
- **XSS Protection**: React's built-in XSS protection
- **Admin Impersonation**: Secure admin impersonation with audit logs

See [Security Guidelines](./docs/security.md) for more details.

## 🧪 Testing

```bash
# Run linter
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔑 Firebase Collections

- `users` - User profiles and roles
- `proposals` - Collaboration proposals
- `conversations` - Messaging threads
- `messages` - Individual messages
- `reviews` - User reviews
- `transactions` - Payment records
- `adminLogs` - Admin audit logs
- `impersonation` - Admin impersonation markers
- `rateLimits` - API rate limiting
- `apiCache` - Apify response cache

## 🌐 API Integrations

### Apify

Used for fetching social media data:

- **Instagram**: Profile scraper for follower counts
- **YouTube**: Channel scraper for subscriber counts
- **Facebook**: Page scraper for follower counts

Rate limited and cached to optimize costs.

## 📊 Usage Analytics

Monitor your application:

- **Firebase Console**: https://console.firebase.google.com
- **Apify Console**: https://console.apify.com
- **GitHub Actions**: Repository Actions tab

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request
5. Automatic preview deployment will be created

## 📝 License

This project is proprietary software. All rights reserved.

## 💬 Support

For issues and questions, please refer to the documentation in the `docs/` directory.
