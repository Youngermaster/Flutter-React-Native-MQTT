import React, { useState, useEffect } from 'react';
import { Text, View, Button } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import MqttService from './MqttService';

const LOCATION_TASK_NAME = 'background-location-task';

export default function LocationDisplay() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // This effect runs once on mount to connect to the MQTT broker
  useEffect(() => {
    MqttService.connect().catch((error) => {
      console.error('Could not connect to MQTT broker', error);
    });

    return () => {
      MqttService.disconnect();
    };
  }, []);

  // Foreground Location Tracking
  useEffect(() => {
    let locationSubscription;

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      locationSubscription = setInterval(async () => {
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
        const locationData = JSON.stringify(currentLocation);
        MqttService.sendMessage('your/location/topic', locationData);
      }, 1000);

    })();

    return () => {
      if (locationSubscription) {
        clearInterval(locationSubscription);
      }
    };
  }, []);

  // Request permissions and start the background task
  const startLocationTracking = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Foreground permission to access location was denied');
      return;
    }

    status = await Location.requestBackgroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Background permission to access location was denied');
      return;
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      distanceInterval: 1,
      deferredUpdatesInterval: 1000,
    });
  };

  let text = 'Press the button to start tracking location';
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);
  }

  return (
    <View>
      <Button onPress={startLocationTracking} title="Start Location Tracking" />
      <Text>{text}</Text>
    </View>
  );
}

TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error('Location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const locationData = JSON.stringify(locations[0]);
    MqttService.sendMessage('your/location/topic', locationData);
  }
});
