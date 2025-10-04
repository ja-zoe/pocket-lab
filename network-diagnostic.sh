#!/bin/bash

echo "🔍 Gemini API Network Diagnostic Tool"
echo "======================================"
echo ""

# Test 1: Basic connectivity
echo "1. Testing basic internet connectivity..."
if ping -c 3 google.com > /dev/null 2>&1; then
    echo "✅ Internet connection: OK"
else
    echo "❌ Internet connection: FAILED"
    echo "   Check your internet connection"
    exit 1
fi

# Test 2: DNS resolution
echo ""
echo "2. Testing DNS resolution for Google APIs..."
if nslookup generativelanguage.googleapis.com > /dev/null 2>&1; then
    echo "✅ DNS resolution: OK"
    nslookup generativelanguage.googleapis.com | grep "Address:"
else
    echo "❌ DNS resolution: FAILED"
    echo "   Try using different DNS servers:"
    echo "   • Google DNS: 8.8.8.8, 8.8.4.4"
    echo "   • Cloudflare: 1.1.1.1, 1.0.0.1"
fi

# Test 3: HTTPS connectivity
echo ""
echo "3. Testing HTTPS connectivity to Google APIs..."
if curl -s --connect-timeout 10 https://generativelanguage.googleapis.com > /dev/null; then
    echo "✅ HTTPS connectivity: OK"
else
    echo "❌ HTTPS connectivity: FAILED"
    echo "   Possible issues:"
    echo "   • Corporate firewall blocking Google APIs"
    echo "   • Proxy configuration needed"
    echo "   • SSL/TLS certificate issues"
fi

# Test 4: API endpoint test
echo ""
echo "4. Testing Gemini API endpoint..."
API_KEY="AIzaSyAA5lgdlYf2wtxDrjGlO2mTguMw3A-tT5U"
RESPONSE=$(curl -s --connect-timeout 15 -H "Content-Type: application/json" \
    -d '{"contents":[{"parts":[{"text":"Test"}]}]}' \
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$API_KEY" 2>&1)

if echo "$RESPONSE" | grep -q "candidates"; then
    echo "✅ Gemini API: WORKING"
    echo "   Response received successfully"
elif echo "$RESPONSE" | grep -q "fetch failed"; then
    echo "❌ Gemini API: NETWORK ERROR"
    echo "   Error: fetch failed"
    echo "   This is the same error you're seeing in the app"
elif echo "$RESPONSE" | grep -q "timeout"; then
    echo "❌ Gemini API: TIMEOUT"
    echo "   Request timed out"
elif echo "$RESPONSE" | grep -q "404"; then
    echo "❌ Gemini API: MODEL NOT FOUND"
    echo "   Model name issue"
elif echo "$RESPONSE" | grep -q "403\|401"; then
    echo "❌ Gemini API: AUTHENTICATION ERROR"
    echo "   API key issue"
else
    echo "❌ Gemini API: UNKNOWN ERROR"
    echo "   Response: $RESPONSE"
fi

# Test 5: Corporate network detection
echo ""
echo "5. Checking for corporate network indicators..."
if command -v nmcli > /dev/null 2>&1; then
    NETWORK=$(nmcli -t -f NAME connection show --active | head -1)
    echo "   Active network: $NETWORK"
fi

# Test 6: Proxy detection
echo ""
echo "6. Checking for proxy configuration..."
if [ ! -z "$HTTP_PROXY" ] || [ ! -z "$HTTPS_PROXY" ]; then
    echo "   HTTP_PROXY: $HTTP_PROXY"
    echo "   HTTPS_PROXY: $HTTPS_PROXY"
    echo "   ⚠️  Proxy detected - may need configuration"
else
    echo "   No proxy environment variables detected"
fi

echo ""
echo "🔧 TROUBLESHOOTING RECOMMENDATIONS:"
echo "=================================="

if echo "$RESPONSE" | grep -q "fetch failed"; then
    echo "1. CORPORATE FIREWALL:"
    echo "   • Contact IT to whitelist *.googleapis.com"
    echo "   • Ask for Google Generative AI API access"
    echo ""
    echo "2. PROXY CONFIGURATION:"
    echo "   • Set HTTP_PROXY and HTTPS_PROXY environment variables"
    echo "   • Configure Node.js to use corporate proxy"
    echo ""
    echo "3. VPN SOLUTION:"
    echo "   • Connect to VPN that allows API access"
    echo "   • Use personal hotspot temporarily"
    echo ""
    echo "4. ALTERNATIVE:"
    echo "   • The app will work with fallback commentary"
    echo "   • AI features will be disabled but core functionality remains"
fi

echo ""
echo "✅ The app is designed to work even without Gemini API!"
echo "   It will automatically fall back to rule-based commentary."
