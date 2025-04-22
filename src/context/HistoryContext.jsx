import React, { createContext, useState, useContext, useCallback } from 'react';

// Create a context for managing history
const HistoryContext = createContext();

// Custom hook to use the history context
export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};

export const HistoryProvider = ({ children }) => {
  // State to track actions history
  const [actions, setActions] = useState([]);
  // Current position in history (for undo/redo)
  const [currentPosition, setCurrentPosition] = useState(0);
  
  // Add a new action to history
  const addAction = useCallback((action) => {
    // When adding a new action, truncate any "future" actions
    // (actions that were undone but could be redone)
    setActions(prevActions => {
      const newActions = [...prevActions.slice(0, currentPosition), action];
      return newActions;
    });
    
    // Update position after adding
    setCurrentPosition(prevPosition => prevPosition + 1);
  }, [currentPosition]);
  
  // Undo the last action
  const undo = useCallback(() => {
    if (currentPosition > 0) {
      const actionToUndo = actions[currentPosition - 1];
      setCurrentPosition(currentPosition - 1);
      return actionToUndo;
    }
    return null;
  }, [actions, currentPosition]);
  
  // Redo a previously undone action
  const redo = useCallback(() => {
    if (currentPosition < actions.length) {
      const actionToRedo = actions[currentPosition];
      setCurrentPosition(currentPosition + 1);
      return actionToRedo;
    }
    return null;
  }, [actions, currentPosition]);
  
  // Go to a specific point in history
  const goToHistoryPosition = useCallback((position) => {
    if (position >= 0 && position <= actions.length) {
      const previousPosition = currentPosition;
      setCurrentPosition(position);
      
      if (position < previousPosition) {
        // Undo operations: execute in reverse from newest to oldest
        return { 
          direction: 'undo', 
          actions: actions.slice(position, previousPosition).reverse() 
        };
      } else if (position > previousPosition) {
        // Redo operations: execute in order from oldest to newest
        return { 
          direction: 'redo', 
          actions: actions.slice(previousPosition, position) 
        };
      }
    }
    return null;
  }, [actions, currentPosition]);
  
  // Clear all history
  const clearHistory = useCallback(() => {
    setActions([]);
    setCurrentPosition(0);
  }, []);
  
  // Create a formatted timestamp for new actions
  const getFormattedTimestamp = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Convert to 12-hour format
    
    return `${formattedHours}:${minutes} ${ampm}`;
  };
  
  // Create and add a new action with the given details
  const createAction = useCallback((type, entity, details) => {
    const timestamp = getFormattedTimestamp();
    const newAction = {
      id: Date.now(),
      type,
      entity,
      ...details,
      timestamp
    };
    
    addAction(newAction);
    return newAction;
  }, [addAction]);

  const value = {
    actions,
    currentPosition,
    undo,
    redo,
    goToHistoryPosition,
    clearHistory,
    createAction,
    canUndo: currentPosition > 0,
    canRedo: currentPosition < actions.length
  };

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  );
};