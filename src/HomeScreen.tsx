// src/HomeScreen.tsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import { Animated, Easing, StatusBar, StyleSheet, Text, TouchableOpacity, View, AppState, Image, RefreshControl } from "react-native"; // ⚡ RefreshControl ઉમેર્યું
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchProfile, fetchTopSponsors, getCachedMobile, onProfileChanged, fetchDonationStats, fetchActivePopup, subscribeLivePopups, type Sponsor, type AppPopup } from "./supabaseClient";
import { TopDonorsSlider, LiveDonationBanner } from "./components/HomeComponents";
import RecentDonorsSection from "./components/RecentDonorsSection";
import VideoDonationCard from "./components/VideoDonationCard";
import { useLiveDonations } from "./useLiveDonations";
import PopupModal from "./components/PopupModal";

const COLORS = { background: "#F5F7F8", white: "#FFFFFF", text: "#17272D", muted: "#7A898D", teal: "#0F766E", tealDark: "#064E3B", border: "#E4EBEA" };
const HEADER_BODY_HEIGHT = 90;

type LocalProfile = { name: string; imageUri: string | null; locationText: string; pincode?: string; mobile?: string; };
type SliderDonor = { id: string; name: string; location: string; date: string; phone: string; amount: number; rank: number; avatar: string; isVerified?: boolean; };

function sponsorToSlider(s: Sponsor, index: number): SliderDonor {
  return {
    id: s.id || `sponsor-${index}`, name: s.name || "પ્રાયોજક", location: (s.note && s.note.trim()) || "ગુજરાત",
    date: s.date || "અત્યાર સુધી", phone: s.mobile || "", amount: Number(s.amount) || 0, rank: index + 1,
    avatar: s.photo_url && s.photo_url.trim().length > 0 ? s.photo_url : `https://i.pravatar.cc/200?img=${(index % 60) + 1}`,
    isVerified: true,
  };
}

