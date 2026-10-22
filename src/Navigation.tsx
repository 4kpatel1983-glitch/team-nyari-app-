// src/Navigation.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, BackHandler, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as NativeSplash from 'expo-splash-screen'; // ⚡ સિસ્ટમ સ્પ્લાશ માટે

import { useFonts as usePoppinsFonts, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, Poppins_900Black } from '@expo-google-fonts/poppins';
import { useFonts as useHindFonts, HindVadodara_400Regular, HindVadodara_500Medium, HindVadodara_600SemiBold, HindVadodara_700Bold } from '@expo-google-fonts/hind-vadodara';

import LoginScreen from "./LoginScreen";
import HomeScreen from "./HomeScreen";
import TeamScreen from "./TeamScreen";
import AddMemberScreen from "./AddMemberScreen";
import MemberListScreen from "./MemberListScreen";
import ProfileScreen from "./ProfileScreen";
import ProfileSetupScreen from "./ProfileSetupScreen";
import RecentDonorsSection from "./components/RecentDonorsSection";
import VideoSearch from "./components/VideoSearch";
import AboutScreen from "./AboutScreen";

// ⚡ SplashScreen ઈમ્પોર્ટ કાઢી નાખ્યું છે
import { clearSession, fetchProfile, getCachedMobile, isSessionActive, keepAlive, saveSession } from "./supabaseClient";

// ⚡ સ્પ્લાશ સ્ક્રીનને ઓટોમેટિક બંધ થતી રોકો
NativeSplash.preventAutoHideAsync().catch(() => {});

const ACTIVE = "#0E7B6E";
const INACTIVE = "#737A77";
const BACKGROUND = "#F6F9F8";
const TEAM_GREEN = "#064E3B";

const TABS = [
  { id: "home", label: "હોમ", icon: "home-outline" },
  { id: "donors", label: "દાનવીરો", icon: "people-outline" },
  { id: "videos", label: "વિડિયો", icon: "videocam-outline" },
  { id: "about", label: "વિશે", icon: "information-circle-outline" },
  { id: "team", label: "Team", icon: "people-outline" },
] as const;

type TabId = "home" | "donors" | "videos" | "about" | "team" | "add_member" | "member_list" | "profile";
type AuthStatus = "loading" | "login" | "setup" | "main";

const UniversalSkeleton = () => {
  const opacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.8, duration: 650, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.35, duration: 650, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View style={sk.container}>
      <View style={sk.header}>
        <View style={{ flex: 1 }}>
          <Animated.View style={[sk.block, { width: 110, height: 14, opacity }]} />
          <Animated.View style={[sk.block, { width: 170, height: 22, marginTop: 8, opacity }]} />
        </View>
        <Animated.View style={[sk.block, { width: 44, height: 44, borderRadius: 16, opacity }]} />
      </View>
      <Animated.View style={[sk.hero, { opacity }]} />
      <View style={sk.stats}>{[1, 2, 3].map((item) => <Animated.View key={item} style={[sk.stat, { opacity }]} />)}</View>
      {[1, 2, 3].map((item) => <Animated.View key={item} style={[sk.card, { opacity }]} />)}
    </View>
  );
};

