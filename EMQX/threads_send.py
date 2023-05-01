import paho.mqtt.client as mqtt
import threading
import time

# Set the MQTT broker address and port
broker_address = "localhost"
broker_port = 1883

# Create a MQTT client instance
client = mqtt.Client()

# Connect to the MQTT broker
client.connect(broker_address, broker_port)

# Define a function that publishes messages to a given topic
def publish_to_topic(topic):
    while True:
        message = "Hello, world from {}!".format(topic)
        client.publish(topic, message)
        print("Sent message to topic {}: {}".format(topic, message))
        time.sleep(0.0045)

# Create a thread for each topic and start them
topics = ["TEST", "ping", "PONG"]
threads = []
for topic in topics:
    thread = threading.Thread(target=publish_to_topic, args=(topic,))
    thread.start()
    threads.append(thread)