const HomePageSkeleton = React.memo(() => {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const Block = ({ style }: any) => <Animated.View style={[{ backgroundColor: "#E1EBE8", borderRadius: 8 }, style, { opacity: pulse }]} />;

  return (
    <View style={sk.pageContainer}>
      <View style={sk.headerSkeleton}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Block style={{ width: 58, height: 58, borderRadius: 29, marginRight: 12 }} />
          <View>
            <Block style={{ width: 100, height: 14, marginBottom: 6 }} />
            <Block style={{ width: 140, height: 24, marginBottom: 6 }} />
            <Block style={{ width: 180, height: 12 }} />
          </View>
        </View>
        <Block style={{ width: 42, height: 42, borderRadius: 14 }} />
      </View>
      <View style={sk.contentSkeleton}>
        <Block style={{ width: '100%', height: 230, borderRadius: 22, marginBottom: 16 }} />
        <Block style={{ width: '100%', height: 100, borderRadius: 17, marginBottom: 20 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <Block style={{ width: 150, height: 20 }} />
          <Block style={{ width: 70, height: 24, borderRadius: 12 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <Block style={{ flex: 1, height: 190, borderRadius: 22 }} />
          <Block style={{ flex: 1, height: 190, borderRadius: 22 }} />
        </View>
        <Block style={{ width: 160, height: 22, marginBottom: 14 }} />
        <Block style={{ width: '100%', height: 320, borderRadius: 17 }} />
      </View>
    </View>
  );
});

const HomeScreen = ({ onTabChange }: { onTabChange?: (tab: string) => void }) => {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const heartBeat = useRef(new Animated.Value(1)).current;

  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [sponsors, setSponsors] = useState<SliderDonor[]>([]);
  const [donationStats, setDonationStats] = useState({ total: 0, donationCount: 0 });
  const [popup, setPopup] = useState<AppPopup | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // ⚡ રિફ્રેશ માટેનું નવું સ્ટેટ
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;
  const popupOpenRef = useRef(false);

  useEffect(() => {
    popupOpenRef.current = popupVisible;
  }, [popupVisible]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(heartBeat, { toValue: 1.25, duration: 140, useNativeDriver: true }),
        Animated.timing(heartBeat, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.delay(800),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [heartBeat]);

  const loadProfile = useCallback(async () => {
    try {
      const mobile = await getCachedMobile();
      if (!mobile) return setProfile(null);
      const fresh = await fetchProfile(mobile);
      if (fresh) setProfile({ name: fresh.name || "", imageUri: fresh.photo_url || null, locationText: fresh.location_text || "", pincode: fresh.pincode || "", mobile: fresh.mobile || mobile });
    } catch (e) {}
  }, []);

  const loadSponsors = useCallback(async () => {
    try {
      const list = await fetchTopSponsors(5);
      setSponsors((list || []).map(sponsorToSlider));
    } catch (e) { setSponsors([]); }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetchDonationStats();
      setDonationStats({ total: res.total, donationCount: res.donorCount });
    } catch (e) {}
  }, []);

  useEffect(() => {
    const init = async () => {
      setInitialLoading(true);
      await Promise.all([loadProfile(), loadSponsors(), loadStats()]);
      setInitialLoading(false);
    };
    init();
    
    const unsub = onProfileChanged(loadProfile);
    return () => { unsub(); };
  }, [loadProfile, loadSponsors, loadStats]);

  useEffect(() => {
    if (!initialLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]).start();
    }
  }, [initialLoading]);

  useLiveDonations(loadStats);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") loadStats();
    });
    return () => subscription.remove();
  }, [loadStats]);

  const loadPopup = useCallback(async (isLiveUpdate = false) => {
    try {
      const p = await fetchActivePopup();
      if (!p) {
        setPopupVisible(false);
        return;
      }

      const today = new Date().toLocaleDateString('en-CA');
      const currentKey = `${p.id}_${p.updated_at || p.created_at || 'default'}`;

      try {
        const savedDataStr = await AsyncStorage.getItem('@last_popup_view');
        let savedData = savedDataStr ? JSON.parse(savedDataStr) : null;

        if (!savedData || savedData.date !== today || savedData.key !== currentKey) {
          if (isLiveUpdate && popupOpenRef.current) return;
          setPopup(p);
          setPopupVisible(true);
        }
      } catch (err) {
        setPopup(p);
        setPopupVisible(true);
      }
    } catch (e) {}
  }, []);

  const handleClosePopup = useCallback(async () => {
    setPopupVisible(false);
    if (popup) {
      const today = new Date().toLocaleDateString('en-CA');
      const currentKey = `${popup.id}_${popup.updated_at || popup.created_at || 'default'}`;
      try {
        await AsyncStorage.setItem('@last_popup_view', JSON.stringify({ date: today, key: currentKey }));
      } catch (err) {}
    }
  }, [popup]);

  useEffect(() => {
    const t = setTimeout(() => loadPopup(false), 600);
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const unsub = subscribeLivePopups(() => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => loadPopup(true), 300);
    });
    return () => {
      clearTimeout(t);
      if (debounce) clearTimeout(debounce);
      unsub();
    };
  }, [loadPopup]);

  // ⚡ નવું ફંક્શન: જ્યારે યુઝર સ્ક્રીન નીચે ખેંચશે ત્યારે આ રન થશે
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // બધો ડેટા એકસાથે ફરીથી લોડ કરો
    await Promise.all([
      loadProfile(), 
      loadSponsors(), 
      loadStats(), 
      loadPopup(false) // પોપઅપ પણ ચેક કરો કે એડમિને નવું નાખ્યું છે કે નહીં
    ]);
    setRefreshing(false);
  }, [loadProfile, loadSponsors, loadStats, loadPopup]);

  const headerHeight = insets.top + HEADER_BODY_HEIGHT;
  const clampedScroll = Animated.diffClamp(scrollY, 0, headerHeight);
  const headerTranslateY = clampedScroll.interpolate({ inputRange: [0, headerHeight], outputRange: [0, -headerHeight], extrapolate: "clamp" });
  const initial = profile?.name?.trim()?.charAt(0)?.toUpperCase() || "";

  if (initialLoading) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <HomePageSkeleton />
      </View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} translucent={false} />
        <Animated.View pointerEvents="box-none" style={[styles.fixedHeader, { height: headerHeight, paddingTop: insets.top, transform: [{ translateY: headerTranslateY }] }]}>
          <View style={styles.headerBody}>
            <View style={styles.headerLeft}>
              <Image source={require("../asset.png")} style={styles.logoImage} resizeMode="contain" />
              <View style={styles.brandContent}>
                <Text style={styles.brandEyebrow} numberOfLines={1}>TEAM</Text>
                <Text style={styles.brandTitle} numberOfLines={1}>NYARI</Text>
                <View style={styles.taglineRow}>
                  <Text style={styles.brandTagline} numberOfLines={1}>સીધી મદદ</Text>
                  <Animated.View style={{ marginHorizontal: 4, transform: [{ scale: heartBeat }] }}><Ionicons name="heart" size={11} color="#E53935" /></Animated.View>
                  <Text style={styles.brandTagline} numberOfLines={1}>દરેક પરિવાર સુધી</Text>
                </View>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity activeOpacity={0.85} style={styles.profileBtn} onPress={() => onTabChange?.("profile")}>
                {profile?.imageUri ? <Image source={{ uri: profile.imageUri }} style={styles.profilePhoto} resizeMode="cover" /> : initial ? <Text style={styles.profileInitial}>{initial}</Text> : <Ionicons name="person" size={19} color={COLORS.white} />}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <Animated.ScrollView 
          style={styles.scroll} 
          showsVerticalScrollIndicator={false} 
          bounces 
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
          contentContainerStyle={[styles.content, { paddingTop: headerHeight + 10, paddingBottom: insets.bottom + 24 }]}
          
          // ⚡ અહીં RefreshControl ઉમેર્યું છે
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.teal]} // એન્ડ્રોઇડ માટે સ્પિનરનો કલર
              tintColor={COLORS.teal} // iOS માટે સ્પિનરનો કલર
              progressBackgroundColor="#FFFFFF"
            />
          }
        >
          {sponsors.length > 0 ? <TopDonorsSlider donors={sponsors} variant="sponsor" /> : (
            <View style={styles.emptySponsors}>
              <View style={styles.emptySponsorsIcon}><Ionicons name="ribbon-outline" size={26} color={COLORS.teal} /></View>
              <Text style={styles.emptySponsorsTitle}>ટોચના પ્રાયોજક</Text>
              <Text style={styles.emptySponsorsText}>હાલમાં પ્રાયોજકની માહિતી ઉપલબ્ધ નથી</Text>
            </View>
          )}
          
          <LiveDonationBanner totalAmount={donationStats.total} totalDonations={donationStats.donationCount} />
          
          <RecentDonorsSection />
          <View style={styles.videoDonationFullWidth}><VideoDonationCard /></View>
        </Animated.ScrollView>

        <PopupModal visible={popupVisible} popup={popup} onClose={handleClosePopup} />
      </View>
    </Animated.View>
  );
};

