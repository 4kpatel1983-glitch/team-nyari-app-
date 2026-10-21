// src/components/DonationReceiptModal.tsx
import React, { useRef, useState } from 'react';
import { 
  Modal, View, Text, StyleSheet, TouchableOpacity, Image, 
  Dimensions, Pressable 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DonationReceiptModalProps = {
  visible: boolean;
  onClose: () => void;
  receiptData: any;
  userData: { name: string; mobile: string; photoUrl: string | null } | null;
};

export default function DonationReceiptModal({ visible, onClose, receiptData, userData }: DonationReceiptModalProps) {
  const cardRef = useRef<ViewShot | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  if (!receiptData) return null;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const handleShare = async () => {
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      const shareUri = uri.startsWith('file://') ? uri : `file://${uri}`;
      
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        return showToast('તમારા ડિવાઇસમાં શેરિંગ ઉપલબ્ધ નથી.', 'error');
      }
      
      await Sharing.shareAsync(shareUri, { mimeType: 'image/png', dialogTitle: 'Team Nyari Receipt' });
    } catch (error) {
      showToast('રસીદ શેર કરવામાં સમસ્યા આવી.', 'error');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {/* ⚡ બહાર કાળા ભાગમાં ક્લિક કરવાથી પોપઅપ બંધ થશે */}
      <Pressable style={styles.overlay} onPress={onClose}>
        
        {/* પોપઅપ કન્ટેનર (અંદર ક્લિક કરવાથી બંધ ન થાય એટલે Pressable રોક્યું છે) */}
        <Pressable style={styles.cardContainer} onPress={(e) => e.stopPropagation()}>
          
          <ViewShot 
            ref={cardRef} 
            options={{ format: 'png', quality: 1, result: 'tmpfile' }} 
            style={styles.captureArea}
            collapsable={false}
          >
            <LinearGradient colors={['#0E7B6E', '#F8FAFC']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.35 }} style={styles.cardContent}>
              
              {/* ⚡ બબલ્સ બેકગ્રાઉન્ડ ડિઝાઇન (pointerEvents="none" જેથી ક્લિક બ્લોક ન થાય) */}
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <View style={styles.bubbleLarge} />
                <View style={styles.bubbleSmall} />
                <View style={styles.bubbleOutline} />
                <View style={styles.bubbleMedium} />
              </View>

              {/* લોગો અને નામ */}
              <View style={styles.header}>
                <Image source={require('../../asset.png')} style={styles.logo} resizeMode="contain" />
                <Text style={styles.brandName}>TEAM NYARI</Text>
                <Text style={styles.brandSub}>FOUNDATION</Text>
              </View>

              {/* યુઝર ફોટો અને નામ */}
              <View style={styles.userRow}>
                <View style={styles.avatarFrame}>
                  {userData?.photoUrl ? (
                    <Image source={{ uri: userData.photoUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitial}>{userData?.name ? userData.name.charAt(0).toUpperCase() : 'D'}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{userData?.name || 'દાનવીર'}</Text>
                  <Text style={styles.userMobile}>{userData?.mobile || '—'}</Text>
                </View>
              </View>

              {/* રકમ */}
              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>કુલ દાન રકમ</Text>
                <View style={styles.amountValueRow}>
                  <Text style={styles.currency}>₹</Text>
                  <Text style={styles.amountValue}>{receiptData.amount}</Text>
                </View>
                <View style={styles.paidBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#059669" />
                  <Text style={styles.paidText}>PAID SUCCESSFULLY</Text>
                </View>
              </View>

              {/* વિગતો */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>RECEIPT NO</Text>
                  <Text style={styles.detailValue}>{receiptData.receipt_no}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>DATE</Text>
                  <Text style={styles.detailValue}>{new Date(receiptData.date).toLocaleDateString('gu-IN')}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>CASE ID</Text>
                  <Text style={styles.detailValue}>{receiptData.case_id}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>STATUS</Text>
                  <Text style={[styles.detailValue, { color: '#059669' }]}>SUCCESS</Text>
                </View>
              </View>
            </LinearGradient>
          </ViewShot>

          {/* ⚡ એક્શન બટન્સ (Share અને Close) */}
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
              <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
              <Text style={styles.shareBtnText}>Share Receipt</Text>
            </TouchableOpacity>
          </View>

        </Pressable>

        {/* કસ્ટમ ટોસ્ટ */}
        {toast.visible && (
          <View style={[styles.toast, { backgroundColor: toast.type === 'error' ? '#EF4444' : '#10B981' }]}>
            <Ionicons name={toast.type === 'error' ? 'alert-circle' : 'checkmark-circle'} size={20} color="#FFF" />
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        )}

      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(10, 35, 30, 0.65)', justifyContent: 'center', alignItems: 'center' },
  cardContainer: { width: SCREEN_WIDTH * 0.88, backgroundColor: '#F8FAFC', borderRadius: 24, overflow: 'hidden', elevation: 15, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20 },
  captureArea: { backgroundColor: '#FFFFFF' },
  cardContent: { paddingBottom: 15, paddingHorizontal: 15, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, position: 'relative', overflow: 'hidden' },

  // ⚡ બબલ્સ ડિઝાઇન સ્ટાઈલ્સ
  bubbleLarge: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255, 255, 255, 0.12)', top: -40, left: -40 },
  bubbleSmall: { position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255, 255, 255, 0.15)', bottom: 30, right: -20 },
  bubbleMedium: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255, 255, 255, 0.08)', top: 100, right: -30 },
  bubbleOutline: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.1)', top: 40, left: 100 },

  header: { alignItems: 'center', marginTop: 15 },
  logo: { width: 50, height: 50, marginBottom: 8 },
  brandName: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  brandSub: { color: '#E6F5F3', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginTop: 2 },
  
  userRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, gap: 10 },
  avatarFrame: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF', padding: 2, elevation: 3 },
  avatar: { width: '100%', height: '100%', borderRadius: 28 },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 28, backgroundColor: '#E6F5F3', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 22, fontWeight: '900', color: '#0E7B6E' },
  userInfo: { alignItems: 'flex-start' },
  userName: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  userMobile: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 2 },
  
  amountBox: { alignItems: 'center', marginTop: 15, backgroundColor: '#FFFFFF', paddingVertical: 12, borderRadius: 16, elevation: 2 },
  amountLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  amountValueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  currency: { fontSize: 22, fontWeight: '800', color: '#0E7B6E', marginRight: 3 },
  amountValue: { fontSize: 36, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  paidBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 8, gap: 4 },
  paidText: { color: '#059669', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 15, gap: 10 },
  detailItem: { width: '46%' },
  detailLabel: { fontSize: 8, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 2 },
  detailValue: { fontSize: 11, fontWeight: '800', color: '#0F172A' },
  
  // એક્શન બટન્સ
  actionRow: { flexDirection: 'row', padding: 15, gap: 10, backgroundColor: '#F8FAFC' },
  closeBtn: { flex: 0.4, height: 50, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#64748B', fontSize: 14, fontWeight: '800' },
  shareBtn: { flex: 1, height: 50, borderRadius: 12, backgroundColor: '#0E7B6E', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  shareBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  
  toast: { position: 'absolute', bottom: 40, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, gap: 10, elevation: 10 },
  toastText: { color: '#FFF', fontSize: 13, fontWeight: '700', flex: 1 },
});