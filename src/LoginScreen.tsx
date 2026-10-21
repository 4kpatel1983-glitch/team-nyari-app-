// src/LoginScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { ActivityIndicator, Animated, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TEAM_LOGO = require('../asset.png');

const COLORS = {
  bg: '#F6F9F8', white: '#FFFFFF', primary: '#0E7B6E', primaryDark: '#0A5F55', primarySoft: '#E5F2EF',
  primaryGlow: '#F0F7F5', inputBg: '#F4F9F7', text: '#0F2E2A', textSecondary: '#3A4F4B', helper: '#5A6E6A',
  muted: '#7A918C', border: '#DCEAE6', danger: '#C94B58', dangerSoft: '#FCEBEE',
};

type LoginScreenProps = { onLoginSuccess: (mobileNumber: string) => void; trustedMobile?: string; };
type ErrorField = 'mobile' | 'otp' | null;

export default function LoginScreen({ onLoginSuccess, trustedMobile }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const initialCleanMobile = trustedMobile ? trustedMobile.replace(/\D/g, '').slice(-10) : '';

  const [countryCode, setCountryCode] = useState('+91');
  const [mobile, setMobile] = useState(initialCleanMobile);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [step, setStep] = useState<'MOBILE' | 'OTP'>('MOBILE');
  const [loading, setLoading] = useState(false);

  const [errorField, setErrorField] = useState<ErrorField>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [verified, setVerified] = useState(false);

  const errorOpacity = useRef(new Animated.Value(0)).current;
  const errorTranslateY = useRef(new Animated.Value(-6)).current;
  const errorAnimIdRef = useRef(0);

  const autoFillTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userEditedOtpRef = useRef(false);

  const isTrusted = !!trustedMobile && mobile.length === 10 && trustedMobile.includes(mobile);

  useEffect(() => {
    return () => { if (autoFillTimeoutRef.current) clearTimeout(autoFillTimeoutRef.current); };
  }, []);

  const cancelAutoFill = () => { if (autoFillTimeoutRef.current) { clearTimeout(autoFillTimeoutRef.current); autoFillTimeoutRef.current = null; } };
  const scheduleAutoFill = (otpValue: string) => {
    cancelAutoFill(); userEditedOtpRef.current = false;
    autoFillTimeoutRef.current = setTimeout(() => { if (!userEditedOtpRef.current) setOtp(otpValue); autoFillTimeoutRef.current = null; }, 1000);
  };

  const showError = (field: ErrorField, message: string) => {
    errorAnimIdRef.current += 1;
    setErrorField(field); setErrorMessage(message); errorOpacity.setValue(0); errorTranslateY.setValue(-6);
    Animated.parallel([
      Animated.timing(errorOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(errorTranslateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  const clearError = () => {
    const myId = ++errorAnimIdRef.current;
    Animated.parallel([
      Animated.timing(errorOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(errorTranslateY, { toValue: -6, duration: 150, useNativeDriver: true }),
    ]).start(() => { if (errorAnimIdRef.current === myId) { setErrorField(null); setErrorMessage(''); } });
  };

  const handleSendOtp = () => {
    clearError();
    if (mobile.length < 10) return showError('mobile', 'કૃપા કરીને ૧૦ આંકડાનો મોબાઇલ નંબર દાખલ કરો.');
    if (isTrusted) {
      setLoading(true); setTimeout(() => { setLoading(false); onLoginSuccess(`${countryCode}${mobile}`); }, 500); return;
    }
    setLoading(true);
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setTimeout(() => { setLoading(false); setGeneratedOtp(randomOtp); setStep('OTP'); setVerified(false); setOtp(''); scheduleAutoFill(randomOtp); }, 600);
  };

  const handleVerifyOtp = () => {
    cancelAutoFill(); setVerified(false);
    if (otp.length < 6) return showError('otp', '૬ આંકડાનો કોડ દાખલ કરો.');
    if (otp !== generatedOtp) return showError('otp', 'ખોટો સુરક્ષા કોડ. ફરી પ્રયાસ કરો.');
    clearError(); setVerified(true); setLoading(true);
    setTimeout(() => { setLoading(false); onLoginSuccess(`${countryCode}${mobile}`); }, 1000);
  };

  const handleOtpChange = (text: string) => { userEditedOtpRef.current = true; cancelAutoFill(); setOtp(text.replace(/[^0-9]/g, '')); if (errorField === 'otp') clearError(); if (verified) setVerified(false); };
  const handleMobileChange = (text: string) => {
    let cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length > 10) cleaned = cleaned.slice(-10);
    setMobile(cleaned); if (errorField === 'mobile') clearError();
  };

  const handleResend = () => { const randomOtp = Math.floor(100000 + Math.random() * 900000).toString(); setGeneratedOtp(randomOtp); setOtp(''); setVerified(false); clearError(); scheduleAutoFill(randomOtp); };
  const handleBackToMobile = () => { cancelAutoFill(); setStep('MOBILE'); setOtp(''); clearError(); setVerified(false); };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <View style={styles.bubbleCardOne} />
      <View style={styles.bubbleCardTwo} />

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 22, paddingBottom: insets.bottom + 20, flexGrow: 1 }}>
        <View style={styles.header}>
          <View style={styles.logoFrame}>
            <Image source={TEAM_LOGO} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.title}>TEAM NYARI</Text>
          <Text style={styles.subtitle}>માનવતા • પ્રામાણિકતા • જવાબદારી</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardInnerBubble} />

          {step === 'MOBILE' ? (
            <>
              <Text style={styles.cardTitle}>Welcome back</Text>
              <Text style={styles.cardSub}>તમારો મોબાઇલ નંબર દાખલ કરો</Text>

              <View style={styles.inputRow}>
                <View style={styles.flagBox}>
                  <Text style={styles.flagIcon}>🇮🇳</Text>
                  <TextInput style={styles.countryCodeInput} value={countryCode} onChangeText={setCountryCode} keyboardType="phone-pad" maxLength={5} />
                </View>
                <TextInput style={[styles.mobileInput, errorField === 'mobile' && styles.inputError]} placeholder="98765 43210" placeholderTextColor="#9AAFA9" keyboardType="number-pad" value={mobile} onChangeText={handleMobileChange} textContentType="telephoneNumber" autoComplete="tel" />
              </View>

              {errorField === 'mobile' && (
                <Animated.View style={[styles.inlineError, { opacity: errorOpacity, transform: [{ translateY: errorTranslateY }] }]}>
                  <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                  <Text style={styles.inlineErrorText}>{errorMessage}</Text>
                </Animated.View>
              )}

              {isTrusted && (
                <View style={styles.trustHint}>
                  <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
                  <Text style={styles.trustHintText}>આ device પર verified — quick login ready</Text>
                </View>
              )}

              <TouchableOpacity style={[styles.primaryBtn, mobile.length < 10 && styles.disabledBtn]} activeOpacity={0.88} onPress={handleSendOtp} disabled={loading || mobile.length < 10}>
                {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : (
                  <>
                    <Text style={styles.primaryBtnText}>{isTrusted ? 'Quick Login' : 'Get OTP'}</Text>
                    <Ionicons name={isTrusted ? 'flash' : 'arrow-forward'} size={17} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.footerNote}>
                <Ionicons name="lock-closed-outline" size={11} color={COLORS.helper} />
                <Text style={styles.footerNoteText}>તમારો નંબર સુરક્ષિત રીતે verify થાય છે</Text>
              </View>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.backBtn} onPress={handleBackToMobile} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={15} color={COLORS.primary} />
                <Text style={styles.backBtnText}>Change number</Text>
              </TouchableOpacity>

              <Text style={styles.cardTitle}>Verify code</Text>
              <Text style={styles.cardSub}>મોબાઇલ પર મોકલેલ ૬ આંકડાનો કોડ દાખલ કરો</Text>

              <View style={[styles.otpInputContainer, errorField === 'otp' && styles.inputError, verified && styles.otpSuccess]}>
                <TextInput style={styles.otpInput} placeholder="• • • • • •" placeholderTextColor="#B8CBC7" keyboardType="number-pad" maxLength={6} value={otp} onChangeText={handleOtpChange} textContentType="oneTimeCode" autoComplete="sms-otp" editable={!verified} />
              </View>

              {errorField === 'otp' && (
                <Animated.View style={[styles.inlineError, { opacity: errorOpacity, transform: [{ translateY: errorTranslateY }] }]}>
                  <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                  <Text style={styles.inlineErrorText}>{errorMessage}</Text>
                </Animated.View>
              )}

              {verified ? (
                <View style={[styles.primaryBtn, styles.successBtn]}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>Verified!</Text>
                </View>
              ) : (
                <TouchableOpacity style={[styles.primaryBtn, otp.length < 6 && styles.disabledBtn]} activeOpacity={0.88} onPress={handleVerifyOtp} disabled={loading || otp.length < 6}>
                  {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : (
                    <>
                      <Text style={styles.primaryBtnText}>Verify & Continue</Text>
                      <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              )}

              {!verified && (
                <TouchableOpacity style={styles.resendBtn} onPress={handleResend} activeOpacity={0.7}>
                  <Ionicons name="refresh-outline" size={12} color={COLORS.primary} />
                  <Text style={styles.resendText}>Resend code</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={styles.brandFooter}>
          <Text style={styles.brandFooterText}>POWERED BY TEAM NYARI</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  bubbleCardOne: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: COLORS.primarySoft, top: -60, right: -60, opacity: 0.6 },
  bubbleCardTwo: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: COLORS.primaryGlow, bottom: -100, left: -80, opacity: 0.55 },
  header: { alignItems: 'center', marginBottom: 22, marginTop: 6 },
  logoFrame: { width: 76, height: 76, borderRadius: 24, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D0E6E1', elevation: 4, shadowColor: COLORS.primaryDark, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12, marginBottom: 12 },
  logoImage: { width: 52, height: 52 },
  title: { fontSize: 22, color: COLORS.text, fontWeight: '900', letterSpacing: 1.2 },
  subtitle: { fontSize: 11.5, color: COLORS.helper, marginTop: 5, fontWeight: '600', letterSpacing: 0.3 },
  card: { backgroundColor: COLORS.white, borderRadius: 26, padding: 22, borderWidth: 1, borderColor: COLORS.border, elevation: 5, shadowColor: COLORS.primaryDark, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.09, shadowRadius: 16, position: 'relative', overflow: 'hidden' },
  cardInnerBubble: { position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: COLORS.primarySoft, top: -35, right: -25, opacity: 0.4 },
  cardTitle: { fontSize: 19, color: COLORS.text, fontWeight: '900', letterSpacing: -0.2 },
  cardSub: { fontSize: 12.5, color: COLORS.helper, marginTop: 4, marginBottom: 18, fontWeight: '600' },
  inputRow: { flexDirection: 'row', gap: 9, marginBottom: 14 },
  flagBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 11, height: 52, gap: 5 },
  flagIcon: { fontSize: 17 },
  countryCodeInput: { fontSize: 14.5, fontWeight: '800', color: COLORS.text, minWidth: 36, padding: 0 },
  mobileInput: { flex: 1, backgroundColor: COLORS.inputBg, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 15, fontSize: 16, color: COLORS.text, height: 52, fontWeight: '700', letterSpacing: 0.5 },
  inputError: { borderColor: COLORS.danger, backgroundColor: '#FFF5F6' },
  inlineError: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4, marginBottom: 12, paddingHorizontal: 4 },
  inlineErrorText: { flex: 1, fontSize: 11.5, color: COLORS.danger, fontWeight: '700' },
  trustHint: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primarySoft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 14, borderWidth: 1, borderColor: '#C9E1DB' },
  trustHintText: { flex: 1, fontSize: 11.5, color: COLORS.primaryDark, fontWeight: '700' },
  otpInputContainer: { backgroundColor: COLORS.inputBg, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14, marginBottom: 12, height: 54, justifyContent: 'center' },
  otpSuccess: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
  otpInput: { fontSize: 20, color: COLORS.text, fontWeight: '800', letterSpacing: 8, textAlign: 'center', paddingHorizontal: 12 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: 14, height: 52, gap: 8, elevation: 4, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 10 },
  successBtn: { backgroundColor: COLORS.primary },
  disabledBtn: { opacity: 0.4 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 14, alignSelf: 'flex-start' },
  backBtnText: { fontSize: 11.5, color: COLORS.primary, fontWeight: '800', letterSpacing: 0.2 },
  resendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 14, paddingVertical: 6 },
  resendText: { fontSize: 12, color: COLORS.primary, fontWeight: '800', letterSpacing: 0.2 },
  footerNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 14 },
  footerNoteText: { fontSize: 11, color: COLORS.helper, fontWeight: '600' },
  brandFooter: { alignItems: 'center', marginTop: 22 },
  brandFooterText: { fontSize: 10, color: '#8EAFA8', fontWeight: '800', letterSpacing: 1.5 },
});