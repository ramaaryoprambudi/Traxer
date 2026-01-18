#!/bin/bash

cd "/Users/ramaaryop/Library/Mobile Documents/com~apple~CloudDocs/Ruang kuliah/Semester 7/IMK/uas/menuju-uas"

echo "🧪 Testing Habit Streaks Endpoint"
echo "================================="

TIMESTAMP=$(date +%s)
EMAIL="streaks$TIMESTAMP@test.com"  
NIM="STREAKS$TIMESTAMP"
BASE_URL="http://localhost:3030"

# Start server in background
PORT=3030 node server.js &
SERVER_PID=$!
sleep 5

# Register user and get token
TOKEN=$(curl -s -X POST $BASE_URL/api/auth/register \
-H "Content-Type: application/json" \
-d "{
  \"name\": \"Streaks Test User\",
  \"email\": \"$EMAIL\",
  \"password\": \"password123\",
  \"nim\": \"$NIM\"
}" | jq -r '.data.token')

echo "1. User registered, token: ${TOKEN:0:20}..."

# Create a habit
HABIT_ID=$(curl -s -X POST $BASE_URL/api/habits \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d '{
  "name": "Daily Exercise",
  "description": "Exercise for 30 minutes daily", 
  "category_id": 2,
  "frequency_type": "daily",
  "target_count": 1
}' | jq -r '.data.id')

echo "2. Created habit with ID: $HABIT_ID"

# Create some habit logs to generate streak data
echo "3. Creating habit logs for streak data..."
curl -s -X POST $BASE_URL/api/logs \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d "{
  \"habit_id\": $HABIT_ID,
  \"date\": \"2026-01-14\",
  \"is_completed\": true
}" > /dev/null

curl -s -X POST $BASE_URL/api/logs \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d "{
  \"habit_id\": $HABIT_ID,
  \"date\": \"2026-01-15\", 
  \"is_completed\": true
}" > /dev/null

curl -s -X POST $BASE_URL/api/logs \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d "{
  \"habit_id\": $HABIT_ID,
  \"date\": \"2026-01-16\",
  \"is_completed\": true
}" > /dev/null

echo "Created logs for dates 2026-01-14, 15, and 16"

# Test the new streaks endpoint
echo -e "\n4. Testing /api/habits/$HABIT_ID/streaks endpoint..."
STREAKS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/habits/$HABIT_ID/streaks" \
-H "Authorization: Bearer $TOKEN")

echo "Response:"
echo "$STREAKS_RESPONSE" | jq .

# Kill server
kill $SERVER_PID

echo -e "\n✅ Test completed!"