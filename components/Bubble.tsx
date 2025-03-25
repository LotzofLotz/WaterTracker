import React, { useRef, useEffect } from "react";
import { Animated, Easing } from "react-native";

interface BubbleProps {
  startPosition: number;
  waterHeight: number;
}

const Bubble: React.FC<BubbleProps> = ({ startPosition, waterHeight }) => {
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
  }, [waterHeight, startPosition, wiggleStrength, speed]);

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

export default Bubble;
