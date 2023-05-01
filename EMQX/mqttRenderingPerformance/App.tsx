import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Client, Message } from 'react-native-paho-mqtt';

const myStorage = {
  setItem: (key: string, item: string) => {
    myStorage[key] = item;
  },
  getItem: (key: string) => myStorage[key],
  removeItem: (key: string) => {
    delete myStorage[key];
  },
};

const MQTTLocationComponent = () => {
  const [locationMessages, setLocationMessages] = useState<string[]>([]);

  useEffect(() => {
    const client = new Client({
      uri: 'ws://10.0.2.2:8083/mqtt',
      clientId: 'rn-client',
      storage: myStorage,
    });

    const onConnectionLost = (responseObject: { errorMessage: string }) => {
      console.log('Connection lost:', responseObject.errorMessage);
    };

    const onMessageArrived = (message: Message) => {
      console.log('Received message:', message.payloadString);
      setLocationMessages((prevMessages) => [...prevMessages, message.payloadString]);
    };

    client.on('connectionLost', onConnectionLost);
    client.on('messageReceived', onMessageArrived);

    client
      .connect()
      .then(() => {
        console.log('Connected to MQTT broker');
        client.subscribe('location/#');
      })
      .catch((error: any) => {
        console.log('Failed to connect to MQTT broker:', error);
      });

    return () => {
      if (client.isConnected()) {
        client.disconnect();
      }
    };
  }, []);

  return (
    <View>
      {locationMessages.map((message, index) => (
        <Text key={index}>{message}</Text>
      ))}
    </View>
  );
};

export default MQTTLocationComponent;
