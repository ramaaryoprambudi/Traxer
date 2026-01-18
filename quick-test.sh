#!/bin/bash

TIMESTAMP=$(date +%s)
EMAIL="quicktest$TIMESTAMP@test.com"
NIM="QT$TIMESTAMP"
BASE_URL="http://localhost:3010"

echo "Quick Update Test"
echo "================"

# Register user
echo "1. Registering user..."
TOKEN=$(curl -s -X POST $BASE_URL/api/auth/register \
-H "Content-Type: application/json" \
-d "{
  \"name\": \"Quick Test\",
  \"email\": \"$EMAIL\",
  \"password\": \"password123\",
  \"nim\": \"$NIM\"
}" | jq -r '.data.token')

echo "Token: ${TOKEN:0:20}..."

# Create habit
echo -e "\n2. Creating habit..."
HABIT_ID=$(curl -s -X POST $BASE_URL/api/habits \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d '{
  "name": "Test Habit",
  "description": "Test description", 
  "category_id": 1
}' | jq -r '.data.id')

echo "Created habit ID: $HABIT_ID"

# Test partial update
echo -e "\n3. Testing partial update without category_id..."
UPDATE_RESULT=$(curl -s -X PUT $BASE_URL/api/habits/$HABIT_ID \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d '{
  "name": "Membaca Buku (Updated)",
  "description": "Membaca minimal 45 menit setiap hari untuk menambah wawasan",
  "target_count": 2
}')

echo "$UPDATE_RESULT" | jq .