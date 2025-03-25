import React, { useRef, useEffect } from "react";
import { Animated, Easing } from "react-native";

const AnimatedBubble: React.FC = () => {
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

export default AnimatedBubble;
