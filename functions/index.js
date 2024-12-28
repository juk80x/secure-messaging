/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");
// const base64url = require("base64url");
const logger = require("firebase-functions/logger");
// const { isoBase64URL } = require("@simplewebauthn/server/helpers");
const CryptoJS = require("crypto-js");

const rpName = "Secure Messaging";
const rpID = process.env.FIREBASE_AUTH_DOMAIN;
const origin = `https://${process.env.FIREBASE_AUTH_DOMAIN}`;

admin.initializeApp();
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

exports.registerCredential = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "User must be logged in to register a WebAuthn credential.",
    );
  }

  const userId = request.auth.uid;
  const userRef = db.collection("users").doc(userId);
  const userSnap = await userRef.get();
  if (userSnap.data().credential_id) {
    throw new HttpsError("already-exists", "Credential already registered.");
  }

  const options = {
    rpName: rpName,
    rpID: rpID,
    userName: request.auth.token.name || "Anonymous User",
    attestationType: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "required",
      userVerification: "required",
    },
  };

  logger.debug(options);
  const regOptions = await generateRegistrationOptions(options).catch((err) => {
    logger.error("Error in generating Registration Options: ", err);
    throw new HttpsError("internal", "Failed to generate WebAuthn options");
  });

  // Store the currentOptions and challenge
  await db.collection("webauthn-options").doc(userId).set({
    options: regOptions,
  });

  return {
    status: "success",
    registrationOptions: regOptions,
  };
});

exports.verifyRegistration = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "User must be logged in to verify WebAuthn registration.",
    );
  }

  const optionsRef = admin
    .firestore()
    .collection("webauthn-options")
    .doc(request.auth.uid);
  const optionsSnap = await optionsRef.get();
  const currentOptions = optionsSnap.data().options;

  const userId = request.auth.uid;
  const body = request.data;

  const verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge: currentOptions.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  }).catch((error) => {
    logger.error("Error in verifying WebAuthn registration:", error);
    throw new HttpsError("internal", "Failed to verify WebAuthn credential");
  });

  const { registrationInfo } = verification;
  const { credential } = registrationInfo;

  // Store the new credential
  await admin
    .firestore()
    .collection("users")
    .doc(userId)
    .update({
      credential_id: credential.id,
      public_key: credential.publicKey,
    })
    .catch((error) => {
      logger.error("Error in storing new credential in Firestore:", error);
      throw new HttpsError("internal", "Failed to store WebAuthn credential");
    });

  // Remove the challenge after verification
  await optionsRef
    .delete()
    .then(() => {
      logger.log("Options successfully deleted!");
    })
    .catch((error) => {
      logger.error("Error removing document: ", error);
    });

  return { status: "success", message: "WebAuth verification successfully." };
});

exports.verifyAuthentication = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "User must be logged in to verify WebAuthn registration.",
    );
  }

  const userRef = db.collection("users");
  const senderSnap = await userRef.doc(request.auth.uid).get();
  const credentialId = senderSnap.data().credential_id;
  const credentialPublicKey = senderSnap.data().public_key;
  const senderEmail = senderSnap.data().email;

  const challengesRef = admin
    .firestore()
    .collection("message-challenges")
    .doc(request.auth.uid);
  const challengesSnap = await challengesRef.get();

  const userId = request.auth.uid;
  const body = request.data;

  const options = {
    response: body,
    expectedChallenge: challengesSnap.data().options.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: credentialId,
      publicKey: credentialPublicKey,
    },
  };

  // Remove the challenge after verification
  await challengesRef
    .delete()
    .then(() => {
      logger.log("Challenge successfully deleted!");
    })
    .catch((error) => {
      logger.error("Error removing document: ", error);
    });

  logger.debug("Options: ", options);
  const verification = await verifyAuthenticationResponse(options).catch(
    (error) => {
      logger.error("Error in verifying Authentication Response:", error);
      throw new HttpsError(
        "internal",
        "Failed to verify Authentication Response",
      );
    },
  );

  logger.debug("Verification: ", verification);
  const { verified } = verification;

  await userRef
    .where("email", "==", challengesSnap.data().address)
    .limit(1)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        logger.info("Recipient not found: ", challengesSnap.data().address);
        throw new HttpsError("internal", "Failed to send message");
      } else {
        const recipient = snapshot.docs[0].data();

        // Store the message
        admin
          .firestore()
          .collection("messages")
          .add({
            sender_id: userId,
            sender_email: senderEmail,
            recipient_id: recipient.user_id,
            message_content: challengesSnap.data().message,
            verified: verified,
            timestamp: Date.now(),
          })
          .catch((error) => {
            logger.error("Error in storing new message in Firestore:", error);
            throw new HttpsError("internal", "Failed to send message");
          });
      }
    });

  return { status: "success", message: "Message sent successfully." };
});

exports.sendMessage = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "User must be logged in to register a WebAuthn credential.",
    );
  }

  const userId = request.auth.uid;
  const { address, message } = request.data;

  const userRef = db.collection("users");
  await userRef
    .where("email", "==", address)
    .limit(1)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        logger.info("Recipient not found: ", address);
        throw new HttpsError("internal", "Failed to send message");
      }
    });

  const challengeHash = CryptoJS.SHA256(message).toString(CryptoJS.enc.Hex); // eslint-disable-line

  const authOptions = await generateAuthenticationOptions({
    rpID: rpID,
    allowCredentials: [],
    challenge: challengeHash,
    userVerification: "required",
  }).catch((err) => {
    logger.error("Error in generating Authentication Options: ", err);
    throw new HttpsError(
      "internal",
      "Failed to generate Authentication options",
    );
  });

  await db
    .collection("message-challenges")
    .doc(userId)
    .set({
      address: address,
      message: message,
      options: authOptions,
      expiresAt: Date.now() + 10 * 60 * 1000,
    })
    .catch((error) => {
      logger.error("Error in storing Message Challenge: ", error);
      throw new HttpsError("internal", "Failed to send message");
    });

  return {
    status: "success",
    authOptions: authOptions,
  };
});
