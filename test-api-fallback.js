#!/usr/bin/env node

// Test script to demonstrate API fallback behavior
const fetch = require('node-fetch');

async function testSummaryAPI() {
  console.log('🧪 Testing Experiment Summary API...\n');
  
  try {
    const response = await fetch('http://localhost:3001/api/experiment/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const summary = await response.json();
      
      console.log('✅ API Response Success!');
      console.log(`📊 Duration: ${summary.duration} seconds`);
      console.log(`📈 Data Points: ${summary.dataPoints}`);
      console.log(`🤖 AI Commentary:`);
      console.log(`   "${summary.commentary}"`);
      console.log(`\n🔍 Commentary Type: ${summary.commentary.includes('Temperature decreased') ? 'Fallback (Rule-based)' : 'Gemini AI'}`);
      
      if (summary.commentary.includes('Temperature decreased')) {
        console.log('\n💡 Note: Using fallback commentary (API may be unavailable)');
      } else {
        console.log('\n🚀 Note: Using Gemini AI commentary!');
      }
      
    } else {
      console.log('❌ API Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Connection Error:', error.message);
  }
}

testSummaryAPI();
