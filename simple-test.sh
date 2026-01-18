#!/bin/bash

cd "/Users/ramaaryop/Library/Mobile Documents/com~apple~CloudDocs/Ruang kuliah/Semester 7/IMK/uas/menuju-uas"
PORT=3009 node server.js &
SERVER_PID=$!
sleep 3

TIMESTAMP=$(date +%s)
EMAIL="simple$TIMESTAMP@test.com"
NIM="SIMPLE$TIMESTAMP"

# Register and get token
TOKEN=$(curl -s -X POST http://localhost:3009/api/auth/register \
-H "Content-Type: application/json" \
-d "{
  \"name\": \"Simple Test\",
  \"email\": \"$EMAIL\",
  \"password\": \"password123\",
  \"nim\": \"$NIM\"
}" | jq -r '.data.token')

# Test simplified GET with specific parameters
echo "Testing GET habits with ?is_active=all"
curl -s -X GET "http://localhost:3009/api/habits?is_active=all" \
-H "Authorization: Bearer $TOKEN" | jq .

kill $SERVER_PID