#!/bin/bash

cd "/Users/ramaaryop/Library/Mobile Documents/com~apple~CloudDocs/Ruang kuliah/Semester 7/IMK/uas/menuju-uas"

echo "🔧 Complete Streaks Test with Data Setup"
echo "======================================="

# Kill any process on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start server
PORT=3000 node server.js &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# Wait for server to start
sleep 8

echo -e "\n1. Getting new token..."

# Register new user
REGISTER_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/auth/register" \
-H "Content-Type: application/json" \
-d "{
  \"nim\": \"test$(date +%s)\",
  \"name\": \"Streak Test User\",
  \"password\": \"password123\"
}")

echo "Register response:"
echo "$REGISTER_RESPONSE" | jq . 2>/dev/null || echo "$REGISTER_RESPONSE"

# Extract token
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.token' 2>/dev/null)
echo -e "\nToken: $TOKEN"

if [ "$TOKEN" != "null" ] && [ "$TOKEN" != "" ]; then
    echo -e "\n2. Creating a test habit..."
    HABIT_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/habits" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Daily Reading",
      "description": "Read for 30 minutes daily",
      "category_id": 1,
      "active_days": [1, 2, 3, 4, 5]
    }')
    
    echo "Habit creation response:"
    echo "$HABIT_RESPONSE" | jq . 2>/dev/null || echo "$HABIT_RESPONSE"
    
    # Get habit ID
    HABIT_ID=$(echo "$HABIT_RESPONSE" | jq -r '.data.id' 2>/dev/null)
    echo -e "\nCreated habit ID: $HABIT_ID"
    
    if [ "$HABIT_ID" != "null" ] && [ "$HABIT_ID" != "" ]; then
        echo -e "\n3. Adding some logs for the habit..."
        
        # Add logs for current date and past dates
        LOG_RESPONSE1=$(curl -s -X POST "http://localhost:3000/api/logs" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
          \"habit_id\": $HABIT_ID,
          \"date\": \"$(date -j -f '%Y-%m-%d' -v-2d "$(date '+%Y-%m-%d')" '+%Y-%m-%d')\",
          \"is_completed\": true
        }")
        
        LOG_RESPONSE2=$(curl -s -X POST "http://localhost:3000/api/logs" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
          \"habit_id\": $HABIT_ID,
          \"date\": \"$(date -j -f '%Y-%m-%d' -v-1d "$(date '+%Y-%m-%d')" '+%Y-%m-%d')\",
          \"is_completed\": true
        }")
        
        LOG_RESPONSE3=$(curl -s -X POST "http://localhost:3000/api/logs" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
          \"habit_id\": $HABIT_ID,
          \"date\": \"$(date '+%Y-%m-%d')\",
          \"is_completed\": true
        }")
        
        echo "Log responses:"
        echo "Day -2: $(echo "$LOG_RESPONSE1" | jq -c .)"
        echo "Day -1: $(echo "$LOG_RESPONSE2" | jq -c .)"
        echo "Today: $(echo "$LOG_RESPONSE3" | jq -c .)"
        
        sleep 3
        
        echo -e "\n4. Testing streaks endpoint..."
        STREAKS_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/habits/$HABIT_ID/streaks" \
        -H "Authorization: Bearer $TOKEN")
        
        echo "🎯 STREAKS ENDPOINT RESPONSE:"
        echo "$STREAKS_RESPONSE" | jq . 2>/dev/null || echo "$STREAKS_RESPONSE"
        
    else
        echo "❌ Failed to create habit"
    fi
else
    echo "❌ Failed to get valid token"
fi

# Kill server
kill $SERVER_PID 2>/dev/null || true

echo -e "\n✅ Complete test finished!"