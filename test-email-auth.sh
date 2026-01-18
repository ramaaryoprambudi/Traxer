#!/bin/bash

cd "/Users/ramaaryop/Library/Mobile Documents/com~apple~CloudDocs/Ruang kuliah/Semester 7/IMK/uas/menuju-uas"

echo "🔧 Testing Email-Based Auth System"
echo "================================="

# Kill any process on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start server
PORT=3000 node server.js &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# Wait for server to start
sleep 5

echo -e "\n1. Testing register with email..."

# Register new user with email
REGISTER_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/auth/register" \
-H "Content-Type: application/json" \
-d '{
  "name": "Test User Email",
  "email": "test@example.com", 
  "password": "password123"
}')

echo "Register response:"
echo "$REGISTER_RESPONSE" | jq . 2>/dev/null || echo "$REGISTER_RESPONSE"

# Extract token
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.token' 2>/dev/null)
echo -e "\nToken: $TOKEN"

if [ "$TOKEN" != "null" ] && [ "$TOKEN" != "" ]; then
    echo -e "\n2. Testing login with email..."
    
    # Test login with same email
    LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "password123"
    }')
    
    echo "Login response:"
    echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
    
    # Get new token from login
    LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token' 2>/dev/null)
    
    if [ "$LOGIN_TOKEN" != "null" ] && [ "$LOGIN_TOKEN" != "" ]; then
        echo -e "\n3. Testing authenticated endpoint..."
        
        PROFILE_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/auth/profile" \
        -H "Authorization: Bearer $LOGIN_TOKEN")
        
        echo "Profile response:"
        echo "$PROFILE_RESPONSE" | jq . 2>/dev/null || echo "$PROFILE_RESPONSE"
        
        echo -e "\n✅ Email-based auth working successfully!"
    else
        echo "❌ Login failed"
    fi
else
    echo "❌ Register failed"
fi

# Kill server
kill $SERVER_PID 2>/dev/null || true

echo -e "\n✅ Auth system test completed!"