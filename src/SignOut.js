import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebaseConfig"; // Adjust the path to your firebaseConfig.js file

function SignOut() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User signed out!");
      // Here you might want to redirect to login page or update state to show login UI
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return <button className="logout-btn " onClick={handleLogout}>Logout</button>;
}

export default SignOut;
