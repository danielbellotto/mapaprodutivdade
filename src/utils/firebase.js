import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCaklEwWtJ1KTD1ZxLsKGTQ0n1Qp2n6fyo",
  authDomain: "mapaprodutividade-dev-v2.firebaseapp.com",
  projectId: "mapaprodutividade-dev-v2",
  storageBucket: "mapaprodutividade-dev-v2.firebasestorage.app",
  messagingSenderId: "397094779919",
  appId: "1:397094779919:web:b1d5d60fbd5a5b4d2d377a"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa os serviços
export const auth = getAuth(app);
export const db = getFirestore(app);