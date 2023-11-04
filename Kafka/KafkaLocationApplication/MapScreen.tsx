import React, { useEffect, useState } from 'react';
import { View, Text, PermissionsAndroid, Platform } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';

function MapScreen() {
  const [location, setLocation] = useState(null);
  const [trail, setTrail] = useState([]);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  // Check for permission and request if not granted
  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      Geolocation.requestAuthorization('whenInUse');
      setLocationPermissionGranted(true);
    } else {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Access Required",
            message: "This app needs to access your location.",
            buttonPositive: "OK"
          }
        );
        setLocationPermissionGranted(granted === PermissionsAndroid.RESULTS.GRANTED);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    let watchId = null;

    if (locationPermissionGranted) {
      // Update location every 500ms
      watchId = Geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          // Update the trail state to include the new location
          setTrail((prevTrail) => [...prevTrail, { latitude, longitude }]);
        },
        (error) => {
          console.log(error.code, error.message);
        },
        { enableHighAccuracy: true, distanceFilter: 0, interval: 500 }
      );
    }

    // Clear watch on unmount
    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, [locationPermissionGranted]);

  return (
    <View style={{ flex: 1 }}>
      {location ? (
        <MapView
          style={{ flex: 1 }}
          region={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}>
          {/* Render the trail as a polyline */}
          <Polyline coordinates={trail} strokeColor="#000" strokeWidth={3} />
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={"Your Location"}
          />
        </MapView>
      ) : (
        <Text>{locationPermissionGranted ? 'Getting the location...' : 'Location permission not granted'}</Text>
      )}
    </View>
  );
}

export default MapScreen;
