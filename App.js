import React from "react";
import { StyleSheet, Dimensions } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import HomeScreen from "./screens/HomeScreen";
import StatsScreen from "./screens/StatsScreen";
import SettingsScreen from "./screens/SettingsScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === "Home") {
              iconName = focused ? "water" : "water-outline";
            } else if (route.name === "Statistiken") {
              iconName = focused ? "stats-chart" : "stats-chart-outline";
            } else if (route.name === "Einstellungen") {
              iconName = focused ? "settings" : "settings-outline";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#2980b9",
          tabBarInactiveTintColor: "gray",
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Statistiken" component={StatsScreen} />
        <Tab.Screen name="Einstellungen" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

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
});
