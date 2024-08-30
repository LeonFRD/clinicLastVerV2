const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // Ensure this matches your frontend origin
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(express.json());

const SCHEDULES_FILE = path.join(__dirname, 'schedules.json');
const DOCTORS_FILE = path.join(__dirname, 'doctors.json');
const USERS_FILE = path.join(__dirname, 'users.json');

const SECRET_KEY = 'your-secret-key'; // In a real app, use an environment variable
// Helper function to read JSON file
async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // If the file doesn't exist, create it with an empty array
      await writeJsonFile(filePath, []);
      return [];
    }
    throw error;
  }
}

// Helper function to write JSON file
async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

const authenticateUser = async (req, res, next) => {
  const { username, password } = req.headers;
  try {
    const users = await readJsonFile(USERS_FILE);
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      next();
    } else {
      res.status(401).json({ message: 'Authentication failed' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const users = await readJsonFile(USERS_FILE);
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      res.json({ message: 'Login successful', username: user.username });
    } else {
      res.status(401).json({ message: 'Authentication failed' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all schedules
app.get('/api/schedules', async (req, res) => {
  try {
    const schedules = await readJsonFile(SCHEDULES_FILE);
    res.json(schedules);
  } catch (error) {
    console.error('Error reading schedules:', error);
    res.status(500).json({ error: 'Failed to read schedules' });
  }
});

// Add a new schedule
app.post('/api/schedules', async (req, res) => {
  try {
    const schedules = await readJsonFile(SCHEDULES_FILE);
    
    // Ensure that req.body is an array
    const newSchedules = Array.isArray(req.body) ? req.body : [req.body];
    
    // Add unique IDs if not already present
    newSchedules.forEach(schedule => {
      if (!schedule.id) {
        schedule.id = Date.now() + Math.floor(Math.random() * 1000);
      }
    });

    // Add the new schedules to the existing ones
    schedules.push(...newSchedules);
    
    await writeJsonFile(SCHEDULES_FILE, schedules);
    res.status(201).json(newSchedules);
    io.emit('scheduleUpdate'); // Emit update event
  } catch (error) {
    console.error('Error adding schedule:', error);
    res.status(500).json({ error: 'Failed to add schedule' });
  }
});


app.delete('/api/schedules/:id', async (req, res) => {
  try {
    const schedules = await readJsonFile(SCHEDULES_FILE);
    const updatedSchedules = schedules.filter(schedule => schedule.id !== parseInt(req.params.id));
    await writeJsonFile(SCHEDULES_FILE, updatedSchedules);
    res.status(200).json({ message: 'Schedule deleted successfully' });
    io.emit('scheduleUpdate'); // Emit update event
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

// Update a schedule
app.put('/api/schedules/:id', async (req, res) => {
  try {
    const schedules = await readJsonFile(SCHEDULES_FILE);
    const index = schedules.findIndex(schedule => schedule.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    schedules[index] = { ...schedules[index], ...req.body };
    await writeJsonFile(SCHEDULES_FILE, schedules);
    res.json(schedules[index]);
    io.emit('scheduleUpdate'); // Emit update event
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
});

// Get all doctors
app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await readJsonFile(DOCTORS_FILE);
    res.json(doctors);
  } catch (error) {
    console.error('Error reading doctors:', error);
    res.status(500).json({ error: 'Failed to read doctors' });
  }
});

// Add a new doctor
app.post('/api/doctors', async (req, res) => {
  try {
    const doctors = await readJsonFile(DOCTORS_FILE);
    const newDoctor = { id: Date.now(), ...req.body };
    doctors.push(newDoctor);
    await writeJsonFile(DOCTORS_FILE, doctors);
    res.status(201).json(newDoctor);
    io.emit('doctorUpdate'); // Emit update event
  } catch (error) {
    console.error('Error adding doctor:', error);
    res.status(500).json({ error: 'Failed to add doctor' });
  }
});

app.put('/api/doctors/:id', async (req, res) => {
  try {
    const doctors = await readJsonFile(DOCTORS_FILE);
    const index = doctors.findIndex(doctor => doctor.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    doctors[index] = { ...doctors[index], ...req.body };
    await writeJsonFile(DOCTORS_FILE, doctors);
    res.json(doctors[index]);
    io.emit('doctorUpdate'); // Emit update event
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ error: 'Failed to update doctor' });
  }
});

// Delete a doctor
app.delete('/api/doctors/:id', async (req, res) => {
  try {
    const doctors = await readJsonFile(DOCTORS_FILE);
    const updatedDoctors = doctors.filter(doctor => doctor.id !== parseInt(req.params.id));
    if (doctors.length === updatedDoctors.length) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    await writeJsonFile(DOCTORS_FILE, updatedDoctors);
    res.json({ message: 'Doctor deleted successfully' });
    io.emit('doctorUpdate'); // Emit update event
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ error: 'Failed to delete doctor' });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));