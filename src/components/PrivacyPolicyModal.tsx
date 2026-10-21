import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchPaymentSettings } from '../supabaseClient';

export default function PrivacyPolicyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [policyText, setPolicyText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchPaymentSettings().then(res => {
        setPolicyText(res.privacyPolicy);
        setLoading(false);
      });
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        
        <View style={[styles.modal, { paddingBottom: insets.bottom + 10 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>નિયમો અને પ્રાઇવસી</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}><Ionicons name="close" size={20} color="#64748B" /></Pressable>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#0E7B6E" style={{ marginTop: 40 }} />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              
              <Text style={styles.text}>
                {policyText || 'હાલમાં કોઈ નિયમો ઉપલબ્ધ નથી.'}
              </Text>

              {/* Footer as requested: Logo, Black Font, No Hand Icon */}
              <View style={styles.footer}>
                <Image source={require('../../asset.png')} style={styles.footerLogo} resizeMode="contain" />
                <Text style={styles.footerText}>TEAM NYARI</Text>
              </View>

            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(10,35,30,0.65)', justifyContent: 'flex-end' },
  modal: { width: '100%', maxHeight: '90%', backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: 20 },
  text: { fontSize: 13.5, color: '#475569', lineHeight: 22, fontWeight: '500', textAlign: 'justify' },
  footer: { alignItems: 'center', marginTop: 35, marginBottom: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  footerLogo: { width: 50, height: 50, marginBottom: 8 },
  footerText: { fontSize: 16, fontWeight: '900', color: '#000000', letterSpacing: 1.5 },
});