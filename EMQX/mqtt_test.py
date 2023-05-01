import paho.mqtt.client as mqtt

URL="localhost"

# Define callback function for message received
def on_message(client, userdata, message):
    print("Received message:", str(message.payload.decode("utf-8")))

# Connect to MQTT broker
client = mqtt.Client()
client.connect(URL, 1883, 60)

# Subscribe to pong topic
#client.subscribe("pong")
client.on_message = on_message

# Publish message to ping topic
client.publish("ping", "Hello, World! Ping")
# Publish message to PONG topic
client.publish("PONG", "Hello, World! Pong")
# Publish message to PONG topic
client.publish("vehicle/62e58349b143fc69509aee48/62e4c0e3553e8d2825e2ab85", "Hello, World! Geolocation")

# Loop forever to receive messages
client.loop_forever()

