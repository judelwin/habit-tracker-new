







// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBED8LxzGayuWiXxo7F9oTLQEBpC4TfWbI",
  authDomain: "habit-tracker-new-ac7e8.firebaseapp.com",
  projectId: "habit-tracker-new-ac7e8",
  storageBucket: "habit-tracker-new-ac7e8.appspot.com",
  messagingSenderId: "579663043326",
  appId: "1:579663043326:web:baf1b8ef5ab1edb17de3af"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
const db = getFirestore(app)

const auth = getAuth(app)
export {app, db, auth} //deleted analytics