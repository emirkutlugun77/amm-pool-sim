import { useEffect, useRef } from 'react';
import { Pool } from '../types';

export function useRealTimePrice(
  pool: Pool | null,
  onPriceUpdate: (updatedPool: Pool) => void
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Disable automatic trading - only manual trades will update prices
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [pool, onPriceUpdate]);
}
