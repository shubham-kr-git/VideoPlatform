// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDxzqXmGx0Gp3oktbb2UAr4R527rnL4x8Y",
  authDomain: "video-platform-c77b3.firebaseapp.com",
  projectId: "video-platform-c77b3",
//   storageBucket: "video-platform-c77b3.firebasestorage.app",
//   messagingSenderId: "826171618879",
  appId: "1:826171618879:web:f7de69c1a26454eae4ea8a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

export function signInWithGoogle(){
    return signInWithPopup(auth, new GoogleAuthProvider());
}

export function signOut(){
  return auth.signOut();
}

export function onAuthStateChangedHelper(callback: (user: User | null) => void){
  return onAuthStateChanged(auth, callback);
}