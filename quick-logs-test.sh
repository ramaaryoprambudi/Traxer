#!/bin/bash

echo "Testing logs endpoint..."
sleep 8

RESPONSE=$(curl -s -X GET "http://localhost:3000/api/logs?start_date=2026-01-01&end_date=2026-01-31" \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsIm5pbSI6InRlc3QxMjM0NTYiLCJuYW1lIjoiUmFtYSIsImlhdCI6MTc2ODUyODU2NywiZXhwIjoxNzY5MTMzMzY3fQ.oe5JMDRSt66yFIaNGnqI8qNhW6oq3uqfvnZmMveFP_Q")

echo "Response:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"