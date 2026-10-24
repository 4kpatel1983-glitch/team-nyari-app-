// App.tsx
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import Navigation from './src/Navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <Navigation />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
