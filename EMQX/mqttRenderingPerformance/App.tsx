// Import the necessary modules from react, react-native, and third-party libraries
import React, { useState, useEffect, useRef } from 'react';
import { PermissionsAndroid } from 'react-native';
import { Client, Message } from 'react-native-paho-mqtt';  // MQTT client for react-native
import Geolocation from 'react-native-geolocation-service';  // Geolocation service for react-native
import ngeohash from 'ngeohash';  // Geohashing library
import MapView, { Marker } from 'react-native-maps';  // MapView component for displaying Google Maps
import customMarkerImage from './assets/bus_marker.png';  // Import custom marker image for the map

// Define the data structure for each driver
interface DriverData {
  driverId: string;
  driverLocation: {
    latitude: number;
    longitude: number;
  };
  route: any[];
  registerId: string;
  colorVehicle: boolean;
  indexDriver: number;
  iconMetro: boolean;
  timestamp: number;  // Added timestamp to track the last update of driver data
}

// Define the data structure for location data. It's a map from geohash to an array of driver data.
interface LocationData {
  [geohash: string]: DriverData[];
}

// A custom storage object used by the MQTT client. This is where the MQTT client will store its persistent data.
const myStorage = {
  setItem: (key: string, item: string) => {
    myStorage[key] = item;
  },
  getItem: (key: string) => myStorage[key],
  removeItem: (key: string) => {
    delete myStorage[key];
  },
};

// Function to request location permissions from the user.
// This is necessary to use the geolocation service in Android.
async function requestLocationPermission() {
  // Wrapped in try-catch to handle permission request errors
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'This App needs access to your location.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    // Check if permission is granted
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Location permission granted');
      return true;
    } else {
      console.log('Location permission denied');
      return false;
    }
  } catch (err) {
    console.warn(err);
    return false;
  }
}

// Main component that uses the MQTT client to receive location updates
const MQTTLocationComponent = () => {
  // Location data state and its setter function. This state will store all the location data received from the MQTT broker.
  const [locationData, setLocationData] = useState<LocationData>({});
  // Reference to the last received message flag. This flag is used to indicate whether the connection to the MQTT broker is alive.
  const lastReceivedMessageRef = useRef<boolean>(false);

  useEffect(() => {
    // Declare the MQTT client and the current geohash
    let client: Client;
    let currentGeohash: string;

    const getClient = async () => {
      // Request location permission
      const hasPermission = await requestLocationPermission();

      // Check if permission was granted
      if (!hasPermission) {
        console.log('Location permission not granted. Unable to proceed.');
        return;
      }

      // Get the current geolocation
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Generate the geohash for the current location
          currentGeohash = ngeohash.encode(latitude, longitude, 5);
          console.log(currentGeohash);

          // Initialize the MQTT client
          client = new Client({
            uri: 'ws://10.0.2.2:8083/mqtt',
            clientId: 'rn-client',
            storage: myStorage,
          });

          // Callback function for handling connection lost
          const onConnectionLost = (responseObject: { errorMessage: string }) => {
            console.log('Connection lost:', responseObject.errorMessage);
            lastReceivedMessageRef.current = false;
          };

          // Callback function for handling message arrival
          const onMessageArrived = (message: Message) => {
            // The payload of the message (expected to be a JSON string)
            const payload = message.payloadString;

            // Attempt to parse the payload to a JavaScript object
            try {
              // Parsing the payload string into a JSON object
              const data = JSON.parse(payload);

              // The geohash is assumed to be the second part of the topic name (splitting by '/')
              const geohash = message.destinationName.split('/')[1];

              // Update the location data state based on the newly arrived message
              setLocationData((prevData) => {
                // Cloning the previous data for immutability
                let updatedData = { ...prevData };

                // If this geohash has no corresponding array in the data yet, create one
                if (!updatedData[geohash]) {
                  updatedData[geohash] = [];
                }

                // Attempt to find the driver in the array of this geohash's data
                const driverIndex = updatedData[geohash].findIndex(
                  driverData => driverData.driverId === data.driverId
                );

                // If the driver was found, update the driver's data, else add new driver data
                if (driverIndex >= 0) {
                  // Updating the existing driver's data with the new data and a fresh timestamp
                  updatedData[geohash][driverIndex] = { ...data, timestamp: Date.now() };
                } else {
                  // Pushing the new driver data (with a fresh timestamp) into the geohash's array
                  updatedData[geohash].push({ ...data, timestamp: Date.now() });
                }
                // Return the updated data to trigger a state update
                return updatedData;
              });

              // Set that a message was received (used for other parts of the code to track connection status)
              lastReceivedMessageRef.current = true;
            } catch (error) {
              // If the payload parsing failed, log an error
              console.log('Failed to parse message:', error);
            }
          };

          // Set the connection lost and message arrival handlers
          client.on('connectionLost', onConnectionLost);
          client.on('messageReceived', onMessageArrived);

          // Connect to the MQTT broker
          client
            .connect()
            .then(() => {
              console.log('Connected to MQTT broker');
              // Subscribe to the current location's topic
              client.subscribe(`location/${currentGeohash}/#`);
            })
            .catch((error: any) => {
              console.log('Failed to connect to MQTT broker:', error);
            });
        },
        (error) => {
          console.log('Error getting location', error);
        },
        // Configuration for the geolocation request
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    };

    // Invoke the getClient function to get and setup the MQTT client
    getClient();

    // Disconnect from the MQTT broker when the component is unmounted
    return () => {
      if (client && client.isConnected()) {
        client.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    // Set an interval to periodically (every 5 seconds) check if any driver data is stale
    const checkStaleDrivers = setInterval(() => {
      // We need to update the location data state
      setLocationData((prevData) => {
        // Cloning the previous data for immutability
        let updatedData = { ...prevData };

        // The current time for comparing with driver timestamps
        const currentTime = Date.now();

        // Iterate over all the geohashes in the data
        for (let geohash in updatedData) {
          // Filter the drivers of this geohash to only include ones that have a timestamp within the last 5 seconds
          updatedData[geohash] = updatedData[geohash].filter(driverData => currentTime - driverData.timestamp < 5000);
          // If the geohash has no drivers left after filtering, remove it from the data
          if (updatedData[geohash].length === 0) {
            delete updatedData[geohash];
          }
        }

        // Return the updated data to trigger a state update
        return updatedData;
      });
    }, 5000);

    // Clear the interval when the component is unmounted to prevent memory leaks
    return () => {
      clearInterval(checkStaleDrivers);
    };
  }, []); // Empty dependency array to only run this effect once, on mount

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
      {/* Map each driver data to a marker on the map */}
      {Object.values(locationData).flat().map((data) => {
        const { latitude, longitude } = data.driverLocation;
        return (
          <Marker
            key={data.driverId}
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

export default MQTTLocationComponent;
