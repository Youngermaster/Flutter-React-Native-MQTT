// Import React hooks and React Native components
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
// Import MQTT client and message from the library
import { Client, Message } from 'react-native-paho-mqtt';
import MapView, { Marker } from 'react-native-maps';
import customMarkerImage from './assets/bus_marker.png';


// Define a custom storage object for the MQTT client
const myStorage = {
  // Function to store an item using the given key
  setItem: (key: string, item: string) => {
    myStorage[key] = item;
  },
  // Function to retrieve an item using the given key
  getItem: (key: string) => myStorage[key],
  // Function to remove an item using the given key
  removeItem: (key: string) => {
    delete myStorage[key];
  },
};

// Define the MQTTLocationComponent
const MQTTLocationComponent = () => {
  // Create a state variable to store the location data
  const [locationData, setLocationData] = useState<Record<string, string>>({});

  // Use an effect to handle MQTT client initialization and cleanup
  useEffect(() => {
    // Create a new MQTT client with the given configuration
    const client = new Client({
      uri: 'ws://10.0.2.2:8083/mqtt',
      clientId: 'rn-client',
      storage: myStorage,
    });

    // Define a callback for handling connection loss
    const onConnectionLost = (responseObject: { errorMessage: string }) => {
      console.log('Connection lost:', responseObject.errorMessage);
    };

    // Define a callback for handling incoming messages
    const onMessageArrived = (message: Message) => {
      // ! Uncomment here if you want to LOG, I use MQTTX so I don't need to log here.
      // console.log('Received message:', message.payloadString);
      const payload = message.payloadString;
      const id = payload.split(' | ')[0].split(': ')[1]; // Extract the ID from the message
      // Update the location data state with the received message
      setLocationData((prevData) => ({ ...prevData, [id]: payload }));
    };

    // Register the callbacks with the MQTT client
    client.on('connectionLost', onConnectionLost);
    client.on('messageReceived', onMessageArrived);

    // Connect to the MQTT broker and subscribe to the location topic
    client
      .connect()
      .then(() => {
        console.log('Connected to MQTT broker');
        client.subscribe('location/#');
      })
      .catch((error: any) => {
        console.log('Failed to connect to MQTT broker:', error);
      });

    // Cleanup function to disconnect from the MQTT broker when the component is unmounted
    return () => {
      if (client.isConnected()) {
        client.disconnect();
      }
    };
  }, []);

  // Render the location data as a list of Text components
  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: 0,
        longitude: 0,
        latitudeDelta: 180,
        longitudeDelta: 360,
      }}
    >
      {Object.entries(locationData).map(([id, message]) => {
        const [, lat, lon] = message.match(/Location: (.*), (.*)/);
        return (
          <Marker
            key={id}
            coordinate={{
              latitude: parseFloat(lat),
              longitude: parseFloat(lon),
            }}
            image={customMarkerImage}
          />
        );
      })}
    </MapView>
  );
};

// Export the MQTTLocationComponent
export default MQTTLocationComponent;
