import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCtC1r4WWxaYRu-OsRONT5devhryQYRu3k",
  authDomain: "tui-coffee-e5da2.firebaseapp.com",
  databaseURL: "https://tui-coffee-e5da2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tui-coffee-e5da2",
  storageBucket: "tui-coffee-e5da2.firebasestorage.app",
  messagingSenderId: "462450409850",
  appId: "1:462450409850:web:c2a64e5dfee1c88563d6c3"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);