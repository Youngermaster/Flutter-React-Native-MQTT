import paho.mqtt.client as mqtt

# Callback function to handle messages received from the broker
def on_message(client, userdata, message):
    print(f"Received message: {message.payload.decode()} on topic: {message.topic}")

# Callback function to handle successful connection to the broker
def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code: {rc}")
    client.subscribe("ping")
    client.subscribe("PONG")

# Create an MQTT client instance
client = mqtt.Client()

# Assign the callback functions
client.on_connect = on_connect
client.on_message = on_message

# Set the MQTT broker's address and port (replace with your broker's information)
broker_address = "localhost"
broker_port = 1883

# Connect to the broker
client.connect(broker_address, broker_port)

# Start the loop to process incoming messages
client.loop_forever()

