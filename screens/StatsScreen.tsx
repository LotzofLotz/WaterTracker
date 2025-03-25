import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function StatsScreen(): JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Statistiken</Text>
      <Text style={styles.subtitle}>Bald verfügbar...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ecf0f1",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2980b9",
  },
  subtitle: {
    fontSize: 16,
    color: "#7f8c8d",
  },
});
