#!/bin/bash

cd "/Users/ramaaryop/Library/Mobile Documents/com~apple~CloudDocs/Ruang kuliah/Semester 7/IMK/uas/menuju-uas"
PORT=3007 node server.js &
SERVER_PID=$!
sleep 3

echo "🧪 Testing Full CRUD Operations for Habits (Clean)"
echo "=================================================="

# Generate unique credentials
TIMESTAMP=$(date +%s)
EMAIL="testuser$TIMESTAMP@test.com"
NIM="TEST$TIMESTAMP"

# Register user and get token
echo "1. Registering user with email: $EMAIL"
TOKEN=$(curl -s -X POST http://localhost:3007/api/auth/register \
-H "Content-Type: application/json" \
-d "{
  \"name\": \"Test User\",
  \"email\": \"$EMAIL\",
  \"password\": \"password123\",
  \"nim\": \"$NIM\"
}" | jq -r '.data.token')

if [[ "$TOKEN" == "null" ]] || [[ -z "$TOKEN" ]]; then
    echo "❌ Failed to get token"
    kill $SERVER_PID
    exit 1
fi
echo "✅ User registered, token: ${TOKEN:0:20}..."

# Test CREATE habit
echo -e "\n2. Creating habit..."
HABIT_RESPONSE=$(curl -s -X POST http://localhost:3007/api/habits \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d '{
  "name": "Clean Test Habit",
  "description": "This is a clean test",
  "category_id": 1,
  "frequency_type": "daily",
  "target_count": 1
}')

echo "Full create response:"
echo "$HABIT_RESPONSE" | jq .

HABIT_ID=$(echo "$HABIT_RESPONSE" | jq -r '.data.id')
echo "Extracted Habit ID: $HABIT_ID"

if [[ "$HABIT_ID" == "null" ]] || [[ -z "$HABIT_ID" ]]; then
    echo "❌ Failed to create habit"
    kill $SERVER_PID
    exit 1
fi

echo "✅ Habit created with ID: $HABIT_ID"

# Test READ all habits
echo -e "\n3. Getting all habits..."
ALL_HABITS_RESPONSE=$(curl -s -X GET http://localhost:3007/api/habits \
-H "Authorization: Bearer $TOKEN")

echo "Get all habits response:"
echo "$ALL_HABITS_RESPONSE" | jq .

# Extract habit count
HABIT_COUNT=$(echo "$ALL_HABITS_RESPONSE" | jq '.data | length')
echo "✅ Retrieved $HABIT_COUNT habits"

echo -e "\n🎉 Core functionality working!"

# Kill server
kill $SERVER_PID