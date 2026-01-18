#!/bin/bash

cd "/Users/ramaaryop/Library/Mobile Documents/com~apple~CloudDocs/Ruang kuliah/Semester 7/IMK/uas/menuju-uas"
PORT=3010 node server.js &
SERVER_PID=$!
sleep 3

TIMESTAMP=$(date +%s)
EMAIL="update$TIMESTAMP@test.com"
NIM="UPDATE$TIMESTAMP"

echo "Testing Habit Update Fix"
echo "========================"

# Register user and get token
TOKEN=$(curl -s -X POST http://localhost:3010/api/auth/register \
-H "Content-Type: application/json" \
-d "{
  \"name\": \"Update Test User\",
  \"email\": \"$EMAIL\",
  \"password\": \"password123\",
  \"nim\": \"$NIM\"
}" | jq -r '.data.token')

echo "1. User registered with token: ${TOKEN:0:20}..."

# Create a habit first
echo -e "\n2. Creating habit..."
HABIT_RESPONSE=$(curl -s -X POST http://localhost:3010/api/habits \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d '{
  "name": "Membaca Buku",
  "description": "Membaca minimal 30 menit setiap hari",
  "category_id": 1,
  "frequency_type": "daily",
  "target_count": 1
}')

HABIT_ID=$(echo "$HABIT_RESPONSE" | jq -r '.data.id')
echo "Created habit with ID: $HABIT_ID"

# Test update with partial data (no category_id)
echo -e "\n3. Testing partial update (no category_id)..."
UPDATE_RESPONSE=$(curl -s -X PUT http://localhost:3010/api/habits/$HABIT_ID \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d '{
  "name": "Membaca Buku (Updated)",
  "description": "Membaca minimal 45 menit setiap hari untuk menambah wawasan",
  "target_count": 2
}')

echo "Update response:"
echo "$UPDATE_RESPONSE" | jq .

# Test update with only name
echo -e "\n4. Testing minimal update (only name)..."
UPDATE_RESPONSE2=$(curl -s -X PUT http://localhost:3010/api/habits/$HABIT_ID \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d '{
  "name": "Membaca Buku Final"
}')

echo "Minimal update response:"
echo "$UPDATE_RESPONSE2" | jq .

kill $SERVER_PID