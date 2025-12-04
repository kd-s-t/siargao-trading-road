import 'react-native-gesture-handler';
import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import ProductsScreen from './screens/ProductsScreen';
import AddProductScreen from './screens/AddProductScreen';
import EditProductScreen from './screens/EditProductScreen';
import OrdersScreen from './screens/OrdersScreen';
import OrderDetailScreen from './screens/OrderDetailScreen';
import SuppliersScreen from './screens/SuppliersScreen';
import SupplierProductsScreen from './screens/SupplierProductsScreen';
import TruckScreen from './screens/TruckScreen';
import ProfileScreen from './screens/ProfileScreen';
import RatingsListScreen from './screens/RatingsListScreen';
import DrawerContent from './components/DrawerContent';
import { ActivityIndicator, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { orderService, Order } from './lib/orders';
import { bugReportService } from './lib/bug_reports';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    bugReportService.reportError(error, 'React Error Boundary');
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text>Something went wrong. The error has been reported.</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrdersList" component={OrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="RatingsList" component={RatingsListScreen} />
    </Stack.Navigator>
  );
}

function SupplierTabs() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (user && (user.role === 'supplier' || user.role === 'store')) {
      loadOrders();
    }
  }, [user?.id]);

  const loadOrders = async () => {
    try {
      const data = await orderService.getOrders();
      setOrders(data || []);
    } catch (error) {
      console.error('Failed to load orders for badge:', error);
    }
  };

  const nonDeliveredCount = orders.filter(order => order.status !== 'delivered').length;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: '#757575',
      }}
    >
      <Tab.Screen
        name="ProductsTab"
        component={ProductsScreen}
        options={{
          tabBarLabel: 'Products',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="package-variant" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStack}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cart" size={size} color={color} />
          ),
          tabBarBadge: nonDeliveredCount > 0 ? nonDeliveredCount : undefined,
        }}
        listeners={{
          tabPress: () => {
            loadOrders();
          },
        }}
      />
    </Tab.Navigator>
  );
}

function StoreDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: {
          width: 280,
        },
        swipeEnabled: true,
        swipeEdgeWidth: 50,
      }}
    >
      <Drawer.Screen name="Suppliers" component={SuppliersScreen} />
      <Drawer.Screen name="SupplierProducts" component={SupplierProductsScreen} />
      <Drawer.Screen name="Orders" component={OrdersStack} />
      <Drawer.Screen name="Truck" component={TruckScreen} />
      <Drawer.Screen name="Profile" component={ProfileStack} />
    </Drawer.Navigator>
  );
}

function SupplierDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: {
          width: 280,
        },
        swipeEnabled: true,
        swipeEdgeWidth: 50,
      }}
    >
      <Drawer.Screen name="SupplierMain" component={SupplierTabs} />
      <Drawer.Screen name="AddProduct" component={AddProductScreen} />
      <Drawer.Screen name="EditProduct" component={EditProductScreen} />
      <Drawer.Screen name="Profile" component={ProfileStack} />
    </Drawer.Navigator>
  );
}

function AdminDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: {
          width: 280,
        },
        swipeEnabled: true,
        swipeEdgeWidth: 50,
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Profile" component={ProfileStack} />
    </Drawer.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            {user.role === 'supplier' ? (
              <Stack.Screen name="SupplierDrawer" component={SupplierDrawer} />
            ) : user.role === 'store' ? (
              <Stack.Screen name="StoreDrawer" component={StoreDrawer} />
            ) : (
              <Stack.Screen name="AdminDrawer" component={AdminDrawer} />
            )}
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      bugReportService.reportError(error, 'Unhandled Promise Rejection');
    };

    if (typeof global !== 'undefined' && (global as any).ErrorUtils) {
      const ErrorUtils = (global as any).ErrorUtils;
      const originalError = ErrorUtils.getGlobalHandler();
      ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        bugReportService.reportError(error, 'Global Error Handler');
        if (originalError) {
          originalError(error, isFatal);
        }
      });
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', rejectionHandler);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('unhandledrejection', rejectionHandler);
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <PaperProvider>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

