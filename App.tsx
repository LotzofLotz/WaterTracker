import React, { useEffect, useState } from "react";
import { StyleSheet, Keyboard, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import HomeScreen from "./screens/HomeScreen";
import StatsScreen from "./screens/StatsScreen";
import SettingsScreen from "./screens/SettingsScreen";

type RootTabParamList = {
  Home: undefined;
  Statistiken: undefined;
  Einstellungen: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function App(): JSX.Element {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator
        id={undefined}
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === "Home") {
              iconName = focused ? "water" : "water-outline";
            } else if (route.name === "Statistiken") {
              iconName = focused ? "stats-chart" : "stats-chart-outline";
            } else if (route.name === "Einstellungen") {
              iconName = focused ? "settings" : "settings-outline";
            } else {
              iconName = "water";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#ffffff",
          tabBarInactiveTintColor: "#d0d0d0",
          headerShown: false,
          tabBarStyle: {
            display: isKeyboardVisible ? "none" : "flex",
            backgroundColor: "#2980b9",
            borderTopWidth: 0,
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
          },
        })}
      >
        <Tab.Screen name="Statistiken" component={StatsScreen} />
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Einstellungen" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
