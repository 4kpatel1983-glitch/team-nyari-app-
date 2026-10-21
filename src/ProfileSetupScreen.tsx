// src/ProfileSetupScreen.tsx
// ============================================================
// TEAM NYARI — PROFILE SETUP (Premium Redesigned UI/UX)
// ============================================================

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet,
  ScrollView, ActivityIndicator, StatusBar, Modal, Pressable,
  Animated, KeyboardAvoidingView, Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  uploadAvatar, upsertProfile, saveSession, STORAGE_KEYS, type Profile,
} from "./supabaseClient";

interface ProfileSetupScreenProps { onComplete: () => void; }

const COLORS = {
  bg: "#F8FAFC", white: "#FFFFFF", primary: "#0E7B6E", primaryDark: "#0A5F55",
  primarySoft: "#F0FDF4", gold: "#D4AF37", text: "#111111", textSecondary: "#334155", // ⚡ Black/Charcoal text
  helper: "#64748B", muted: "#94A3B8", border: "#E2E8F0", danger: "#EF4444",
};

type ErrorField = "name" | "photo" | "pincode" | null;

export default function ProfileSetupScreen({ onComplete }: ProfileSetupScreenProps) {
  const insets = useSafeAreaInsets();

  const [mobile, setMobile] = useState<string>("");
  const [name, setName] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [pincodeVerified, setPincodeVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photoPickerVisible, setPhotoPickerVisible] = useState(false);

  const [errorField, setErrorField] = useState<ErrorField>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const errorOpacity = useRef(new Animated.Value(0)).current;
  const errorTranslateY = useRef(new Animated.Value(-6)).current;
  const errorAnimIdRef = useRef(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    (async () => {
      const m = await AsyncStorage.getItem(STORAGE_KEYS.USER_MOBILE);
      if (m) setMobile(m);
    })();
  }, []);

  const isFormValid = name.trim().length > 0 && imageUri !== null && pincodeVerified && address.length > 0;
  const missingItems: string[] = [];
  if (!name.trim()) missingItems.push("નામ");
  if (!imageUri) missingItems.push("ફોટો");
  if (!pincodeVerified) missingItems.push("પિનકોડ");

  const showError = (field: ErrorField, message: string) => {
    errorAnimIdRef.current += 1;
    setErrorField(field);
    setErrorMessage(message);
    errorOpacity.setValue(0);
    errorTranslateY.setValue(-6);
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
    ]).start(() => {
      if (errorAnimIdRef.current === myId) {
        setErrorField(null);
        setErrorMessage("");
      }
    });
  };

  const verifyPincode = useCallback(async (pin: string) => {
    if (pin.length !== 6) return;
    try {
      setVerifying(true);
      setPincodeVerified(false);
      setAddress("");
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const json = await res.json();

      if (Array.isArray(json) && json[0]?.Status === "Success" && json[0]?.PostOffice?.length > 0) {
        const po = json[0].PostOffice[0];
        const fullAddress = [po.Name, po.Block && po.Block !== po.Name ? po.Block : null, po.District, po.State].filter(Boolean).join(", ");
        setAddress(fullAddress);
        setPincodeVerified(true);
        clearError();
      } else {
        setPincodeVerified(false);
        setAddress("");
        showError("pincode", "આ પિનકોડ મળ્યો નથી. ફરી ચેક કરો.");
      }
    } catch (e) {
      showError("pincode", "Network error. ફરી પ્રયાસ કરો.");
    } finally {
      setVerifying(false);
    }
  }, []);

  const handlePincodeChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 6);
    setPincode(cleaned);
    setPincodeVerified(false);
    setAddress("");
    if (errorField === "pincode") clearError();
    if (cleaned.length === 6) verifyPincode(cleaned);
  };

  const openCamera = async () => {
    setPhotoPickerVisible(false);
    setTimeout(async () => {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return showError("photo", "કેમેરા પરમિશન જરૂરી છે.");
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!result.canceled && result.assets?.length) { setImageUri(result.assets[0].uri); clearError(); }
    }, 250);
  };

  const openGallery = async () => {
    setPhotoPickerVisible(false);
    setTimeout(async () => {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!result.canceled && result.assets?.length) { setImageUri(result.assets[0].uri); clearError(); }
    }, 250);
  };

  const handleGetLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return showError("pincode", "GPS પરમિશન આપો.");
      setLoadingLocation(true);
      let location = await Location.getLastKnownPositionAsync({});
      if (!location) {
        location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }
      if (location) {
        const geocode = await Location.reverseGeocodeAsync({ latitude: location.coords.latitude, longitude: location.coords.longitude });
        if (geocode?.length) {
          const addr = geocode[0];
          const pin = (addr.postalCode || "").replace(/[^0-9]/g, "").slice(0, 6);
          if (pin) { setPincode(pin); verifyPincode(pin); }
          const parts = [addr.city || addr.subregion, addr.district, addr.region].filter(Boolean);
          if (parts.length) setAddress(parts.join(", "));
        }
      }
    } catch (error) {
      showError("pincode", "લોકેશન ફેચ કરવામાં સમસ્યા આવી.");
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSaveProfile = async () => {
    clearError();
    if (!name.trim()) return showError("name", "કૃપા કરીને નામ લખો.");
    if (!imageUri) return showError("photo", "કૃપા કરીને પ્રોફાઇલ ફોટો ઉમેરો.");
    if (!pincodeVerified) return showError("pincode", "કૃપા કરીને સાચો પિનકોડ દાખલ કરો.");
    if (!mobile) return showError("name", "Mobile missing. Please restart app.");

    try {
      setSaving(true);
      const photoUrl = await uploadAvatar(imageUri, mobile);
      if (!photoUrl) { setSaving(false); return showError("photo", "ફોટો upload કરવામાં સમસ્યા આવી."); }

      const profilePayload: Profile = {
        mobile, name: name.trim(), pincode: pincode.trim(), location_text: address.trim(), photo_url: photoUrl,
      };

      const savedProfile = await upsertProfile(profilePayload);
      if (!savedProfile) { setSaving(false); return showError("name", "Supabase માં save fail. ફરી પ્રયાસ કરો."); }

      await saveSession(mobile, savedProfile);
      await AsyncStorage.setItem("USER_PROFILE", JSON.stringify({
        name: savedProfile.name, imageUri: savedProfile.photo_url, locationText: savedProfile.location_text, pincode: savedProfile.pincode, mobile: savedProfile.mobile,
      }));

      setSaved(true);
      setSaving(false);
      setTimeout(() => { onComplete(); }, 1500);
    } catch (error) {
      setSaving(false);
      showError("name", "પ્રોફાઇલ સેવ કરવામાં સમસ્યા આવી.");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      {/* Soft Background Glows */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <Animated.View style={[styles.flex, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <ScrollView 
          contentContainerStyle={[styles.scroll, { paddingTop: Math.max(insets.top, 20) + 20, paddingBottom: Math.max(insets.bottom + 24, 32) }]} 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
        >
          
          {/* HEADER (Badge & Subtitle Removed) */}
          <View style={styles.header}>
            <Text style={styles.title}>Setup your profile</Text>
          </View>

          {/* AVATAR */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setPhotoPickerVisible(true)} style={styles.avatarWrapper}>
              <View style={[styles.avatarRing, imageUri ? styles.avatarRingActive : null]}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="camera" size={28} color={COLORS.primary} />
                  </View>
                )}
              </View>
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.cameraBtn}>
                <Ionicons name="pencil" size={12} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>{imageUri ? "ફોટો બદલવા માટે ટચ કરો" : "ફોટો ઉમેરવો ફરજિયાત છે *"}</Text>
          </View>

          {/* FORM CARD */}
          <View style={styles.card}>
            
            {/* NAME */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>પૂરું નામ <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputWrapper, errorField === "name" && styles.inputWrapperError]}>
                <View style={styles.inputIconWrap}>
                  <Ionicons name="person-outline" size={18} color={COLORS.primary} />
                </View>
                <TextInput
                  style={styles.input} placeholder="નામ લખો" placeholderTextColor="#9AAFA9"
                  value={name} onChangeText={(t) => { setName(t); if (errorField === "name") clearError(); }} autoCapitalize="words"
                />
              </View>
              {errorField === "name" && (
                <Animated.View style={[styles.inlineError, { opacity: errorOpacity, transform: [{ translateY: errorTranslateY }] }]}>
                  <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                  <Text style={styles.inlineErrorText}>{errorMessage}</Text>
                </Animated.View>
              )}
            </View>

            {/* PINCODE & GPS (Capsule Shape) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>પિનકોડ <Text style={styles.required}>*</Text></Text>
              <View style={styles.pincodeRow}>
                <View style={[styles.inputWrapper, { flex: 1 }, errorField === "pincode" && styles.inputWrapperError]}>
                  <View style={styles.inputIconWrap}>
                    <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                  </View>
                  <TextInput
                    style={styles.input} placeholder="6 digit pincode" placeholderTextColor="#9AAFA9"
                    value={pincode} onChangeText={handlePincodeChange} keyboardType="number-pad" maxLength={6}
                  />
                  {verifying ? (
                    <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 10 }} />
                  ) : pincodeVerified ? (
                    <View style={styles.verifiedBadge}><Ionicons name="checkmark-circle" size={20} color={COLORS.primary} /></View>
                  ) : null}
                </View>

                {/* ⚡ GPS BUTTON (Small Capsule Shape) */}
                <TouchableOpacity activeOpacity={0.8} onPress={handleGetLocation} disabled={loadingLocation} style={styles.gpsIconButton}>
                  <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.gpsGradient}>
                    {loadingLocation ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="locate" size={20} color="#FFFFFF" />}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {errorField === "pincode" && (
                <Animated.View style={[styles.inlineError, { opacity: errorOpacity, transform: [{ translateY: errorTranslateY }] }]}>
                  <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                  <Text style={styles.inlineErrorText}>{errorMessage}</Text>
                </Animated.View>
              )}
            </View>

            {/* ADDRESS AUTO-FILL (White/Grey Card Style) */}
            {pincodeVerified && address.length > 0 && (
              <Animated.View style={styles.addressCard}>
                <View style={styles.addressIconWrap}>
                  <Ionicons name="checkmark-done" size={18} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addressLabel}>Verified Address</Text>
                  <Text style={styles.addressText}>{address}</Text>
                </View>
              </Animated.View>
            )}

            {/* SAVE BUTTON (Capsule Shape) */}
            <View style={{ marginTop: 5 }}>
              {saved ? (
                <View style={styles.saveButtonWrapper}>
                  <LinearGradient colors={['#10B981', '#059669']} style={styles.saveButtonGradient}>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Profile Saved!</Text>
                  </LinearGradient>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    activeOpacity={isFormValid ? 0.85 : 1} onPress={handleSaveProfile} disabled={!isFormValid || saving}
                    style={[styles.saveButtonWrapper, (!isFormValid || saving) && { opacity: 0.7 }]}
                  >
                    <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.saveButtonGradient}>
                      {saving ? (
                        <ActivityIndicator color={COLORS.white} size="small" />
                      ) : (
                        <>
                          <Text style={styles.saveButtonText}>Save & Continue</Text>
                          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {!isFormValid && missingItems.length > 0 && (
                    <View style={styles.missingHint}>
                      <Ionicons name="information-circle-outline" size={14} color={COLORS.helper} />
                      <Text style={styles.missingHintText}>બાકી: {missingItems.join(" • ")}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* PHOTO PICKER MODAL */}
      <Modal visible={photoPickerVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setPhotoPickerVisible(false)}>
        <View style={styles.pickerBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPhotoPickerVisible(false)} />
          <View style={[styles.pickerSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Profile Photo</Text>
            <Text style={styles.pickerSubtitle}>તમારો ફોટો ક્યાંથી લેવો છે?</Text>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 15 }}>
              <TouchableOpacity style={styles.pickerOptionBox} onPress={openCamera} activeOpacity={0.8}>
                <View style={styles.pickerIconWrap}><Ionicons name="camera" size={24} color={COLORS.primary} /></View>
                <Text style={styles.pickerOptionTitle}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.pickerOptionBox} onPress={openGallery} activeOpacity={0.8}>
                <View style={styles.pickerIconWrap}><Ionicons name="images" size={24} color={COLORS.primary} /></View>
                <Text style={styles.pickerOptionTitle}>Gallery</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.pickerCancel} onPress={() => setPhotoPickerVisible(false)} activeOpacity={0.85}>
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: COLORS.bg, position: 'relative', overflow: 'hidden' },
  
  // Background Glows
  glowTop: { position: "absolute", width: 250, height: 250, borderRadius: 125, backgroundColor: COLORS.primarySoft, top: -80, right: -80, opacity: 0.8 },
  glowBottom: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "#F1F5F9", bottom: -60, left: -60, opacity: 0.9 },

  scroll: { paddingHorizontal: 20 },
  
  // Header
  header: { alignItems: "center", marginBottom: 25 },
  title: { fontSize: 26, fontWeight: "900", color: COLORS.text, textAlign: "center", letterSpacing: -0.5 },
  
  // Avatar
  avatarContainer: { alignItems: "center", marginBottom: 20 },
  avatarWrapper: { position: "relative", padding: 3, backgroundColor: COLORS.white, borderRadius: 50, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 15 },
  avatarRing: { width: 86, height: 86, borderRadius: 43, borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarRingActive: { borderColor: COLORS.primary, borderStyle: 'solid' },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: { width: '100%', height: '100%', backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  cameraBtn: { position: "absolute", bottom: 2, right: 2, width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: COLORS.white },
  avatarHint: { fontSize: 12, color: COLORS.helper, marginTop: 10, fontWeight: "700" },
  
  // Form Card
  card: { backgroundColor: COLORS.white, borderRadius: 24, padding: 18, elevation: 6, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.04, shadowRadius: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "900", color: COLORS.text, marginBottom: 8 },
  required: { color: COLORS.danger },
  
  // Sleeker Inputs
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 10, height: 52, borderWidth: 1, borderColor: '#E2E8F0' },
  inputWrapperError: { borderColor: COLORS.danger, backgroundColor: "#FEF2F2" },
  inputIconWrap: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: COLORS.text, fontWeight: "600", paddingVertical: 0 },
  
  inlineError: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, paddingHorizontal: 4 },
  inlineErrorText: { flex: 1, fontSize: 11.5, color: COLORS.danger, fontWeight: "700" },
  
  // Pincode & GPS (Capsule Shape)
  pincodeRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  
  // ⚡ GPS Button redesigned to Small Capsule
  gpsIconButton: { width: 64, height: 52, borderRadius: 12, overflow: "hidden", elevation: 3 },
  gpsGradient: { flex: 1, alignItems: "center", justifyContent: "center" },
  verifiedBadge: { marginRight: 6 },
  
  // Address Card (White/Grey Style)
  addressCard: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#F8FAFC" },
  addressIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: '#E2E8F0' },
  addressLabel: { fontSize: 9, fontWeight: "900", color: COLORS.helper, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 2 },
  addressText: { fontSize: 12.5, fontWeight: "800", color: COLORS.text, lineHeight: 18 }, // Black Charcoal Font
  
  // Save Button (Capsule)
  saveButtonWrapper: { borderRadius: 26, overflow: "hidden", elevation: 4, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10 },
  saveButtonGradient: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  saveButtonText: { color: COLORS.white, fontSize: 15, fontWeight: "900", letterSpacing: 0.3 },
  
  missingHint: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 12 },
  missingHintText: { fontSize: 11.5, color: COLORS.helper, fontWeight: "700" },
  
  // Picker Modal
  pickerBackdrop: { flex: 1, backgroundColor: "rgba(10,35,30,0.6)", justifyContent: "flex-end" },
  pickerSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10 },
  pickerHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0", alignSelf: "center", marginBottom: 16 },
  pickerTitle: { fontSize: 18, fontWeight: "900", color: COLORS.text, letterSpacing: -0.3 },
  pickerSubtitle: { fontSize: 12.5, color: COLORS.helper, marginTop: 3, fontWeight: "500" },
  pickerOptionBox: { flex: 1, backgroundColor: COLORS.primarySoft, borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#C9E1DB' },
  pickerIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center", elevation: 1 },
  pickerOptionTitle: { fontSize: 13.5, fontWeight: "800", color: COLORS.primaryDark },
  pickerCancel: { alignItems: "center", justifyContent: "center", backgroundColor: "#F1F5F9", borderRadius: 16, height: 50, marginTop: 12 },
  pickerCancelText: { fontSize: 14, fontWeight: "800", color: COLORS.textSecondary },
});