// Import React hooks and React Native components
import React, { useState, useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
// Import MQTT client and message from the library
import { Client, Message } from 'react-native-paho-mqtt';
import MapView, { Marker } from 'react-native-maps';
import customMarkerImage from './assets/bus_marker.png';

interface LocationData {
  [id: string]: {
    driverLocation: {
      latitude: number;
      longitude: number;
    };
    route: any[];
    registerId: string;
    colorVehicle: boolean;
    indexDriver: number;
    iconMetro: boolean;
  };
}

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
  const [locationData, setLocationData] = useState<LocationData>({});
  // Create a ref for the last received message flag
  const lastReceivedMessageRef = useRef<boolean>(false);

  // Use an effect to handle MQTT client initialization and cleanup
  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;

    // Create a new MQTT client with the given configuration
    const client = new Client({
      uri: 'ws://10.0.2.2:8083/mqtt',
      clientId: 'rn-client',
      storage: myStorage,
    });

    // Define a callback for handling connection loss
    const onConnectionLost = (responseObject: { errorMessage: string }) => {
      console.log('Connection lost:', responseObject.errorMessage);
      lastReceivedMessageRef.current = false; // Set the flag to false when connection is lost
    };

    // Define a callback for handling incoming messages
    const onMessageArrived = (message: Message) => {
      const payload = message.payloadString;
      try {
        const data = JSON.parse(payload);
        const id = message.destinationName.split('/')[1]; // Extract the ID from the topic
        setLocationData((prevData) => ({ ...prevData, [id]: data }));
        lastReceivedMessageRef.current = true; // Set the flag to true when a message is received
      } catch (error) {
        console.log('Failed to parse message:', error);
      }
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

    // Cleanup function to disconnect from the MQTT broker and clear the timeout when the component is unmounted
    return () => {
      if (client.isConnected()) {
        client.disconnect();
      }
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

  // Add a new useEffect for handling the timeout logic
  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;

    // Check if a message was received
    if (lastReceivedMessageRef.current) {
      // Reset the flag and set the timeout again
      lastReceivedMessageRef.current = false;
      timeout = setTimeout(() => {
        // Check if no message was received during the timeout
        if (!lastReceivedMessageRef.current) {
          console.log('No data received. Flashing components or taking action...');
          setLocationData({}); // Clear the locationData state
        }
      }, 1000);
    }

    // Cleanup function to clear the timeout when the component is updated or unmounted
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [lastReceivedMessageRef.current]);

  // Render the location data as markers on the map
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
      {Object.entries(locationData).map(([id, data]) => {
        const { latitude, longitude } = data.driverLocation;
        return (
          <Marker
            key={id}
            coordinate={{
              latitude,
              longitude,
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
