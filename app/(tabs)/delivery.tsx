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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingBag, Plus, Search, Filter, Truck, Clock, Check, CreditCard } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Medicine {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  inStock: boolean;
  prescription: boolean;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  orderDate: string;
  deliveryDate?: string;
  trackingNumber?: string;
}

interface OrderItem {
  medicine: Medicine;
  quantity: number;
}

const mockMedicines: Medicine[] = [
  {
    id: '1',
    name: 'Ibuprofen 200mg',
    price: 12.99,
    description: 'Pain relief and anti-inflammatory',
    image: 'https://images.pexels.com/photos/3683107/pexels-photo-3683107.jpeg',
    inStock: true,
    prescription: false,
  },
  {
    id: '2',
    name: 'Amoxicillin 500mg',
    price: 24.99,
    description: 'Antibiotic for bacterial infections',
    image: 'https://images.pexels.com/photos/3683098/pexels-photo-3683098.jpeg',
    inStock: true,
    prescription: true,
  },
  {
    id: '3',
    name: 'Vitamin D3 1000IU',
    price: 18.50,
    description: 'Daily vitamin supplement',
    image: 'https://images.pexels.com/photos/3683101/pexels-photo-3683101.jpeg',
    inStock: true,
    prescription: false,
  },
  {
    id: '4',
    name: 'Lisinopril 10mg',
    price: 15.75,
    description: 'Blood pressure medication',
    image: 'https://images.pexels.com/photos/3683111/pexels-photo-3683111.jpeg',
    inStock: false,
    prescription: true,
  },
];

