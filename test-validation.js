const express = require('express');
const { validateHabitUpdate } = require('./middleware/validation');

const app = express();
app.use(express.json());

// Test endpoint
app.put('/test', validateHabitUpdate, (req, res) => {
    res.json({
        success: true,
        message: 'Validation passed',
        data: req.body
    });
});

app.listen(3012, () => {
    console.log('Test server running on port 3012');
});