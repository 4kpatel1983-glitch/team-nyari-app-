// src/components/DonationModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Image, Keyboard, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View, Alert, DeviceEventEmitter } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchPaymentSettings, createDonation, getCachedMobile, fetchProfile } from '../supabaseClient';
import DonationReceiptModal from './DonationReceiptModal';

type DonationModalProps = {
  visible: boolean; onClose: () => void; caseTitle?: string; caseId?: string; beneficiaryUpiId?: string; beneficiaryName?: string; onSuccess?: () => void;
};

const COLORS = { bg: '#F8FAFC', white: '#FFFFFF', text: '#0F172A', muted: '#64748B', primary: '#0E7B6E', primaryDark: '#085A50', primarySoft: '#E6F5F3', border: '#E2E8F0', gold: '#D97706', success: '#10B981' };
const PRESET_AMOUNTS = [10, 50, 100, 500];
const FEE_PERCENTAGE = 0.0236;

export default function DonationModal({ visible, onClose, caseTitle = 'સહાય માટે દાન', caseId = 'TN-C-01', beneficiaryUpiId, beneficiaryName, onSuccess }: DonationModalProps) {
  const [amount, setAmount] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [paying, setPaying] = useState(false);
  const [focused, setFocused] = useState(false);
  const [savingDonation, setSavingDonation] = useState(false);
  
  const [receiptData, setReceiptData] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [userData, setUserData] = useState<{ name: string; mobile: string; photoUrl: string | null } | null>(null);
  const [upiSettings, setUpiSettings] = useState({ upiId: '', payeeName: '' });
  
  const amountRef = useRef('');
  const appState = useRef(AppState.currentState);
  const isPayingRef = useRef(false); 

  useEffect(() => {
    if (visible) { fetchPaymentSettings().then(setUpiSettings); } 
    else { setAmount(''); setErrorMsg(''); setPaying(false); setSavingDonation(false); setShowReceiptModal(false); setReceiptData(null); isPayingRef.current = false; }
  }, [visible]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (isPayingRef.current) {
          isPayingRef.current = false; setPaying(false); setSavingDonation(true);
          try {
            const mobile = await getCachedMobile();
            const profile = await fetchProfile(mobile || '');
            const donationRecord = { donor_mobile: mobile || '', donor_name: profile?.name || 'દાનવીર', donor_photo: profile?.photo_url || '', amount: Number(amountRef.current), case_id: caseId, status: 'success' };
            
            const savedDonation = await createDonation(donationRecord);

            if (savedDonation) {
              // ⚡ મેજિક લાઈન: આખી એપને જાણ કરો કે નવું દાન આવ્યું છે
              DeviceEventEmitter.emit('ON_DONATION_SUCCESS'); 
              
              setReceiptData(savedDonation);
              setUserData({ name: profile?.name || 'દાનવીર', mobile: profile?.mobile || mobile || '', photoUrl: profile?.photo_url || null });
              setShowReceiptModal(true); onSuccess?.(); 
            } else { Alert.alert('ભૂત', 'દાન સેવ કરવામાં સમસ્યા આવી.'); }
          } catch (e) { Alert.alert('ભૂત', 'દાન સેવ કરવામાં સમસ્યા આવી.'); } 
          finally { setSavingDonation(false); }
        }
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [caseId, onSuccess]);

  const handleDonate = async () => {
    Keyboard.dismiss();
    const baseAmount = Number(amountRef.current);
    const finalUpiId = beneficiaryUpiId || upiSettings.upiId;
    const finalPayeeName = beneficiaryName || upiSettings.payeeName || 'TEAM NYARI';

    if (!amountRef.current || baseAmount < 10) return setErrorMsg('દાનની લઘુત્તમ રકમ ₹10 છે.');
    if (!finalUpiId) return setErrorMsg('પેમેન્ટ સિસ્ટમ હાલમાં ડાઉન છે.');
    
    setErrorMsg('');
    const totalAmount = baseAmount + (baseAmount * FEE_PERCENTAGE);
    const params = [`pa=${encodeURIComponent(finalUpiId)}`, `pn=${encodeURIComponent(finalPayeeName)}`, `am=${encodeURIComponent(totalAmount.toFixed(2))}`, 'cu=INR', `tn=${encodeURIComponent(`TEAM NYARI ${caseId}`)}`].join('&');

    try { setPaying(true); isPayingRef.current = true; await Linking.openURL(`upi://pay?${params}`); } 
    catch { setPaying(false); isPayingRef.current = false; setErrorMsg('UPI એપ ખોલી શકાયું નથી.'); }
  };

  const handleCloseReceipt = () => { setShowReceiptModal(false); onClose(); };

  const baseAmt = Number(amount) || 0; const feeAmt = baseAmt * FEE_PERCENTAGE; const totalAmt = baseAmt + feeAmt; const isAmountValid = baseAmt >= 10;

  return (
    <>
      <Modal visible={visible && !showReceiptModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} statusBarTranslucent>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
        <View style={styles.root}>
          <LinearGradient colors={['#0E7B6E', '#F8FAFC']} style={styles.topGradient} />
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <View style={styles.header}>
              <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}><Ionicons name="close" size={22} color={COLORS.text} /></Pressable>
              <Text style={styles.headerTitle}>સુરક્ષિત દાન</Text><View style={{ width: 38 }} />
            </View>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.caseCard}>
                  <View style={styles.caseCardGlow} />
                  <View style={styles.logoFrame}><Image source={require('../../asset.png')} style={{ width: '100%', height: '100%' }} resizeMode="contain" /></View>
                  <View style={{ flex: 1, marginLeft: 14 }}><Text style={styles.brandName}>TEAM NYARI • સીધી મદદ</Text><Text style={styles.caseTitle} numberOfLines={2}>{caseTitle}</Text></View>
                </View>
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>દાનની રકમ પસંદ કરો</Text>
                  <View style={styles.presetsRow}>
                    {PRESET_AMOUNTS.map((preset) => {
                      const isSelected = amount === String(preset);
                      return (<Pressable key={preset} onPress={() => { setAmount(String(preset)); amountRef.current = String(preset); setErrorMsg(''); }} style={[styles.presetChip, isSelected && styles.presetChipActive]}><Text style={[styles.presetText, isSelected && styles.presetTextActive]}>₹{preset}</Text></Pressable>);
                    })}
                  </View>
                  <Text style={[styles.sectionTitle, { marginTop: 20, fontSize: 13 }]}>અથવા અન્ય રકમ લખો</Text>
                  <Pressable style={[styles.inputWrap, focused && styles.inputWrapFocused, errorMsg !== '' && styles.inputWrapError]}>
                    <Text style={styles.rupeeSymbol}>₹</Text>
                    <TextInput value={amount} onChangeText={(t) => { const cleaned = t.replace(/[^0-9]/g, ''); setAmount(cleaned); amountRef.current = cleaned; setErrorMsg(''); }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="0" placeholderTextColor="#CBD5E1" keyboardType="number-pad" style={styles.amountInput} maxLength={6} />
                    {amount.length > 0 && (<Pressable onPress={() => { setAmount(''); amountRef.current = ''; }} style={styles.clearBtn}><Ionicons name="close-circle" size={20} color={COLORS.muted} /></Pressable>)}
                  </Pressable>
                  {errorMsg ? (<View style={styles.errorBox}><Ionicons name="alert-circle" size={14} color="#EF4444" /><Text style={styles.errorText}>{errorMsg}</Text></View>) : null}
                  {isAmountValid && (
                    <View style={styles.feeBreakdown}>
                      <View style={styles.feeRow}><Text style={styles.feeLabel}>મૂળ દાન રકમ</Text><Text style={styles.feeValue}>₹{baseAmt.toFixed(2)}</Text></View>
                      <View style={styles.feeRow}><Text style={styles.feeLabel}>બેંક/ગેટવે ચાર્જ (2.36%)</Text><Text style={styles.feeValue}>₹{feeAmt.toFixed(2)}</Text></View>
                      <View style={[styles.feeRow, { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8, marginTop: 4 }]}><Text style={[styles.feeLabel, { fontWeight: '800', color: COLORS.text }]}>કુલ ચૂકવવાની રકમ</Text><Text style={[styles.feeValue, { fontWeight: '900', color: COLORS.primary, fontSize: 16 }]}>₹{totalAmt.toFixed(2)}</Text></View>
                    </View>
                  )}
                </View>
                <View style={styles.trustCard}>
                  <View style={styles.trustRow}><Ionicons name="shield-checkmark" size={20} color={COLORS.primary} /><Text style={styles.trustText}>100% સુરક્ષિત પેમેન્ટ ગેટવે</Text></View>
                  <View style={styles.divider} />
                  <View style={styles.trustRow}><Ionicons name="information-circle" size={18} color={COLORS.gold} /><Text style={styles.chargeText}><Text style={{ fontWeight: '900', color: COLORS.text }}>અમારી પ્રતિબદ્ધતા: </Text>ઉપર દર્શાવેલો ચાર્જ ટીમ ન્યારી દ્વારા લેવામાં આવતો નથી, પરંતુ તે સીધો બેંક અને પેમેન્ટ ગેટવેનો પ્રોસેસિંગ ચાર્જ છે.</Text></View>
                </View>
                <View style={{ marginTop: 24, marginBottom: 20 }}>
                  <Pressable onPress={handleDonate} disabled={paying || savingDonation || !isAmountValid} style={({ pressed }) => [styles.ctaButton, (!isAmountValid || paying || savingDonation) && { opacity: 0.6 }, pressed && { transform: [{ scale: 0.98 }] }]}>
                    <LinearGradient colors={['#0E7B6E', '#085A50']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaGradient}>
                      {paying || savingDonation ? (<ActivityIndicator color="#FFF" />) : (<><Text style={styles.ctaText}>{isAmountValid ? `₹${totalAmt.toFixed(2)} ચૂકવો` : 'રકમ પસંદ કરો'}</Text><View style={styles.arrowIcon}><Ionicons name="arrow-forward" size={18} color={COLORS.primary} /></View></>)}
                    </LinearGradient>
                  </Pressable>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </Modal>
      <DonationReceiptModal visible={showReceiptModal} onClose={handleCloseReceipt} receiptData={receiptData} userData={userData} />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg }, topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 }, header: { height: 60, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', elevation: 3 }, headerTitle: { color: COLORS.white, fontSize: 17, fontWeight: '800', letterSpacing: 0.5 }, scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 }, caseCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', elevation: 8, marginBottom: 24, overflow: 'hidden' }, caseCardGlow: { position: 'absolute', top: 0, left: 0, width: 80, height: '100%', backgroundColor: COLORS.primarySoft, opacity: 0.5, borderTopRightRadius: 100 }, logoFrame: { width: 50, height: 50, borderRadius: 16, backgroundColor: COLORS.white, padding: 6, alignItems: 'center', justifyContent: 'center', elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' }, brandName: { color: COLORS.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }, caseTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800', marginTop: 4, lineHeight: 22 }, card: { backgroundColor: COLORS.white, borderRadius: 24, padding: 20, elevation: 4 }, sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: '800', marginBottom: 14 }, presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, presetChip: { flex: 1, minWidth: '45%', paddingVertical: 14, borderRadius: 14, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' }, presetChipActive: { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary }, presetText: { color: COLORS.muted, fontSize: 15, fontWeight: '700' }, presetTextActive: { color: COLORS.primary, fontSize: 16, fontWeight: '900' }, inputWrap: { flexDirection: 'row', alignItems: 'center', height: 70, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: '#F8FAFC', marginTop: 8 }, inputWrapFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.white }, inputWrapError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' }, rupeeSymbol: { color: COLORS.primary, fontSize: 28, fontWeight: '800', marginRight: 8 }, amountInput: { flex: 1, color: COLORS.text, fontSize: 32, fontWeight: '900' }, clearBtn: { padding: 4 }, errorBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: '#FEF2F2', padding: 10, borderRadius: 10 }, errorText: { color: '#EF4444', fontSize: 12, fontWeight: '600' }, feeBreakdown: { marginTop: 15, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12 }, feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }, feeLabel: { color: COLORS.muted, fontSize: 12, fontWeight: '600' }, feeValue: { color: COLORS.text, fontSize: 12, fontWeight: '700' }, trustCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 16, marginTop: 20, borderWidth: 1, borderColor: COLORS.border }, trustRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, trustText: { color: COLORS.text, fontSize: 13.5, fontWeight: '800' }, divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 }, chargeText: { flex: 1, color: COLORS.muted, fontSize: 11.5, lineHeight: 18, fontWeight: '500' }, ctaButton: { borderRadius: 18, overflow: 'hidden', marginTop: 10 }, ctaGradient: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, ctaText: { color: COLORS.white, fontSize: 18, fontWeight: '900' }, arrowIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
});