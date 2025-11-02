import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { Bell, Plus, Trash2, Clock, Calendar } from 'lucide-react-native';
import NotificationService, { MedicationReminder } from '@/services/NotificationService';

interface Props {
  medicationId: string;
  medicationName: string;
  dosage: string;
  onClose: () => void;
}

export default function NotificationSetup({ medicationId, medicationName, dosage, onClose }: Props) {
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReminders();
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      await NotificationService.initialize();
      await NotificationService.setupNotificationCategories();
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      Alert.alert(
        'Notification Setup Failed',
        'Unable to set up notifications. Please check your device settings and try again.'
      );
    }
  };

  const loadReminders = async () => {
    try {
      const allReminders = await NotificationService.getReminders();
      const medicationReminders = allReminders.filter(r => r.medicationId === medicationId);
      setReminders(medicationReminders);
    } catch (error) {
      console.error('Failed to load reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const createReminder = () => {
    const newReminder: MedicationReminder = {
      id: Date.now().toString(),
      medicationId,
      medicationName,
      dosage,
      scheduledTime: '09:00',
      days: [1, 2, 3, 4, 5], // Monday to Friday
      enabled: true,
    };

    setReminders([...reminders, newReminder]);
  };

  const updateReminder = async (updatedReminder: MedicationReminder) => {
    try {
      const notificationId = await NotificationService.scheduleReminder(updatedReminder);
      
      const updatedReminders = reminders.map(r =>
        r.id === updatedReminder.id
          ? { ...updatedReminder, notificationId: notificationId || undefined }
          : r
      );
      
      setReminders(updatedReminders);
    } catch (error) {
      console.error('Failed to update reminder:', error);
      Alert.alert('Error', 'Failed to update reminder. Please try again.');
    }
  };

  const deleteReminder = async (reminderId: string) => {
    try {
      await NotificationService.deleteReminder(reminderId);
      setReminders(reminders.filter(r => r.id !== reminderId));
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      Alert.alert('Error', 'Failed to delete reminder. Please try again.');
    }
  };

  const toggleReminderEnabled = async (reminder: MedicationReminder) => {
    const updatedReminder = { ...reminder, enabled: !reminder.enabled };
    await updateReminder(updatedReminder);
  };

  const updateReminderTime = (reminder: MedicationReminder, time: string) => {
    const updatedReminder = { ...reminder, scheduledTime: time };
    updateReminder(updatedReminder);
  };

  const toggleDay = (reminder: MedicationReminder, day: number) => {
    const days = reminder.days.includes(day)
      ? reminder.days.filter(d => d !== day)
      : [...reminder.days, day].sort();
    
    const updatedReminder = { ...reminder, days };
    updateReminder(updatedReminder);
  };

  const testNotification = async () => {
    try {
      await NotificationService.testNotification();
      Alert.alert('Test Sent', 'Check your notifications to see if it worked!');
    } catch (error) {
      Alert.alert('Test Failed', 'Unable to send test notification. Please check your settings.');
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading reminders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notification Setup</Text>
          <Text style={styles.subtitle}>{medicationName} ({dosage})</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.testSection}>
          <TouchableOpacity style={styles.testButton} onPress={testNotification}>
            <Bell size={20} color="#1976D2" />
            <Text style={styles.testButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        </View>

        {reminders.map((reminder) => (
          <View key={reminder.id} style={styles.reminderCard}>
            <View style={styles.reminderHeader}>
              <View style={styles.reminderInfo}>
                <Clock size={20} color="#424242" />
                <Text style={styles.reminderTime}>{reminder.scheduledTime}</Text>
              </View>
              <View style={styles.reminderControls}>
                <Switch
                  value={reminder.enabled}
                  onValueChange={() => toggleReminderEnabled(reminder)}
                  trackColor={{ false: '#E0E0E0', true: '#C8E6C9' }}
                  thumbColor={reminder.enabled ? '#4CAF50' : '#BDBDBD'}
                />
                <TouchableOpacity
                  onPress={() => deleteReminder(reminder.id)}
                  style={styles.deleteButton}
                >
                  <Trash2 size={18} color="#F44336" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.timeSelector}>
              <Text style={styles.sectionLabel}>Time</Text>
              <View style={styles.timeInputs}>
                {['08:00', '12:00', '18:00', '22:00'].map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeOption,
                      reminder.scheduledTime === time && styles.timeOptionSelected,
                    ]}
                    onPress={() => updateReminderTime(reminder, time)}
                  >
                    <Text
                      style={[
                        styles.timeOptionText,
                        reminder.scheduledTime === time && styles.timeOptionTextSelected,
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.daySelector}>
              <Text style={styles.sectionLabel}>Days</Text>
              <View style={styles.dayButtons}>
                {dayNames.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayButton,
                      reminder.days.includes(index) && styles.dayButtonSelected,
                    ]}
                    onPress={() => toggleDay(reminder, index)}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        reminder.days.includes(index) && styles.dayButtonTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={createReminder}>
          <Plus size={20} color="#2E7D32" />
          <Text style={styles.addButtonText}>Add Reminder</Text>
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoText}>
            • Notifications will appear at your scheduled times{'\n'}
            • Tap "Taken" to mark your dose as completed{'\n'}
            • Tap "Snooze" to be reminded again in 15 minutes{'\n'}
            • Make sure notifications are enabled in your device settings
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#757575',
    marginTop: 40,
  },
  testSection: {
    marginBottom: 20,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    borderRadius: 8,
  },
  testButtonText: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: '500',
    marginLeft: 8,
  },
  reminderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 8,
  },
  reminderControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    marginLeft: 12,
    padding: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  timeSelector: {
    marginBottom: 16,
  },
  timeInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeOption: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  timeOptionSelected: {
    backgroundColor: '#2E7D32',
  },
  timeOptionText: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
  },
  timeOptionTextSelected: {
    color: '#FFFFFF',
  },
  daySelector: {
    marginBottom: 8,
  },
  dayButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 40,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#2E7D32',
  },
  dayButtonText: {
    fontSize: 12,
    color: '#424242',
    fontWeight: '500',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E8',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  addButtonText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
});