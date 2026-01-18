#!/bin/bash

cd "/Users/ramaaryop/Library/Mobile Documents/com~apple~CloudDocs/Ruang kuliah/Semester 7/IMK/uas/menuju-uas"

echo "🔧 Testing Fixed Streaks Endpoint"
echo "================================="

# Kill any process on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start server
PORT=3000 node server.js &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# Wait for server to start
sleep 8

echo "Testing endpoint..."

# Test with existing token and habit
RESPONSE=$(curl -s -X GET "http://localhost:3000/api/habits/15/streaks" \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsIm5pbSI6InRlc3QxMjM0NTYiLCJuYW1lIjoiUmFtYSIsImlhdCI6MTc2ODUyODU2NywiZXhwIjoxNzY5MTMzMzY3fQ.oe5JMDRSt66yFIaNGnqI8qNhW6oq3uqfvnZmMveFP_Q")

echo "Response from /api/habits/15/streaks:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

# Kill server
kill $SERVER_PID 2>/dev/null || true

echo -e "\n✅ Test completed!"