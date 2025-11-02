import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NotificationService, { MedicationReminder } from '@/services/NotificationService';

export interface NotificationHookResult {
  isInitialized: boolean;
  reminders: MedicationReminder[];
  scheduleReminder: (reminder: MedicationReminder) => Promise<string | null>;
  cancelReminder: (notificationId: string) => Promise<void>;
  testNotification: () => Promise<void>;
  refreshReminders: () => Promise<void>;
}

export function useNotifications(): NotificationHookResult {
  const [isInitialized, setIsInitialized] = useState(false);
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);

  useEffect(() => {
    initializeService();
    setupAppStateListener();
  }, []);

  const initializeService = async () => {
    try {
      await NotificationService.initialize();
      await NotificationService.setupNotificationCategories();
      await refreshReminders();
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  };

  const setupAppStateListener = () => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Clear badge when app becomes active
        NotificationService.clearBadge();
        refreshReminders();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  };

  const refreshReminders = async () => {
    try {
      const allReminders = await NotificationService.getReminders();
      setReminders(allReminders);
    } catch (error) {
      console.error('Failed to refresh reminders:', error);
    }
  };

  const scheduleReminder = async (reminder: MedicationReminder): Promise<string | null> => {
    try {
      const notificationId = await NotificationService.scheduleReminder(reminder);
      await refreshReminders();
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
      return null;
    }
  };

  const cancelReminder = async (notificationId: string): Promise<void> => {
    try {
      await NotificationService.cancelReminder(notificationId);
      await refreshReminders();
    } catch (error) {
      console.error('Failed to cancel reminder:', error);
    }
  };

  const testNotification = async (): Promise<void> => {
    try {
      await NotificationService.testNotification();
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  };

  return {
    isInitialized,
    reminders,
    scheduleReminder,
    cancelReminder,
    testNotification,
    refreshReminders,
  };
}