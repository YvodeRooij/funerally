#!/bin/bash

# Demo: Using Gemini CLI as a Sparring Partner for Security Consultation
# This demonstrates the direct CLI usage for security-related questions

echo "🔒 Gemini Security Consultation Demo"
echo "===================================="
echo ""
echo "Question: What are the top 3 security considerations for a funeral planning platform's document storage system?"
echo ""
echo "Running: node scripts/gemini-sparring.js chat \"What are the top 3 security considerations for a funeral planning platform's document storage system?\""
echo ""
echo "─────────────────────────────────────────────────────────────────────────────────"
echo ""

# Execute the Gemini CLI command
node scripts/gemini-sparring.js chat "What are the top 3 security considerations for a funeral planning platform's document storage system?"

echo ""
echo "─────────────────────────────────────────────────────────────────────────────────"
echo ""
echo "✅ Demo completed. Gemini has provided security insights for the funeral planning platform."