#!/bin/bash

cd "/Users/ramaaryop/Library/Mobile Documents/com~apple~CloudDocs/Ruang kuliah/Semester 7/IMK/uas/menuju-uas"

echo "🔧 Full Streaks Endpoint Test"
echo "=========================="

# Kill any process on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start server
PORT=3000 node server.js &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# Wait for server to start
sleep 8

echo -e "\n1. Getting new token..."

# Login to get fresh token
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
-H "Content-Type: application/json" \
-d '{
  "nim": "test123456",
  "password": "password123"
}')

echo "Login response:"
echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token' 2>/dev/null)

if [ "$TOKEN" = "null" ] || [ "$TOKEN" = "" ]; then
    echo "❌ Failed to get token"
    echo "Trying with another user..."
    
    # Try register new user first
    REGISTER_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
      "nim": "test999999",
      "name": "Test User",
      "password": "password123"
    }')
    
    echo "Register response:"
    echo "$REGISTER_RESPONSE" | jq . 2>/dev/null || echo "$REGISTER_RESPONSE"
    
    TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.token' 2>/dev/null)
fi

echo -e "\nToken: $TOKEN"

if [ "$TOKEN" != "null" ] && [ "$TOKEN" != "" ]; then
    echo -e "\n2. Testing habits list first..."
    HABITS_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/habits" \
    -H "Authorization: Bearer $TOKEN")
    
    echo "Habits response:"
    echo "$HABITS_RESPONSE" | jq . 2>/dev/null || echo "$HABITS_RESPONSE"
    
    # Get first habit ID
    HABIT_ID=$(echo "$HABITS_RESPONSE" | jq -r '.data[0].id' 2>/dev/null)
    
    echo -e "\nHabit ID to test: $HABIT_ID"
    
    if [ "$HABIT_ID" != "null" ] && [ "$HABIT_ID" != "" ]; then
        echo -e "\n3. Testing streaks endpoint..."
        STREAKS_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/habits/$HABIT_ID/streaks" \
        -H "Authorization: Bearer $TOKEN")
        
        echo "Streaks response:"
        echo "$STREAKS_RESPONSE" | jq . 2>/dev/null || echo "$STREAKS_RESPONSE"
    else
        echo "❌ No habits found to test with"
    fi
else
    echo "❌ Failed to get valid token"
fi

# Kill server
kill $SERVER_PID 2>/dev/null || true

echo -e "\n✅ Full test completed!"