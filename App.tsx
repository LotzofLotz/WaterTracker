import React from "react";
import { StyleSheet } from "react-native";
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
          tabBarActiveTintColor: "#2980b9",
          tabBarInactiveTintColor: "gray",
          headerShown: false,
        })}
      >
        <Tab.Screen name="Statistiken" component={StatsScreen} />
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Einstellungen" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
