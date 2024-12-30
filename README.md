# Secure Messaging

A secure, real-time messaging application built using React for the frontend, with Firebase providing authentication, data storage via Firestore, and backend logic through Cloud Functions.

## Features

- **User Authentication**: Secure login and registration using Firebase Authentication with Google IdP
- **Real-time Messaging**: Messages are stored and retrieved in real-time using Firestore.
- **Encrypted Messages**: Messages are encrypted client-side before being sent to Firestore.
- **Scalable Backend**: Utilizes Firebase Cloud Functions for server-side logic.

## Prerequisites

- Node.js (v23 or above)
- npm
- Firebase CLI (for deployment)

## Getting Started

### 1. Clone the Repository
```bash
git clone git@github.com:juk80x/secure-messaging.git
cd secure-messaging
```

### 2. Install Dependencies
```bash
npm install
cd functions/
npm install
cd ../
```

### 3. Setup Environment Variables
1. Create a new Firebase project at 
   https://firebase.google.com/
2. Log in to Firebase using the Firebase CLI
```bash
firebase login
```
3. Get the configuration for your project
```bash
firebase project:get-config --project [PROJECT_ID]
```
4. Create a `.env` file in the root of your project for sensitive information:
```bash
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
REACT_APP_FIREBASE_PROJECT_ID=your_project_id_here
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
REACT_APP_FIREBASE_APP_ID=your_app_id_here
```
4. Create a `.env` file in the `/functions` directory for sensitive information:
```bash
REACT_APP_FIREBASE_RP_ID=your_app_domain_here
```
## Development
Run the Development server:
```bash
npm start
```

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

## Building for Production
```bash
npm run build
```

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

### Deployment
#### Deploying to Firebase Hosting
1. Log into Firebase:
```bash
firebase login
```
2. Initialize Firebase in your Project:
```bash
firebase init
```
3. Select `Hosting` and hit Enter
4. Select `Use an existing project`, and select your Firebase project
5. For `What do you want to use as your public directory?` type `build`.
6. Select `N` for remaining options.

To deploy both your React app and Cloud Functions:
```bash
firebase deploy
```

### Security
- **Authentication**: Uses Firebase Authentication for secure user management.
- **Data Security**: Firestore rules are set to ensure only authenticated users can read/write messages.
- **Encryption**: Client-side encryption before data is sent to Firestore for additional security.

