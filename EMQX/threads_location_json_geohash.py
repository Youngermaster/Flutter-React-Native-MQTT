import paho.mqtt.client as mqtt
import threading
import time
import random
import json
import pygeohash as gh

# Set the MQTT broker address and port
broker_address = "localhost"
broker_port = 1883

# Create a MQTT client instance
client = mqtt.Client()

# Connect to the MQTT broker
client.connect(broker_address, broker_port)

# Define a function that publishes messages to a given topic
def publish_to_topic(topic, driverId):
    while True:
        latitude = random.uniform(6.175786, 6.180395)
        longitude = random.uniform(-75.581079, -75.577513)
        # geohash = gh.encode(latitude, longitude)
        geohash = "9q9hv"

        message = {
            "driverId": driverId,
            "driverLocation": {
                "latitude": latitude,
                "longitude": longitude
            },
            "route": [],
            "registerId": "",
            "colorVehicle": True,
            "indexDriver": -1,
            "iconMetro": False
        }

        # Convert the message to JSON string
        json_message = json.dumps(message)

        # Publish to the geohash-based topic
        client.publish(f"location/{geohash}", json_message)
        print(f"Sent message to topic location/{geohash}: {json_message}")
        time.sleep(1)

# List of driverId
driverIds = ["64575d696ca2794dc626d5b8", "6457673431359f61e6ad036d", "630c56ea95629c26259dc55f", "630c56ea95629c26259dc420", "630c56ea95629c26259dc69z"]

# Create threads and start them
threads = [threading.Thread(target=publish_to_topic, args=("location", driverId)) for driverId in driverIds]
for thread in threads:
    thread.start()
