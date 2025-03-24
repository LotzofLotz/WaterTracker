import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import LottieView from "lottie-react-native";
import { useState, useRef, useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Konfiguriere, wie Benachrichtigungen angezeigt werden
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Funktion zum Anfordern von Berechtigungen
async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2980b9",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

// Funktion zum Senden einer lokalen Benachrichtigung
async function sendGoalReachedNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Tagesziel erreicht! 🎉",
      body: "Herzlichen Glückwunsch! Du hast dein tägliches Wasserziel von 3 Litern erreicht.",
    },
    trigger: null, // Sofort senden
  });
}

async function scheduleDailyReminders() {
  // Lösche alle vorherigen Benachrichtigungen
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Erinnerungszeiten
  const reminderHours = [10, 12, 18, 22];

  for (const hour of reminderHours) {
    // Erstelle ein Date-Objekt für die nächste Benachrichtigung
    const now = new Date();
    const scheduleDate = new Date();
    scheduleDate.setHours(hour);
    scheduleDate.setMinutes(0);
    scheduleDate.setSeconds(0);
    scheduleDate.setMilliseconds(0);

    // Wenn die Zeit für heute bereits vorbei ist, plane für morgen
    if (scheduleDate <= now) {
      scheduleDate.setDate(scheduleDate.getDate() + 1);
    }

    const identifier = `water-reminder-${hour}`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Go get some water juice!! 💧",
        body: "Trink jetzt sofort ein Glas Wasser aminaheum!!!",
        data: { hourOfDay: hour },
      },
      trigger: scheduleDate,
      identifier,
    });

    console.log(
      `Benachrichtigung für ${scheduleDate.toLocaleString()} geplant`
    );
  }
}

// Vereinfachen wir es extrem - keine Animation, nur statische Darstellung