export default function DeliveryTab() {
  const [medicines, setMedicines] = useState<Medicine[]>(mockMedicines);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'browse' | 'cart' | 'orders'>('browse');
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedCart = await AsyncStorage.getItem('delivery_cart');
      const storedOrders = await AsyncStorage.getItem('delivery_orders');
      
      if (storedCart) setCart(JSON.parse(storedCart));
      if (storedOrders) setOrders(JSON.parse(storedOrders));
    } catch (error) {
      console.error('Error loading delivery data:', error);
    }
  };

  const saveData = async (newCart: OrderItem[], newOrders: Order[]) => {
    try {
      await AsyncStorage.setItem('delivery_cart', JSON.stringify(newCart));
      await AsyncStorage.setItem('delivery_orders', JSON.stringify(newOrders));
    } catch (error) {
      console.error('Error saving delivery data:', error);
    }
  };

  const addToCart = (medicine: Medicine) => {
    if (medicine.prescription) {
      Alert.alert(
        'Prescription Required',
        'This medication requires a prescription. Please upload your prescription to proceed.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upload Prescription', onPress: () => uploadPrescription(medicine) },
        ]
      );
      return;
    }

    const existingItem = cart.find(item => item.medicine.id === medicine.id);
    let newCart;

    if (existingItem) {
      newCart = cart.map(item =>
        item.medicine.id === medicine.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newCart = [...cart, { medicine, quantity: 1 }];
    }

    setCart(newCart);
    saveData(newCart, orders);
  };

  const updateQuantity = (medicineId: string, quantity: number) => {
    if (quantity === 0) {
      const newCart = cart.filter(item => item.medicine.id !== medicineId);
      setCart(newCart);
      saveData(newCart, orders);
    } else {
      const newCart = cart.map(item =>
        item.medicine.id === medicineId
          ? { ...item, quantity }
          : item
      );
      setCart(newCart);
      saveData(newCart, orders);
    }
  };

  const uploadPrescription = (medicine: Medicine) => {
    Alert.alert('Prescription Upload', 'Prescription upload feature would be implemented here.');
  };

  const checkout = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before checkout.');
      return;
    }

    const total = cart.reduce((sum, item) => sum + (item.medicine.price * item.quantity), 0);
    const newOrder: Order = {
      id: Date.now().toString(),
      items: [...cart],
      total,
      status: 'pending',
      orderDate: new Date().toISOString(),
      trackingNumber: `TRK${Date.now()}`,
    };

    const newOrders = [newOrder, ...orders];
    setOrders(newOrders);
    setCart([]);
    saveData([], newOrders);
    setShowCheckout(false);
    setSelectedTab('orders');

    Alert.alert('Order Placed', 'Your order has been placed successfully!');
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'confirmed': return '#2196F3';
      case 'shipped': return '#9C27B0';
      case 'delivered': return '#4CAF50';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock size={16} color={getStatusColor(status)} />;
      case 'confirmed': return <Check size={16} color={getStatusColor(status)} />;
      case 'shipped': return <Truck size={16} color={getStatusColor(status)} />;
      case 'delivered': return <Check size={16} color={getStatusColor(status)} />;
      default: return <Clock size={16} color={getStatusColor(status)} />;
    }
  };

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cartTotal = cart.reduce((sum, item) => sum + (item.medicine.price * item.quantity), 0);

  const renderBrowse = () => (
    <ScrollView style={styles.content}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#757575" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medicines..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.medicineGrid}>
        {filteredMedicines.map((medicine) => (
          <View key={medicine.id} style={styles.medicineCard}>
            <Image source={{ uri: medicine.image }} style={styles.medicineImage} />
            <View style={styles.medicineInfo}>
              <Text style={styles.medicineName}>{medicine.name}</Text>
              <Text style={styles.medicineDescription}>{medicine.description}</Text>
              <View style={styles.medicineFooter}>
                <Text style={styles.medicinePrice}>Rs.{medicine.price}</Text>
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    !medicine.inStock && styles.addButtonDisabled,
                  ]}
                  onPress={() => addToCart(medicine)}
                  disabled={!medicine.inStock}
                >
                  <Plus size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              {medicine.prescription && (
                <Text style={styles.prescriptionRequired}>Prescription Required</Text>
              )}
              {!medicine.inStock && (
                <Text style={styles.outOfStock}>Out of Stock</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderCart = () => (
    <View style={styles.cartContainer}>
      {cart.length === 0 ? (
        <View style={styles.emptyCart}>
          <ShoppingBag size={64} color="#BDBDBD" />
          <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
          <Text style={styles.emptyCartSubtitle}>Add medicines to get started</Text>
        </View>
      ) : (
        <>
          <ScrollView style={styles.cartItems}>
            {cart.map((item) => (
              <View key={item.medicine.id} style={styles.cartItem}>
                <Image source={{ uri: item.medicine.image }} style={styles.cartItemImage} />
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>{item.medicine.name}</Text>
                  <Text style={styles.cartItemPrice}>${item.medicine.price}</Text>
                </View>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.medicine.id, item.quantity - 1)}
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.medicine.id, item.quantity + 1)}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.cartFooter}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total: </Text>
              <Text style={styles.totalAmount}>Rs.{cartTotal.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => setShowCheckout(true)}
            >
              <CreditCard size={20} color="#FFFFFF" />
              <Text style={styles.checkoutText}>Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  const renderOrders = () => (
    <ScrollView style={styles.content}>
      {orders.length === 0 ? (
        <View style={styles.emptyOrders}>
          <Truck size={64} color="#BDBDBD" />
          <Text style={styles.emptyOrdersTitle}>No orders yet</Text>
          <Text style={styles.emptyOrdersSubtitle}>Your order history will appear here</Text>
        </View>
      ) : (
        orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>Order #{order.id.slice(-6)}</Text>
              <View style={styles.orderStatus}>
                {getStatusIcon(order.status)}
                <Text style={[styles.orderStatusText, { color: getStatusColor(order.status) }]}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Text>
              </View>
            </View>
            <Text style={styles.orderDate}>
              Ordered: {new Date(order.orderDate).toLocaleDateString()}
            </Text>
            <Text style={styles.orderTotal}>Total: Rs.{order.total.toFixed(2)}</Text>
            {order.trackingNumber && (
              <Text style={styles.trackingNumber}>
                Tracking: {order.trackingNumber}
              </Text>
            )}
            <View style={styles.orderItems}>
              {order.items.map((item, index) => (
                <Text key={index} style={styles.orderItem}>
                  {item.quantity}x {item.medicine.name}
                </Text>
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medicine Delivery</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'browse' && styles.tabActive]}
            onPress={() => setSelectedTab('browse')}
          >
            <Text style={[styles.tabText, selectedTab === 'browse' && styles.tabTextActive]}>
              Browse
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'cart' && styles.tabActive]}
            onPress={() => setSelectedTab('cart')}
          >
            <Text style={[styles.tabText, selectedTab === 'cart' && styles.tabTextActive]}>
              Cart ({cart.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'orders' && styles.tabActive]}
            onPress={() => setSelectedTab('orders')}
          >
            <Text style={[styles.tabText, selectedTab === 'orders' && styles.tabTextActive]}>
              Orders
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {selectedTab === 'browse' && renderBrowse()}
      {selectedTab === 'cart' && renderCart()}
      {selectedTab === 'orders' && renderOrders()}

      <Modal
        visible={showCheckout}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.checkoutModal}>
          <View style={styles.checkoutHeader}>
            <TouchableOpacity onPress={() => setShowCheckout(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.checkoutTitle}>Checkout</Text>
            <TouchableOpacity onPress={checkout}>
              <Text style={styles.placeOrderButton}>Place Order</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.checkoutContent}>
            <Text style={styles.checkoutSectionTitle}>Order Summary</Text>
            {cart.map((item) => (
              <View key={item.medicine.id} style={styles.checkoutItem}>
                <Text style={styles.checkoutItemName}>
                  {item.quantity}x {item.medicine.name}
                </Text>
                <Text style={styles.checkoutItemPrice}>
                  Rs.{(item.medicine.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
            <View style={styles.checkoutTotal}>
              <Text style={styles.checkoutTotalText}>Total: Rs.{cartTotal.toFixed(2)}</Text>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#2E7D32',
  },
  tabText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    padding: 20,
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
  medicineGrid: {
    padding: 20,
  },
  medicineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  medicineImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  medicineInfo: {
    padding: 16,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  medicineDescription: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
  },
  medicineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicinePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
  },
  addButton: {
    backgroundColor: '#2E7D32',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  prescriptionRequired: {
    fontSize: 12,
    color: '#FF5722',
    fontWeight: '500',
    marginTop: 8,
  },
  outOfStock: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '500',
    marginTop: 8,
  },
  cartContainer: {
    flex: 1,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyCartTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#424242',
    marginTop: 16,
  },
  emptyCartSubtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginTop: 8,
  },
  cartItems: {
    flex: 1,
    padding: 20,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#E0E0E0',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#424242',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginHorizontal: 16,
  },
  cartFooter: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E7D32',
  },
  checkoutButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  checkoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  emptyOrders: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyOrdersTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#424242',
    marginTop: 16,
  },
  emptyOrdersSubtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginTop: 8,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  orderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderStatusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  trackingNumber: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 8,
  },
  orderItems: {
    marginTop: 8,
  },
  orderItem: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 2,
  },
  checkoutModal: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  checkoutHeader: {
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
  checkoutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  placeOrderButton: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
  },
  checkoutContent: {
    flex: 1,
    padding: 20,
  },
  checkoutSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  checkoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  checkoutItemName: {
    fontSize: 14,
    color: '#424242',
  },
  checkoutItemPrice: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  checkoutTotal: {
    borderTopWidth: 2,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
    marginTop: 16,
  },
  checkoutTotalText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    textAlign: 'right',
  },
});