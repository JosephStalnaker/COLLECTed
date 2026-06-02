import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { User } from "../types";

export const signUp = async (
  email: string,
  password: string,
  displayName: string,
): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  await updateProfile(userCredential.user, { displayName });

  const user: User = {
    uid: userCredential.user.uid,
    email: userCredential.user.email,
    displayName,
    photoURL: null,
    createdAt: new Date(),
  };

  await setDoc(doc(db, "users", user.uid), {
    ...user,
    createdAt: serverTimestamp(),
  });

  return user;
};

export const signIn = async (
  email: string,
  password: string,
): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const snapshot = await getDoc(doc(db, "users", userCredential.user.uid));

  return snapshot.data() as User;
};

export const logOut = async (): Promise<void> => {
  await signOut(auth);
};

export const subscribeToAuthChanges = (
  callback: (user: User | null) => void,
): (() => void) => {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const snapshot = await getDoc(doc(db, "users", firebaseUser.uid));
      callback(snapshot.exists() ? (snapshot.data() as User) : null);
    } else {
      callback(null);
    }
  });
};
