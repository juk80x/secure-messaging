import React, { useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "./firebaseConfig";

function SendMessage() {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [messageData, setMessageData] = useState({
    address: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMessageData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      setError("User not authenticated");
      setSuccess(false);
      return;
    }

    try {
      // Call Cloud Function to get registration options
      const sendMessageFunction = httpsCallable(functions, "sendMessage");
      const { data } = await sendMessageFunction(messageData);
      const authOptions = data.authOptions;

      // Start WebAuthn registration
      const attestation = await startAuthentication({
        optionsJSON: authOptions,
      });

      // Send attestation response back to server for verification
      const verifyFunction = httpsCallable(functions, "verifyAuthentication");

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

    setMessageData({
      address: "",
      message: "",
    });
  };

  return (
    <form className="message-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label for="recipient-email">Recipient:</label>
        <input
          type="email"
          name="address"
          className="recipient-email"
          value={messageData.address}
          onChange={handleChange}
          placeholder="Email Address"
          required
        />
      </div>
      <div className="form-group">
        <label for="message">Message:</label>
        <textarea
          name="message"
          value={messageData.message}
          onChange={handleChange}
          placeholder="Enter your message"
          className="message-input"
          required
        />
      </div>
      <button type="submit" className="btn-submit">
        Send Message
      </button>
      {error && <p>Error: {error}</p>}
      {success && <p>Message Sent!</p>}
    </form>
  );
}

export default SendMessage;
