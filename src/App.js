// src/App.js
import React from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebaseConfig";
import SignIn from "./SignIn";
import UserStore from "./UserStore";
import CredentialCheck from "./CredentialCheck";
import MessageList from "./MessageList";
import SignOut from "./SignOut";

const App = () => {
  const [user] = useAuthState(auth);

  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.displayName}!</p>
          <SignOut />
          <UserStore />
          <CredentialCheck />
          <MessageList />
        </div>
      ) : (
        <SignIn />
      )}
    </div>
  );
};

export default App;
