# 🔬 LabLink Frontend

A modern React-based dashboard for live sensor data visualization and experiment management.

## ✨ Features

- **🔐 Authentication**: Firebase Auth with Google and Email/Password login
- **📊 Live Data Visualization**: Real-time temperature and acceleration graphs using Recharts
- **🎮 Experiment Controls**: Start/Stop experiment functionality with live data collection
- **📁 Data Export**: CSV export functionality for collected sensor data
- **📚 Experiment History**: View and manage past experiments
- **🎨 Sciency Theme**: Dark theme with teal/green accents and glowing effects

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS with custom sciency theme
- **Charts**: Recharts for live data visualization
- **Authentication**: Firebase Auth
- **Routing**: React Router v7
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Configure Firebase**:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password and Google)
   - Copy your Firebase config to `src/lib/firebase.ts`

3. **Start development server**:
   ```bash
   pnpm dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:5173`

## 🔧 Configuration

### Firebase Setup

Update `src/lib/firebase.ts` with your Firebase configuration:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### Backend Integration

The frontend expects a backend API at `/api/devices/:id/data` for live sensor data. Currently uses mock data for demonstration.

## 📱 Pages

- **Login Page** (`/login`): Authentication with Google and Email/Password
- **Dashboard** (`/dashboard`): Main experiment interface with live graphs
- **History** (`/history`): View and manage past experiments

## 🎨 Design System

### Colors
- **Background**: `#0f172a` (navy)
- **Primary**: `#14b8a6` (teal)
- **Secondary**: `#22c55e` (light green)
- **Text**: White/Gray scale

### Components
- **Cards**: Glowing borders with backdrop blur
- **Buttons**: Primary (teal), Secondary (green), Danger (red)
- **Charts**: Custom tooltips and styling

## 📊 Data Structure

```typescript
interface SensorData {
  timestamp: number;
  temperature: number;
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
}
```

## 🔄 Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint

### Project Structure

```
src/
├── contexts/          # React contexts (Auth)
├── lib/              # Utilities and Firebase config
├── pages/            # Page components
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   └── HistoryPage.tsx
├── App.tsx           # Main app with routing
└── main.tsx          # Entry point
```

## 🚀 Deployment

1. **Build the project**:
   ```bash
   pnpm build
   ```

2. **Deploy** to your preferred hosting service:
   - Vercel (recommended for React apps)
   - Netlify
   - Firebase Hosting
   - AWS S3 + CloudFront

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the LabLink MVP for educational purposes.