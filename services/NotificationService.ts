import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { SchedulableTriggerInputTypes } from "expo-notifications";

// Configure how notifications are displayed
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Function to request permissions
export async function registerForPushNotificationsAsync(): Promise<boolean> {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

// Hilfsfunktion um eine einzelne Notification zu schedulen
async function scheduleNotification(timeStr: string): Promise<string | null> {
  try {
    const [hours, minutes] = timeStr.split(":").map(Number);

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Go get some water juice! 💧",
        body: "Trink jetzt sofort ein Glas Wasser aminaheum!",
        sound: true,
      },
      trigger: {
        hour: hours,
        minute: minutes,
        type: SchedulableTriggerInputTypes.DAILY,
      },
    });

    console.log(`Notification scheduled for ${timeStr}, ID: ${identifier}`);
    return identifier;
  } catch (error) {
    console.error(`Error scheduling notification for ${timeStr}:`, error);
    return null;
  }
}

// Hauptfunktion zum Verwalten der Notifications basierend auf Settings
export async function updateNotificationSchedule(
  enabledTimes: string[]
): Promise<boolean> {
  try {
    // Hole alle aktuell geplanten Notifications
    const currentNotifications =
      await Notifications.getAllScheduledNotificationsAsync();

    // Erstelle Map von Zeiten zu Notification IDs
    const timeToIdMap = new Map(
      currentNotifications.map((notification) => {
        const trigger = notification.trigger as any;
        const timeStr = `${trigger.hour
          .toString()
          .padStart(2, "0")}:${trigger.minute.toString().padStart(2, "0")}`;
        return [timeStr, notification.identifier];
      })
    );

    // Cancelle Notifications die nicht mehr in enabledTimes sind
    for (const [time, id] of timeToIdMap.entries()) {
      if (!enabledTimes.includes(time)) {
        await Notifications.cancelScheduledNotificationAsync(id);
        console.log(`Cancelled notification for ${time}`);
      }
    }

    // Schedule neue Notifications für neue Zeiten
    for (const time of enabledTimes) {
      if (!timeToIdMap.has(time)) {
        await scheduleNotification(time);
      }
    }

    // Log final schedule
    const finalNotifications =
      await Notifications.getAllScheduledNotificationsAsync();
    console.log(
      `Updated notification schedule. ${finalNotifications.length} notifications active`
    );

    return true;
  } catch (error) {
    console.error("Error updating notification schedule:", error);
    return false;
  }
}

// Die ursprüngliche scheduleDailyReminders Funktion können wir jetzt durch einen Aufruf von updateNotificationSchedule ersetzen
export async function scheduleDailyReminders(): Promise<boolean> {
  const defaultTimes = ["10:00", "14:00", "18:00", "22:00"];
  return updateNotificationSchedule(defaultTimes);
}
