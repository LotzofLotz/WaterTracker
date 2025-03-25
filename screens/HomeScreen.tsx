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
} from "../services/NotificationService";

interface Bubble {
  id: number;
  x: number;
  waterHeight: number;
}

export default function HomeScreen(): JSX.Element {
  const [waterCount, setWaterCount] = useState<number>(0);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nextBubbleId = useRef<number>(1);
  const [showGoalAnimation, setShowGoalAnimation] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] =
    useState<boolean>(false);

  // Initially position the water mostly off-screen
  // We'll start with just a small portion visible (30px)
  const initialPosition = screenHeight - 80;

  // How far to move up with each glass (in equal steps)
  const stepSize = (screenHeight - 80) / 10; // Leave 80px at top for UI elements

  // Animation value for vertical position
  const animatedPosition = useRef(new Animated.Value(initialPosition)).current;

  // Request permissions for notifications when the app starts
  useEffect(() => {
    async function setupNotifications() {
      const permission = await registerForPushNotificationsAsync();
      if (permission) {
        setNotificationPermission(true);
        // Schedule daily reminders
        await scheduleDailyReminders();
      }
    }

    setupNotifications();
  }, []);

  // Create a new bubble
  const createBubble = (): void => {
    // Only create bubbles if at least 2 glasses have been added
    if (waterCount < 2) return;

    const bubbleId = nextBubbleId.current++;
    const randomX = Math.random() * (screenWidth - 50) + 25; // Random X position

    // Calculate the current water height (how much is visible)
    const currentWaterHeight = Math.min(waterCount * stepSize, screenHeight);

    setBubbles((prevBubbles) => [
      ...prevBubbles,
      {
        id: bubbleId,
        x: randomX,
        waterHeight: currentWaterHeight,
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

    // Start timer if enough water
    if (waterCount >= 1) {
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
  }, [waterCount]);

  const addWater = (): void => {
    const newCount = waterCount + 1;
    setWaterCount(newCount);

    // Calculate new position, ensuring we don't go above the top limit
    const newPosition = Math.max(initialPosition - newCount * stepSize, 0);

    Animated.timing(animatedPosition, {
      toValue: newPosition,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease),
    }).start();

    // Check if goal is reached
    if (newCount === 10) {
      // Show the success animation
      setShowGoalAnimation(true);
    }
  };

  const removeWater = (): void => {
    if (waterCount <= 0) return; // Don't go below zero

    const newCount = waterCount - 1;
    setWaterCount(newCount);

    // Calculate new position
    const newPosition = initialPosition - newCount * stepSize;

    Animated.timing(animatedPosition, {
      toValue: newPosition,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease),
    }).start();

    // If water level drops below 10, hide the goal animation
    if (newCount < 10 && showGoalAnimation) {
      setShowGoalAnimation(false);
    }
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
            {(waterCount * 300).toFixed(0)} ml / 3000 ml
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
      {showGoalAnimation && <GoalBubbleAnimation />}

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
