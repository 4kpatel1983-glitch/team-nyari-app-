import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ThankYouModalProps {
  visible: boolean;
  onClose: () => void;
  memberName?: string;
  memberId?: string;
}

const ThankYouModal: React.FC<ThankYouModalProps> = ({ visible, onClose, memberName = 'સભ્ય', memberId = '' }) => {
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          
          <LinearGradient colors={['#E6F7F3', '#F7FAF9']} style={styles.iconWrap}>
            <Ionicons name="checkmark-circle" size={60} color="#0B5D52" />
          </LinearGradient>
          
          <Text style={styles.title}>આભાર! 🙏</Text>
          
          {/* ⚡ લખાણ કપાઈ ન જાય એટલે flexWrap અને પેડિંગ ફિક્સ કર્યું છે */}
          <Text style={styles.subtitle}>
            તમે સફળતાપૂર્વક Team Nyari પરિવાર સાથે જોડાઈ ગયા છો.
          </Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>સભ્યનું નામ</Text>
            <Text style={styles.infoValue}>{memberName}</Text>
            {memberId ? (
              <>
                <View style={styles.divider} />
                <Text style={styles.infoLabel}>MEMBER ID</Text>
                <Text style={[styles.infoValue, { color: '#0B5D52' }]}>{memberId}</Text>
              </>
            ) : null}
          </View>

          {/* ⚡ બટનનું લખાણ બદલ્યું અને Capsule શેપ આપ્યો */}
          <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.buttonText}>તમારું ID Card જુઓ</Text>
            <Ionicons name="card-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(11, 93, 82, 0.65)', padding: 24 },
  modalView: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 24, alignItems: 'center', width: '100%', maxWidth: 400, elevation: 10 },
  iconWrap: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '900', color: '#172B2A', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#647575', textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 10, fontWeight: '600' },
  infoCard: { width: '100%', backgroundColor: '#F7FAF9', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#DCE9E6', alignItems: 'center', marginBottom: 24 },
  infoLabel: { fontSize: 11, fontWeight: '700', color: '#647575', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  infoValue: { fontSize: 18, fontWeight: '800', color: '#172B2A' },
  divider: { width: '100%', height: 1, backgroundColor: '#DCE9E6', marginVertical: 12 },
  button: { width: '100%', height: 54, borderRadius: 27, backgroundColor: '#0B5D52', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});

export default ThankYouModal;