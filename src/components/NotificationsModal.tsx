import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchNotifications, getCachedMobile } from '../supabaseClient';

export default function NotificationsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      getCachedMobile().then(mobile => {
        if (mobile) {
          fetchNotifications(mobile).then(res => {
            setNotifications(res);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      });
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* ⚡ બહાર ટચ કરવાથી બંધ થશે */}
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>નોટિફિકેશન</Text>
            <Pressable onPress={onClose}><Ionicons name="close" size={22} color="#64748B" /></Pressable>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#0E7B6E" style={{ marginTop: 30 }} />
          ) : notifications.length > 0 ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              {notifications.map((n) => (
                <View key={n.id} style={styles.card}>
                  <View style={styles.iconBox}><Ionicons name="notifications" size={18} color="#0E7B6E" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{n.title}</Text>
                    <Text style={styles.cardMsg}>{n.message}</Text>
                    <Text style={styles.cardDate}>{new Date(n.created_at).toLocaleDateString('gu-IN')}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={50} color="#CBD5E1" />
              <Text style={styles.emptyText}>હાલ કોઈ સૂચના નથી</Text>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(10,35,30,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 400, backgroundColor: '#FFF', borderRadius: 24, padding: 20, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  card: { flexDirection: 'row', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  iconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#E6F5F3', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  cardMsg: { fontSize: 12, color: '#64748B', marginTop: 2, lineHeight: 18 },
  cardDate: { fontSize: 10, color: '#94A3B8', marginTop: 6, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#64748B', fontWeight: '600', marginTop: 10 }
});