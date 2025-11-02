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
import { Calendar } from 'react-native-calendars';
import { Heart, Plus, Droplet, Moon, Thermometer, Activity } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CycleData {
  id: string;
  date: string;
  type: 'period' | 'ovulation' | 'symptom';
  intensity?: 'light' | 'medium' | 'heavy';
  symptoms?: string[];
  notes?: string;
}

interface CycleStats {
  averageCycleLength: number;
  averagePeriodLength: number;
  nextPeriodDate: string;
  fertileWindow: { start: string; end: string };
}

const symptomOptions = [
  'Cramps', 'Bloating', 'Headache', 'Mood swings', 'Fatigue',
  'Breast tenderness', 'Back pain', 'Nausea', 'Acne', 'Cravings'
];

export default function CycleTab() {
  const [cycleData, setCycleData] = useState<CycleData[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [intensity, setIntensity] = useState<'light' | 'medium' | 'heavy'>('medium');
  const [notes, setNotes] = useState('');
  const [currentView, setCurrentView] = useState<'calendar' | 'insights'>('calendar');
  const [stats, setStats] = useState<CycleStats | null>(null);

  useEffect(() => {
    loadCycleData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [cycleData]);

  const loadCycleData = async () => {
    try {
      const stored = await AsyncStorage.getItem('cycle_data');
      if (stored) {
        setCycleData(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading cycle data:', error);
    }
  };

  const saveCycleData = async (data: CycleData[]) => {
    try {
      await AsyncStorage.setItem('cycle_data', JSON.stringify(data));
      setCycleData(data);
    } catch (error) {
      console.error('Error saving cycle data:', error);
    }
  };

  const calculateStats = () => {
    const periodDates = cycleData
      .filter(entry => entry.type === 'period')
      .map(entry => new Date(entry.date))
      .sort((a, b) => a.getTime() - b.getTime());

    if (periodDates.length < 2) {
      setStats(null);
      return;
    }

    // Calculate average cycle length
    const cycleLengths = [];
    for (let i = 1; i < periodDates.length; i++) {
      const diff = Math.ceil((periodDates[i].getTime() - periodDates[i - 1].getTime()) / (1000 * 60 * 60 * 24));
      cycleLengths.push(diff);
    }

    const averageCycleLength = Math.round(
      cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length
    );

    // Calculate average period length (consecutive period days)
    const periodLengths = [];
    let currentPeriodLength = 1;
    
    const sortedPeriodDates = cycleData
      .filter(entry => entry.type === 'period')
      .map(entry => entry.date)
      .sort();

    for (let i = 1; i < sortedPeriodDates.length; i++) {
      const prev = new Date(sortedPeriodDates[i - 1]);
      const curr = new Date(sortedPeriodDates[i]);
      const dayDiff = Math.ceil((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        currentPeriodLength++;
      } else {
        periodLengths.push(currentPeriodLength);
        currentPeriodLength = 1;
      }
    }
    periodLengths.push(currentPeriodLength);

    const averagePeriodLength = Math.round(
      periodLengths.reduce((sum, length) => sum + length, 0) / periodLengths.length
    );

    // Predict next period
    const lastPeriod = periodDates[periodDates.length - 1];
    const nextPeriodDate = new Date(lastPeriod.getTime() + (averageCycleLength * 24 * 60 * 60 * 1000));

    // Calculate fertile window (typically days 10-17 of cycle)
    const fertileStart = new Date(lastPeriod.getTime() + (10 * 24 * 60 * 60 * 1000));
    const fertileEnd = new Date(lastPeriod.getTime() + (17 * 24 * 60 * 60 * 1000));

    setStats({
      averageCycleLength,
      averagePeriodLength,
      nextPeriodDate: nextPeriodDate.toISOString().split('T')[0],
      fertileWindow: {
        start: fertileStart.toISOString().split('T')[0],
        end: fertileEnd.toISOString().split('T')[0],
      },
    });
  };

  const getMarkedDates = () => {
    const marked: { [key: string]: any } = {};

    cycleData.forEach(entry => {
      if (entry.type === 'period') {
        marked[entry.date] = {
          selected: true,
          selectedColor: '#E91E63',
          selectedTextColor: '#FFFFFF',
        };
      } else if (entry.type === 'ovulation') {
        marked[entry.date] = {
          selected: true,
          selectedColor: '#FF9800',
          selectedTextColor: '#FFFFFF',
        };
      }
    });

    // Add fertile window
    if (stats) {
      const fertileStart = new Date(stats.fertileWindow.start);
      const fertileEnd = new Date(stats.fertileWindow.end);
      
      for (let d = fertileStart; d <= fertileEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (!marked[dateStr]) {
          marked[dateStr] = {
            marked: true,
            dotColor: '#4CAF50',
          };
        }
      }
    }

    return marked;
  };

  const addEntry = () => {
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date first');
      return;
    }

    const newEntry: CycleData = {
      id: Date.now().toString(),
      date: selectedDate,
      type: 'period',
      intensity,
      symptoms: selectedSymptoms,
      notes: notes.trim() || undefined,
    };

    const updated = [...cycleData, newEntry];
    saveCycleData(updated);
    resetModal();
  };

  const resetModal = () => {
    setShowAddModal(false);
    setSelectedSymptoms([]);
    setIntensity('medium');
    setNotes('');
  };

  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const renderCalendarView = () => (
    <ScrollView style={styles.content}>
      <Calendar
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
          setShowAddModal(true);
        }}
        markedDates={getMarkedDates()}
        theme={{
          backgroundColor: '#FFFFFF',
          calendarBackground: '#FFFFFF',
          textSectionTitleColor: '#424242',
          selectedDayBackgroundColor: '#2E7D32',
          selectedDayTextColor: '#FFFFFF',
          todayTextColor: '#2E7D32',
          dayTextColor: '#424242',
          textDisabledColor: '#BDBDBD',
          arrowColor: '#2E7D32',
          monthTextColor: '#212121',
          indicatorColor: '#2E7D32',
        }}
      />

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#E91E63' }]} />
            <Text style={styles.legendText}>Period</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.legendText}>Ovulation</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Fertile Window</Text>
          </View>
        </View>
      </View>

      {stats && (
        <View style={styles.quickStats}>
          <Text style={styles.quickStatsTitle}>Quick Stats</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Next Period:</Text>
            <Text style={styles.statValue}>
              {new Date(stats.nextPeriodDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Cycle Length:</Text>
            <Text style={styles.statValue}>{stats.averageCycleLength} days</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderInsightsView = () => (
    <ScrollView style={styles.content}>
      {stats ? (
        <>
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Activity size={24} color="#2E7D32" />
              <Text style={styles.insightTitle}>Cycle Overview</Text>
            </View>
            <View style={styles.insightStats}>
              <View style={styles.insightStat}>
                <Text style={styles.insightStatValue}>{stats.averageCycleLength}</Text>
                <Text style={styles.insightStatLabel}>Avg Cycle Length</Text>
              </View>
              <View style={styles.insightStat}>
                <Text style={styles.insightStatValue}>{stats.averagePeriodLength}</Text>
                <Text style={styles.insightStatLabel}>Avg Period Length</Text>
              </View>
            </View>
          </View>

          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Droplet size={24} color="#E91E63" />
              <Text style={styles.insightTitle}>Next Period</Text>
            </View>
            <Text style={styles.nextPeriodDate}>
              {new Date(stats.nextPeriodDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Text style={styles.daysUntil}>
              {Math.ceil((new Date(stats.nextPeriodDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days from now
            </Text>
          </View>

          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Heart size={24} color="#4CAF50" />
              <Text style={styles.insightTitle}>Fertile Window</Text>
            </View>
            <Text style={styles.fertileWindow}>
              {new Date(stats.fertileWindow.start).toLocaleDateString()} - {' '}
              {new Date(stats.fertileWindow.end).toLocaleDateString()}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.noDataCard}>
          <Moon size={64} color="#BDBDBD" />
          <Text style={styles.noDataTitle}>Not enough data</Text>
          <Text style={styles.noDataSubtitle}>
            Track your cycle for at least 2 periods to see insights
          </Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cycle Tracker</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, currentView === 'calendar' && styles.toggleButtonActive]}
            onPress={() => setCurrentView('calendar')}
          >
            <Text style={[styles.toggleText, currentView === 'calendar' && styles.toggleTextActive]}>
              Calendar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, currentView === 'insights' && styles.toggleButtonActive]}
            onPress={() => setCurrentView('insights')}
          >
            <Text style={[styles.toggleText, currentView === 'insights' && styles.toggleTextActive]}>
              Insights
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {currentView === 'calendar' ? renderCalendarView() : renderInsightsView()}

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={resetModal}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Add Entry'}
            </Text>
            <TouchableOpacity onPress={addEntry}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Flow Intensity</Text>
              <View style={styles.intensityButtons}>
                {(['light', 'medium', 'heavy'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.intensityButton,
                      intensity === level && styles.intensityButtonActive,
                    ]}
                    onPress={() => setIntensity(level)}
                  >
                    <Text
                      style={[
                        styles.intensityText,
                        intensity === level && styles.intensityTextActive,
                      ]}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Symptoms</Text>
              <View style={styles.symptomGrid}>
                {symptomOptions.map((symptom) => (
                  <TouchableOpacity
                    key={symptom}
                    style={[
                      styles.symptomButton,
                      selectedSymptoms.includes(symptom) && styles.symptomButtonActive,
                    ]}
                    onPress={() => toggleSymptom(symptom)}
                  >
                    <Text
                      style={[
                        styles.symptomText,
                        selectedSymptoms.includes(symptom) && styles.symptomTextActive,
                      ]}
                    >
                      {symptom}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any additional notes..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  toggleText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#212121',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  legend: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#424242',
  },
  quickStats: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickStatsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#424242',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 12,
  },
  insightStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  insightStat: {
    alignItems: 'center',
  },
  insightStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E7D32',
  },
  insightStatLabel: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginTop: 4,
  },
  nextPeriodDate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'center',
  },
  daysUntil: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginTop: 8,
  },
  fertileWindow: {
    fontSize: 16,
    color: '#424242',
    textAlign: 'center',
  },
  noDataCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 40,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  noDataTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#424242',
    marginTop: 16,
  },
  noDataSubtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
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
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 12,
  },
  intensityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  intensityButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  intensityButtonActive: {
    backgroundColor: '#E91E63',
  },
  intensityText: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
  },
  intensityTextActive: {
    color: '#FFFFFF',
  },
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  symptomButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    margin: 4,
  },
  symptomButtonActive: {
    backgroundColor: '#2E7D32',
  },
  symptomText: {
    fontSize: 14,
    color: '#424242',
  },
  symptomTextActive: {
    color: '#FFFFFF',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#212121',
    minHeight: 100,
  },
});