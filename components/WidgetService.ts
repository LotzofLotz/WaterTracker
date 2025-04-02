import { NativeModules } from "react-native";
const { AndroidWidget } = NativeModules;

export const updateWidget = async (waterAmount: number, dailyGoal: number) => {
  try {
    await AndroidWidget.updateWidget({
      waterAmount: waterAmount,
      dailyGoal: dailyGoal,
      text: `${waterAmount}/${dailyGoal} ml`,
    });
  } catch (error) {
    console.error("Error updating widget:", error);
  }
};
