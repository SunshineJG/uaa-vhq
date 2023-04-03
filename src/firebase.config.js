// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getFunctions } from 'firebase/functions'
import { getStorage } from 'firebase/storage'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDWFHHca0DULltfKeP0SPjriJXh-ZGIzf8",
  authDomain: "vhq-uaa.firebaseapp.com",
  projectId: "vhq-uaa",
  storageBucket: "vhq-uaa.appspot.com",
  messagingSenderId: "54282393410",
  appId: "1:54282393410:web:dd70bd0c297bf7c9105adb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);
