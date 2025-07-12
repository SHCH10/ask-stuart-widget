import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Updated with Web API Key enabled
const firebaseConfig = {
  apiKey: "AIzaSyA01OtnytcW3ThyOS3sAV_LXNeSt7mA5qk",
  authDomain: "ask-stuart.firebaseapp.com",
  projectId: "ask-stuart",
  storageBucket: "ask-stuart.firebasestorage.app",
  messagingSenderId: "517717293626",
  appId: "1:517717293626:web:78a5766355f82bd44f9303"
};

console.log('Firebase Config Updated:', firebaseConfig);

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Messaging requires HTTPS or localhost, handle gracefully
let messaging;
try {
  if (typeof window !== 'undefined' && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.warn('Firebase Messaging not available:', error.message);
}

export { messaging };

// FCM Token and Message Handling
export const requestNotificationPermission = async () => {
  if (!messaging) {
    console.warn('Firebase Messaging not available');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.warn('VAPID key not configured');
        return null;
      }

      const token = await getToken(messaging, { vapidKey });
      console.log('FCM Token:', token);
      
      // Store token for push notifications
      if (token && import.meta.env.VITE_API_BASE_URL) {
        try {
          await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/fcm-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token,
              userId: 'admin' // For admin notifications
            })
          });
        } catch (fetchError) {
          console.warn('Failed to store FCM token:', fetchError.message);
        }
      }
      
      return token;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
  }
  return null;
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) {
      console.warn('Firebase Messaging not available for onMessage');
      return;
    }
    
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
