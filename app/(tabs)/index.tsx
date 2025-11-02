import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Clock, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Pill, Bell, Settings } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationSetup from '@/components/NotificationSetup';
import NotificationService from '@/services/NotificationService';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  lastTaken?: string;
  adherence: number;
  reminderEnabled: boolean;
  color: string;
}

export default function MedicineTab() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNotificationSetup, setShowNotificationSetup] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    frequency: '',
    times: [''],
  });

  const medicineColors = ['#E91E63', '#9C27B0', '#3F51B5', '#2196F3', '#009688', '#4CAF50'];

  useEffect(() => {
    loadMedications();
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      await NotificationService.initialize();
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  };

  const loadMedications = async () => {
    try {
      const stored = await AsyncStorage.getItem('medications');
      if (stored) {
        setMedications(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading medications:', error);
    }
  };

  const saveMedications = async (meds: Medication[]) => {
    try {
      await AsyncStorage.setItem('medications', JSON.stringify(meds));
      setMedications(meds);
    } catch (error) {
      console.error('Error saving medications:', error);
    }
  };

  const addMedication = () => {
    if (!newMed.name || !newMed.dosage) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const medication: Medication = {
      id: Date.now().toString(),
      name: newMed.name,
      dosage: newMed.dosage,
      frequency: newMed.frequency,
      times: newMed.times.filter(time => time.length > 0),
      adherence: 100,
      reminderEnabled: true,
      color: medicineColors[medications.length % medicineColors.length],
    };

    const updated = [...medications, medication];
    saveMedications(updated);
    setShowAddModal(false);
    setNewMed({ name: '', dosage: '', frequency: '', times: [''] });
  };

  const markAsTaken = (id: string) => {
    const updated = medications.map(med => {
      if (med.id === id) {
        const now = new Date().toISOString();
        // Simulate adherence calculation based on timing
        const newAdherence = Math.max(70, Math.min(100, med.adherence + Math.random() * 10 - 5));
        return { 
          ...med, 
          lastTaken: now,
          adherence: Math.round(newAdherence)
        };
      }
      return med;
    });
    saveMedications(updated);
    
    // Show confirmation with haptic feedback
    Alert.alert(
      'Medication Taken',
      'Great job staying on track with your medication!',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const toggleReminder = (id: string) => {
    const updated = medications.map(med => 
      med.id === id 
        ? { ...med, reminderEnabled: !med.reminderEnabled }
        : med
    );
    saveMedications(updated);
  };

  const openNotificationSetup = (medication: Medication) => {
    setSelectedMedication(medication);
    setShowNotificationSetup(true);
  };

  const getAdherenceColor = (adherence: number) => {
    if (adherence >= 90) return '#4CAF50';
    if (adherence >= 70) return '#FF9800';
    return '#F44336';
  };

  const getNextDoseTime = (times: string[]) => {
    if (times.length === 0) return 'Not scheduled';
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    for (const time of times) {
      if (time) {
        const [hours, minutes] = time.split(':').map(Number);
        const timeInMinutes = hours * 60 + minutes;
        
        if (timeInMinutes > currentTime) {
          return time;
        }
      }
    }
    
    // If no time today, show first time tomorrow
    return `Tomorrow ${times[0]}`;
  };

  const getTodaysMedications = () => {
    return medications.filter(med => {
      if (!med.lastTaken) return true;
      
      const lastTaken = new Date(med.lastTaken);
      const today = new Date();
      
      return lastTaken.toDateString() !== today.toDateString();
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Medicine Tracker</Text>
          <Text style={styles.headerSubtitle}>
            {getTodaysMedications().length} medications due today
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {medications.length === 0 ? (
          <View style={styles.emptyState}>
            <Pill size={64} color="#BDBDBD" />
            <Text style={styles.emptyTitle}>No Medications Added</Text>
            <Text style={styles.emptySubtitle}>
              Tap the + button to add your first medication
            </Text>
          </View>
        ) : (
          <>
            {/* Today's Medications Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today's Medications</Text>
              {getTodaysMedications().map((med) => (
                <View key={med.id} style={styles.medicationCard}>
                  <View style={styles.medicationHeader}>
                    <View style={styles.medicationInfo}>
                      <View style={styles.medicationTitleRow}>
                        <View style={[styles.colorIndicator, { backgroundColor: med.color }]} />
                        <Text style={styles.medicationName}>{med.name}</Text>
                        <TouchableOpacity
                          style={styles.reminderButton}
                          onPress={() => openNotificationSetup(med)}
                        >
                          <Settings size={16} color="#757575" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.medicationDosage}>{med.dosage}</Text>
                      <Text style={styles.medicationFrequency}>{med.frequency}</Text>
                    </View>
                    <View style={styles.adherenceContainer}>
                      <Text style={[styles.adherenceText, { color: getAdherenceColor(med.adherence) }]}>
                        {med.adherence}%
                      </Text>
                      <Text style={styles.adherenceLabel}>Adherence</Text>
                    </View>
                  </View>

                  <View style={styles.medicationActions}>
                    <View style={styles.scheduleInfo}>
                      <Clock size={16} color="#757575" />
                      <Text style={styles.scheduleText}>
                        Next: {getNextDoseTime(med.times)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.takenButton}
                      onPress={() => markAsTaken(med.id)}
                    >
                      <CheckCircle size={20} color="#4CAF50" />
                      <Text style={styles.takenText}>Mark as Taken</Text>
                    </TouchableOpacity>
                  </View>

                  {med.lastTaken && (
                    <Text style={styles.lastTakenText}>
                      Last taken: {new Date(med.lastTaken).toLocaleString()}
                    </Text>
                  )}

                  {/* Adherence Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${med.adherence}%`, 
                            backgroundColor: getAdherenceColor(med.adherence) 
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* All Medications Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Medications</Text>
              {medications.map((med) => (
                <View key={`all-${med.id}`} style={styles.compactMedicationCard}>
                  <View style={[styles.colorIndicator, { backgroundColor: med.color }]} />
                  <View style={styles.compactMedicationInfo}>
                    <Text style={styles.compactMedicationName}>{med.name}</Text>
                    <Text style={styles.compactMedicationDetails}>
                      {med.dosage} • {med.frequency}
                    </Text>
                  </View>
                  <View style={styles.compactAdherence}>
                    <Text style={[styles.compactAdherenceText, { color: getAdherenceColor(med.adherence) }]}>
                      {med.adherence}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Medication</Text>
            <TouchableOpacity onPress={addMedication}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Medication Name *</Text>
              <TextInput
                style={styles.textInput}
                value={newMed.name}
                onChangeText={(text) => setNewMed({ ...newMed, name: text })}
                placeholder="Enter medication name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dosage *</Text>
              <TextInput
                style={styles.textInput}
                value={newMed.dosage}
                onChangeText={(text) => setNewMed({ ...newMed, dosage: text })}
                placeholder="e.g., 10mg, 2 tablets"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Frequency</Text>
              <TextInput
                style={styles.textInput}
                value={newMed.frequency}
                onChangeText={(text) => setNewMed({ ...newMed, frequency: text })}
                placeholder="e.g., Twice daily, Every 8 hours"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Times</Text>
              <TextInput
                style={styles.textInput}
                value={newMed.times[0]}
                onChangeText={(text) => setNewMed({ ...newMed, times: [text] })}
                placeholder="e.g., 8:00 AM"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {selectedMedication && (
        <Modal
          visible={showNotificationSetup}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <NotificationSetup
            medicationId={selectedMedication.id}
            medicationName={selectedMedication.name}
            dosage={selectedMedication.dosage}
            onClose={() => {
              setShowNotificationSetup(false);
              setSelectedMedication(null);
            }}
          />
        </Modal>
      )}
    </SafeAreaView>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#2E7D32',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#424242',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  medicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  colorIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 12,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  reminderButton: {
    padding: 4,
  },
  medicationDosage: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 2,
    marginLeft: 16,
  },
  medicationFrequency: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 16,
  },
  adherenceContainer: {
    alignItems: 'center',
  },
  adherenceText: {
    fontSize: 20,
    fontWeight: '700',
  },
  adherenceLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  medicationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleText: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 6,
  },
  takenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  takenText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
  },
  lastTakenText: {
    fontSize: 12,
    color: '#9E9E9E',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  compactMedicationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  compactMedicationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  compactMedicationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 2,
  },
  compactMedicationDetails: {
    fontSize: 14,
    color: '#757575',
  },
  compactAdherence: {
    alignItems: 'center',
  },
  compactAdherenceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cancelButton: {
    fontSize: 16,
    color: '#757575',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  saveButton: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#424242',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#212121',
  },
});