import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Bell, X } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPermissionGranted: () => void;
}

export default function NotificationPermissionPrompt({ visible, onClose, onPermissionGranted }: Props) {
  const [isRequesting, setIsRequesting] = useState(false);

  const requestPermission = async () => {
    setIsRequesting(true);
    
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status === 'granted') {
        onPermissionGranted();
        onClose();
        Alert.alert(
          'Notifications Enabled',
          'You\'ll now receive reminders for your medications at the scheduled times.'
        );
      } else {
        Alert.alert(
          'Permission Denied',
          'To receive medication reminders, please enable notifications in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Notifications.openSettingsAsync() },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      Alert.alert(
        'Error',
        'Unable to request notification permission. Please try again or check your device settings.'
      );
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#757575" />
          </TouchableOpacity>
          
          <View style={styles.iconContainer}>
            <Bell size={48} color="#2E7D32" />
          </View>
          
          <Text style={styles.title}>Enable Notifications</Text>
          <Text style={styles.description}>
            Get timely reminders for your medications to help you stay on track with your health routine.
          </Text>
          
          <View style={styles.benefits}>
            <Text style={styles.benefitItem}>• Never miss a dose</Text>
            <Text style={styles.benefitItem}>• Mark doses as taken directly from notifications</Text>
            <Text style={styles.benefitItem}>• Snooze reminders when needed</Text>
            <Text style={styles.benefitItem}>• Improve medication adherence</Text>
          </View>
          
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.enableButton}
              onPress={requestPermission}
              disabled={isRequesting}
            >
              <Text style={styles.enableButtonText}>
                {isRequesting ? 'Requesting...' : 'Enable Notifications'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.skipButton} onPress={onClose}>
              <Text style={styles.skipButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#E8F5E8',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  benefits: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  benefitItem: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 8,
    lineHeight: 20,
  },
  buttons: {
    width: '100%',
  },
  enableButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  enableButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
});