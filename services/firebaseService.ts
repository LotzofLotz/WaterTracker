// services/firebaseService.ts
import firebaseApp from "../firebaseConfig";
import firestore from "@react-native-firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Benutzer-Collection
const usersCollection = firestore().collection("users");

// Settings-Typ-Definition
export interface Settings {
  dailyGoal: number;
  glassSize: number;
  notifications: string[];
}

// Interface für Tageswasserdaten
interface DayWaterData {
  date: string;
  waterAmount: number;
}

// Gerätespezifische ID abrufen oder erstellen
const getUserId = async () => {
  let userId = await AsyncStorage.getItem("user_id");
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await AsyncStorage.setItem("user_id", userId);
  }
  return userId;
};

// Einstellungen speichern
export const saveUserSettings = async (settings: Settings) => {
  try {
    const userId = await getUserId();
    await usersCollection.doc(userId).set(
      {
        settings: settings,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log("Einstellungen erfolgreich gespeichert");
    return true;
  } catch (error) {
    console.error("Fehler beim Speichern der Einstellungen:", error);
    return false;
  }
};

// Initialisiert oder aktualisiert den Wassereintrag für heute
export const saveWaterAmount = async (amount: number): Promise<boolean> => {
  try {
    const userId = await getUserId();
    const today = new Date().toISOString().split("T")[0];

    await firestore()
      .collection("users")
      .doc(userId)
      .collection("waterLog")
      .doc(today)
      .set({
        date: today,
        waterAmount: amount,
      });

    console.log(`Wassermenge ${amount}ml für ${today} gespeichert`);
    return true;
  } catch (error) {
    console.error("Fehler beim Speichern der Wassermenge:", error);
    return false;
  }
};

// Lädt die Wassermenge für heute
export const loadTodayWaterAmount = async (): Promise<number> => {
  try {
    const userId = await getUserId();
    const today = new Date().toISOString().split("T")[0];

    const dayDoc = await firestore()
      .collection("users")
      .doc(userId)
      .collection("waterLog")
      .doc(today)
      .get();

    if (dayDoc.exists) {
      return dayDoc.data()?.waterAmount || 0;
    } else {
      // Wenn noch kein Eintrag existiert, erstelle einen mit 0
      await saveWaterAmount(0);
      return 0;
    }
  } catch (error) {
    console.error("Fehler beim Laden der Wassermenge:", error);
    return 0;
  }
};

// Einstellungen laden
export const loadUserSettings = async (): Promise<Settings> => {
  try {
    const userId = await getUserId();
    const doc = await usersCollection.doc(userId).get();

    if (doc.exists && doc.data()?.settings) {
      return doc.data()?.settings;
    }
    // Standardeinstellungen
    return {
      dailyGoal: 3000,
      glassSize: 300,
      notifications: ["10:00", "14:00", "18:00", "22:00"],
    };
  } catch (error) {
    console.error("Fehler beim Laden der Einstellungen:", error);
    return {
      dailyGoal: 3000,
      glassSize: 300,
      notifications: ["10:00", "14:00", "18:00", "22:00"],
    };
  }
};

// Settings Subscription
export const subscribeToUserSettings = (
  callback: (settings: Settings) => void
) => {
  const unsub = async () => {
    const userId = await getUserId();
    return firestore()
      .collection("users")
      .doc(userId)
      .onSnapshot((doc) => {
        if (doc.exists && doc.data()?.settings) {
          callback(doc.data()?.settings as Settings);
        } else {
          callback({
            dailyGoal: 3000,
            glassSize: 300,
            notifications: ["10:00", "14:00", "18:00", "22:00"],
          });
        }
      });
  };

  let unsubscribe: (() => void) | null = null;
  unsub().then((unsubFn) => {
    unsubscribe = unsubFn;
  });

  return () => {
    if (unsubscribe) unsubscribe();
  };
};

// Funktion zum Anzeigen aller WaterLog Einträge
export const printWaterLog = async () => {
  try {
    const userId = await getUserId();
    const waterLogSnapshot = await firestore()
      .collection("users")
      .doc(userId)
      .collection("waterLog")
      .get();

    console.log("\n=== WaterLog Overview ===");
    console.log(`Number of entries: ${waterLogSnapshot.size}`);

    waterLogSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`\nDate: ${data.date}`);
      console.log(`WaterAmount: ${data.waterAmount}ml`);
    });

    console.log("\n=== End WaterLog ===");
  } catch (error) {
    console.error("Error loading WaterLog:", error);
  }
};

// Funktion zum kompletten Reset des WaterLogs
export const resetWaterLog = async (): Promise<boolean> => {
  try {
    const userId = await getUserId();
    const waterLogRef = firestore()
      .collection("users")
      .doc(userId)
      .collection("waterLog");

    // Hole alle Dokumente
    const snapshot = await waterLogRef.get();

    // Wenn keine Dokumente existieren, sind wir fertig
    if (snapshot.empty) {
      console.log("WaterLog ist bereits leer");
      return true;
    }

    // Batch-Operation für effizientes Löschen
    const batch = firestore().batch();
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Führe die Batch-Operation aus
    await batch.commit();
    console.log(`WaterLog zurückgesetzt. ${snapshot.size} Einträge gelöscht.`);

    // Erstelle einen neuen Eintrag für heute mit 0ml
    const today = new Date().toISOString().split("T")[0];
    await saveWaterAmount(0);
    console.log(`Neuer Eintrag für heute (${today}) mit 0ml erstellt.`);

    return true;
  } catch (error) {
    console.error("Fehler beim Zurücksetzen des WaterLogs:", error);
    return false;
  }
};
