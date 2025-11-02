import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MedicationReminder {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string; // HH:MM format
  days: number[]; // 0-6, Sunday to Saturday
  enabled: boolean;
  notificationId?: string;
}

export interface NotificationAction {
  type: 'taken' | 'snooze';
  medicationId: string;
  reminderTime: string;
}

class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private expoPushToken: string | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Request permissions
      await this.requestPermissions();

      // Get push token
      if (Device.isDevice) {
        this.expoPushToken = await this.registerForPushNotificationsAsync();
      }

      // Set up notification response listener
      this.setupNotificationResponseListener();

      this.isInitialized = true;
      console.log('NotificationService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NotificationService:', error);
      throw error;
    }
  }

  private async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      // Web notifications require different handling
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permissions not granted');
      return false;
    }

    return true;
  }

  private async registerForPushNotificationsAsync(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Must use physical device for Push Notifications');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      console.log('Expo push token:', token.data);
      return token.data;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  private setupNotificationResponseListener(): void {
    Notifications.addNotificationResponseReceivedListener(async (response) => {
      const { actionIdentifier, notification } = response;
      const { medicationId, reminderTime } = notification.request.content.data || {};

      if (!medicationId || !reminderTime) return;

      try {
        switch (actionIdentifier) {
          case 'taken':
            await this.handleMedicationTaken(medicationId, reminderTime);
            break;
          case 'snooze':
            await this.handleSnoozeReminder(medicationId, reminderTime);
            break;
          default:
            // Default tap - open app
            console.log('Notification tapped, opening app');
            break;
        }
      } catch (error) {
        console.error('Error handling notification response:', error);
      }
    });
  }

  async scheduleReminder(reminder: MedicationReminder): Promise<string | null> {
    try {
      if (!reminder.enabled) return null;

      // Cancel existing notification if it exists
      if (reminder.notificationId) {
        await this.cancelReminder(reminder.notificationId);
      }

      const [hours, minutes] = reminder.scheduledTime.split(':').map(Number);
      
      // Schedule for each enabled day
      const notificationIds: string[] = [];
      
      for (const dayOfWeek of reminder.days) {
        const trigger: Notifications.WeeklyTriggerInput = {
          weekday: dayOfWeek === 0 ? 1 : dayOfWeek + 1, // Convert to Expo's format (1-7, Monday-Sunday)
          hour: hours,
          minute: minutes,
          repeats: true,
        };

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '💊 Medicine Reminder',
            body: `Time to take ${reminder.medicationName} (${reminder.dosage})`,
            data: {
              medicationId: reminder.medicationId,
              reminderTime: reminder.scheduledTime,
              type: 'medicine_reminder',
            },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            categoryIdentifier: 'medicine_reminder',
          },
          trigger,
        });

        notificationIds.push(notificationId);
      }

      // Store the first notification ID as the primary one
      const primaryNotificationId = notificationIds[0];
      
      // Save reminder with notification ID
      await this.saveReminder({
        ...reminder,
        notificationId: primaryNotificationId,
      });

      return primaryNotificationId;
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
      return null;
    }
  }

  async cancelReminder(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel reminder:', error);
    }
  }

  async cancelAllReminders(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all reminders:', error);
    }
  }

  private async handleMedicationTaken(medicationId: string, reminderTime: string): Promise<void> {
    try {
      // Load current medications
      const medicationsData = await AsyncStorage.getItem('medications');
      if (!medicationsData) return;

      const medications = JSON.parse(medicationsData);
      const updatedMedications = medications.map((med: any) => {
        if (med.id === medicationId) {
          return {
            ...med,
            lastTaken: new Date().toISOString(),
            adherence: Math.min(100, med.adherence + 2), // Boost adherence
          };
        }
        return med;
      });

      await AsyncStorage.setItem('medications', JSON.stringify(updatedMedications));

      // Show confirmation notification
      await this.showLocalNotification(
        '✅ Dose Recorded',
        `${medications.find((m: any) => m.id === medicationId)?.name || 'Medication'} marked as taken`,
        { type: 'confirmation' }
      );

      console.log('Medication marked as taken:', medicationId);
    } catch (error) {
      console.error('Error handling medication taken:', error);
    }
  }

  private async handleSnoozeReminder(medicationId: string, reminderTime: string): Promise<void> {
    try {
      // Schedule a new notification in 15 minutes
      const snoozeMinutes = 15;
      const trigger: Notifications.TimeIntervalTriggerInput = {
        seconds: snoozeMinutes * 60,
        repeats: false,
      };

      // Get medication name for the notification
      const medicationsData = await AsyncStorage.getItem('medications');
      let medicationName = 'Your medication';
      
      if (medicationsData) {
        const medications = JSON.parse(medicationsData);
        const medication = medications.find((med: any) => med.id === medicationId);
        if (medication) {
          medicationName = `${medication.name} (${medication.dosage})`;
        }
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Snoozed Reminder',
          body: `Don't forget to take ${medicationName}`,
          data: {
            medicationId,
            reminderTime,
            type: 'snoozed_reminder',
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'medicine_reminder',
        },
        trigger,
      });

      // Show confirmation
      await this.showLocalNotification(
        '⏰ Reminder Snoozed',
        `We'll remind you again in ${snoozeMinutes} minutes`,
        { type: 'confirmation' }
      );

      console.log('Reminder snoozed for:', medicationId);
    } catch (error) {
      console.error('Error handling snooze reminder:', error);
    }
  }

  async showLocalNotification(
    title: string,
    body: string,
    data: any = {}
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Show immediately
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to show local notification:', error);
      throw error;
    }
  }

  async setupNotificationCategories(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Notifications.setNotificationCategoryAsync('medicine_reminder', [
          {
            identifier: 'taken',
            buttonTitle: '✅ Taken',
            options: {
              isDestructive: false,
              isAuthenticationRequired: false,
            },
          },
          {
            identifier: 'snooze',
            buttonTitle: '⏰ Snooze 15min',
            options: {
              isDestructive: false,
              isAuthenticationRequired: false,
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to setup notification categories:', error);
    }
  }

  private async saveReminder(reminder: MedicationReminder): Promise<void> {
    try {
      const existingReminders = await this.getReminders();
      const updatedReminders = existingReminders.filter(r => r.id !== reminder.id);
      updatedReminders.push(reminder);
      
      await AsyncStorage.setItem('medication_reminders', JSON.stringify(updatedReminders));
    } catch (error) {
      console.error('Failed to save reminder:', error);
    }
  }

  async getReminders(): Promise<MedicationReminder[]> {
    try {
      const remindersData = await AsyncStorage.getItem('medication_reminders');
      return remindersData ? JSON.parse(remindersData) : [];
    } catch (error) {
      console.error('Failed to get reminders:', error);
      return [];
    }
  }

  async deleteReminder(reminderId: string): Promise<void> {
    try {
      const reminders = await this.getReminders();
      const reminder = reminders.find(r => r.id === reminderId);
      
      if (reminder?.notificationId) {
        await this.cancelReminder(reminder.notificationId);
      }

      const updatedReminders = reminders.filter(r => r.id !== reminderId);
      await AsyncStorage.setItem('medication_reminders', JSON.stringify(updatedReminders));
    } catch (error) {
      console.error('Failed to delete reminder:', error);
    }
  }

  async testNotification(): Promise<void> {
    try {
      await this.showLocalNotification(
        '🧪 Test Notification',
        'This is a test notification to verify the service is working correctly.',
        { type: 'test' }
      );
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }

  getPushToken(): string | null {
    return this.expoPushToken;
  }

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Failed to get badge count:', error);
      return 0;
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Failed to set badge count:', error);
    }
  }

  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }
}

export default NotificationService.getInstance();