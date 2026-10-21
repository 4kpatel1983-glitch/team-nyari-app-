// src/SplashScreen.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, StatusBar, StyleSheet, Text, View, Easing, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TEAM_LOGO = require('../asset.png');

const COLORS = {
  bg: '#F6F9F8', primary: '#0E7B6E', primaryDark: '#0A5F55', primarySoft: '#E2F0ED', text: '#10302B', muted: '#6F8782', black: '#0F172A',
};

type SplashScreenProps = { onFinish: () => void; };

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const insets = useSafeAreaInsets();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  
  const footerFadeAnim = useRef(new Animated.Value(0)).current;
  const footerTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(600), 
      Animated.parallel([
        Animated.timing(footerFadeAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.spring(footerTranslateY, { toValue: 0, friction: 7, tension: 50, useNativeDriver: true }),
      ]),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => { onFinish(); });
    }, 3500);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, footerFadeAnim, footerTranslateY, onFinish]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 24) }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} translucent />
      <View style={styles.bubbleTopLeft} />
      <View style={styles.bubbleBottomRight} />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoFrame}>
          <Image source={TEAM_LOGO} style={styles.logoImage} resizeMode="contain" />
        </View>
        <Text style={styles.brandTitle}>TEAM NYARI</Text>
        <Text style={styles.brandSubtitle}>માનવતા • પ્રામાણિકતા • જવાબદારી</Text>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: footerFadeAnim, transform: [{ translateY: footerTranslateY }], marginBottom: insets.bottom + 12 }]}>
        <View style={styles.footerPill}>
          <View style={styles.dot} /> 
          <Text style={styles.footerText}>દિલથી આપેલું દાન • સીધી મદદ</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bubbleTopLeft: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: COLORS.primarySoft, top: -60, left: -50, opacity: 0.7 },
  bubbleBottomRight: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#E2F0ED', bottom: -80, right: -60, opacity: 0.6 },
  content: { alignItems: 'center', justifyContent: 'center' },
  logoFrame: { width: 110, height: 110, borderRadius: 34, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#C7E2DC', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10, marginBottom: 22 },
  logoImage: { width: 76, height: 76 },
  brandTitle: { fontSize: 30, lineHeight: 38, color: COLORS.text, letterSpacing: 2, fontWeight: '900' },
  brandSubtitle: { marginTop: 8, fontSize: 13.5, lineHeight: 20, color: COLORS.muted, fontWeight: '600', letterSpacing: 0.5 },
  footer: { position: 'absolute', bottom: 20, alignItems: 'center' },
  footerPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: '#E1EBE8', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginRight: 8 },
  footerText: { fontSize: 13, color: COLORS.black, fontWeight: '900', letterSpacing: 0.8, fontFamily: 'HindVadodara_700Bold' },
});