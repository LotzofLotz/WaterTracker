import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import firestore from "@react-native-firebase/firestore";
import {
  saveUserSettings,
  loadUserSettings,
} from "../services/firebaseService";

interface Settings {
  dailyGoal: number;
  glassSize: number;
  notifications: string[];
}

export default function SettingsScreen(): JSX.Element {
  const [settings, setSettings] = useState<Settings>({
    dailyGoal: 3000,
    glassSize: 300,
    notifications: ["10:00", "14:00", "18:00", "22:00"],
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async (): Promise<void> => {
    try {
      const savedSettings = await loadUserSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const saveSettings = async (): Promise<void> => {
    try {
      await saveUserSettings(settings);
      // Erfolgsmeldung anzeigen
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const updateDailyGoal = (value: string): void => {
    const numValue = parseInt(value) || 0;
    setSettings((prev) => ({ ...prev, dailyGoal: numValue }));
  };

  const updateGlassSize = (value: string): void => {
    const numValue = parseInt(value) || 0;
    setSettings((prev) => ({ ...prev, glassSize: numValue }));
  };

  const toggleNotification = (time: string): void => {
    setSettings((prev) => ({
      ...prev,
      notifications: prev.notifications.includes(time)
        ? prev.notifications.filter((t) => t !== time)
        : [...prev.notifications, time],
    }));
  };

  const renderTimeButton = (time: string): JSX.Element => {
    const isActive = settings.notifications.includes(time);
    return (
      <TouchableOpacity
        style={[styles.timeButton, isActive && styles.timeButtonActive]}
        onPress={() => toggleNotification(time)}
      >
        <Text
          style={[
            styles.timeButtonText,
            isActive && styles.timeButtonTextActive,
          ]}
        >
          {time}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Settings</Text>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily goal</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={settings.dailyGoal.toString()}
              onChangeText={updateDailyGoal}
              keyboardType="numeric"
            />
            <Text style={styles.unit}>ml</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Glass Size</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={settings.glassSize.toString()}
              onChangeText={updateGlassSize}
              keyboardType="numeric"
            />
            <Text style={styles.unit}>ml</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Erinnerungen</Text>
          <View style={styles.timeGrid}>
            {renderTimeButton("08:00")}
            {renderTimeButton("10:00")}
            {renderTimeButton("12:00")}
            {renderTimeButton("14:00")}
            {renderTimeButton("16:00")}
            {renderTimeButton("18:00")}
            {renderTimeButton("20:00")}
            {renderTimeButton("22:00")}
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ecf0f1",
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2980b9",
    marginBottom: 20,
    marginTop: 50,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#bdc3c7",
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    marginRight: 10,
  },
  unit: {
    fontSize: 16,
    color: "#7f8c8d",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  timeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#bdc3c7",
    margin: 5,
  },
  timeButtonActive: {
    backgroundColor: "#2980b9",
    borderColor: "#2980b9",
  },
  timeButtonText: {
    color: "#2c3e50",
  },
  timeButtonTextActive: {
    color: "white",
  },
  saveButton: {
    backgroundColor: "#2980b9",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
