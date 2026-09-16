import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { MapPin } from 'lucide-react-native';

interface InteractiveMapPickerProps {
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lng: number) => void;
  isLoading?: boolean;
  height?: number;
}

export const InteractiveMapPicker: React.FC<InteractiveMapPickerProps> = ({
  latitude,
  longitude,
  onLocationSelect,
  isLoading = false,
  height = 220,
}) => {
  const webViewRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const NativeWebView = WebView as any;

  // Generate self-contained Leaflet + OpenStreetMap HTML
  const generateMapHtml = (lat: number, lng: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; background: #F4F5F9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .custom-pin {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .custom-pin-inner {
      width: 32px;
      height: 32px;
      background: #181F4B;
      border: 3px solid #C9A876;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 10px rgba(24, 31, 75, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .custom-pin-dot {
      width: 10px;
      height: 10px;
      background: #C9A876;
      border-radius: 50%;
      transform: rotate(45deg);
    }
    .leaflet-control-attribution {
      font-size: 9px !important;
      background: rgba(255, 255, 255, 0.85) !important;
      padding: 2px 6px !important;
      border-radius: 4px !important;
      color: #6B7088 !important;
    }
    .leaflet-control-attribution a {
      color: #181F4B !important;
      text-decoration: none !important;
      font-weight: 600 !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var currentLat = ${lat};
    var currentLng = ${lng};
    
    // Initialize Leaflet Map
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: true
    }).setView([currentLat, currentLng], 16);

    // OpenStreetMap Standard Tile Layer (100% Free, Zero API Key)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Zoom control in top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Custom Navy & Gold Marker Icon
    var customIcon = L.divIcon({
      className: 'custom-pin',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      html: '<div class="custom-pin-inner"><div class="custom-pin-dot"></div></div>'
    });

    // Draggable Marker
    var marker = L.marker([currentLat, currentLng], {
      icon: customIcon,
      draggable: true,
      autoPan: true
    }).addTo(map);

    function sendLocationUpdate(lat, lng) {
      var msg = JSON.stringify({ type: 'LOCATION_CHANGED', latitude: lat, longitude: lng });
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(msg);
      } else if (window.parent) {
        window.parent.postMessage(msg, '*');
      }
    }

    // Drag Marker Event
    marker.on('dragend', function(e) {
      var pos = marker.getLatLng();
      sendLocationUpdate(pos.lat, pos.lng);
    });

    // Tap/Click on Map Event
    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      map.panTo(e.latlng);
      sendLocationUpdate(e.latlng.lat, e.latlng.lng);
    });

    // Handle messages from React Native to move camera
    window.addEventListener('message', function(event) {
      try {
        var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.type === 'FLY_TO' && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          marker.setLatLng([data.latitude, data.longitude]);
          map.flyTo([data.latitude, data.longitude], 16, { duration: 1.0 });
        }
      } catch (err) {}
    });
  </script>
</body>
</html>
`;

  // Listen to Web iframe postMessage
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleWebMessage = (event: MessageEvent) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data?.type === 'LOCATION_CHANGED' && data.latitude && data.longitude) {
            onLocationSelect(data.latitude, data.longitude);
          }
        } catch {}
      };

      window.addEventListener('message', handleWebMessage);
      return () => window.removeEventListener('message', handleWebMessage);
    }
  }, [onLocationSelect]);

  // Update map position when latitude/longitude props change
  useEffect(() => {
    const payload = JSON.stringify({
      type: 'FLY_TO',
      latitude,
      longitude,
    });

    if (Platform.OS === 'web') {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(payload, '*');
      }
    } else {
      webViewRef.current?.postMessage(payload);
    }
  }, [latitude, longitude]);

  const handleNativeMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.type === 'LOCATION_CHANGED' && data.latitude && data.longitude) {
        onLocationSelect(data.latitude, data.longitude);
      }
    } catch {}
  };

  return (
    <View style={[styles.wrapper, { height }]}>
      <View style={styles.mapFrame}>
        {Platform.OS === 'web' ? (
          <iframe
            ref={iframeRef}
            srcDoc={generateMapHtml(latitude, longitude)}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: 18,
            }}
            title="OpenStreetMap Picker"
          />
        ) : (
          <NativeWebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: generateMapHtml(latitude, longitude) }}
            onMessage={handleNativeMessage}
            style={{ width: '100%', height: '100%', borderRadius: 18 }}
            scrollEnabled={false}
            overScrollMode="never"
          />
        )}

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="#C9A876" size="small" />
            <Text style={styles.loadingText}>Memperbarui titik lokasi...</Text>
          </View>
        )}
      </View>

      {/* Official OpenStreetMap Attribution Banner */}
      <View style={styles.attributionBar}>
        <MapPin size={12} color="#C9A876" style={{ marginRight: 4 }} />
        <Text style={styles.attributionText}>
          Geser pin atau sentuh peta • Data Peta © OpenStreetMap contributors
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 14,
  },
  mapFrame: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
    backgroundColor: '#F4F5F9',
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(24, 31, 75, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  loadingText: {
    color: '#FFFFFF',
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    marginTop: 6,
  },
  attributionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
  },
  attributionText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#8A8F9E',
  },
});
