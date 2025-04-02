import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { useFocusEffect } from "@react-navigation/native";
import {
  loadUserSettings,
  getWaterEntriesForLastDays,
  Settings,
} from "../services/firebaseService";

// Interface für die Datenstruktur aus firebaseService
interface DayWaterData {
  date: string;
  waterAmount: number;
}

export default function StatsScreen(): JSX.Element {
  const [waterData, setWaterData] = useState<DayWaterData[]>([]);
  const [dailyGoal, setDailyGoal] = useState<number>(2500); // Still in ml
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // useFocusEffect hook verwenden, um Daten bei Fokus zu laden
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        console.log("StatsScreen focused, loading data...");
        setIsLoading(true);
        try {
          // Lade Benutzereinstellungen (Tagesziel)
          const settings: Settings = await loadUserSettings();
          setDailyGoal(settings.dailyGoal);

          // Lade Wasserdaten der letzten 7 Tage
          const entries: DayWaterData[] = await getWaterEntriesForLastDays(7);
          console.log("entries", entries);
          setWaterData(entries);
        } catch (error) {
          console.error("Error loading stats data:", error);
        } finally {
          setIsLoading(false);
        }
      };

      loadData();

      // Optional: Cleanup-Funktion, falls benötigt (hier nicht)
      // return () => {
      //   console.log("StatsScreen unfocused");
      // };
    }, []) // Leeres Abhängigkeitsarray für useCallback
  );

  // Convert ml to L for chart and calculations
  const dailyGoalL = dailyGoal / 1000;

  // Format data for gifted-charts BarChart
  const barData = waterData.map((entry) => ({
    value: entry.waterAmount / 1000, // Convert ml to L
    label: `${entry.date.slice(-2)}.${entry.date.slice(5, 7)}`, // Format as DD.MM
    frontColor: "#4ABFF4", // Default blue color
    // You can add conditional coloring based on values, example:
    // frontColor: entry.waterAmount >= dailyGoal ? '#4ADDBA' : '#4ABFF4',
  }));

  // Use a hardcoded reference line at exactly 3L (regardless of dailyGoal)
  // This makes it easier to verify the positioning is correct
  const referenceLine = 3.0;

  // Calculate stats using Liters
  const calculateStats = () => {
    if (waterData.length === 0) {
      return {
        average: "N/A",
        highest: "N/A",
        lowest: "N/A",
        goalMetDays: "N/A",
      };
    }

    const amountsL = waterData.map((entry) => entry.waterAmount / 1000);
    const averageRaw =
      amountsL.reduce((sum, a) => sum + a, 0) / amountsL.length;
    const highestRaw = Math.max(...amountsL);
    const amountsAboveZeroL = amountsL.filter((a) => a > 0);
    const lowestRaw =
      amountsAboveZeroL.length > 0 ? Math.min(...amountsAboveZeroL) : 0;
    const goalMetDays = waterData.filter(
      (entry) => entry.waterAmount >= dailyGoal
    ).length;

    // Format numbers after calculation
    return {
      average: `${averageRaw.toFixed(1)} L`,
      highest: `${highestRaw.toFixed(1)} L`,
      lowest: lowestRaw > 0 ? `${lowestRaw.toFixed(1)} L` : "0 L",
      goalMetDays: `${goalMetDays} of ${waterData.length} days`,
    };
  };

  const stats = calculateStats();

  // Find max value for chart scale (in Liters)
  const maxValue = Math.max(
    ...waterData.map((entry) => entry.waterAmount / 1000),
    dailyGoalL,
    4 // Ensure at least 4L scale for readability
  );

  // Round up to nearest integer for clean scale
  const chartMaxValue = Math.ceil(maxValue);

  // Calculate number of sections for y-axis
  const noOfSections = chartMaxValue > 5 ? 5 : chartMaxValue;

  const screenWidth = Dimensions.get("window").width;

  // Custom function to render the goal line directly
  const renderGoalLine = () => {
    // We'll use this approach instead of trying to calculate positions
    // Based on the chart height and the specified reference value
    return (
      <View
        style={{
          position: "absolute",
          backgroundColor: "red",
          height: 1.5,
          left: 40,
          right: 20,
          // Adjusted calculation with offset to position exactly at 3.0
          top: `${(1 - referenceLine / chartMaxValue) * 75 + 3}%`,
          opacity: 0.8,
          zIndex: 999,
        }}
      />
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Water Statistics</Text>
      <Text style={styles.subtitle}>Last 7 Days</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#0077b6" style={styles.loader} />
      ) : barData.length > 0 ? (
        <View style={styles.chartWrapper}>
          <Text style={styles.chartTitle}>Daily Consumption (L)</Text>

          <View style={styles.chartContainer}>
            <View style={{ position: "relative", marginTop: 10 }}>
              <BarChart
                data={barData}
                width={screenWidth - 100}
                height={220}
                barWidth={25}
                spacing={screenWidth > 400 ? 18 : 12}
                noOfSections={noOfSections}
                maxValue={chartMaxValue}
                yAxisThickness={1}
                xAxisThickness={1}
                yAxisTextStyle={{ color: "black" }}
                yAxisLabelSuffix=" L"
                showYAxisIndices
                showFractionalValues
                //isAnimated
              />

              {/* Add a hard-coded line at exactly y=3.0 */}
              <View
                style={{
                  position: "absolute",
                  left: 45,
                  right: 15,
                  borderColor: "red",
                  borderWidth: 1.5,
                  borderStyle: "solid",
                  // Adjusted position to align with the chart's 3.0L mark
                  top: 68,
                  zIndex: 99,
                }}
              />
            </View>
          </View>

          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Summary</Text>
            <View style={styles.statRow}>
              <Text>Average:</Text>
              <Text>{stats.average}</Text>
            </View>
            <View style={styles.statRow}>
              <Text>Highest:</Text>
              <Text>{stats.highest}</Text>
            </View>
            <View style={styles.statRow}>
              <Text>Lowest (&gt;0):</Text>
              <Text>{stats.lowest}</Text>
            </View>
            <View style={styles.statRow}>
              <Text>Goal Achieved:</Text>
              <Text>{stats.goalMetDays}</Text>
            </View>
          </View>
        </View>
      ) : (
        <Text style={styles.noDataText}>
          No data available for the last 7 days.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    marginTop: "7%",
    backgroundColor: "#f5f5f5",
  },
  loader: {
    marginTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  chartWrapper: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  chartContainer: {
    position: "relative",
    marginTop: 10,
    marginHorizontal: -10, // Compensate for internal padding of the chart
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
    color: "#444",
  },
  goalLineLabel: {
    position: "absolute",
    right: 15,
    top: 5,
    fontSize: 10,
    color: "red",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingHorizontal: 3,
  },
  statsContainer: {
    marginTop: 25,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  noDataText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#666",
  },
});
