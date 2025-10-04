#!/usr/bin/env node

// Test script to check available Gemini models
const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = 'AIzaSyAA5lgdlYf2wtxDrjGlO2mTguMw3A-tT5U';

async function testGeminiModels() {
  console.log('🔍 Testing Gemini API models...\n');
  
  const genAI = new GoogleGenerativeAI(API_KEY);
  
  // Try different model names
  const modelsToTest = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-1.0-pro',
    'gemini-1.5-flash-8b'
  ];
  
  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent("Hello, this is a test. Please respond with 'Model working' if you can read this.");
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${modelName}: SUCCESS`);
      console.log(`   Response: ${text.substring(0, 50)}...`);
      console.log('');
      
      // If this model works, use it
      if (text.includes('Model working') || text.length > 0) {
        console.log(`🎯 RECOMMENDED MODEL: ${modelName}`);
        break;
      }
      
    } catch (error) {
      console.log(`❌ ${modelName}: FAILED - ${error.message}`);
    }
  }
}

testGeminiModels().catch(console.error);
