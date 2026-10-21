// App.tsx
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from './src/components/ErrorBoundary'; // ⚡ ઉમેર્યું

import Navigation from './src/Navigation';

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Navigation />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}