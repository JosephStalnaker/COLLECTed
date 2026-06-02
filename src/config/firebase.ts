import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAoVSv2CNro9qtX79FvxiZeCCZHH9MSiBg",
  authDomain: "collected-c5db0.firebaseapp.com",
  projectId: "collected-c5db0",
  projectId: "collected-c5db0",
  storageBucket: "collected-c5db0.firebasestorage.app",
  messagingSenderId: "800951593946",
  appId: "1:800951593946:web:ee0e42afe3c35a8a16eee3",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
