# Gemini API Setup for AI Commentary

## Overview
The PocketLab system now supports AI-powered experiment commentary using Google's Gemini API. This provides more sophisticated and educational analysis of sensor data.

## Setup Instructions

### 1. Get a Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key

### 2. Configure the Backend
The API key is already configured! You can start the backend in two ways:

**Option 1: Use the provided script (Recommended)**
```bash
cd backend
./start-with-gemini.sh
```

**Option 2: Set environment variable manually**
```bash
cd backend
GEMINI_API_KEY=AIzaSyAA5lgdlYf2wtxDrjGlO2mTguMw3A-tT5U npm run dev
```

**Option 3: Create a .env file**
```bash
# backend/.env
GEMINI_API_KEY=AIzaSyAA5lgdlYf2wtxDrjGlO2mTguMw3A-tT5U
```

## Features

### With Gemini API Key:
- **AI-Powered Analysis**: Sophisticated commentary on experiment data
- **Educational Insights**: Science teacher-style explanations
- **Pattern Recognition**: Advanced interpretation of sensor trends
- **Contextual Understanding**: Considers experiment duration and conditions

### Without API Key (Fallback):
- **Rule-Based Commentary**: Basic pattern detection
- **Reliable Operation**: Always works even without API access
- **Educational Content**: Still provides useful insights

## Example AI Commentary

**With Gemini API:**
> "Your experiment shows a clear heating trend with temperature increasing by 12.4°C over 3 minutes, indicating active thermal processes. The stable pressure readings suggest controlled environmental conditions, while the detected motion events correlate with the temperature changes, possibly indicating heat-induced convection. This data demonstrates excellent experimental control and provides valuable insights into thermal dynamics."

**Fallback Mode:**
> "Temperature increased steadily by 12.4°C over the experiment duration. Pressure readings remained stable throughout the experiment. 2 motion events detected, suggesting active movement or vibration. Data quality: No significant anomalies detected - clean dataset."

## API Usage
- **Model**: gemini-1.5-flash (fast and cost-effective)
- **Rate Limits**: Follows Google's standard API limits
- **Cost**: Very low cost per request (typically < $0.001 per summary)

## Troubleshooting

### Common Issues:
1. **"Failed to generate experiment summary"**: Check API key validity
2. **Fallback commentary only**: Verify GEMINI_API_KEY environment variable
3. **API errors**: Check internet connection and API key permissions

### Debug Mode:
Check the backend console for detailed error messages when API calls fail.

## Security Notes
- Never commit your actual API key to version control
- Use environment variables for API keys
- The system gracefully falls back to rule-based commentary if the API fails
