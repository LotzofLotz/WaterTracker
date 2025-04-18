import React from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from "react-native";
import LottieView from "lottie-react-native";
import { useState, useRef, useEffect } from "react";
import Bubble from "../components/Bubble";
import AnimatedBubble from "../components/AnimatedBubble";
import GoalBubbleAnimation from "../components/GoalBubbleAnimation";
import {
  registerForPushNotificationsAsync,
  scheduleDailyReminders,
  updateNotificationSchedule,
} from "../services/NotificationService";
import {
  loadUserSettings,
  Settings,
  subscribeToUserSettings,
  saveWaterAmount,
  loadTodayWaterAmount,
  printWaterLog,
  resetWaterLog,
} from "../services/firebaseService";

interface Bubble {
  id: number;
  x: number;
  waterHeight: number;
}

export default function HomeScreen(): JSX.Element {
  const [waterAmount, setWaterAmount] = useState<number>(0);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nextBubbleId = useRef<number>(1);
  const [showGoalAnimation, setShowGoalAnimation] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] =
    useState<boolean>(false);

  const [settings, setSettings] = useState<Settings>({
    dailyGoal: 3000, // Standardwerte
    glassSize: 300,
    notifications: ["10:00", "14:00", "18:00", "22:00"],
  });

  // Start the water completely off-screen at the bottom
  const initialPosition = screenHeight;
  // Define the top position (should be 0 for the very top)
  const topWaterPosition = 0; 
  // Calculate the total animation distance (should be the full screen height)
  const totalAnimationDistance = screenHeight - topWaterPosition; // This simplifies to just screenHeight

  // Animation value for vertical position
  const animatedPosition = useRef(new Animated.Value(initialPosition)).current;

  // Lade den initialen Wasserstand und animiere die Wasserhöhe
  useEffect(() => {
    const initializeWaterAmount = async () => {
      const amount = await loadTodayWaterAmount();
      setWaterAmount(amount);

      // Prüfe, ob das Ziel bereits erreicht ist
      // if (amount >= settings.dailyGoal) {
      //   setShowGoalAnimation(true);
      // }

      // Berechne die Position basierend auf dem geladenen Wasserstand
      // Progress is capped at 1 (100%)
      const progress = Math.min(amount / settings.dailyGoal, 1);
      // New position calculation: Start at initialPosition and move up based on progress
      // Ensure it reaches topWaterPosition (0) when progress is 1
      const newPosition = initialPosition - progress * totalAnimationDistance;

      // Animiere zur korrekten Position
      Animated.timing(animatedPosition, {
        toValue: newPosition,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }).start();
    };

    initializeWaterAmount();
  }, [settings.dailyGoal]);

  // Request permissions for notifications when the app starts
  useEffect(() => {
    async function setupNotifications() {
      const permission = await registerForPushNotificationsAsync();
      if (permission) {
        setNotificationPermission(true);
        await scheduleDailyReminders();
      }
    }

    setupNotifications();
  }, []);

  // useEffect(() => {
  //   checkWaterEntries();
  // }, []);

  //  useEffect(() => {
  //    cleanupUserData();
  //  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await loadUserSettings();
      if (savedSettings) {
        setSettings(savedSettings);
        console.log("Settings loaded:", savedSettings);
      }
    };

    loadSettings();

    // Echtzeit-Updates abonnieren
    const unsubscribe = subscribeToUserSettings(async (newSettings) => {
      setSettings(newSettings);
      console.log("Settings updated via listener:", newSettings);
      await updateNotificationSchedule(newSettings.notifications);
    });

    // Aufräumen beim Unmount
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    printWaterLog();
  }, []);

  // useEffect(() => {
  //   const reset = async () => {
  //     await resetWaterLog();
  //     // Optional: Zeige den neuen (leeren) WaterLog an
  //     await printWaterLog();
  //   };
  //   reset();
  // }, []);



  // Create a new bubble
  const createBubble = (): void => {
    // Only create bubbles if at least some water was added
    if (waterAmount < settings.glassSize * 2) return;

    const bubbleId = nextBubbleId.current++;
    const randomX = Math.random() * (screenWidth - 50) + 25; // Random X position

    // Berechne den Fortschritt (0-1) - gleiche Berechnung wie bei der Animation
    const progress = Math.min(waterAmount / settings.dailyGoal, 1);

    // Die Wasserhöhe ist proportional zum Fortschritt
    const waterHeight = progress * (screenHeight - 80);

    setBubbles((prevBubbles) => [
      ...prevBubbles,
      {
        id: bubbleId,
        x: randomX,
        waterHeight: waterHeight,
      },
    ]);

    // Remove bubble after it completes
    setTimeout(() => {
      setBubbles((prevBubbles) =>
        prevBubbles.filter((bubble) => bubble.id !== bubbleId)
      );
    }, 8500);
  };

  // Start/stop bubble timer based on water count
  useEffect(() => {
    // Clear any existing timer
    if (bubbleTimerRef.current) {
      clearInterval(bubbleTimerRef.current);
      bubbleTimerRef.current = null;
    }
    if(waterAmount >= settings.dailyGoal){
      setShowGoalAnimation(true);
    }

    if (waterAmount >= 1) {
      bubbleTimerRef.current = setInterval(createBubble, 1000);
      // Create first bubble immediately
      createBubble();
    }

    // Cleanup on unmount
    return () => {
      if (bubbleTimerRef.current) {
        clearInterval(bubbleTimerRef.current);
      }
    };
  }, [waterAmount]);

  const addWater = async (): Promise<void> => {
    const newAmount = waterAmount + settings.glassSize;
    setWaterAmount(newAmount);

    // Berechne den Fortschritt (0-1)
    const progress = Math.min(newAmount / settings.dailyGoal, 1);

    // Position berechnen - Start at initialPosition and move up based on progress
    // Ensure it reaches topWaterPosition (0) when progress is 1
    const newPosition = initialPosition - progress * totalAnimationDistance;

    Animated.timing(animatedPosition, {
      toValue: newPosition,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease),
    }).start();

    // Speichere den neuen Wasserstand in Firebase
    await saveWaterAmount(newAmount);

    // Ziel-Check basierend auf Wassermenge
    // if (newAmount >= settings.dailyGoal) {
    //   setShowGoalAnimation(true);
    // }
  };

  const removeWater = async (): Promise<void> => {
    if (waterAmount <= 0) return;

    const newAmount = Math.max(waterAmount - settings.glassSize, 0);
    setWaterAmount(newAmount);

    // Berechne den Fortschritt (0-1)
    const progress = newAmount / settings.dailyGoal;

    // Position berechnen - Start at initialPosition and move up based on progress
    // Ensure it corresponds to the current progress
    const newPosition = initialPosition - progress * totalAnimationDistance;

    Animated.timing(animatedPosition, {
      toValue: newPosition,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease),
    }).start();


    if (newAmount < settings.dailyGoal) {
      setShowGoalAnimation(false);
    }

    // Speichere den neuen Wasserstand in Firebase
    await saveWaterAmount(newAmount);

     
  };

  return (
    <View style={styles.container}>
      <View style={styles.waterContainer}>
        {/* Dynamisch generierte Blasen */}
        {bubbles.map((bubble) => (
          <Bubble
            key={bubble.id}
            startPosition={bubble.x}
            waterHeight={bubble.waterHeight}
          />
        ))}

        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {waterAmount.toFixed(0)} ml / {settings.dailyGoal} ml
          </Text>
        </View>

        <Animated.View
          style={[
            styles.coloredView,
            {
              transform: [{ translateY: animatedPosition }],
            },
          ]}
        >
          {/* Wave animation */}
          <View style={styles.waveWrapper}>
            <LottieView
              source={require("../assets/lf20_lgqjxc2l.json.json")}
              autoPlay
              loop
              style={styles.animation}
            />
          </View>
        </Animated.View>
      </View>

      <TouchableOpacity style={styles.floatingButton} onPress={addWater}>
        <Text style={styles.buttonText}>+</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.minusButton} onPress={removeWater}>
        <Text style={styles.minusButtonText}>-</Text>
      </TouchableOpacity>

      {/* Nur die Bubble-Animation, wenn das Ziel erreicht ist */}
      {showGoalAnimation && (
        // <GoalBubbleAnimation onComplete={() => setShowGoalAnimation(false)} />
        <GoalBubbleAnimation onComplete={() => console.log("complete")} />
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  waterContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#ecf0f1",
    paddingBottom: 50, // Add padding for the tab bar
  },
  coloredView: {
    width: "100%",
    height: Dimensions.get("window").height * 2,
    position: "absolute",
    top: 0,
    backgroundColor: "#2980b9",
    overflow: "visible",
    transform: [{ translateY: Dimensions.get("window").height - 80 }], // Initial position above tab bar
  },
  waveWrapper: {
    position: "absolute",
    top: -50, // Move the wave up to hide the straight edge of the water
    left: 0,
    right: 0,
    height: 100,
    zIndex: 2,
  },
  animation: {
    width: "100%",
    height: 100,
  },
  progressInfo: {
    position: "absolute",
    top: 50,
    width: "100%",
    alignItems: "center",
    zIndex: 10,
  },
  progressText: {
    fontSize: 20,
    color: "#2c3e50",
    fontWeight: "bold",
  },
  floatingButton: {
    position: "absolute",
    bottom: 80, // Increased to be above tab bar
    left: "50%",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#87CEFA",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 20,
    transform: [{ translateX: -45 }], // Center horizontally
  },
  buttonText: {
    bottom: 3,
    fontSize: 50,
    color: "white",
  },
  minusButton: {
    position: "absolute",
    bottom: 50, // Increased to be above tab bar
    left: 30,
    width: 60,
    height: 60,
    borderRadius: 35,
    backgroundColor: "#87CEFA",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 20,
  },
  minusButtonText: {
    bottom: 3,
    fontSize: 40,
    color: "white",
  },
  bubble: {
    position: "absolute",
    backgroundColor: "#ffffff", // Pure white for maximum visibility
    bottom: 50, // Start a bit above bottom for visibility
    zIndex: 10, // Ensure it's above everything
  },
});
