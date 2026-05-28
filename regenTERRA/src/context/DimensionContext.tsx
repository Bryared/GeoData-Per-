import React, { createContext, useContext, useState } from 'react';

export type DimensionType = 'alimentaria' | 'desastres' | 'recursos';

interface DimensionContextType {
  dimension: DimensionType;
  setDimension: (dim: DimensionType) => void;
}

const DimensionContext = createContext<DimensionContextType | undefined>(undefined);

export function DimensionProvider({ children }: { children: React.ReactNode }) {
  const [dimension, setDimensionState] = useState<DimensionType>(() => {
    return (localStorage.getItem('geoterra_dimension') as DimensionType) || 'alimentaria';
  });

  const setDimension = (dim: DimensionType) => {
    setDimensionState(dim);
    localStorage.setItem('geoterra_dimension', dim);
    // Dispatch storage event to trigger update in other components listening to local storage
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <DimensionContext.Provider value={{ dimension, setDimension }}>
      {children}
    </DimensionContext.Provider>
  );
}

export function useDimension() {
  const context = useContext(DimensionContext);
  if (!context) {
    throw new Error('useDimension must be used within a DimensionProvider');
  }
  return context;
}
