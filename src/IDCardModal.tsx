// src/IDCardModal.tsx
import React, { useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions, ActivityIndicator, Image } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { DemoMember } from './MemberListScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TEAM_LOGO = require('../asset.png');

const C = {
  primary: '#0B5D52', secondary: '#0F766E', mint: '#E6F7F3', bg: '#F7FAF9', white: '#FFFFFF',
  text: '#172B2A', textMuted: '#647575', border: '#DCE9E6', gold: '#D4AF55', success: '#16A36A',
};

interface IDCardModalProps { visible: boolean; onClose: () => void; member: DemoMember | null; }

const maskMobile = (mobile?: string) => {
  if (!mobile) return 'XXXXXXXXXX';
  const value = String(mobile);
  if (value.length < 10) return value;
  return `${value.slice(0, 2)}XXXXXX${value.slice(-2)}`;
};

const safeText = (value: unknown, fallback = '—') => {
  if (value === undefined || value === null || String(value).trim() === '') return fallback;
  return String(value);
};

export default function IDCardModal({ visible, onClose, member }: IDCardModalProps) {
  const insets = useSafeAreaInsets();
  const cardRef = useRef<ViewShot | null>(null);
  const [busy, setBusy] = useState(false);

  if (!member) return null;

  const captureCard = async () => {
    if (!cardRef.current) {
      Alert.alert('થોડું રાહ જુઓ', 'ID Card તૈયાર થઈ રહ્યું છે.');
      return null;
    }
    try {
      const uri = await cardRef.current.capture?.({ format: 'png', quality: 1, result: 'tmpfile' });
      if (!uri) throw new Error('Unable to capture ID card');
      return uri.startsWith('file://') ? uri : `file://${uri}`;
    } catch (error) {
      Alert.alert('ID Card તૈયાર થઈ શક્યું નથી', 'કૃપા કરીને ફરી પ્રયાસ કરો.');
      return null;
    }
  };

  const handleSave = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const uri = await captureCard();
      if (!uri) return;
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Sharing ઉપલબ્ધ નથી', 'આ device પર ID Card sharing હાલમાં ઉપલબ્ધ નથી.');
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Team Nyari ID Card Save કરો' });
    } catch (error) {
      Alert.alert('Error', 'ID Card save કરતી વખતે સમસ્યા આવી.');
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const uri = await captureCard();
      if (!uri) return;
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Sharing ઉપલબ્ધ નથી', 'આ device પર sharing હાલમાં ઉપલબ્ધ નથી.');
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Team Nyari ID Card Share કરો' });
    } catch (error) {
      Alert.alert('Share થઈ શક્યું નથી', 'કૃપા કરીને ફરી પ્રયાસ કરો.');
    } finally {
      setBusy(false);
    }
  };

  const addressParts = [member.houseNo, member.areaLocality, member.cityVillage, member.taluka, member.district]
    .filter((item) => item !== undefined && item !== null && String(item).trim() !== '')
    .map((item) => String(item).trim());

  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Address not available';
  const memberName = safeText(member.name, 'Team Nyari Member');
  const role = safeText((member as any).roleGujarati || (member as any).role || (member as any).designation, 'સામાન્ય સભ્ય');
  
  // DB Generated ID (TN-M-0001) is used directly
  const memberId = safeText((member as any).memberId || (member as any).id, 'N/A');
  
  const mobile = safeText((member as any).mobile, 'Not Available');
  const photo = (member as any).photo || (member as any).photoUri || (member as any).image || null;
  const district = safeText((member as any).district, 'Gujarat');
  const state = safeText((member as any).state, 'Gujarat');

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalShell, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          
          <View style={styles.topBar}>
            <View style={styles.topBrandRow}>
              <View style={styles.topLogoBox}>
                <Image source={TEAM_LOGO} style={styles.topLogo} resizeMode="contain" />
              </View>
              <View style={styles.topTextWrap}>
                <Text style={styles.topBrand}>TEAM NYARI</Text>
                <Text style={styles.topSub}>Digital Member ID Card</Text>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={C.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            <Text style={styles.previewLabel}>તમારું Digital ID Card</Text>
            <Text style={styles.previewSub}>આ ID Card save અથવા share કરી શકો છો.</Text>

            <View style={styles.cardOuter}>
              <ViewShot ref={cardRef} style={styles.captureArea} options={{ format: 'png', quality: 1, result: 'tmpfile' }}>
                <View style={styles.idCard}>
                  
                  <View style={styles.goldAccentLine} />

                  <LinearGradient colors={['#0B5D52', '#0F766E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.cardLogoBox}>
                        <Image source={TEAM_LOGO} style={styles.cardLogo} resizeMode="contain" />
                      </View>
                      <View style={styles.cardBrandWrap}>
                        <Text style={styles.cardBrand}>TEAM NYARI</Text>
                        <Text style={styles.cardTagline}>સેવા • સહકાર • પારદર્શિતા</Text>
                      </View>
                    </View>
                    <View style={styles.memberBadge}>
                      <Text style={styles.memberBadgeLabel}>MEMBER ID</Text>
                      <Text style={styles.memberBadgeValue}>{memberId}</Text>
                    </View>
                  </LinearGradient>

                  <View style={styles.cardBody}>
                    <View style={styles.profileSection}>
                      <View style={styles.photoFrame}>
                        {photo ? (
                          <Image source={{ uri: String(photo) }} style={styles.memberPhoto} resizeMode="cover" />
                        ) : (
                          <View style={styles.photoPlaceholder}>
                            <Ionicons name="person" size={36} color={C.primary} />
                          </View>
                        )}
                      </View>

                      <View style={styles.memberMainInfo}>
                        <Text style={styles.memberName} numberOfLines={2}>{memberName}</Text>
                        <View style={styles.rolePill}>
                          <View style={styles.roleDot} />
                          <Text style={styles.roleText} numberOfLines={1}>{role}</Text>
                        </View>
                        <View style={styles.verifiedRow}>
                          <Ionicons name="checkmark-circle" size={14} color={C.success} />
                          <Text style={styles.verifiedText}>Verified Member</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.infoGrid}>
                      <InfoItem icon="call-outline" label="MOBILE" value={maskMobile(mobile)} />
                      <InfoItem icon="location-outline" label="DISTRICT" value={district} />
                      <InfoItem icon="map-outline" label="STATE" value={state} />
                      <InfoItem icon="id-card-outline" label="MEMBER ID" value={memberId} />
                    </View>

                    <View style={styles.addressBox}>
                      <View style={styles.addressIcon}>
                        <Ionicons name="navigate-outline" size={16} color={C.primary} />
                      </View>
                      <View style={styles.addressContent}>
                        <Text style={styles.addressLabel}>ADDRESS</Text>
                        <Text style={styles.addressText} numberOfLines={3}>{fullAddress}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.footerLeft}>
                      <View style={styles.footerCheck}>
                        <Ionicons name="shield-checkmark" size={12} color={C.white} />
                      </View>
                      <Text style={styles.footerText}>Official Digital Member ID</Text>
                    </View>
                    <Text style={styles.footerCountry}>GUJARAT</Text>
                  </View>

                </View>
              </ViewShot>
            </View>

            <View style={styles.successCard}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={18} color={C.white} />
              </View>
              <View style={styles.successTextWrap}>
                <Text style={styles.successTitle}>ID Card Successfully Generated</Text>
                <Text style={styles.successSub}>તમારું Team Nyari Digital Member ID તૈયાર છે.</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity activeOpacity={0.86} onPress={handleSave} disabled={busy} style={[styles.actionButton, styles.saveButton, busy && styles.disabledButton]}>
                {busy ? <ActivityIndicator color={C.primary} /> : (
                  <>
                    <View style={styles.actionIcon}><Ionicons name="download-outline" size={18} color={C.primary} /></View>
                    <Text style={styles.saveButtonText}>Save ID Card</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.86} onPress={handleShare} disabled={busy} style={[styles.actionButton, styles.shareButton, busy && styles.disabledButton]}>
                {busy ? <ActivityIndicator color={C.white} /> : (
                  <>
                    <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.shareButtonText}>Share</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity activeOpacity={0.75} onPress={onClose} style={styles.doneButton}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>

            <Text style={styles.bottomNote}>Team Nyari • Digital Member Identity</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function InfoItem({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={14} color={C.primary} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(11, 93, 82, 0.65)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  modalShell: { width: '100%', maxWidth: 440, maxHeight: '92%', backgroundColor: C.bg, borderRadius: 28, overflow: 'hidden', elevation: 12 },
  topBar: { minHeight: 68, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', alignItems: 'center' },
  topBrandRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  topLogoBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  topLogo: { width: 40, height: 40 },
  topTextWrap: { marginLeft: 10, flex: 1 },
  topBrand: { color: C.text, fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  topSub: { color: C.textMuted, fontSize: 10, marginTop: 1 },
  closeButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  previewLabel: { color: C.text, fontSize: 16, fontWeight: '800' },
  previewSub: { color: C.textMuted, fontSize: 11, marginTop: 1, marginBottom: 16 },
  
  cardOuter: { width: '100%', alignItems: 'center', padding: 2, borderRadius: 22, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, elevation: 4 },
  captureArea: { width: '100%', backgroundColor: C.white, borderRadius: 22, overflow: 'hidden' },
  idCard: { width: '100%', backgroundColor: C.white, borderRadius: 22, overflow: 'hidden', position: 'relative' },
  goldAccentLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: C.gold, zIndex: 10 },
  
  cardHeader: { minHeight: 82, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardLogoBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardLogo: { width: 44, height: 44 },
  cardBrandWrap: { marginLeft: 10, flex: 1 },
  cardBrand: { color: C.white, fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  cardTagline: { color: 'rgba(255,255,255,0.85)', fontSize: 9, marginTop: 2 },
  memberBadge: { minWidth: 74, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center' },
  memberBadgeLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 6.5, fontWeight: '800', letterSpacing: 0.5 },
  memberBadgeValue: { color: C.white, fontSize: 9.5, fontWeight: '900', marginTop: 2 },
  
  cardBody: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 14, backgroundColor: C.white },
  profileSection: { flexDirection: 'row', alignItems: 'center' },
  photoFrame: { width: 76, height: 76, borderRadius: 18, backgroundColor: C.mint, borderWidth: 1.5, borderColor: C.border, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  memberPhoto: { width: '100%', height: '100%' },
  photoPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  memberMainInfo: { flex: 1, marginLeft: 14, minWidth: 0 },
  memberName: { color: C.text, fontSize: 17, lineHeight: 22, fontWeight: '900' },
  rolePill: { alignSelf: 'flex-start', maxWidth: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: C.mint, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, marginTop: 6 },
  roleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary, marginRight: 5 },
  roleText: { color: C.primary, fontSize: 9.5, fontWeight: '800', maxWidth: SCREEN_WIDTH * 0.4 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  verifiedText: { color: C.success, fontSize: 9.5, fontWeight: '800', marginLeft: 4 },
  
  infoGrid: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', flexWrap: 'wrap' },
  infoItem: { width: '50%', flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  infoIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' },
  infoTextWrap: { flex: 1, marginLeft: 8, minWidth: 0 },
  infoLabel: { color: C.textMuted, fontSize: 6.8, fontWeight: '900', letterSpacing: 0.5 },
  infoValue: { color: C.text, fontSize: 9.5, fontWeight: '800', marginTop: 1 },
  
  addressBox: { marginTop: 10, borderRadius: 14, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, padding: 10, flexDirection: 'row', alignItems: 'flex-start' },
  addressIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' },
  addressContent: { flex: 1, marginLeft: 8 },
  addressLabel: { color: C.textMuted, fontSize: 6.8, fontWeight: '900', letterSpacing: 0.5 },
  addressText: { color: C.text, fontSize: 9.5, lineHeight: 14, marginTop: 2, fontWeight: '600' },
  
  cardFooter: { minHeight: 38, paddingHorizontal: 14, backgroundColor: C.mint, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerLeft: { flexDirection: 'row', alignItems: 'center' },
  footerCheck: { width: 22, height: 22, borderRadius: 7, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  footerText: { color: C.primary, fontSize: 8, fontWeight: '800', marginLeft: 6 },
  footerCountry: { color: C.primary, fontSize: 7.5, fontWeight: '900', letterSpacing: 1 },
  
  successCard: { marginTop: 16, minHeight: 60, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
  successIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.success, alignItems: 'center', justifyContent: 'center' },
  successTextWrap: { flex: 1, marginLeft: 10 },
  successTitle: { color: C.text, fontSize: 11.5, fontWeight: '800' },
  successSub: { color: C.textMuted, fontSize: 9.5, marginTop: 1, fontWeight: '500' },
  
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionButton: { flex: 1, minHeight: 52, borderRadius: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  saveButton: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  shareButton: { backgroundColor: C.primary },
  actionIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  saveButtonText: { color: C.primary, fontSize: 12, fontWeight: '800' },
  shareButtonText: { color: C.white, fontSize: 12, fontWeight: '800', marginLeft: 8 },
  disabledButton: { opacity: 0.55 },
  
  doneButton: { minHeight: 52, marginTop: 12, borderRadius: 26, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' },
  doneText: { color: C.primary, fontSize: 14, fontWeight: '800' },
  bottomNote: { color: C.textMuted, textAlign: 'center', fontSize: 9, marginTop: 14, marginBottom: 10 },
});