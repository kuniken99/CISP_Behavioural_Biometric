// frontend/src/context/CBBAContext.js
import React, { createContext, useContext } from 'react';
import useCBBA from '../hooks/useCBBA';

const CBBAContext = createContext(null);

export const CBBAProvider = ({ children, isAuthenticated, currentUser, onRiskDetected }) => {
  const cbbaState = useCBBA(isAuthenticated, currentUser, onRiskDetected);

  return (
    <CBBAContext.Provider value={cbbaState}>
      {children}
    </CBBAContext.Provider>
  );
};

export const useCBBAContext = () => {
  const context = useContext(CBBAContext);
  if (!context) {
    // Return default values if used outside provider
    return {
      riskScore: 0,
      riskLevel: 'low',
      cbbaStatus: 'Inactive',
      isTrained: false,
      isTraining: false,
      sessionId: null,
      trainProfile: () => {},
      getProfileStatus: () => {},
      collectTrainingData: () => {},
      clearData: () => {},
      assessRisk: () => {}
    };
  }
  return context;
};
