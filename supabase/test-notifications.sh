#!/bin/bash
# Test script for admin-notifications Edge Function
# Usage: ./test-notifications.sh <cron-secret> [batch-size]

CRON_SECRET="${1}"
BATCH_SIZE="${2:-25}"
FUNCTION_URL="https://codjrsxeqmeoscnjyeyj.supabase.co/functions/v1/admin-notifications"

if [ -z "$CRON_SECRET" ]; then
    echo "❌ Error: CRON_SECRET is required"
    echo "Usage: $0 <cron-secret> [batch-size]"
    exit 1
fi

echo "Testing admin-notifications function..."
echo "URL: $FUNCTION_URL?batch=$BATCH_SIZE"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "$FUNCTION_URL?batch=$BATCH_SIZE" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $CRON_SECRET")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ Success!"
    echo ""
    echo "Response:"
    echo "$BODY" | jq '.'
else
    echo "❌ Error! HTTP $HTTP_CODE"
    echo ""
    echo "Response:"
    echo "$BODY"
fi
