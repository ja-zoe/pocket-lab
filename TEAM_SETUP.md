# Team Setup Instructions

## For Teammates to See Live Data

### Option 1: Connect to Aaron's Backend (Recommended)
1. **Create a `.env` file** in the `frontend/` directory:
```bash
cd frontend
echo "VITE_API_URL=http://192.168.1.104:8000" > .env
echo "VITE_WS_URL=ws://192.168.1.104:8000" >> .env
```

2. **Clear browser cache** and refresh:
   - Open Dev Tools (F12)
   - Right-click refresh → "Empty Cache and Hard Reload"
   - Or use Ctrl+Shift+R

3. **Start the frontend**:
```bash
cd frontend
npm run dev
```

### Option 2: Run Your Own Backend
1. **Set up backend**:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

2. **Update frontend config**:
```bash
cd frontend
echo "VITE_API_URL=http://localhost:8000" > .env
echo "VITE_WS_URL=ws://localhost:8000" >> .env
```

### Troubleshooting
- **No data showing?** Check if backend is running: `http://192.168.1.104:8000/api/sensor-data`
- **WebSocket not connecting?** Check Network tab in Dev Tools for WebSocket errors
- **Different data?** Clear browser cache and refresh

### Test Account
- **Email:** test@example.com
- **Password:** testpassword
