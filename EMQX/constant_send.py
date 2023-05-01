import paho.mqtt.client as mqtt
import time

# Set the MQTT broker address and port
broker_address = "localhost"
broker_port = 1883

# Create a MQTT client instance
client = mqtt.Client()

# Connect to the MQTT broker
client.connect(broker_address, broker_port)

# Set the topics to which we'll send messages
topics = ["TEST", "ping", "PONG"]

# Send a message to each topic every 100 ms
while True:
    message = "Hello, world!"
    for topic in topics:
        client.publish(topic, message)
        print("Sent message to topic {}: {}".format(topic, message))
    time.sleep(0.01)

