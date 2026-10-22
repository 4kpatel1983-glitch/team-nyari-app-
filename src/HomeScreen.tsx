// src/HomeScreen.tsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import { Animated, Easing, StatusBar, StyleSheet, Text, TouchableOpacity, View, AppState, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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

const SponsorSkeleton = React.memo(() => {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const Block = ({ style }: any) => <Animated.View style={[{ backgroundColor: "#E1EBE8", borderRadius: 8 }, style, { opacity: pulse }]} />;

  return (
    <View style={styles.skeletonWrap}>
      <View style={styles.skeletonTopRow}><Block style={{ width: 110, height: 22, borderRadius: 11 }} /><Block style={{ width: 90, height: 22, borderRadius: 11 }} /></View>
      <View style={styles.skeletonMainRow}>
        <Block style={{ width: 104, height: 104, borderRadius: 52 }} />
        <View style={styles.skeletonInfo}>
          <Block style={{ width: "75%", height: 22 }} /><Block style={{ width: "55%", height: 14, marginTop: 8 }} /><Block style={{ width: "45%", height: 14, marginTop: 6 }} /><Block style={{ width: "100%", height: 50, marginTop: 10, borderRadius: 12 }} />
        </View>
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
  const [sponsorsLoading, setSponsorsLoading] = useState(true);
  const [donationStats, setDonationStats] = useState({ total: 0, donationCount: 0 });
  const [popup, setPopup] = useState<AppPopup | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const popupKeyRef = useRef<string>("");

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

  const loadSponsors = useCallback(async (showLoader: boolean = true) => {
    try {
      if (showLoader) setSponsorsLoading(true);
      const list = await fetchTopSponsors(5);
      setSponsors((list || []).map(sponsorToSlider));
    } catch (e) { setSponsors([]); } finally { setSponsorsLoading(false); }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetchDonationStats();
      setDonationStats({ total: res.total, donationCount: res.donorCount });
    } catch (e) {}
  }, []);

  useEffect(() => {
    loadProfile(); loadSponsors(true); loadStats(); 
    const unsub = onProfileChanged(loadProfile);
    return () => { unsub(); };
  }, [loadProfile, loadSponsors, loadStats]);

  useLiveDonations(loadStats);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") loadStats();
    });
    return () => subscription.remove();
  }, [loadStats]);

  // ⚡ HOME POPUP: હોમ ખુલતાં જ બતાવો + Supabase માં ફેરફાર થાય તો લાઈવ અપડેટ
  const loadPopup = useCallback(async (isFirst: boolean) => {
    try {
      const p = await fetchActivePopup();
      if (!p) {
        popupKeyRef.current = "";
        setPopupVisible(false);
        return;
      }
      const key = JSON.stringify([p.id, p.title, p.message, p.image_url, p.button_text, p.button_link]);
      if (isFirst || key !== popupKeyRef.current) {
        popupKeyRef.current = key;
        setPopup(p);
        setPopupVisible(true);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadPopup(true), 500);
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const unsub = subscribeLivePopups(() => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => loadPopup(false), 300);
    });
    return () => {
      clearTimeout(t);
      if (debounce) clearTimeout(debounce);
      unsub();
    };
  }, [loadPopup]);

  const headerHeight = insets.top + HEADER_BODY_HEIGHT;
  const clampedScroll = Animated.diffClamp(scrollY, 0, headerHeight);
  const headerTranslateY = clampedScroll.interpolate({ inputRange: [0, headerHeight], outputRange: [0, -headerHeight], extrapolate: "clamp" });
  const initial = profile?.name?.trim()?.charAt(0)?.toUpperCase() || "";

  return (
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

      <Animated.ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} bounces scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        contentContainerStyle={[styles.content, { paddingTop: headerHeight + 10, paddingBottom: insets.bottom + 24 }]}
      >
        {sponsorsLoading ? <SponsorSkeleton /> : sponsors.length > 0 ? <TopDonorsSlider donors={sponsors} variant="sponsor" /> : (
          // ⚡ જો ડેટા ખાલી હોય તો આ કાર્ડ દેખાશે
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

      <PopupModal visible={popupVisible} popup={popup} onClose={() => setPopupVisible(false)} />
    </View>
  );
};

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
  skeletonWrap: { backgroundColor: COLORS.white, borderRadius: 22, padding: 14, marginTop: 6, marginBottom: 6, borderWidth: 1, borderColor: COLORS.border, marginHorizontal: 4 },
  skeletonTopRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  skeletonMainRow: { flexDirection: "row", gap: 13, alignItems: "flex-start" },
  skeletonInfo: { flex: 1, minWidth: 0 },
  
  // ⚡ ખાલી કાર્ડની ડિઝાઇન
  emptySponsors: { marginTop: 6, marginBottom: 4, paddingVertical: 30, paddingHorizontal: 20, borderRadius: 22, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, alignItems: "center" },
  emptySponsorsIcon: { width: 56, height: 56, borderRadius: 20, backgroundColor: "#E6F5F2", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  emptySponsorsTitle: { fontSize: 15, fontWeight: "800", color: "#0F2E2A", letterSpacing: 0.3 },
  emptySponsorsText: { fontSize: 12, color: COLORS.muted, marginTop: 4, textAlign: "center" },
});

export default React.memo(HomeScreen);
