import React, { useEffect, useRef, useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "./firebaseConfig";
import SendMessage from "./SendMessage";

function RegisterWebAuthn() {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    const buttonElement = buttonRef.current;

    if (buttonElement) {
      // Use native event listener for click event
      buttonElement.addEventListener("click", handleRegistration);
    }

    // Cleanup the event listener on component unmount
    return () => {
      if (buttonElement) {
        buttonElement.removeEventListener("click", handleRegistration);
      }
    };
  }, []);

  const handleRegistration = async (event) => {
    event.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      setError("User not authenticated");
      setSuccess(false);
      return;
    }

    try {
      // Call Cloud Function to get registration options
      const registerFunction = httpsCallable(functions, "registerCredential");
      const { data } = await registerFunction();
      const registrationOptions = data.registrationOptions;

      // Start WebAuthn registration
      const attestation = await startRegistration({
        optionsJSON: registrationOptions,
      });

      // Send attestation response back to server for verification
      const verifyFunction = httpsCallable(functions, "verifyRegistration");

      const { data: verificationResult } = await verifyFunction(attestation);

      if (verificationResult.status === "success") {
        setSuccess(true);
        setError(null);
      } else {
        throw new Error(
          verificationResult.message || "Failed to verify credential",
        );
      }
    } catch (e) {
      console.error(e);
      setError(e.message);
      setSuccess(false);
    }
  };

  return (
    <div>
      {success ? <SendMessage/> : <button className="btn-submit" ref={buttonRef}>Register Passkey</button>}
      {error && <p>Error: {error}</p>}
    </div>
  );
}

export default RegisterWebAuthn;
