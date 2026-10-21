// src/TeamScreen.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import logo from '../asset.png';
import { SkeletonBox, SkeletonText, SkeletonAvatar } from './SkeletonLoader';
import { fetchMemberStats } from './supabaseClient';

const C = { 
  bg: '#F6F4EE', white: '#FFFFFF', black: '#111111', charcoal: '#202B29', 
  sage: '#17483D', sageDark: '#0E352D', sageSoft: '#E6EFEC', 
  gold: '#B4935A', goldSoft: '#F2EBDD', border: '#E1DFD7', muted: '#7A817D' 
};

const TeamScreenSkeleton = React.memo(() => (
  <SafeAreaView style={styles.safe} edges={['top']}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <SkeletonText width={100} height={14} style={{ marginBottom: 8 }} />
        <SkeletonText width={180} height={32} style={{ marginBottom: 8 }} />
        <SkeletonText width={220} height={14} />
      </View>
      <View style={styles.heroCard}>
        <View style={styles.hero}>
          <SkeletonAvatar size={49} />
          <SkeletonText width="80%" height={24} style={{ marginTop: 17 }} />
          <SkeletonText width="100%" height={16} style={{ marginTop: 10 }} />
          <SkeletonBox width="100%" height={1} style={{ marginVertical: 15 }} />
          <SkeletonText width={140} height={14} style={{ marginTop: 6 }} />
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <SkeletonBox width={38} height={38} borderRadius={13} />
          <SkeletonText width={80} height={25} style={{ marginTop: 9 }} />
        </View>
        <View style={styles.stat}>
          <SkeletonBox width={38} height={38} borderRadius={13} />
          <SkeletonText width={80} height={25} style={{ marginTop: 9 }} />
        </View>
      </View>
      <SkeletonBox width="100%" height={140} borderRadius={24} style={{ marginBottom: 14 }} />
      <SkeletonBox width="100%" height={140} borderRadius={24} />
    </ScrollView>
  </SafeAreaView>
));

type Props = { navigation: { navigate: (screen: string) => void; goBack: () => void; } };

