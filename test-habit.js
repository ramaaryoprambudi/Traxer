const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testHabits() {
    try {
        console.log('🧪 Testing Habit CRUD operations...\n');

        // 1. Register a test user
        console.log('1. Registering test user...');
        const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
            name: 'Test User',
            email: `test${Date.now()}@test.com`,
            password: 'password123',
            nim: `NIM${Date.now()}`
        });

        console.log('✅ User registered:', registerResponse.data.message);
        const token = registerResponse.data.data.token;

        // 2. Test create habit
        console.log('\n2. Creating a habit...');
        const habitData = {
            name: 'Test Habit',
            description: 'This is a test habit',
            category_id: 1,
            frequency_type: 'daily',
            target_count: 1
        };

        const createResponse = await axios.post(`${BASE_URL}/habits`, habitData, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('✅ Habit created:', createResponse.data);
        const habitId = createResponse.data.data.id;

        // 3. Test get all habits
        console.log('\n3. Getting all habits...');
        const getResponse = await axios.get(`${BASE_URL}/habits`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('✅ Habits retrieved:', getResponse.data);

        // 4. Test get habit by ID
        console.log('\n4. Getting habit by ID...');
        const getByIdResponse = await axios.get(`${BASE_URL}/habits/${habitId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('✅ Habit by ID:', getByIdResponse.data);

        // 5. Test update habit
        console.log('\n5. Updating habit...');
        const updateData = {
            name: 'Updated Test Habit',
            description: 'This is an updated test habit',
            category_id: 1,
            frequency_type: 'weekly',
            active_days: [1, 2, 3, 4, 5],
            target_count: 2
        };

        const updateResponse = await axios.put(`${BASE_URL}/habits/${habitId}`, updateData, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('✅ Habit updated:', updateResponse.data);

        // 6. Test delete habit
        console.log('\n6. Deleting habit...');
        const deleteResponse = await axios.delete(`${BASE_URL}/habits/${habitId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('✅ Habit deleted:', deleteResponse.data);

        console.log('\n🎉 All CRUD operations completed successfully!');

    } catch (error) {
        console.error('❌ Error occurred:', error.response ? error.response.data : error.message);
        
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Run the test
testHabits();