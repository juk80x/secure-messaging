import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebaseConfig";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

function MessageList() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const q = query(
          collection(db, "messages"),
          where("recipient_id", "==", currentUser.uid),
          orderBy("timestamp", "desc"),
        );

        const unsubscribeSnap = onSnapshot(q, (snapshot) => {
          try {
            const newMessages = snapshot.docs.map((doc) => ({
              id: doc.id,
              timestamp: doc.data().timestamp,
              content: doc.data().message_content,
              verified: doc.data().verified,
              sender: doc.data().sender_email,
            }));
            setMessages(newMessages);
          } catch (err) {
            console.error(err);
          }
        });

        return () => unsubscribeSnap();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Empty dependency array means this effect runs once on mount

  return (
    <div>
      <h2>Messages</h2>
      {messages && messages.length > 0 ? (
        <ul className="message-list">
          {messages.map((message) => (
            <li key={message.id} className="message-item">
              <span className="sender-email">{message.sender}</span>
              <span className="timestamp">
                {new Date(message.timestamp).toLocaleString()}
              </span>
              <span
                className={`verified-icon ${message.verified ? "verified" : "not-verified"}`}
              >
                {message.verified ? "✓" : "✗"}
              </span>
              <div className="message-content">{message.content}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No messages to display</p>
      )}
    </div>
  );
}

export default MessageList;
