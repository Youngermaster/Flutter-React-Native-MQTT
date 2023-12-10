import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StatusBar,
  Text,
  useColorScheme,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {Client, Message} from 'react-native-paho-mqtt';
import BackgroundFetch from 'react-native-background-fetch';

const App: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [location, setLocation] = useState({latitude: 0, longitude: 0});

  // Set up an in-memory alternative to global localStorage
  const myStorage = {
    setItem: (key, item) => {
      myStorage[key] = item;
    },
    getItem: key => myStorage[key],
    removeItem: key => {
      delete myStorage[key];
    },
  };

  // Create a client instance
  const client = new Client({
    uri: 'ws://192.168.20.33:8083/mqtt',
    clientId: 'yourClientId',
    storage: myStorage,
  });

  const fetchLocation = async () => {
    // Get current location and send it to MQTT
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        setLocation({latitude, longitude});

        const locationMessage = new Message(
          JSON.stringify({latitude, longitude}),
        );
        locationMessage.destinationName = 'locationTopic';
        client.send(locationMessage);
      },
      error => console.log(error),
      {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000},
    );
  };

  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);

      if (
        granted['android.permission.ACCESS_FINE_LOCATION'] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.ACCESS_COARSE_LOCATION'] ===
          PermissionsAndroid.RESULTS.GRANTED
      ) {
        console.log('Location permissions granted');
        if (Platform.Version >= 29) {
          const backgroundGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
          );

          if (backgroundGranted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Background location permission granted');
          } else {
            console.log('Background location permission denied');
          }
        }
      } else {
        console.log('Location permissions denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  // Configure BackgroundFetch
  const initBackgroundFetch = async () => {
    const onEvent = async taskId => {
      console.log('[BackgroundFetch] task: ', taskId);
      await fetchLocation();
      BackgroundFetch.finish(taskId);
    };

    const onTimeout = async taskId => {
      console.warn('[BackgroundFetch] TIMEOUT task: ', taskId);
      BackgroundFetch.finish(taskId);
    };

    let status = await BackgroundFetch.configure(
      {minimumFetchInterval: 15},
      onEvent,
      onTimeout,
    );

    console.log('[BackgroundFetch] configure status: ', status);
  };

  useEffect(() => {
    requestLocationPermission();
    client
      .connect()
      .then(() => {
        console.log('Connected to MQTT Broker!');
        initBackgroundFetch();
      })
      .catch(error => {
        console.log('Connection failed: ', error);
      });

    return () => {
      client.disconnect();
      BackgroundFetch.stop();
    };
  }, []);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#333' : '#FFF',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Text>Current Location</Text>
      <Text>Latitude: {location.latitude}</Text>
      <Text>Longitude: {location.longitude}</Text>
    </SafeAreaView>
  );
};

export default App;
