
# Mobile App Backend for Real-Time Data Processing

This project serves as the backend for a mobile application, handling data transfer from an MQTT broker to Firebase realtime database and performing real-time calculations. Built in JavaScript with Node.js.

## Features

- **Data Transfer:** Listens to MQTT topics to receive real-time sensor data, then forwards this data to Firebase Realtime Database, making it accessible to mobile applications.
- **Average Calculation:** Calculates the average of sensor values over specified intervals (e.g., hourly, daily (over the period of a week oa a month)) to provide summarized insights.
- **Firebase Integration:** Uses Firebase Admin SDK to securely store and retrieve data, supporting scalable and efficient data handling for mobile app integration.


## Technologies

- **Node.js:** Backend server for handling data processing.
- **Firebase Admin SDK:** Manages data storage and retrieval within Firebase Realtime Database.
- **MQTT Protocol:** Provides lightweight and efficient data transfer for IoT sensors.

## Getting Started

1. Clone this repository:
   ```bash
   git clone https://github.com/AhmedCha/Capteur-Temperature-NodeJS.git
   ```
2. Get adminsdk .json file from Firebase and copy it to root directory as ```firebase-adminsdk.json```
3. Install dependencies using ```npm install```.
4. Run the server: 
- To send MQTT data to Firebase, use:
   ```
   node mqtt-to-firebase.js
   ``` 
- To calculate average values, use:
   ```
   node calculate-averages.js
   ``` 
Alternatively you can simply execute ```Start-calculate-averages.bat``` or ```Start-mqtt-to-firebase.bat```
