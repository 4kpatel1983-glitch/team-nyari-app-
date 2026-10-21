// src/useLiveDonations.ts
import { useEffect, useRef } from 'react';
import { AppState, DeviceEventEmitter } from 'react-native';
import { subscribeLiveDonations } from './supabaseClient';

// ⚡ REALTIME 100% ચાલુ કર્યું છે. પોલિંગ (Polling) પૂરેપૂરું બંધ કર્યું છે.
const ENABLE_REALTIME = true; 

export function useLiveDonations(onChange: () => void) {
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const trigger = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => cbRef.current(), 300);
    };

    const unsubRealtime = ENABLE_REALTIME ? subscribeLiveDonations(trigger) : () => {};
    const localSub = DeviceEventEmitter.addListener('ON_DONATION_SUCCESS', trigger);
    const appSub = AppState.addEventListener('change', (s) => { if (s === 'active') trigger(); });

    return () => {
      if (timer) clearTimeout(timer);
      unsubRealtime();
      localSub.remove();
      appSub.remove();
    };
  }, []);
}