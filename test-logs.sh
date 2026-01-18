#!/bin/bash

cd "/Users/ramaaryop/Library/Mobile Documents/com~apple~CloudDocs/Ruang kuliah/Semester 7/IMK/uas/menuju-uas"

TIMESTAMP=$(date +%s)
EMAIL="logs$TIMESTAMP@test.com"  
NIM="LOGS$TIMESTAMP"
BASE_URL="http://localhost:3020"

echo "🧪 Testing Logs Endpoint with Date Range"
echo "========================================"

# Register and login
TOKEN=$(curl -s -X POST $BASE_URL/api/auth/register \
-H "Content-Type: application/json" \
-d "{
  \"name\": \"Logs Test User\",
  \"email\": \"$EMAIL\",
  \"password\": \"password123\",
  \"nim\": \"$NIM\"
}" | jq -r '.data.token')

echo "1. User registered, token: ${TOKEN:0:20}..."

# Create a habit first
HABIT_ID=$(curl -s -X POST $BASE_URL/api/habits \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d '{
  "name": "Test Habit for Logs",
  "description": "Testing logs functionality", 
  "category_id": 1,
  "frequency_type": "daily",
  "target_count": 1
}' | jq -r '.data.id')

echo "2. Created habit with ID: $HABIT_ID"

# Create some habit logs
echo "3. Creating habit logs..."
curl -s -X POST $BASE_URL/api/logs \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d "{
  \"habit_id\": $HABIT_ID,
  \"date\": \"2026-01-15\",
  \"is_completed\": true,
  \"completed_count\": 1
}" > /dev/null

curl -s -X POST $BASE_URL/api/logs \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d "{
  \"habit_id\": $HABIT_ID,
  \"date\": \"2026-01-16\", 
  \"is_completed\": true,
  \"completed_count\": 1
}" > /dev/null

echo "Created test logs for dates 2026-01-15 and 2026-01-16"

# Test the problematic endpoint
echo -e "\n4. Testing logs endpoint with date range..."
LOGS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/logs?start_date=2026-01-01&end_date=2026-01-31" \
-H "Authorization: Bearer $TOKEN")

echo "Response:"
echo "$LOGS_RESPONSE" | jq .

# Test without date range
echo -e "\n5. Testing logs endpoint without date range..."
LOGS_RESPONSE2=$(curl -s -X GET "$BASE_URL/api/logs" \
-H "Authorization: Bearer $TOKEN")

echo "Response without date range:"
echo "$LOGS_RESPONSE2" | jq .