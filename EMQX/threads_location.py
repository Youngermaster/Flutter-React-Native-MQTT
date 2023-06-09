import paho.mqtt.client as mqtt
import threading
import time
import random

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
        latitude = random.uniform(6.10, 6.20)
        longitude = random.uniform(-75, -75.6)
        random_id = random.randint(1, 3)  # Changed the range to 1-3
        message = f"ID: {random_id} | Location: {latitude:.6f}, {longitude:.6f}"
        client.publish(topic, message)
        print(f"Sent message to topic {topic}: {message}")
        time.sleep(1)


# Create a thread for each topic and start them
topics = ["location/1", "location/2", "location/3"]
threads = []
for topic in topics:
    thread = threading.Thread(target=publish_to_topic, args=(topic,))
    thread.start()
    threads.append(thread)
