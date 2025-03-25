import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

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
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2980b9",
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

export async function scheduleDailyReminders(): Promise<void> {
  // Delete all previous notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Reminder times
  const reminderHours: number[] = [10, 12, 18, 22];

  for (const hour of reminderHours) {
    // Create a Date object for the next notification
    const now = new Date();
    const scheduleDate = new Date();
    scheduleDate.setHours(hour);
    scheduleDate.setMinutes(0);
    scheduleDate.setSeconds(0);
    scheduleDate.setMilliseconds(0);

    // If the time for today has already passed, schedule for tomorrow
    if (scheduleDate <= now) {
      scheduleDate.setDate(scheduleDate.getDate() + 1);
    }

    const identifier = `water-reminder-${hour}`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Go get some water juice!! 💧",
        body: "Trink jetzt sofort ein Glas Wasser aminaheum!!!",
        data: { hourOfDay: hour },
      },
      trigger: {
        channelId: "default",
        seconds: 86400,
      },
      identifier,
    });

    console.log(
      `Benachrichtigung für ${scheduleDate.toLocaleString()} geplant`
    );
  }
}
