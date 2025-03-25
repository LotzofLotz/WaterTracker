import React, { useRef, useState, useEffect } from "react";
import { View, Animated, Easing, Dimensions, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";

const GoalBubbleAnimation: React.FC = () => {
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
              source={require("../assets/checkmark.json")}
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

const styles = StyleSheet.create({
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

export default GoalBubbleAnimation;
