import { useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      setIsOnline(state === 'active');
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription?.remove();
  }, []);

  return isOnline;
}
