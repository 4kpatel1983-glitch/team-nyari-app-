import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchPaymentSettings } from '../supabaseClient';

export default function HelpSupportModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchPaymentSettings().then(res => {
        setPhoneNumber(res.supportMobile);
        setLoading(false);
      });
    }
  }, [visible]);

  const handleWhatsApp = () => {
    if (phoneNumber) {
      Linking.openURL(`whatsapp://send?phone=91${phoneNumber}&text=નમસ્તે ટીમ ન્યારી, મને એપ વિશે મદદની જરૂર છે.`);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="headset" size={28} color="#0E7B6E" />
            </View>
            <Text style={styles.title}>મદદ અને સંપર્ક</Text>
            <Text style={styles.sub}>અમે તમારી સેવામાં સદૈવ તત્પર છીએ.</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#0E7B6E" style={{ marginTop: 20 }} />
          ) : (
            <>
              {/* માફી અને સૂચના વાળું બોક્સ */}
              <View style={styles.noticeBox}>
                <Ionicons name="information-circle" size={20} color="#D97706" />
                <Text style={styles.noticeText}>
                  માફ કરશો, અમાર્યાદિત સંખ્યામાં કોલ્સ આવતા હોવાથી અમે પૂરતો સમય આપી શકતા નથી. તેથી ત્વરિત માહિતી માટે કૃપા કરીને વોટ્સએપ પર સંપર્ક કરો.
                </Text>
              </View>

              {/* મોટું ગોળ WhatsApp આઈકોન બટન (ડાર્ક ટીલ ગ્રીન) */}
              <View style={styles.whatsappContainer}>
                <Pressable style={styles.whatsappBtn} onPress={handleWhatsApp}>
                  <Ionicons name="logo-whatsapp" size={42} color="#FFF" />
                </Pressable>
                <Text style={styles.whatsappLabel}>વોટ્સએપ પર મેસેજ કરવા અહીં ક્લિક કરો</Text>
              </View>
            </>
          )}

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(10,35,30,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 400, backgroundColor: '#FFF', borderRadius: 28, padding: 24, alignItems: 'center' },
  
  header: { alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E6F5F3', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  sub: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },

  noticeBox: { flexDirection: 'row', backgroundColor: '#FFFBEB', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#FEF3C7', gap: 10, marginBottom: 25, alignItems: 'flex-start' },
  noticeText: { flex: 1, color: '#92400E', fontSize: 12, lineHeight: 20, fontWeight: '600' },

  // WhatsApp નું નવું ડિઝાઇન
  whatsappContainer: { alignItems: 'center', marginBottom: 10 },
  whatsappBtn: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#0A5F55', // ડાર્ક ટીલ ગ્રીન કલર
    alignItems: 'center', 
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#0A5F55',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  whatsappLabel: { fontSize: 13, color: '#0A5F55', fontWeight: '700', marginTop: 12 },
});