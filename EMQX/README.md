# `onMessageArrived(message: Message)`

Let's break down the onMessageArrived function step by step:

- When a new message arrives, the onMessageArrived function is called with the message as its argument. The message is an instance of the Message class provided by the react-native-paho-mqtt library.

- The payloadString property of the message object contains the actual content of the message as a string. This value is stored in the payload constant. For example, the first message would have the payload: "ID: 1 | Location: -32.559834, 76.037765".

- To extract the ID from the payload, the function first splits the payload string by the " | " separator, resulting in an array with two elements: ["ID: 1", "Location: -32.559834, 76.037765"]. Then, it takes the first element of this array ("ID: 1"), and splits it again by the ": " separator, resulting in another array: ["ID", "1"]. Finally, it extracts the second element of this array, which is the ID as a string (e.g., "1").

- The function updates the location data state by calling setLocationData with a callback function. The callback function receives the previous state as its argument (prevData). It returns a new state object that includes all the properties from the previous state (using the spread syntax: {...prevData}), as well as a new property with the key as the extracted ID and the value as the payload. In this case, the ID is used as the property name (e.g., "1"), and the payload is used as the property value (e.g., "ID: 1 | Location: -32.559834, 76.037765").

For the given input messages, the location data state would be updated as follows:

- After the first message: { "1": "ID: 1 | Location: -32.559834, 76.037765" }
- After the second message: { "1": "ID: 1 | Location: -32.559834, 76.037765", "3": "ID: 3 | Location: -39.486660, 114.856626" }
- After the third message: { "1": "ID: 1 | Location: -32.559834, 76.037765", "3": "ID: 3 | Location: -42.114024, -59.694751" } (Note that the location for ID 3 is updated)
- After the fourth message: { "1": "ID: 1 | Location: -32.559834, 76.037765", "3": "ID: 3 | Location: -42.114024, -59.694751", "2": "ID: 2 | Location: -25.391499, -38.235048" }

This function ensures that the location data state is always updated with the latest information for each unique ID.