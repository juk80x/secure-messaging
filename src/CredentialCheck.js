import React, { useState, useEffect } from "react";
import RegisterWebAuthn from "./RegisterWebAuthn";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import SendMessage from "./SendMessage";

function CredentialCheck() {
  const [isPasskeyRegistered, setIsPasskeyRegistered] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().credential_id) {
          setIsPasskeyRegistered(true);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return <div>{isPasskeyRegistered ? <SendMessage/> : <RegisterWebAuthn />}</div>;
}

export default CredentialCheck;
