import { initializeApp } from "@react-native-firebase/app";

// Firebase wird automatisch mit der google-services.json konfiguriert
// @ts-ignore - Configuration comes from google-services.json
const firebaseApp = initializeApp();

export default firebaseApp;
