import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Alert } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const LocationDisplay: React.FC = () => {
  const [location, setLocation] = useState<string>('Waiting for location...');

  const requestLocationPermission = async () => {
    const permission = Platform.OS === 'ios'
      ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
      : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

    let locationPermission = await check(permission);

    if (locationPermission === RESULTS.DENIED) {
      const newPermission = await request(permission);
      locationPermission = newPermission;
    }

    return locationPermission === RESULTS.GRANTED;
  };

  useEffect(() => {
    let locationInterval: NodeJS.Timeout;

    (async () => {
      const hasLocationPermission = await requestLocationPermission();

      if (!hasLocationPermission) {
        Alert.alert('Location permission denied');
        return;
      }

      locationInterval = setInterval(() => {
        Geolocation.getCurrentPosition(
          (position) => {
            const locationStr = `Lat: ${position.coords.latitude}, Long: ${position.coords.longitude}`;
            setLocation(locationStr);
          },
          (error) => {
            setLocation('Error getting location: ' + error.message);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      }, 1000);
    })();

    return () => clearInterval(locationInterval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{location}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default LocationDisplay;
