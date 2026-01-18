#!/bin/bash

# Start server in background
cd "/Users/ramaaryop/Library/Mobile Documents/com~apple~CloudDocs/Ruang kuliah/Semester 7/IMK/uas/menuju-uas"
PORT=3004 node server.js &
SERVER_PID=$!

# Wait for server to start
sleep 3

echo "Testing habit creation..."

# Register user and get token
TOKEN=$(curl -s -X POST http://localhost:3004/api/auth/register \
-H "Content-Type: application/json" \
-d '{
  "name": "Test User",
  "email": "testuser@test.com",
  "password": "password123",
  "nim": "TEST123"
}' | jq -r '.data.token')

echo "Token obtained: $TOKEN"

# Test creating habit
echo "Creating habit..."
curl -s -X POST http://localhost:3004/api/habits \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d '{
  "name": "Daily Reading",
  "description": "Read for 30 minutes",
  "category_id": 1
}' | jq .

# Kill server
kill $SERVER_PID