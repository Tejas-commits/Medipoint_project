import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Heart, MapPin, ShoppingBag, Calendar } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Medicine',
          tabBarIcon: ({ size, color }) => (
            <Heart size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="providers"
        options={{
          title: 'Providers',
          tabBarIcon: ({ size, color }) => (
            <MapPin size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="delivery"
        options={{
          title: 'Delivery',
          tabBarIcon: ({ size, color }) => (
            <ShoppingBag size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cycle"
        options={{
          title: 'Cycle',
          tabBarIcon: ({ size, color }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}