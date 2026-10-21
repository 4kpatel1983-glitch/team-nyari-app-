// src/components/ErrorBoundary.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
    // ભવિષ્યમાં અહીં Sentry જેવું ટૂલ જોડી શકાય જેથી ખબર પડે કે એપ ક્યાં ક્રેશ થઈ.
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconBox}>
              <Ionicons name="warning-outline" size={50} color="#C94B58" />
            </View>
            <Text style={styles.title}>અરે! કંઈક ખોટું થયું</Text>
            <Text style={styles.subtitle}>
              એપમાં એક નાની સમસ્યા આવી છે. ચિંતા ના કરો, તમે ફરી થી પ્રયાસ કરી શકો છો.
            </Text>
            
            <TouchableOpacity style={styles.button} onPress={this.handleReset} activeOpacity={0.8}>
              <Ionicons name="refresh-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>ફરી પ્રયાસ કરો</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F9F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  iconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FCEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F2E2A',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#5A6E6A',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#0E7B6E',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});