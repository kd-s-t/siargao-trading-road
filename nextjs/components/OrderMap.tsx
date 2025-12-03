'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Box, Typography } from '@mui/material';
import { User } from '@/lib/users';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then((mod) => mod.Polyline), { ssr: false });

type LeafletType = typeof import('leaflet');
let L: LeafletType | null = null;
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  L = require('leaflet') as LeafletType;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('leaflet/dist/leaflet.css');
  
  if (L && L.Icon && L.Icon.Default && L.Icon.Default.prototype) {
    delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }
}

const getStoreIcon = (logoUrl?: string) => {
  if (typeof window === 'undefined' || !L) return null;
  
  if (logoUrl) {
    return L.divIcon({
      html: `
        <div style="position: relative; width: 40px; height: 50px;">
          <svg width="40" height="50" viewBox="0 0 40 50" style="position: absolute; top: 0; left: 0; z-index: 1;">
            <path d="M20 0 C30 0, 40 8, 40 18 C40 28, 20 50, 20 50 C20 50, 0 28, 0 18 C0 8, 10 0, 20 0 Z" fill="#1976d2" stroke="#fff" stroke-width="2"/>
          </svg>
          <img src="${logoUrl}" style="position: absolute; top: 4px; left: 4px; width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); z-index: 2; background: white;" onerror="this.style.display='none'" />
        </div>
      `,
      className: 'store-marker-icon',
      iconSize: [40, 50],
      iconAnchor: [20, 50],
      popupAnchor: [0, -50],
    });
  }
  
  return new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

const getTruckIcon = (logoUrl?: string) => {
  if (typeof window === 'undefined' || !L) return null;
  
  if (logoUrl) {
    return L.divIcon({
      html: `
        <div style="position: relative; width: 40px; height: 50px;">
          <svg width="40" height="50" viewBox="0 0 40 50" style="position: absolute; top: 0; left: 0; z-index: 1;">
            <path d="M20 0 C30 0, 40 8, 40 18 C40 28, 20 50, 20 50 C20 50, 0 28, 0 18 C0 8, 10 0, 20 0 Z" fill="#f44336" stroke="#fff" stroke-width="2"/>
          </svg>
          <img src="${logoUrl}" style="position: absolute; top: 4px; left: 4px; width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); z-index: 2; background: white;" onerror="this.style.display='none'" />
        </div>
      `,
      className: 'supplier-marker-icon',
      iconSize: [40, 50],
      iconAnchor: [20, 50],
      popupAnchor: [0, -50],
    });
  }
  
  return new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

const getMovingTruckIcon = (angle: number = 0) => {
  if (typeof window === 'undefined' || !L) return null;
  return L.divIcon({
    html: `<img src="/truck.png" style="transform: rotate(${angle}deg); width: 40px; height: 20px;" />`,
    className: 'moving-truck-icon',
    iconSize: [40, 20],
    iconAnchor: [20, 10],
    popupAnchor: [0, -10],
  });
};

const calculateBearing = (point1: [number, number], point2: [number, number]): number => {
  const lat1 = point1[0] * Math.PI / 180;
  const lat2 = point2[0] * Math.PI / 180;
  const dLon = (point2[1] - point1[1]) * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
};

interface OrderMapProps {
  store?: User;
  supplier?: User;
  status?: string;
  height?: number;
}

const SIARGAO_CENTER: [number, number] = [9.8563, 126.0483];

export function OrderMap({ store, supplier, status, height = 250 }: OrderMapProps) {
  const [mounted, setMounted] = useState(false);
  const [truckPosition, setTruckPosition] = useState<[number, number] | null>(null);
  const [truckAngle, setTruckAngle] = useState<number>(0);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [animatedRoutePoints, setAnimatedRoutePoints] = useState<[number, number][]>([]);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);
  const routeCacheKey = useRef<string>('');

  useEffect(() => {
    setMounted(true);
    
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        .leaflet-control-attribution {
          display: none !important;
        }
        .leaflet-control-zoom {
          display: none !important;
        }
        .leaflet-container {
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
        }
        .leaflet-map-pane {
          margin: 0 !important;
          padding: 0 !important;
        }
        .leaflet-tile-container {
          margin: 0 !important;
          padding: 0 !important;
        }
        .leaflet-pane {
          margin: 0 !important;
          padding: 0 !important;
        }
      `;
      if (!document.head.querySelector('style[data-map-hide-controls]')) {
        style.setAttribute('data-map-hide-controls', 'true');
        document.head.appendChild(style);
      }
    }
  }, []);

  const storeLocation: [number, number] | null = store?.latitude && store?.longitude
    ? [store.latitude, store.longitude]
    : null;

  const supplierLocation: [number, number] | null = supplier?.latitude && supplier?.longitude
    ? [supplier.latitude, supplier.longitude]
    : null;

  const isInTransit = status === 'in_transit';

  useEffect(() => {
    if (!storeLocation || !supplierLocation || !mounted || isFetchingRoute) {
      if (!storeLocation || !supplierLocation) {
        setRoutePoints([]);
        routeCacheKey.current = '';
      }
      return;
    }

    const cacheKey = `${supplierLocation[0]},${supplierLocation[1]}-${storeLocation[0]},${storeLocation[1]}`;
    if (routeCacheKey.current === cacheKey && routePoints.length > 0) {
      return;
    }

    const fetchRoute = async () => {
      setIsFetchingRoute(true);
      routeCacheKey.current = cacheKey;
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${supplierLocation[1]},${supplierLocation[0]};${storeLocation[1]},${storeLocation[0]}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes[0] && data.routes[0].geometry) {
          const coordinates = data.routes[0].geometry.coordinates;
          if (coordinates && coordinates.length > 2) {
            const points: [number, number][] = coordinates.map((coord: number[]) => [coord[1], coord[0]]);
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
  }, [storeLocation, supplierLocation, mounted]);

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

  const center: [number, number] = storeLocation || supplierLocation || SIARGAO_CENTER;

  if (!mounted) {
    return (
      <Box sx={{ width: '100%', height, position: 'relative', bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Loading map...
        </Typography>
      </Box>
    );
  }

  const bounds = storeLocation && supplierLocation && L
    ? L.latLngBounds([storeLocation, supplierLocation])
    : null;

  return (
    <Box sx={{ width: '100%', height, position: 'relative', margin: 0, padding: 0, overflow: 'hidden', '& > *': { margin: 0, padding: 0 } }}>
      <MapContainer
        center={center}
        zoom={storeLocation && supplierLocation ? undefined : 13}
        bounds={bounds || undefined}
        style={{ height: '100%', width: '100%', zIndex: 0, margin: 0, padding: 0, border: 'none' }}
        scrollWheelZoom={false}
        zoomControl={false}
      >
        <TileLayer
          attribution=""
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {storeLocation && (
          <Marker position={storeLocation} icon={getStoreIcon(store?.logo_url) || undefined}>
            <Popup>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Store Location
              </Typography>
              {store?.name && <Typography variant="body2">{store.name}</Typography>}
              {store?.address && <Typography variant="caption">{store.address}</Typography>}
            </Popup>
          </Marker>
        )}
        {supplierLocation && (
          <Marker position={supplierLocation} icon={getTruckIcon(supplier?.logo_url) || undefined}>
            <Popup>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Supplier Location
              </Typography>
              {supplier?.name && <Typography variant="body2">{supplier.name}</Typography>}
              {supplier?.address && <Typography variant="caption">{supplier.address}</Typography>}
            </Popup>
          </Marker>
        )}
        {isInTransit && truckPosition && (
          <Marker position={truckPosition} icon={getMovingTruckIcon(truckAngle) || undefined}>
            <Popup>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Truck in Transit
              </Typography>
              <Typography variant="body2">Delivering to {store?.name || 'Store'}</Typography>
            </Popup>
          </Marker>
        )}
        {routePoints.length > 0 && (
          <>
            <Polyline
              positions={routePoints}
              color={isInTransit ? "#ff9800" : "#1976d2"}
              weight={5}
              opacity={0.3}
              dashArray={isInTransit ? "8, 8" : "15, 10"}
            />
            {isInTransit && animatedRoutePoints.length > 1 && (
              <Polyline
                positions={animatedRoutePoints}
                color="#ff9800"
                weight={5}
                opacity={0.9}
              />
            )}
            {!isInTransit && (
              <Polyline
                positions={routePoints}
                color="#1976d2"
                weight={5}
                opacity={0.9}
                dashArray="15, 10"
              />
            )}
          </>
        )}
      </MapContainer>
    </Box>
  );
}

