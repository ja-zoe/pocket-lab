import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MockDataContextType {
  isMockDataEnabled: boolean;
  toggleMockData: () => void;
  mockDataStatus: string;
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

export const useMockData = () => {
  const context = useContext(MockDataContext);
  if (context === undefined) {
    throw new Error('useMockData must be used within a MockDataProvider');
  }
  return context;
};

interface MockDataProviderProps {
  children: ReactNode;
}

export const MockDataProvider: React.FC<MockDataProviderProps> = ({ children }) => {
  const [isMockDataEnabled, setIsMockDataEnabled] = useState(false);

  const toggleMockData = () => {
    setIsMockDataEnabled(prev => !prev);
  };

  const mockDataStatus = isMockDataEnabled 
    ? "Mock Data Active - Demonstrating all graphs with simulated sensor data"
    : "Live Data Active - Receiving real sensor data from ESP32";

  const value: MockDataContextType = {
    isMockDataEnabled,
    toggleMockData,
    mockDataStatus
  };

  return (
    <MockDataContext.Provider value={value}>
      {children}
    </MockDataContext.Provider>
  );
};
