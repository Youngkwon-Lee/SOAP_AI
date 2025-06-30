// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyAXZKivR30wveUw7YI-hy2SebNAqB5LBTU",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:demo",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-DEMO"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app);
const analytics = getAnalytics(app);

// 개발 환경에서 에뮬레이터 연결 (임시로 비활성화)
if (false && process.env.NODE_ENV === 'development') {
  try {
    // Firestore 에뮬레이터 연결 (포트 8080)
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('🔗 Firebase Firestore 에뮬레이터에 연결되었습니다 (localhost:8080)');
    
    // Auth 에뮬레이터 연결 (포트 9099)
    connectAuthEmulator(auth, 'http://localhost:9099');
    console.log('🔗 Firebase Auth 에뮬레이터에 연결되었습니다 (localhost:9099)');
    
    // Functions 에뮬레이터 연결 (포트 5002)
    connectFunctionsEmulator(functions, 'localhost', 5002);
    console.log('🔗 Firebase Functions 에뮬레이터에 연결되었습니다 (localhost:5002)');
    
    // Storage 에뮬레이터 연결 (포트 9199)
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('🔗 Firebase Storage 에뮬레이터에 연결되었습니다 (localhost:9199)');
  } catch (error) {
    console.warn('에뮬레이터 연결 중 오류 (이미 연결되었을 수 있습니다):', error);
  }
}

// 에뮬레이터 없이 실제 Firebase 서비스 사용
console.log('🔥 Firebase 프로덕션 모드로 실행 중...');

export { db, auth, storage, functions, analytics }; 