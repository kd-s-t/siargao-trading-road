import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import ProductsScreen from './screens/ProductsScreen';
import AddProductScreen from './screens/AddProductScreen';
import EditProductScreen from './screens/EditProductScreen';
import OrdersScreen from './screens/OrdersScreen';
import SuppliersScreen from './screens/SuppliersScreen';
import SupplierProductsScreen from './screens/SupplierProductsScreen';
import TruckScreen from './screens/TruckScreen';
import { ActivityIndicator, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function SupplierTabs() {
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
        component={OrdersScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cart" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
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
              <>
                <Stack.Screen name="SupplierMain" component={SupplierTabs} />
                <Stack.Screen name="AddProduct" component={AddProductScreen} />
                <Stack.Screen name="EditProduct" component={EditProductScreen} />
              </>
            ) : user.role === 'store' ? (
              <>
                <Stack.Screen name="Suppliers" component={SuppliersScreen} />
                <Stack.Screen name="SupplierProducts" component={SupplierProductsScreen} />
                <Stack.Screen name="Truck" component={TruckScreen} />
              </>
            ) : (
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
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
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

