import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyC_cS9iWjDugDV91_sEbpvfuDbafxoftpM",
  authDomain: "zee-media-10d6c.firebaseapp.com",
  projectId: "zee-media-10d6c",
  storageBucket: "zee-media-10d6c.firebasestorage.app",
  messagingSenderId: "131359372393",
  appId: "1:131359372393:web:fbe02d5765dccd07499ef8",
};

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export const MAX_VIDEO_BYTES = 32 * 1024 * 1024;