const sk = StyleSheet.create({
  pageContainer: { flex: 1, backgroundColor: COLORS.background, paddingTop: 50 },
  headerSkeleton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.background, marginBottom: 10 },
  contentSkeleton: { paddingHorizontal: 14, flex: 1 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background }, scroll: { flex: 1 }, content: { paddingHorizontal: 14 },
  videoDonationFullWidth: { marginHorizontal: -10, alignSelf: "stretch" },
  fixedHeader: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, elevation: 8, backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: "#E8EEEE" },
  headerBody: { height: HEADER_BODY_HEIGHT, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flex: 1, flexDirection: "row", alignItems: "center", minWidth: 0 },
  logoImage: { width: 58, height: 58, borderRadius: 29, marginRight: 12 },
  brandContent: { flex: 1, minWidth: 0 },
  brandEyebrow: { fontSize: 10, lineHeight: 12, fontWeight: "700", letterSpacing: 2.2, color: "#000000", includeFontPadding: false, marginBottom: 2 },
  brandTitle: { fontSize: 27, lineHeight: 30, fontWeight: "900", letterSpacing: 0.2, color: "#12181B", includeFontPadding: false },
  taglineRow: { flexDirection: "row", alignItems: "center", marginTop: 4, flexWrap: "nowrap" },
  brandTagline: { fontSize: 10, lineHeight: 13, fontWeight: "700", letterSpacing: 0.1, color: "#4B5654", includeFontPadding: false, flexShrink: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 8 },
  profileBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.teal, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.tealDark, overflow: "hidden" },
  profilePhoto: { width: "100%", height: "100%" },
  profileInitial: { color: COLORS.white, fontSize: 17, fontWeight: "900", letterSpacing: 0.5, includeFontPadding: false },
  emptySponsors: { marginTop: 6, marginBottom: 4, paddingVertical: 30, paddingHorizontal: 20, borderRadius: 22, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, alignItems: "center" },
  emptySponsorsIcon: { width: 56, height: 56, borderRadius: 20, backgroundColor: "#E6F5F2", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  emptySponsorsTitle: { fontSize: 15, fontWeight: "800", color: "#0F2E2A", letterSpacing: 0.3 },
  emptySponsorsText: { fontSize: 12, color: COLORS.muted, marginTop: 4, textAlign: "center" },
});

export default React.memo(HomeScreen);