export default function Navigation() {
  const [poppinsLoaded] = usePoppinsFonts({ Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, Poppins_900Black });
  const [hindLoaded] = useHindFonts({ HindVadodara_400Regular, HindVadodara_500Medium, HindVadodara_600SemiBold, HindVadodara_700Bold });

  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [trustedMobile, setTrustedMobile] = useState<string | undefined>(undefined);
  const insets = useSafeAreaInsets();

  const activeTabRef = useRef<TabId>("home");
  const bootStarted = useRef(false);

  const handleTabChange = useCallback((newTab: TabId) => {
    if (activeTabRef.current === newTab) return;
    activeTabRef.current = newTab;
    setActiveTab(newTab);
  }, []);

  const bootApp = useCallback(async () => {
    try {
      keepAlive();
      const active = await isSessionActive();
      const mobile = await getCachedMobile();

      if (active && mobile) {
        setTrustedMobile(mobile);
        const profile = await fetchProfile(mobile);
        
        if (!profile) {
          await clearSession();
          setTrustedMobile(undefined);
          setAuthStatus("login");
          return;
        }

        if (profile.name?.trim()) {
          setAuthStatus("main");
        } else {
          setAuthStatus("setup");
        }
        return;
      }

      if (mobile) {
        setTrustedMobile(mobile);
      }
      
      setAuthStatus("login");
      
    } catch (error) {
      setAuthStatus("login");
    }
  }, []);

  useEffect(() => {
    if (bootStarted.current) return;
    bootStarted.current = true;
    void bootApp();
  }, [bootApp]);

  // ⚡ 2.5 સેકન્ડનો ડિલે આપીને સ્પ્લાશ હાઈડ કરો
  useEffect(() => {
    if (poppinsLoaded && hindLoaded && authStatus !== "loading") {
      const timer = setTimeout(() => {
        NativeSplash.hideAsync().catch(() => {});
      }, 2500); // 2.5 સેકન્ડ

      return () => clearTimeout(timer);
    }
  }, [poppinsLoaded, hindLoaded, authStatus]);

  useEffect(() => {
    if (authStatus !== "main") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      const current = activeTabRef.current;
      if (current === "add_member" || current === "member_list") { handleTabChange("team"); return true; }
      if (current === "profile") { handleTabChange("home"); return true; }
      if (current !== "home") { handleTabChange("home"); return true; }
      return false;
    });
    return () => subscription.remove();
  }, [authStatus, handleTabChange]);

  const handleLoginSuccess = useCallback(async (mobileNumber: string) => {
    try {
      await saveSession(mobileNumber);
      setTrustedMobile(mobileNumber);
      const profile = await fetchProfile(mobileNumber);
      
      if (profile?.name?.trim()) { 
        activeTabRef.current = "home"; 
        setActiveTab("home"); 
        setAuthStatus("main"); 
      } else { 
        setAuthStatus("setup"); 
      }
    } catch (error) { 
      setAuthStatus("setup"); 
    }
  }, []);

  const handleProfileSetupComplete = useCallback(async () => {
    try {
      const mobile = await getCachedMobile();
      if (!mobile) { setAuthStatus("login"); return; }
      await saveSession(mobile);
      setTrustedMobile(mobile);
      activeTabRef.current = "home";
      setActiveTab("home");
      setAuthStatus("main");
    } catch (error) {
      activeTabRef.current = "home"; setActiveTab("home"); setAuthStatus("main");
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try { await clearSession(); } catch (error) {}
    setTrustedMobile(undefined); 
    activeTabRef.current = "home"; 
    setActiveTab("home"); 
    setAuthStatus("login");
  }, []);

  const customNavigation = React.useMemo(() => ({
    navigate: (screenName: string) => {
      switch (screenName) {
        case "AddMember": handleTabChange("add_member"); break;
        case "MemberList": handleTabChange("member_list"); break;
        case "Team": handleTabChange("team"); break;
        case "Profile": handleTabChange("profile"); break;
        default: handleTabChange("home"); break;
      }
    },
    goBack: () => handleTabChange("team"),
  }), [handleTabChange]);

  // જ્યાં સુધી ડેટા લોડ ના થાય, ત્યાં સુધી કંઈ રેન્ડર ના કરો (સ્પ્લાશ ચાલુ રહેશે)
  if (!poppinsLoaded || !hindLoaded || authStatus === "loading") {
    return null; 
  }

  if (authStatus === "login") return <LoginScreen onLoginSuccess={handleLoginSuccess} trustedMobile={trustedMobile} />;
  if (authStatus === "setup") return <View style={styles.root}><ProfileSetupScreen onComplete={handleProfileSetupComplete} /></View>;

  const renderTab = (id: TabId, node: React.ReactNode, extra?: any) => {
    if (activeTab !== id) return null;
    return <View key={id} style={[styles.screen, extra]}>{node}</View>;
  };

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        {renderTab("home", <HomeScreen onTabChange={(tab) => handleTabChange(tab as TabId)} />)}
        {renderTab("donors", <RecentDonorsSection fullScreen onClose={() => handleTabChange("home")} />, [styles.donorsScreen, { paddingTop: insets.top }])}
        {renderTab("videos", <VideoSearch />)}
        {renderTab("team", <TeamScreen navigation={customNavigation} />)}
        {renderTab("about", <AboutScreen />)}
        
        {renderTab("profile", 
          <ProfileScreen 
            onBack={() => handleTabChange("home")} 
            onGoToTeam={() => handleTabChange("team")} 
            onGoToAbout={() => handleTabChange("about")} 
            onLogout={handleLogout} 
          />
        )}
        
        {renderTab("add_member", <AddMemberScreen navigation={customNavigation} />)}
        {renderTab("member_list", <MemberListScreen navigation={customNavigation} />)}
      </View>

      <View style={[styles.bottomArea, { paddingBottom: insets.bottom }]}>
        <View style={styles.navBar}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const isTeam = tab.id === "team";
            return (
              <TouchableOpacity
                key={tab.id} activeOpacity={0.75} delayPressIn={0} onPress={() => handleTabChange(tab.id as TabId)}
                accessibilityRole="tab" accessibilityState={{ selected: isActive }} style={styles.tab}
              >
                {isTeam ? (
                  <View style={[styles.teamCapsule, isActive && styles.teamCapsuleActive]}>
                    <Ionicons name="people" size={19} color={isActive ? "#FFFFFF" : TEAM_GREEN} />
                    <Text style={[styles.teamCapsuleText, isActive && styles.teamCapsuleTextActive]}>Team</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name={isActive ? (tab.icon.replace("-outline", "") as any) : (tab.icon as any)} size={22} color={isActive ? ACTIVE : INACTIVE} />
                    <Text style={isActive ? styles.labelActive : styles.label}>{tab.label}</Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 16, backgroundColor: BACKGROUND },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  block: { backgroundColor: "#E1EBE8", borderRadius: 8 },
  hero: { height: 160, backgroundColor: "#E1EBE8", borderRadius: 24, marginBottom: 18 },
  stats: { flexDirection: "row", gap: 10, marginBottom: 18 },
  stat: { flex: 1, height: 74, backgroundColor: "#E1EBE8", borderRadius: 18 },
  card: { height: 100, backgroundColor: "#E1EBE8", borderRadius: 20, marginBottom: 12 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BACKGROUND }, content: { flex: 1 }, screen: { flex: 1, minHeight: 0 },
  loadingCenter: { flex: 1, backgroundColor: BACKGROUND }, donorsScreen: { backgroundColor: BACKGROUND },
  bottomArea: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderTopColor: "#E1EBE8", elevation: 12 },
  navBar: { height: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingHorizontal: 3 },
  tab: { flex: 1, height: "100%", alignItems: "center", justifyContent: "center" },
  label: { fontSize: 10, marginTop: 3, color: INACTIVE, fontWeight: "500" },
  labelActive: { fontSize: 10, marginTop: 3, color: ACTIVE, fontWeight: "700" },
  teamCapsule: { minHeight: 43, paddingHorizontal: 9, borderRadius: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: "#E5F3ED", borderWidth: 1, borderColor: "#C7E5D8" },
  teamCapsuleActive: { backgroundColor: TEAM_GREEN, borderColor: TEAM_GREEN, paddingHorizontal: 11, elevation: 5, shadowColor: TEAM_GREEN, shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  teamCapsuleText: { fontSize: 11, fontWeight: "800", color: "#075B46" },
  teamCapsuleTextActive: { color: "#FFFFFF" },
});

export default React.memo(Navigation);
