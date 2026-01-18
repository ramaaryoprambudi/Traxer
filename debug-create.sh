#!/bin/bash

cd "/Users/ramaaryop/Library/Mobile Documents/com~apple~CloudDocs/Ruang kuliah/Semester 7/IMK/uas/menuju-uas"
PORT=3006 node server.js &
SERVER_PID=$!
sleep 3

echo "🔍 Debugging Habit Creation Response"
echo "===================================="

# Register user and get token
TOKEN=$(curl -s -X POST http://localhost:3006/api/auth/register \
-H "Content-Type: application/json" \
-d '{
  "name": "Debug User",
  "email": "debug@test.com",
  "password": "password123",
  "nim": "DEBUG123"
}' | jq -r '.data.token')

echo "Token: $TOKEN"

# Test CREATE habit and show full response
echo -e "\nCreating habit and showing full response:"
HABIT_RESPONSE=$(curl -s -X POST http://localhost:3006/api/habits \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d '{
  "name": "Debug Habit",
  "description": "Debug description",
  "category_id": 1
}')

echo "$HABIT_RESPONSE" | jq .

# Kill server
kill $SERVER_PID