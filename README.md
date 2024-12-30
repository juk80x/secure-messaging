# Secure Messaging

A secure, messaging application built using a React-based frontend, with Firebase providing authentication, data storage via Firestore, and backend logic through Cloud Functions.

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
1. Create a new Firebase project with Authentication (w/ Google provider), Hosting, Firestore Database and Functions at
   https://firebase.google.com/
2. Log in to Firebase using the Firebase CLI
```bash
firebase login
```
3. Get the configuration for your project
```bash
firebase apps:sdkconfig
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
For local development use `localhost:3000` for `your_app_domain_here`. 

## Development
Run the Development server:
```bash
npm start
```

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

## Production
### Building for Production
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

### Operations
#### Authentication
![Sign In](https://raw.githubusercontent.com/juk80x/secure-messaging/master/docs/images/sign_in.png)
<br>
The user will have the option to log in using Google credentials.
### Registration
![Registration](https://raw.githubusercontent.com/juk80x/secure-messaging/master/docs/images/registration.png)
<br>
Once logged in the user will have the option of registering a passkey using WebAuthn.
### Send Messages
![Send Message](https://raw.githubusercontent.com/juk80x/secure-messaging/master/docs/images/send_message.png)
<br>
Once the user has registered a passkey, the user will be able to send signed messages
to other users that have already registered with secure messaging service using the
user's registered email address.
### Receive Messages
![Message List](https://raw.githubusercontent.com/juk80x/secure-messaging/master/docs/images/message_list.png)
<br>
Once the user has registered a passkey, the users will be able to list messages sent 
by other secure messaging service users.

## Security Features
### Authentication
The service uses Firebase Authentication with Google as the identity provider for secure user management.
### Identity
The email address provided by Google is stored and used to identify the user in all service operations.
### Access Control
#### Registration
- (Create, Read) The user is only authorized to register a single passkey for their own account.
- (Update, Delete) Only a database administrator is able to delete the passkey if a new one must be registered.
#### Messaging
- (Create) The user is only able to send messages to existing users.
- (Read) The recipient is only able to read messages sent to their registered email address.
> Messages are **NOT** encrypted. Any administrator with access to the database
or server-side code can read the messages.
- (Update) All messages are signed, so there is no authorized way to update the message.
> All signature validation is performed server-side. The recipient has no way of validating the signature
of the message. Any administrator with access to the database
or server-side code could update the messages without the recipient knowing.
- (Delete) Only a database administrator is able to delete any messages. 
### Message Signing
Each message is signed using WebAuthn and a registered passkey. 
1. The user registers a WebAuthn passkey with the service. The service stores the public-key in the user's identity record.
2. When the user sends a message, the WebAuthn challenge is generated server-side by hashing the message.
3. The user uses their private key from the registered passkey to sign the challenge.
4. The server uses the user's stored public-key to verify signature of the challenge, and stores the verification status 
along with the message for the recipient.
### Data Security 
Firestore rules are set to ensure only authenticated users can read/write messages.
### In-Transit encryption
Data is encrypted while in transit before being sent to either the Firestore Database or server-side code. 

## Future Work
### Asynchronous Key Distribution 
Add the ability for the sender and recipient to securely share keys to enable message signing
and encryption in a manner that doesn't require trusting the server. The feature should be 
asynchronous so that neither the sender nor recipient need to be online to complete the key exchange.
### Message Encryption
Encrypt all messages using a key that has been securely agreed upon between only the
sender and the recipient of the message.
### Recipient-based Signature Verification
Sign all messages using a private key for which the public-key has been agreed upon between only the
sender and the recipient of the message. 
### Distributed Messaging
The client-server design of the service makes the server-side a single point of failure. By
distributing the service, messaging can be resilient to node failure. 
