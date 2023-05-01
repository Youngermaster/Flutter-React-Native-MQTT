import paho.mqtt.client as mqtt

URL="localhost"

# Callback function to handle messages received from the broker


def on_message(client, userdata, message):
    print(
        f"Received message: {message.payload.decode()} on topic: {message.topic}")

# Callback function to handle successful connection to the broker


def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code: {rc}")
    client.subscribe("location/#")
    client.subscribe("TEST")
    client.subscribe("ping")
    client.subscribe("PONG")
    client.subscribe(
        "vehicle/62e4c0e3553e8d2825e2ab85/62ea1e148b4082585139623b")


# Create an MQTT client instance
client = mqtt.Client()

# Assign the callback functions
client.on_connect = on_connect
client.on_message = on_message

# Set the MQTT broker's address and port (replace with your broker's information)
broker_address = URL
broker_port = 1883

# Connect to the broker
client.connect(broker_address, broker_port)

# Start the loop to process incoming messages
client.loop_forever()
