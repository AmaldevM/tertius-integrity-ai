
# Tertius Integrity - Field Force & Expense Management

## Deployment Instructions (Vercel)

This application is designed to be deployed on Vercel with a Firebase Firestore backend.

### 1. Set up Firebase
1. Create a project at [console.firebase.google.com](https://console.firebase.google.com/).
2. Enable **Firestore Database** in test mode or production mode.
3. Go to **Project Settings** > **General** > **Your apps** and create a Web App.
4. Copy the `firebaseConfig` keys (apiKey, authDomain, etc.).

### 2. Deploy to Vercel
1. Push this code to a Git repository (GitHub/GitLab).
2. Import the project into Vercel.
3. In the Vercel **Project Settings**, go to **Environment Variables**.
4. Add the following variables using the values from your Firebase config:

```
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456...
REACT_APP_FIREBASE_APP_ID=1:12345...
```

5. Deploy.

### Local Development
If you want to run this locally without setting up environment variables, open `services/mockDb.ts` and replace the `process.env` calls with your actual string keys. **Do not commit these keys to public repositories.**