const TeamScreen = ({ navigation }: Props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalDistricts, setTotalDistricts] = useState(0);

  useEffect(() => {
    let mounted = true;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;

    const loadStats = async () => {
      try {
        const stats = await fetchMemberStats();
        if (!mounted) return;
        setTotalMembers(stats.total);
        setTotalDistricts(stats.districts);
      } catch (e) {
        console.log('Team stats error:', e);
      }
    };

    loadStats().then(() => {
      if (!mounted) return;
      settleTimer = setTimeout(() => {
        if (mounted) setIsLoading(false);
      }, 200);
    });

    const interval = setInterval(loadStats, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, []);

  // ⚡ કોઈ પોપઅપ નહીં, સીધા સ્ક્રીન પર જ નેવિગેશન
  const goToAddMember = useCallback(() => navigation.navigate('AddMember'), [navigation]);
  const goToMemberList = useCallback(() => navigation.navigate('MemberList'), [navigation]);

  if (isLoading) return <TeamScreenSkeleton />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* હેડર - સરળ અને સ્પષ્ટ ભાષા */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>TEAM NYARI</Text>
          <Text style={styles.title}>અમારી ટીમ</Text>
          <Text style={styles.subtitle}>જરૂરિયાતમંદોની સેવા માટે એકસાથે જોડાઈએ</Text>
        </View>

        {/* હીરો કાર્ડ */}
        <View style={styles.heroCard}>
          <LinearGradient colors={['#FFFFFF', '#F2F5F2', '#E7EEEA']} style={styles.hero}>
            <View style={styles.heroLogo}><Image source={logo} style={styles.heroLogoImage} /></View>
            <View style={styles.activeBadge}><View style={styles.dot} /><Text style={styles.activeText}>ACTIVE TEAM</Text></View>
            <Text style={styles.heroTitle}>સેવા માટે એકસાથે આગળ વધીએ</Text>
            <Text style={styles.heroText}>Team Nyari સાથે જોડાઈને જરૂરિયાતમંદ પરિવારો સુધી સેવા પહોંચાડવામાં તમારો ફાળો આપો.</Text>
            <View style={styles.heroLine} />
            <Text style={styles.smallLabel}>TEAM COMMUNITY</Text>
            <Text style={styles.heroBottom}>100% સેવા • 100% સમર્પણ</Text>
          </LinearGradient>
        </View>

        {/* સ્ટેટ્સ */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <View style={styles.statIcon}><Ionicons name="people-outline" size={20} color={C.sage} /></View>
            <Text style={styles.statNumber}>{totalMembers > 0 ? totalMembers.toLocaleString('en-IN') : '0'}</Text>
            <Text style={styles.statLabel}>કુલ સભ્યો</Text>
          </View>
          <View style={styles.stat}>
            <View style={[styles.statIcon, { backgroundColor: C.goldSoft }]}><Ionicons name="location-outline" size={20} color={C.gold} /></View>
            <Text style={styles.statNumber}>{totalDistricts > 0 ? totalDistricts : '0'}</Text>
            <Text style={styles.statLabel}>જિલ્લાઓ</Text>
          </View>
        </View>

        {/* ⚡ નવા બે સીધા કાર્ડ (કોઈ મેનેજમેન્ટ પોપઅપ નહીં) */}
        
        {/* કાર્ડ ૧: સભ્યોની યાદી */}
        <Pressable onPress={goToMemberList} style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}>
          <LinearGradient colors={['#FFFFFF', '#F8F5F0']} style={styles.actionGradient}>
            <View style={[styles.actionIconBox, { backgroundColor: C.goldSoft }]}>
              <Ionicons name="people" size={24} color={C.gold} />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionTitle}>સભ્યોની યાદી જુઓ</Text>
              <Text style={styles.actionSub}>ટીમ ન્યારીના તમામ સભ્યોને મળો</Text>
            </View>
            <View style={[styles.actionArrow, { backgroundColor: C.goldSoft }]}>
              <Ionicons name="arrow-forward" size={18} color={C.gold} />
            </View>
          </LinearGradient>
        </Pressable>

        {/* કાર્ડ ૨: નવો સભ્ય બનો */}
        <Pressable onPress={goToAddMember} style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}>
          <LinearGradient colors={['#FFFFFF', '#F2F7F4']} style={styles.actionGradient}>
            <View style={[styles.actionIconBox, { backgroundColor: C.sageSoft }]}>
              <Ionicons name="person-add" size={24} color={C.sage} />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionTitle}>નવો સભ્ય બનો</Text>
              <Text style={styles.actionSub}>ટીમ જોડાઓ અને તમારું ID કાર્ડ મેળવો</Text>
            </View>
            <View style={[styles.actionArrow, { backgroundColor: C.sageSoft }]}>
              <Ionicons name="arrow-forward" size={18} color={C.sage} />
            </View>
          </LinearGradient>
        </Pressable>

        {/* માહિતી કાર્ડ */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.infoIcon}><Ionicons name="sparkles-outline" size={19} color={C.gold} /></View>
            <View><Text style={styles.infoTitle}>Team Nyari સાથે કેમ જોડાવું?</Text><Text style={styles.infoSub}>તમારી સેવા • કોઈના જીવનમાં બદલાવ</Text></View>
          </View>
          {[['heart-outline', 'જરૂરિયાતમંદ પરિવારો માટે સેવા'], ['shield-checkmark-outline', 'પારદર્શક અને જવાબદાર ટીમ'], ['people-outline', 'ગુજરાતભરમાં સેવા સાથે જોડાણ']].map(([icon, text], i) => (
            <View style={styles.feature} key={i}>
              <View style={styles.featureIcon}><Ionicons name={icon as any} size={17} color={C.sage} /></View>
              <Text style={styles.featureText}>{text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}><Text style={styles.footerTitle}>TEAM NYARI</Text><Text style={styles.footerText}>દિલથી સેવા • સાથે મળીને પરિવર્તન</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg }, scroll: { padding: 17, paddingBottom: 35 },
  header: { marginBottom: 17 }, eyebrow: { fontFamily: 'Poppins_700Bold', fontSize: 12, letterSpacing: 1.5, color: C.black, marginBottom: 1 },
  title: { fontFamily: 'HindVadodara_700Bold', fontSize: 28, color: C.black, lineHeight: 35 }, subtitle: { fontFamily: 'HindVadodara_400Regular', fontSize: 11.5, color: C.muted },
  
  heroCard: { borderRadius: 27, overflow: 'hidden', borderWidth: 1, borderColor: C.border, marginBottom: 14 }, hero: { padding: 19 },
  heroLogo: { width: 49, height: 49, borderRadius: 16, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E4DE' },
  heroLogoImage: { width: 34, height: 34, resizeMode: 'contain' },
  activeBadge: { position: 'absolute', right: 19, top: 19, flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#E6E5DF' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.sage, marginRight: 6 }, activeText: { fontFamily: 'Poppins_600SemiBold', fontSize: 7, letterSpacing: 0.8, color: C.sage },
  heroTitle: { fontFamily: 'HindVadodara_700Bold', fontSize: 21, color: C.black, marginTop: 17 }, heroText: { fontFamily: 'HindVadodara_400Regular', fontSize: 12, lineHeight: 18, color: '#58625E', marginTop: 4 },
  heroLine: { height: 1, backgroundColor: C.border, marginVertical: 15 }, smallLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 7, letterSpacing: 1, color: C.gold },
  heroBottom: { fontFamily: 'HindVadodara_600SemiBold', fontSize: 12, color: C.black, marginTop: 2 },
  
  statsRow: { flexDirection: 'row', gap: 11, marginBottom: 14 }, stat: { flex: 1, backgroundColor: C.white, borderRadius: 21, borderWidth: 1, borderColor: C.border, padding: 14 },
  statIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: C.sageSoft, alignItems: 'center', justifyContent: 'center' },
  statNumber: { fontFamily: 'Poppins_700Bold', fontSize: 25, color: C.black, marginTop: 9 }, statLabel: { fontFamily: 'HindVadodara_500Medium', fontSize: 11, color: C.muted },

  // ⚡ નવા એક્શન કાર્ડ્સ
  actionCard: { borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: C.border, marginBottom: 12, elevation: 3, shadowColor: '#0E352D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8 },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  actionGradient: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  actionIconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  actionTextWrap: { flex: 1 },
  actionTitle: { fontFamily: 'HindVadodara_700Bold', fontSize: 17, color: C.black },
  actionSub: { fontFamily: 'HindVadodara_400Regular', fontSize: 11, color: C.muted, marginTop: 2 },
  actionArrow: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  infoCard: { backgroundColor: C.white, borderRadius: 24, borderWidth: 1, borderColor: C.border, padding: 16, marginTop: 5 }, infoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 13 },
  infoIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  infoTitle: { fontFamily: 'HindVadodara_700Bold', fontSize: 15, color: C.black }, infoSub: { fontFamily: 'HindVadodara_400Regular', fontSize: 10, color: C.muted },
  feature: { flexDirection: 'row', alignItems: 'center', minHeight: 43, borderTopWidth: 1, borderTopColor: '#EEEDE7' },
  featureIcon: { width: 31, height: 31, borderRadius: 10, backgroundColor: C.sageSoft, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  featureText: { fontFamily: 'HindVadodara_500Medium', fontSize: 12, color: C.black },
  footer: { alignItems: 'center', paddingTop: 22 }, footerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 11, letterSpacing: 2, color: C.black }, footerText: { fontFamily: 'HindVadodara_400Regular', fontSize: 10, color: C.muted, marginTop: 2 },
});

export default React.memo(TeamScreen);