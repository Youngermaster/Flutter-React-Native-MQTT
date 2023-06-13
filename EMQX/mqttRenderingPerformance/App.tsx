import React, { useState, useEffect, useRef } from 'react';
import { PermissionsAndroid } from 'react-native';
import { Client, Message } from 'react-native-paho-mqtt';
import Geolocation from 'react-native-geolocation-service';
import ngeohash from 'ngeohash';
import MapView, { Marker } from 'react-native-maps';
import customMarkerImage from './assets/bus_marker.png';

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
  timestamp: number;
}

interface LocationData {
  [geohash: string]: DriverData[];
}

const myStorage = {
  setItem: (key: string, item: string) => {
    myStorage[key] = item;
  },
  getItem: (key: string) => myStorage[key],
  removeItem: (key: string) => {
    delete myStorage[key];
  },
};

async function requestLocationPermission() {
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

const MQTTLocationComponent = () => {
  const [locationData, setLocationData] = useState<LocationData>({});
  const lastReceivedMessageRef = useRef<boolean>(false);

  useEffect(() => {
    let client: Client;
    let currentGeohash: string;

    const getClient = async () => {
      const hasPermission = await requestLocationPermission();

      if (!hasPermission) {
        console.log('Location permission not granted. Unable to proceed.');
        return;
      }

      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          currentGeohash = ngeohash.encode(latitude, longitude, 5);
          console.log(currentGeohash);

          client = new Client({
            uri: 'ws://10.0.2.2:8083/mqtt',
            clientId: 'rn-client',
            storage: myStorage,
          });

          const onConnectionLost = (responseObject: { errorMessage: string }) => {
            console.log('Connection lost:', responseObject.errorMessage);
            lastReceivedMessageRef.current = false;
          };

          const onMessageArrived = (message: Message) => {
            const payload = message.payloadString;
            try {
              const data = JSON.parse(payload);
              const geohash = message.destinationName.split('/')[1];

              setLocationData((prevData) => {
                let updatedData = {...prevData};
                if (!updatedData[geohash]) {
                  updatedData[geohash] = [];
                }
                const driverIndex = updatedData[geohash].findIndex(driverData => driverData.driverId === data.driverId);
                if (driverIndex >= 0) {
                  updatedData[geohash][driverIndex] = {...data, timestamp: Date.now() };
                } else {
                  updatedData[geohash].push({ ...data, timestamp: Date.now() });
                }
                return updatedData;
              });
              lastReceivedMessageRef.current = true;
            } catch (error) {
              console.log('Failed to parse message:', error);
            }
          };

          client.on('connectionLost', onConnectionLost);
          client.on('messageReceived', onMessageArrived);

          client
            .connect()
            .then(() => {
              console.log('Connected to MQTT broker');
              client.subscribe(`location/${currentGeohash}/#`);
            })
            .catch((error: any) => {
              console.log('Failed to connect to MQTT broker:', error);
            });
        },
        (error) => {
          console.log('Error getting location', error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    };

    getClient();

    return () => {
      if (client && client.isConnected()) {
        client.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const checkStaleDrivers = setInterval(() => {
      setLocationData((prevData) => {
        let updatedData = {...prevData};
        const currentTime = Date.now();

        for (let geohash in updatedData) {
          updatedData[geohash] = updatedData[geohash].filter(driverData => currentTime - driverData.timestamp < 5000);
          if (updatedData[geohash].length === 0) {
            delete updatedData[geohash];
          }
        }

        return updatedData;
      });
    }, 5000);

    return () => {
      clearInterval(checkStaleDrivers);
    };
  }, []);

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
