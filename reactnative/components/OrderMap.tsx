import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Image, Text as RNText } from 'react-native';
import { Text } from 'react-native-paper';
import { User } from '../lib/auth';

let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let PROVIDER_DEFAULT: any = null;
let PROVIDER_GOOGLE: any = null;
let mapsAvailable = false;

try {
  const maps = require('react-native-maps');
  if (maps && (maps.default || maps.MapView)) {
    MapView = maps.default || maps.MapView;
    Marker = maps.Marker;
    Polyline = maps.Polyline;
    PROVIDER_DEFAULT = maps.PROVIDER_DEFAULT || undefined;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE || undefined;
    mapsAvailable = true;
  }
} catch (error) {
  console.warn('react-native-maps not available:', error);
  mapsAvailable = false;
}

interface OrderMapProps {
  store?: User;
  supplier?: User;
  status?: string;
  height?: number;
}

const SIARGAO_CENTER = { latitude: 9.8563, longitude: 126.0483 };

const calculateBearing = (
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number => {
  const lat1 = point1.latitude * Math.PI / 180;
  const lat2 = point2.latitude * Math.PI / 180;
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
};

export default function OrderMap({ store, supplier, status, height = 250 }: OrderMapProps) {
  if (!mapsAvailable || !MapView) {
    const storeLocation = store?.latitude && store?.longitude
      ? { latitude: store.latitude, longitude: store.longitude }
      : null;
    const supplierLocation = supplier?.latitude && supplier?.longitude
      ? { latitude: supplier.latitude, longitude: supplier.longitude }
      : null;

    return (
      <View style={[styles.container, { height }, styles.fallbackContainer]}>
        <Text variant="bodyMedium" style={styles.fallbackText}>
          Map unavailable
        </Text>
        {storeLocation && (
          <Text variant="bodySmall" style={styles.fallbackText}>
            Store: {store?.name || 'Unknown'}
          </Text>
        )}
        {supplierLocation && (
          <Text variant="bodySmall" style={styles.fallbackText}>
            Supplier: {supplier?.name || 'Unknown'}
          </Text>
        )}
        {status && (
          <Text variant="bodySmall" style={styles.fallbackText}>
            Status: {status}
          </Text>
        )}
      </View>
    );
  }

  const [truckPosition, setTruckPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [truckAngle, setTruckAngle] = useState<number>(0);
  const [routePoints, setRoutePoints] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [animatedRoutePoints, setAnimatedRoutePoints] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);
  const routeCacheKey = useRef<string>('');

  const storeLocation = store?.latitude && store?.longitude
    ? { latitude: store.latitude, longitude: store.longitude }
    : null;

  const supplierLocation = supplier?.latitude && supplier?.longitude
    ? { latitude: supplier.latitude, longitude: supplier.longitude }
    : null;

  const isInTransit = status === 'in_transit';

  useEffect(() => {
    if (!storeLocation || !supplierLocation || isFetchingRoute) {
      if (!storeLocation || !supplierLocation) {
        setRoutePoints([]);
        routeCacheKey.current = '';
      }
      return;
    }

    const cacheKey = `${supplierLocation.latitude},${supplierLocation.longitude}-${storeLocation.latitude},${storeLocation.longitude}`;
    if (routeCacheKey.current === cacheKey && routePoints.length > 0) {
      return;
    }

    const fetchRoute = async () => {
      setIsFetchingRoute(true);
      routeCacheKey.current = cacheKey;
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${supplierLocation.longitude},${supplierLocation.latitude};${storeLocation.longitude},${storeLocation.latitude}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes[0] && data.routes[0].geometry) {
          const coordinates = data.routes[0].geometry.coordinates;
          if (coordinates && coordinates.length > 2) {
            const points = coordinates.map((coord: number[]) => ({
              latitude: coord[1],
              longitude: coord[0],
            }));
            setRoutePoints(points);
          } else {
            setRoutePoints([supplierLocation, storeLocation]);
          }
        } else {
          setRoutePoints([supplierLocation, storeLocation]);
        }
      } catch {
        setRoutePoints([supplierLocation, storeLocation]);
      } finally {
        setIsFetchingRoute(false);
      }
    };

    fetchRoute();
  }, [storeLocation, supplierLocation]);

  useEffect(() => {
    if (!isInTransit || !routePoints.length || routePoints.length < 2) {
      setTruckPosition(null);
      setTruckAngle(0);
      setAnimatedRoutePoints([]);
      return;
    }

    const fixedProgress = 0.6;
    const index = Math.floor(fixedProgress * (routePoints.length - 1));
    const currentIndex = Math.min(index, routePoints.length - 2);
    const currentPoint = routePoints[currentIndex];
    const nextPoint = routePoints[currentIndex + 1];
    const angle = calculateBearing(currentPoint, nextPoint);
    setTruckAngle(angle);
    setTruckPosition(currentPoint);

    let progress = 0;
    const animationSpeed = 0.01;
    const interval = setInterval(() => {
      progress += animationSpeed;
      if (progress > 1) {
        progress = 1;
      }
      
      const endIndex = Math.floor(progress * (routePoints.length - 1));
      const animatedPoints = routePoints.slice(0, endIndex + 1);
      setAnimatedRoutePoints(animatedPoints);
      
      if (progress >= 1) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isInTransit, routePoints]);

  const center = storeLocation || supplierLocation || SIARGAO_CENTER;

  const region = storeLocation && supplierLocation
    ? {
        latitude: (storeLocation.latitude + supplierLocation.latitude) / 2,
        longitude: (storeLocation.longitude + supplierLocation.longitude) / 2,
        latitudeDelta: Math.abs(storeLocation.latitude - supplierLocation.latitude) * 1.5 + 0.01,
        longitudeDelta: Math.abs(storeLocation.longitude - supplierLocation.longitude) * 1.5 + 0.01,
      }
    : {
        ...center,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        provider={PROVIDER_GOOGLE || PROVIDER_DEFAULT}
        style={styles.map}
        region={region}
        scrollEnabled={true}
        zoomEnabled={true}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {storeLocation && (
          <Marker
            coordinate={storeLocation}
            title="Store Location"
            description={store?.name || 'Store'}
          >
            <View style={styles.markerContainer}>
              {store?.logo_url ? (
                <View style={styles.customMarker}>
                  <View style={styles.markerPin}>
                    <Image
                      source={{ uri: store.logo_url }}
                      style={styles.markerImage}
                    />
                  </View>
                </View>
              ) : (
                <View style={[styles.defaultMarker, { backgroundColor: '#1976d2' }]}>
                  <RNText style={styles.markerText}>
                    {store?.name?.charAt(0).toUpperCase() || 'S'}
                  </RNText>
                </View>
              )}
            </View>
          </Marker>
        )}

        {supplierLocation && (
          <Marker
            coordinate={supplierLocation}
            title="Supplier Location"
            description={supplier?.name || 'Supplier'}
          >
            <View style={styles.markerContainer}>
              {supplier?.logo_url ? (
                <View style={styles.customMarker}>
                  <View style={[styles.markerPin, { borderColor: '#f44336' }]}>
                    <Image
                      source={{ uri: supplier.logo_url }}
                      style={styles.markerImage}
                    />
                  </View>
                </View>
              ) : (
                <View style={[styles.defaultMarker, { backgroundColor: '#f44336' }]}>
                  <RNText style={styles.markerText}>
                    {supplier?.name?.charAt(0).toUpperCase() || 'S'}
                  </RNText>
                </View>
              )}
            </View>
          </Marker>
        )}

        {isInTransit && truckPosition && (
          <Marker
            coordinate={truckPosition}
            title="Truck in Transit"
            description={`Delivering to ${store?.name || 'Store'}`}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[styles.truckMarker, { transform: [{ rotate: `${truckAngle}deg` }] }]}>
              <RNText style={styles.truckEmoji}>🚚</RNText>
            </View>
          </Marker>
        )}

        {routePoints.length > 0 && (
          <>
            <Polyline
              coordinates={routePoints}
              strokeColor={isInTransit ? "#ff9800" : "#1976d2"}
              strokeWidth={5}
              lineDashPattern={isInTransit ? [8, 8] : [15, 10]}
              lineCap="round"
              lineJoin="round"
            />
            {isInTransit && animatedRoutePoints.length > 1 && (
              <Polyline
                coordinates={animatedRoutePoints}
                strokeColor="#ff9800"
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
              />
            )}
            {!isInTransit && (
              <Polyline
                coordinates={routePoints}
                strokeColor="#1976d2"
                strokeWidth={5}
                lineDashPattern={[15, 10]}
                lineCap="round"
                lineJoin="round"
              />
            )}
          </>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 8,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPin: {
    width: 40,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#1976d2',
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  defaultMarker: {
    width: 40,
    height: 50,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  truckMarker: {
    width: 40,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  truckEmoji: {
    fontSize: 30,
  },
  fallbackContainer: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  fallbackText: {
    textAlign: 'center',
    marginVertical: 4,
    opacity: 0.7,
  },
});

