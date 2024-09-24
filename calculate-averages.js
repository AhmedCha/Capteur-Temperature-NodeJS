const admin = require('firebase-admin');
const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

// Firebase Admin Initialization
var serviceAccount = require("./cothings-esp32-firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cothings-esp32-default-rtdb.firebaseio.com"
});


const database = admin.database();

/**
 * Converts timestamp string to a Date object
 */
const parseTimestamp = (timestamp) => {
  const [datePart, timePart] = timestamp.split(", ");
  const [day, month, year] = datePart.split("/");
  const [hours, minutes, seconds] = timePart.split(":");

  return new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`);
};

/**
 * Filter data by time range
 */
const filterDataByTimeRange = (data, startTime, endTime) => {
  return Object.values(data).filter(item => {
    const itemTimestamp = parseTimestamp(item.timestamp).getTime();
    return itemTimestamp >= startTime && itemTimestamp <= endTime;
  });
};

/**
 * Format a date object to "DD/MM/YYYY, HH:MM" string
 */
const formatTimestamp = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year}, ${hours}:${minutes}`;
};

/**
 * Format a date object to "DD/MM/YYYY" string (for daily averages)
 */
const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Calculate average temperature for a set of data points
 */
const calculateAverage = (data) => {
  if (data.length === 0) return 0;
  const total = data.reduce((sum, item) => sum + parseFloat(item.temperature), 0);
  return total / data.length;
};

/**
 * Get averages for every hour in the past 24 hours
 */
const getHourlyAverages = (data) => {
  const now = new Date();
  now.setMinutes(0, 0, 0); // Round down to the nearest full hour (set minutes, seconds, ms to 0)

  let hourlyAverages = [];

  for (let i = 0; i < 24; i++) {
    const endTime = new Date(now.getTime() - i * ONE_HOUR); // Get the current hour
    const startTime = new Date(endTime.getTime() - ONE_HOUR); // Get the previous hour

    const hourData = filterDataByTimeRange(data, startTime.getTime(), endTime.getTime());

    const temperature = calculateAverage(hourData).toFixed(2);
    const timestamp = formatTimestamp(endTime); // Format as "DD/MM/YYYY, HH:00"

    hourlyAverages.unshift({ timestamp, temperature }); // Insert at the beginning to reverse the order
  }

  return hourlyAverages; // Array of 24 objects with "hour" and "average"
};

/**
 * Get averages for each day in the past week (7 days)
 */
const getDailyAverages = (data, days) => {
  const now = new Date().getTime();
  let dailyAverages = [];

  for (let i = 0; i < days; i++) {
    const startTime = now - (i + 1) * ONE_DAY;
    const endTime = now - i * ONE_DAY;
    const dayData = filterDataByTimeRange(data, startTime, endTime);

    const temperature = calculateAverage(dayData).toFixed(2);
    const timestamp = formatDate(new Date(endTime)); // Get the formatted date

    dailyAverages.unshift({ timestamp, temperature }); // Insert at the beginning to reverse the order
  }

  return dailyAverages; // Array of `days` objects with "date" and "average"
};

/**
 * Save averages to Firebase
 */
const saveAveragesToFirebase = async (averages) => {
  const averagesRef = database.ref("TemperatureAverages");
  const timestamp = new Date().getTime();
  await averagesRef.set({ ...averages, lastUpdated: timestamp });
};

/**
 * Fetch averages from Firebase
 */
const fetchAveragesFromFirebase = async () => {
  const averagesRef = database.ref("TemperatureAverages");
  const snapshot = await averagesRef.once('value');
  return snapshot.val();
};

/**
 * Fetch temperature data from Firebase
 */
const fetchTemperatureData = async () => {
  const temperatureRef = database.ref("TemperatureSensorData");
  const snapshot = await temperatureRef.once('value');
  return snapshot.val();
};

/**
 * Main function to fetch or calculate temperature averages
 */
const fetchOrCalculateAverages = async () => {
  try {
    // Fetch cached averages from Firebase
    const cachedAverages = await fetchAveragesFromFirebase();
    const now = new Date().getTime();

    // Check if cached data exists and was updated less than an hour ago
    if (cachedAverages && now - cachedAverages.lastUpdated < ONE_HOUR) {
      console.log("Returning cached averages.");
      return cachedAverages; // Return cached averages
    }

    // Fetch raw temperature data from Firebase
    const data = await fetchTemperatureData();

    // Calculate new averages if no cached data or it's too old
    const last24HourAverages = getHourlyAverages(data);
    const lastWeekAverages = getDailyAverages(data, 7);
    const lastMonthAverages = getDailyAverages(data, 30);

    const averages = {
      last24HourAverages,
      lastWeekAverages,
      lastMonthAverages,
    };

    // Save newly calculated averages with the current timestamp
    await saveAveragesToFirebase(averages);

    console.log("New averages calculated and saved.");
    return averages;
  } catch (error) {
    console.error("Error fetching or calculating averages:", error);
  }
};


/**
 * Set up periodic data fetching every hour
 */
setInterval(() => {
  console.log("Checking for new temperature data...");
  fetchOrCalculateAverages();
}, ONE_HOUR/60); // Runs every minute



// Run the first check immediately
fetchOrCalculateAverages();

