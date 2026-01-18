#!/bin/bash

cd "/Users/ramaaryop/Library/Mobile Documents/com~apple~CloudDocs/Ruang kuliah/Semester 7/IMK/uas/menuju-uas"
PORT=3008 node server.js &
SERVER_PID=$!
sleep 3

echo "🔍 Debugging Registration"
echo "========================"

TIMESTAMP=$(date +%s)
EMAIL="debug$TIMESTAMP@test.com"
NIM="DEBUG$TIMESTAMP"

echo "Registering user with email: $EMAIL"

REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3008/api/auth/register \
-H "Content-Type: application/json" \
-d "{
  \"name\": \"Debug User $TIMESTAMP\",
  \"email\": \"$EMAIL\",
  \"password\": \"password123\",
  \"nim\": \"$NIM\"
}")

echo "Full registration response:"
echo "$REGISTER_RESPONSE" | jq .

kill $SERVER_PID