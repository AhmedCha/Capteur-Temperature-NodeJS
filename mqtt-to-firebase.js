require('dotenv').config();

const admin = require("firebase-admin");
const mqtt = require('mqtt');
const path = require('path');

// Firebase Admin Initialization
var serviceAccount = require("./cothings-esp32-firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cothings-esp32-default-rtdb.firebaseio.com"
});

const db = admin.database();
const ref = db.ref('TemperatureSensorData');

// MQTT Options with TLS
const mqttOptions = {
  host: 'c6780cfec9814f9eae33835beeda43f3.s1.eu.hivemq.cloud',
  port: 8883,
  protocol: 'mqtts',
  username: 'MQTT-Firebase',
  password: 'Secure*Password1',
  rejectUnauthorized: false,
};

const mqttClient = mqtt.connect(mqttOptions);

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  mqttClient.subscribe('#', (err) => {
    if (err) {
      console.error('Subscription error:', err);
    } else {
      console.log('Subscribed to topic: #');
    }
  });
});

mqttClient.on('message', (topic, message) => {
  console.log(`Received message: ${message.toString()} on topic: ${topic}`);

  const currentTime = Date.now();
  const formattedTime = convertTimestampToCET(currentTime);
  let temperature = parseFloat(message.toString()).toFixed(2);

  ref.push({
    temperature: temperature,
    timestamp: formattedTime,
  });
});


mqttClient.on('error', (error) => {
  console.error(`MQTT Client Error: ${error}`);
});

mqttClient.on('offline', () => {
  console.log('MQTT Client is offline');
});

mqttClient.on('reconnect', () => {
  console.log('MQTT Client is reconnecting');
});

function convertTimestampToCET(timestamp) {
  // Create a date object from the timestamp
  let date = new Date(timestamp);

  // Convert to CET/CEST using toLocaleString
  let formattedDate = date.toLocaleString('en-GB', { timeZone: 'Africa/Tunis' });
  return formattedDate;
}
