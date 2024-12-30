import React from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "./firebaseConfig";

const SignIn = () => {
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      // Handle error
      console.error(error);
    }
  };

  return <button className="btn-submit" onClick={handleGoogleSignIn}>Sign In with Google</button>;
};

export default SignIn;
