import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth"; // Import Firebase
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

const UserStore = () => {
  const [userExists, setUserExists] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserExists(true);
        } else {
          await setDoc(userRef, {
            user_id: currentUser.uid,
            email: currentUser.email,
          });

          setUserExists(true);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div>{userExists ? null : <p>User is being added to Firestore...</p>}</div>
  );
};

export default UserStore;
