import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Phone, Clock, Star, Filter, Search, AlertTriangle } from 'lucide-react-native';
import { MapsIntegration } from '@/utils/mapsIntegration';

interface Provider {
  id: string;
  name: string;
  specialty: string;
  address: string;
  phone: string;
  rating: number;
  distance: number;
  hours: string;
  available: boolean;
}

const mockProviders: Provider[] = [
  {
    id: '1',
    name: 'Dr. Priti Harkal - Sarswati Clinic',
    specialty: 'General Practitioner',
    address: 'Shantai Classic, near Gokul sweets, Ravet, Pune, Pimpri-Chinchwad, Maharashtra 412101',
    phone: '09518392996',
    rating: 4.9,
    distance: 0.5,
    hours: '10:00 AM - 9:00 PM',
    available: true,
  },
  {
    id: '2',
    name: 'Healthwise Pharma',
    specialty: 'Pharmacy',
    address: '15/4/537, Pradhikaran, Sector 29, Ravet, Pimpri-Chinchwad, Maharashtra 412101',
    phone: '(555) 234-5678',
    rating: 4.6,
    distance: 1,
    hours: '8:00 AM - 1:00 AM',
    available: true,
  },
  {
    id: '3',
    name: 'Dr. Nikhil Phade',
    specialty: 'Orthopedic Doctor',
    address: 'Sonigara) Shop, TWIN TOWERS, 6, SB Patil School Rd, Ravet, Pune, Pimpri-Chinchwad, Maharashtra 412101',
    phone: '09284659494',
    rating: 4.9,
    distance: 1.2,
    hours: '8:30 AM - 2:00 PM',
    available: false,
  },
  {
    id: '4',
    name: 'Lifeline Multispeciality Hospital',
    specialty: 'Urgent Care',
    address: 'Nano Homes, and, Bhondve Cir, near Sant Tukaram Bridge, Chawk, Ravet, Pune, Pimpri-Chinchwad, Maharashtra 412101',
    phone: '07798855599',
    rating: 4.2,
    distance: 1.6,
    hours: '24 Hours',
    available: true,
  },
];

export default function ProvidersTab() {
  const [providers, setProviders] = useState<Provider[]>(mockProviders);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filters = ['All', 'Doctors', 'Pharmacies', 'Urgent Care', 'Available Now'];

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         provider.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    if (selectedFilter === 'Doctors') {
      matchesFilter = provider.specialty.includes('Dr.') || 
                     !provider.specialty.includes('Pharmacy') && 
                     !provider.specialty.includes('Clinic');
    } else if (selectedFilter === 'Pharmacies') {
      matchesFilter = provider.specialty.includes('Pharmacy');
    } else if (selectedFilter === 'Urgent Care') {
      matchesFilter = provider.specialty.includes('Urgent Care');
    } else if (selectedFilter === 'Available Now') {
      matchesFilter = provider.available;
    }

    return matchesSearch && matchesFilter;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={16}
        color={i < Math.floor(rating) ? '#FFC107' : '#E0E0E0'}
        fill={i < Math.floor(rating) ? '#FFC107' : 'transparent'}
      />
    ));
  };

  const handleCall = (phone: string) => {
    Alert.alert(
      'Call Provider',
      `Call ${phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => console.log('Calling:', phone) },
      ]
    );
  };

  const handleDirections = (address: string) => {
    // This function is deprecated, use handleDirectionsForProvider directly
  };

  const handleDirectionsForProvider = (provider: Provider) => {
    // Validate address before attempting to open maps
    if (!MapsIntegration.validateAddress(provider.address)) {
      Alert.alert(
        'Invalid Address',
        'The address for this provider appears to be incomplete. Please contact them directly for directions.',
        [
          { text: 'Call Provider', onPress: () => handleCall(provider.phone) },
          { text: 'OK' }
        ]
      );
      return;
    }

    // Open maps with provider information
    MapsIntegration.openDirections({
      address: provider.address,
      name: provider.name,
      phone: provider.phone
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Healthcare Providers</Text>
        <Text style={styles.locationText}>Near you</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#757575" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search providers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content}>
        {filteredProviders.map((provider) => (
          <View key={provider.id} style={styles.providerCard}>
            <View style={styles.providerHeader}>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{provider.name}</Text>
                <Text style={styles.providerSpecialty}>{provider.specialty}</Text>
                <View style={styles.ratingContainer}>
                  <View style={styles.stars}>
                    {renderStars(provider.rating)}
                  </View>
                  <Text style={styles.ratingText}>{provider.rating}</Text>
                </View>
              </View>
              <View style={styles.distanceContainer}>
                <Text style={styles.distanceText}>{provider.distance} mi</Text>
                {provider.available && (
                  <View style={styles.availableBadge}>
                    <Text style={styles.availableText}>Available</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.providerDetails}>
              <View style={styles.detailRow}>
                <MapPin size={16} color="#757575" />
                <Text style={styles.detailText}>{provider.address}</Text>
              </View>
              <View style={styles.detailRow}>
                <Clock size={16} color="#757575" />
                <Text style={styles.detailText}>{provider.hours}</Text>
              </View>
            </View>

            <View style={styles.providerActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleCall(provider.phone)}
              >
                <Phone size={18} color="#1976D2" />
                <Text style={styles.actionText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDirectionsForProvider(provider)}
              >
                <MapPin size={18} color="#1976D2" />
                <Text style={styles.actionText}>Directions</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
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
  locationText: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#212121',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#2E7D32',
  },
  filterText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  providerCard: {
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
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  providerSpecialty: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
  },
  distanceContainer: {
    alignItems: 'flex-end',
  },
  distanceText: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  availableBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  providerDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#424242',
    marginLeft: 8,
    flex: 1,
  },
  providerActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
    marginLeft: 6,
  },
  warningIcon: {
    marginLeft: 8,
  },
});
