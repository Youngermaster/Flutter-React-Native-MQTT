import React, { useState, useEffect } from 'react';
import { Text, View } from 'react-native';
import * as Location from 'expo-location';
import MqttService from './MqttService';

export default function LocationDisplay() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    // Connect to the MQTT broker
    MqttService.connect().then(() => {
      console.log('Connected to MQTT broker');
    }).catch((error) => {
      console.error('Could not connect to MQTT broker', error);
    });

    let locationSubscription;

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // Setting up the interval to fetch location every second
      locationSubscription = setInterval(async () => {
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }, 1000); // 1000 milliseconds = 1 second
    })();

    // Cleanup function to clear the interval and disconnect MQTT when the component is unmounted
    return () => {
      if (locationSubscription) {
        clearInterval(locationSubscription);
      }
      MqttService.disconnect();
    };
  }, []);

  // Send location data whenever it changes
  useEffect(() => {
    if (location) {
      const locationData = JSON.stringify(location);
      MqttService.sendMessage('your/location/topic', locationData);
    }
  }, [location]);

  let text = 'Waiting for location...';
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);
  }

  return (
    <View>
      <Text>{text}</Text>
    </View>
  );
}
