import React, { useEffect, useState } from 'react';
import { View, Text, PermissionsAndroid, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';

function MapScreen() {
  const [location, setLocation] = useState(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(null);

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
            buttonPositive: 'Test'
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          // Permission granted
          console.log("Location permission granted");
          setLocationPermissionGranted(true);
        } else {
          // Permission denied
          console.log("Location permission denied");
          setLocationPermissionGranted(false);
        }
      } catch (err) {
        console.warn(err);
        console.log(err);
      }
    }
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (locationPermissionGranted) {
      Geolocation.getCurrentPosition(
        (position) => {
          setLocation(position.coords);
        },
        (error) => {
          console.log(error.code, error.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    }
  }, [locationPermissionGranted]);

  return (
    <View style={{ flex: 1 }}>
      {location ? (
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}>
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={"Your Location"}
          />
        </MapView>
      ) : (
        <Text>Getting the location...</Text>
      )}
    </View>
  );
}

export default MapScreen;