// Für die animierte Blase
const AnimatedBubble = () => {
  const bubbleY = useRef(new Animated.Value(0)).current;
  const bubbleX = useRef(new Animated.Value(150)).current;

  useEffect(() => {
    const animateBubble = () => {
      // Starte von unten
      bubbleY.setValue(0);

      // Wiggle-Animation für X-Position
      Animated.sequence([
        Animated.timing(bubbleX, {
          toValue: 200,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(bubbleX, {
          toValue: 100,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]).start();

      // Nach oben steigen
      Animated.timing(bubbleY, {
        toValue: -700, // Höhe des Containers
        duration: 6000,
        useNativeDriver: true,
        easing: Easing.linear,
      }).start(() => {
        // Wenn die Animation fertig ist, neu starten
        animateBubble();
      });
    };

    // Animation starten
    animateBubble();

    // Cleanup
    return () => {
      bubbleY.stopAnimation();
      bubbleX.stopAnimation();
    };
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.9)",
        bottom: 100,
        transform: [{ translateY: bubbleY }, { translateX: bubbleX }],
        zIndex: 1000,
        elevation: 10,
      }}
    />
  );
};

// GoalBubbleAnimation Komponente - mit Checkmark-Animation
const GoalBubbleAnimation = () => {
  // Animation werte für die Blase
  const bubbleScale = useRef(new Animated.Value(0.2)).current; // Starte klein
  const bubbleY = useRef(new Animated.Value(0)).current; // Starte bei 0 (Bottom-Position)
  const screenHeight = Dimensions.get("window").height;

  // State für das Anzeigen der Checkmark
  const [showCheckmark, setShowCheckmark] = useState(false);

  useEffect(() => {
    // Animation Sequenz
    Animated.parallel([
      // Wachse zur vollen Größe während des Aufstiegs
      Animated.timing(bubbleScale, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      // Bewege dich nach oben (negative Y-Werte = Bewegung nach oben)
      Animated.timing(bubbleY, {
        toValue: -screenHeight / 2, // Bewege zur Mitte des Screens (von unten)
        duration: 2000,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start(() => {
      // Wenn die Animation abgeschlossen ist, zeige die Checkmark
      setShowCheckmark(true);
    });
  }, []);

  return (
    <View style={styles.goalAnimationContainer} pointerEvents="none">
      <Animated.View
        style={[
          styles.successBubble,
          {
            transform: [{ scale: bubbleScale }, { translateY: bubbleY }],
            position: "absolute",
            bottom: 0, // Am unteren Rand des Containers starten
          },
        ]}
      >
        {/* Checkmark-Animation wird nur angezeigt, wenn die Blase ihre Position erreicht hat */}
        {showCheckmark && (
          <View style={styles.checkmarkContainer}>
            <LottieView
              source={require("./assets/checkmark.json")}
              autoPlay
              loop={false}
              style={styles.checkmarkAnimation}
            />
          </View>
        )}
      </Animated.View>
    </View>
  );
};

export default function App() {
  const [waterCount, setWaterCount] = useState(0);
  const [bubbles, setBubbles] = useState([]);
  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;
  const bubbleTimerRef = useRef(null);
  const nextBubbleId = useRef(1);
  const [showGoalAnimation, setShowGoalAnimation] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(false);

  // Initially position the water mostly off-screen
  // We'll start with just a small portion visible (30px)
  const initialPosition = screenHeight - 30;

  // How far to move up with each glass (in equal steps)
  const stepSize = (screenHeight - 30) / 10; // Leave 30px at top for UI elements

  // Animation value for vertical position
  const animatedPosition = useRef(new Animated.Value(initialPosition)).current;

  // Berechtigungen für Benachrichtigungen einholen, wenn die App startet
  useEffect(() => {
    async function setupNotifications() {
      const permission = await registerForPushNotificationsAsync();
      if (permission) {
        setNotificationPermission(true);
        // Plane die täglichen Erinnerungen
        await scheduleDailyReminders();
      }
    }

    setupNotifications();
  }, []);

  // Create a new bubble
  const createBubble = () => {
    // Only create bubbles if at least 2 glasses have been added
    if (waterCount < 2) return;

    const bubbleId = nextBubbleId.current++;
    const randomX = Math.random() * (screenWidth - 50) + 25; // Random X position

    // Die aktuelle Wasserhöhe berechnen (wieviel ist sichtbar)
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

  const addWater = () => {
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

    // Prüfe, ob das Ziel erreicht wurde
    if (newCount === 10) {
      // Zeige die Erfolgsanimation
      setShowGoalAnimation(true);
    }
  };

  const removeWater = () => {
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

    // Wenn der Wasserstand unter 10 fällt, verstecke die Goal-Animation
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
              source={require("./assets/lf20_lgqjxc2l.json.json")}
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

// Neue Bubble-Komponente für die dynamischen Blasen
const Bubble = ({ startPosition, waterHeight }) => {
  const bubbleY = useRef(new Animated.Value(0)).current;
  const bubbleX = useRef(new Animated.Value(startPosition)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Zufällige Größe und Geschwindigkeit für Vielfalt
  const size = useRef(Math.random() * 15 + 10).current; // 10-25px
  const speed = useRef(Math.random() * 2000 + 3000).current; // 3-5 Sekunden
  const wiggleStrength = useRef(Math.random() * 50 + 20).current;

  useEffect(() => {
    // X-Position Animation (Wiggle)
    Animated.sequence([
      Animated.timing(bubbleX, {
        toValue: startPosition - wiggleStrength,
        duration: 2000,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }),
      Animated.timing(bubbleX, {
        toValue: startPosition + wiggleStrength,
        duration: 2000,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }),
    ]).start();

    // Berechne die Distanz bis zur Wasseroberfläche
    const distanceToSurface = waterHeight - 30;

    // Y-Position Animation (Aufsteigen)
    Animated.timing(bubbleY, {
      toValue: -distanceToSurface,
      duration: speed,
      useNativeDriver: true,
      easing: Easing.linear,
    }).start();

    // Die Fade-Out-Animation soll früher beginnen
    // Berechne einen früheren Startpunkt - z.B. wenn die Blase 70% ihres Weges zurückgelegt hat
    const fadeDelay = speed * 0.7; // Starte das Ausblenden nach 70% der Aufstiegszeit

    Animated.timing(opacity, {
      toValue: 0,
      duration: 500,
      delay: fadeDelay,
      useNativeDriver: true,
    }).start();

    return () => {
      bubbleY.stopAnimation();
      bubbleX.stopAnimation();
      opacity.stopAnimation();
    };
  }, [waterHeight]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        bottom: 0,
        transform: [{ translateY: bubbleY }, { translateX: bubbleX }],
        opacity: opacity,
        zIndex: 1000,
        elevation: 10,
      }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  waterContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#ecf0f1",
  },
  coloredView: {
    width: "100%",
    height: Dimensions.get("window").height * 2, // Make sure it's tall enough
    position: "absolute",
    top: 0,
    backgroundColor: "#2980b9",
    overflow: "visible",
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
    bottom: 60,
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
  },
  buttonText: {
    bottom: 3,
    fontSize: 50,
    color: "white",
  },
  minusButton: {
    position: "absolute",
    bottom: 30,
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
  goalAnimationContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "flex-end", // Statt center - Elemente am unteren Rand ausrichten
    alignItems: "center",
    zIndex: 9999,
    pointerEvents: "none",
  },
  successBubble: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  checkmarkContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkAnimation: {
    width: 140,
    height: 140,
  },
});
