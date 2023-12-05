import { Client } from 'react-native-paho-mqtt';

class MqttService {
  constructor() {
    // Define your MQTT broker settings
    const mqttHost = '10.0.2.2'; // for Android emulator bridge to localhost
    const mqttPort = 1883; // Default MQTT port
    const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;

    // Create a client instance
    this.client = new Client({ uri: `ws://${mqttHost}:${mqttPort}/mqtt`, clientId: clientId });

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
    const mqttMessage = new Paho.Message(message);
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
