import { Client, Message } from 'react-native-paho-mqtt';

// Set up an in-memory alternative to global localStorage
const myStorage = {
  setItem: (key, item) => {
    myStorage[key] = item;
  },
  getItem: (key) => myStorage[key],
  removeItem: (key) => {
    delete myStorage[key];
  },
};

class MqttService {
  constructor() {
    // Define your MQTT broker settings
    // const mqttHost = '10.0.2.2'; // for Android emulator bridge to localhost
    const mqttHost = '192.168.20.33'; // for Android emulator bridge to localhost
    const mqttPort = 8083; // Default MQTT port
    const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;

    // Create a client instance
    this.client = new Client({ uri: `ws://${mqttHost}:${mqttPort}/mqtt`, clientId: clientId, storage: myStorage });

    // Set up event handlers
    this.client.on('connectionLost', (responseObject) => {
      if (responseObject.errorCode !== 0) {
        console.log('onConnectionLost:', responseObject.errorMessage);
      }
    });
    this.client.on('messageReceived', (message) => {
      console.log('onMessageReceived:', message.payloadString);
    });
  }

  connect() {
    return this.client.connect();
  }

  sendMessage(topic, message) {
    const mqttMessage = new Message(message);
    mqttMessage.destinationName = topic;
    this.client.send(mqttMessage);
  }

  disconnect() {
    if (this.client.isConnected()) {
      this.client.disconnect();
    }
  }
}

export default new MqttService();
