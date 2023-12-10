import React, {useEffect, useState} from 'react';
import {SafeAreaView, StatusBar, Text, useColorScheme} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {Client, Message} from 'react-native-paho-mqtt';

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

  // Connect the client and set event handlers
  useEffect(() => {
    client
      .connect()
      .then(() => {
        console.log('Connected to MQTT Broker!');
      })
      .catch(error => {
        console.log('Connection failed: ', error);
      });

    const watchId = Geolocation.watchPosition(
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
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 1000,
        distanceFilter: 1,
      },
    );

    return () => {
      Geolocation.clearWatch(watchId);
      client.disconnect();
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
