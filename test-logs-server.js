const express = require('express');
const cors = require('cors');
const { authenticateToken } = require('./middleware/auth');
const { validateDateRange } = require('./middleware/validation');
const logController = require('./controllers/logController');

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get('/test-logs', authenticateToken, validateDateRange, logController.getHabitLogs);

app.listen(3022, () => {
    console.log('Test server for logs running on port 3022');
});