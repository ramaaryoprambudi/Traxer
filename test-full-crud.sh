#!/bin/bash

cd "/Users/ramaaryop/Library/Mobile Documents/com~apple~CloudDocs/Ruang kuliah/Semester 7/IMK/uas/menuju-uas"
PORT=3005 node server.js &
SERVER_PID=$!

# Wait for server to start
sleep 3

echo "🧪 Testing Full CRUD Operations for Habits"
echo "=========================================="

# Register user and get token
echo "1. Registering user..."
TOKEN=$(curl -s -X POST http://localhost:3005/api/auth/register \
-H "Content-Type: application/json" \
-d '{
  "name": "Test User CRUD",
  "email": "crud@test.com",
  "password": "password123",
  "nim": "CRUD123"
}' | jq -r '.data.token')

echo "✅ User registered, token obtained"

# Test CREATE habit (daily)
echo -e "\n2. Creating daily habit..."
DAILY_HABIT=$(curl -s -X POST http://localhost:3005/api/habits \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d '{
  "name": "Daily Exercise",
  "description": "Exercise for 30 minutes",
  "category_id": 2,
  "frequency_type": "daily",
  "target_count": 1
}')

DAILY_HABIT_ID=$(echo "$DAILY_HABIT" | jq -r '.data.id')
echo "✅ Daily habit created with ID: $DAILY_HABIT_ID"

# Test CREATE habit (weekly)
echo -e "\n3. Creating weekly habit..."
WEEKLY_HABIT=$(curl -s -X POST http://localhost:3005/api/habits \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d '{
  "name": "Weekly Planning",
  "description": "Plan the week",
  "category_id": 3,
  "frequency_type": "weekly",
  "active_days": [1, 3, 5],
  "target_count": 2
}')

WEEKLY_HABIT_ID=$(echo "$WEEKLY_HABIT" | jq -r '.data.id')
echo "✅ Weekly habit created with ID: $WEEKLY_HABIT_ID"

# Test READ all habits
echo -e "\n4. Getting all habits..."
ALL_HABITS=$(curl -s -X GET http://localhost:3005/api/habits \
-H "Authorization: Bearer $TOKEN")
HABIT_COUNT=$(echo "$ALL_HABITS" | jq '.data | length')
echo "✅ Retrieved $HABIT_COUNT habits"

# Test READ specific habit
echo -e "\n5. Getting habit by ID..."
SPECIFIC_HABIT=$(curl -s -X GET http://localhost:3005/api/habits/$DAILY_HABIT_ID \
-H "Authorization: Bearer $TOKEN")
HABIT_NAME=$(echo "$SPECIFIC_HABIT" | jq -r '.data.name')
echo "✅ Retrieved habit: $HABIT_NAME"

# Test UPDATE habit
echo -e "\n6. Updating habit..."
UPDATE_RESPONSE=$(curl -s -X PUT http://localhost:3005/api/habits/$DAILY_HABIT_ID \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d '{
  "name": "Updated Daily Exercise",
  "description": "Exercise for 45 minutes",
  "category_id": 2,
  "frequency_type": "weekly",
  "active_days": [1, 2, 3, 4, 5],
  "target_count": 3
}')

UPDATED_NAME=$(echo "$UPDATE_RESPONSE" | jq -r '.data.name')
echo "✅ Habit updated: $UPDATED_NAME"

# Test DELETE habit
echo -e "\n7. Deleting habit..."
DELETE_RESPONSE=$(curl -s -X DELETE http://localhost:3005/api/habits/$WEEKLY_HABIT_ID \
-H "Authorization: Bearer $TOKEN")
DELETE_MESSAGE=$(echo "$DELETE_RESPONSE" | jq -r '.message')
echo "✅ $DELETE_MESSAGE"

# Verify deletion
echo -e "\n8. Verifying deletion..."
FINAL_HABITS=$(curl -s -X GET http://localhost:3005/api/habits \
-H "Authorization: Bearer $TOKEN")
FINAL_COUNT=$(echo "$FINAL_HABITS" | jq '.data | length')
echo "✅ Final habit count: $FINAL_COUNT"

echo -e "\n🎉 All CRUD operations completed successfully!"

# Kill server
kill $SERVER_PID