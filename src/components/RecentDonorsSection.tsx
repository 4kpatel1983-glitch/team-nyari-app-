// src/components/RecentDonorsSection.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Modal, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View, useWindowDimensions, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchDonorFeed as fetchDonorFeedFromDB } from "../supabaseClient";
import { useLiveDonations } from "../useLiveDonations";

export interface Donor { id: string; name: string; phone?: string; mobile?: string; location?: string; city?: string; date?: string; amount: number; avatar?: string; isVerified?: boolean; }

const PREVIEW_COUNT = 5;
const HISTORY_PREVIEW_COUNT = 20;
const SECTION_MARGIN = 2;
const SECTION_PADDING = 14;
const SECTION_BORDER = 1;
const SLIDER_CARD_GAP = 12;
const SLIDER_MAX_CARDS = 8;
const AUTO_SCROLL_MS = 4000;

export async function fetchDonorFeed(limit = 50): Promise<Donor[]> {
  try {
    const live = await fetchDonorFeedFromDB(limit, 0, limit - 1);
    return live.map((d) => ({
      id: d.id, name: d.name, mobile: d.mobile, phone: d.phone,
      amount: d.amount, date: d.date, avatar: d.avatar, location: d.location,
      isVerified: d.isVerified ?? true,
    }));
  } catch { return []; }
}

function getDonorName(donor: Donor): string { return donor.name?.trim() || "દાનવીર"; }
function getDonorLocation(donor: Donor): string { return donor.location || donor.city || "ગુજરાત"; }
function getDonorImage(donor: Donor): string | undefined { return donor.avatar; }
function getMaskedMobile(donor: Donor): string { const raw = donor.phone || donor.mobile || ""; const digits = raw.replace(/\D/g, ""); if (!digits) return "—"; return `${digits.slice(0, 7)}×××`; }
function getInitial(name: string): string { const clean = name.trim(); return clean ? clean.charAt(0).toUpperCase() : "D"; }
function formatAmount(amount: number): string { return `₹${Number(amount || 0).toLocaleString("en-IN")}`; }

function useSliderCardWidth() {
  const { width: windowWidth } = useWindowDimensions();
  const fallbackWidth = Math.max(1, windowWidth - SECTION_MARGIN * 2 - SECTION_BORDER * 2);
  const [cardWidth, setCardWidth] = useState(fallbackWidth);
  const lastMeasuredRef = useRef(0);
  const onSliderLayout = useCallback((event: any) => {
    const measured = Math.floor(event.nativeEvent.layout.width);
    if (measured > 0 && measured !== lastMeasuredRef.current) {
      lastMeasuredRef.current = measured;
      setCardWidth(measured);
    }
  }, []);
  return { cardWidth, onSliderLayout };
}

const DonorAvatar = React.memo(({ donor }: { donor: Donor }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const image = getDonorImage(donor);
  if (image && !imageFailed) {
    return (
      <View style={styles.avatar}>
        <Image source={{ uri: image }} style={styles.avatarImage} resizeMode="cover" onError={() => setImageFailed(true)} />
        {donor.isVerified !== false && <View style={styles.avatarVerified}><Ionicons name="checkmark" size={9} color="#FFFFFF" /></View>}
      </View>
    );
  }
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{getInitial(getDonorName(donor))}</Text>
      {donor.isVerified !== false && <View style={styles.avatarVerified}><Ionicons name="checkmark" size={9} color="#FFFFFF" /></View>}
    </View>
  );
});

const DonorCard = React.memo(({ donor }: { donor: Donor }) => (
  <Pressable style={({ pressed }) => [styles.donorCard, pressed && styles.donorCardPressed]}>
    <DonorAvatar donor={donor} />
    <View style={styles.donorMiddle}>
      <Text style={styles.donorName} numberOfLines={1}>{getDonorName(donor)}</Text>
      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={12} color="#64748B" />
        <Text style={styles.infoText} numberOfLines={1}>{getDonorLocation(donor)}</Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="phone-portrait-outline" size={11} color="#94A3B8" />
        <Text style={styles.mobileText} numberOfLines={1}>{getMaskedMobile(donor)}</Text>
      </View>
    </View>
    <View style={styles.amountCapsule}><Text style={styles.amountLabel}>દાન</Text><Text style={styles.amountText}>{formatAmount(donor.amount)}</Text></View>
  </Pressable>
));

const DonorSliderCard = React.memo(({ donors, cardWidth }: { donors: Donor[]; cardWidth: number }) => {
  const renderDonor = (donor: Donor) => {
    const image = getDonorImage(donor);
    return (
      <View key={donor.id} style={styles.pairDonor}>
        <View style={styles.sliderAvatarWrap}>
          {image ? (
            <Image source={{ uri: image }} style={styles.sliderAvatarImg} resizeMode="cover" />
          ) : (
            <Text style={styles.sliderAvatarText}>{getInitial(getDonorName(donor))}</Text>
          )}
          {donor.isVerified !== false && <View style={styles.sliderVerified}><Ionicons name="checkmark" size={9} color="#FFFFFF" /></View>}
        </View>
        <Text style={styles.sliderName} numberOfLines={1}>{getDonorName(donor)}</Text>
        
        {/* ⚡ ગ્રીન બેકગ્રાઉન્ડ કાઢી નાખ્યો છે */}
        <View style={styles.sliderMetaRow}>
          <Ionicons name="location" size={11} color="#64748B" />
          <Text style={styles.sliderMetaText} numberOfLines={1}>{getDonorLocation(donor)}</Text>
        </View>

        <View style={styles.sliderAmountPill}><Text style={styles.sliderAmountLabel}>દાન</Text><Text style={styles.sliderAmountValue}>{formatAmount(donor.amount)}</Text></View>
      </View>
    );
  };
  return (
    <View style={[styles.pairCard, { width: cardWidth }]}>
      {donors[0] && renderDonor(donors[0])}
      {donors[1] && <View style={styles.pairDivider} />}
      {donors[1] && renderDonor(donors[1])}
    </View>
  );
});

const DonorAutoSlider = React.memo(({ donors }: { donors: Donor[] }) => {
  const listRef = useRef<FlatList<Donor[]>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const { cardWidth, onSliderLayout } = useSliderCardWidth();
  const pageWidth = cardWidth + SLIDER_CARD_GAP;

  const donorPairs = useMemo(() => {
    const pairs: Donor[][] = [];
    for (let i = 0; i < donors.length; i += 2) pairs.push(donors.slice(i, i + 2));
    return pairs;
  }, [donors]);

  const firstDonorId = donorPairs[0]?.[0]?.id;
  const prevFirstIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (prevFirstIdRef.current === firstDonorId) return;
    prevFirstIdRef.current = firstDonorId;
    setActiveIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [firstDonorId]);

  useEffect(() => {
    if (donorPairs.length <= 1 || isDragging) return;
    const timer = setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + 1) % donorPairs.length;
        listRef.current?.scrollToOffset({ offset: next * pageWidth, animated: true });
        return next;
      });
    }, AUTO_SCROLL_MS);
    return () => clearInterval(timer);
  }, [donorPairs.length, isDragging, pageWidth]);

  return (
    <View onLayout={onSliderLayout}>
      <FlatList
        ref={listRef} data={donorPairs} horizontal showsHorizontalScrollIndicator={false}
        keyExtractor={(pair) => pair.map((d) => d.id).join("-")}
        renderItem={({ item }) => <DonorSliderCard donors={item} cardWidth={cardWidth} />}
        ItemSeparatorComponent={() => <View style={{ width: SLIDER_CARD_GAP }} />}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 6 }}
        snapToInterval={pageWidth} snapToAlignment="start" decelerationRate="fast"
        onScrollBeginDrag={() => setIsDragging(true)}
        onScrollEndDrag={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
          setActiveIndex(Math.max(0, Math.min(donorPairs.length - 1, index)));
          setIsDragging(false);
        }}
        getItemLayout={(_, index) => ({ length: pageWidth, offset: pageWidth * index, index })}
      />
      {donorPairs.length > 1 && (
        <View style={styles.dotsRow}>{donorPairs.map((pair, index) => <View key={pair.map((d) => d.id).join("-")} style={[styles.dot, index === activeIndex && styles.dotActive]} />)}</View>
      )}
    </View>
  );
});

const DonorHistoryView = ({ donors, onClose }: { donors: Donor[]; onClose: () => void }) => {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filteredDonors = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return donors;
    return donors.filter((donor) => getDonorName(donor).toLowerCase().includes(query) || getDonorLocation(donor).toLowerCase().includes(query));
  }, [donors, search]);

  const visibleDonors = useMemo(() => showAll ? filteredDonors : filteredDonors.slice(0, HISTORY_PREVIEW_COUNT), [filteredDonors, showAll]);

  return (
    <SafeAreaView style={styles.historyRoot}>
      <View style={styles.historyHeader}>
        <Pressable onPress={onClose} hitSlop={20} style={styles.backButton}><Ionicons name="arrow-back" size={22} color="#1E293B" /></Pressable>
        <View style={styles.historyTitleBox}><Text style={styles.historyTitle}>બધા દાનવીરો</Text><Text style={styles.historySubtitle}>દરેક દાનની વિગત</Text></View>
      </View>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={19} color="#64748B" />
        <TextInput value={search} onChangeText={(v) => { setSearch(v); setShowAll(false); }} placeholder="દાનવીર શોધો..." placeholderTextColor="#94A3B8" style={styles.searchInput} />
      </View>
      <FlatList
        data={visibleDonors} keyExtractor={(item) => item.id} renderItem={({ item }) => <DonorCard donor={item} />} 
        showsVerticalScrollIndicator={false} contentContainerStyle={styles.historyList}
        ListEmptyComponent={<View style={styles.emptyBox}><Text style={styles.emptyTitle}>દાનવીર મળ્યા નથી</Text></View>}
        ListFooterComponent={
          !showAll && filteredDonors.length > HISTORY_PREVIEW_COUNT ? (
            <Pressable onPress={() => setShowAll(true)} style={styles.viewAllFooterButton}>
              <Text style={styles.viewAllTitle}>બધા દાનવીરો જુઓ ({filteredDonors.length})</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const RecentDonorsSection = ({ fullScreen = false, onClose }: { fullScreen?: boolean; onClose?: () => void }) => {
  const [allDonors, setAllDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const loadDonors = useCallback(async () => {
    const result = await fetchDonorFeed(50); 
    setAllDonors((prev) => (result.length > 0 || prev.length === 0 ? result : prev));
    setLoading(false);
  }, []);

  useEffect(() => { loadDonors(); }, [loadDonors]);
  useLiveDonations(loadDonors);

  if (fullScreen) return <DonorHistoryView donors={allDonors} onClose={onClose || (() => {})} />;
  if (loading && allDonors.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextBox}>
          <Text style={styles.sectionTitle}>બધા દાનવીરો</Text>
          <Text style={styles.sectionSubtitle}>દિલથી આપેલા સહયોગ માટે આભાર</Text>
        </View>
        {allDonors.length > PREVIEW_COUNT && (
          <Pressable onPress={() => setShowHistory(true)} style={styles.viewAllPill}>
            <Text style={styles.viewAllPillText}>View All</Text><Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
      <DonorAutoSlider donors={allDonors.slice(0, SLIDER_MAX_CARDS)} />
      
      <Modal visible={showHistory} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowHistory(false)}>
        <DonorHistoryView donors={allDonors} onClose={() => setShowHistory(false)} />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginHorizontal: SECTION_MARGIN, marginTop: 12, borderRadius: 26, backgroundColor: "#F8FAFC", paddingTop: 18, paddingBottom: 14, overflow: "hidden", borderWidth: 1, borderColor: "#E2E8F0" },
  headerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: SECTION_PADDING, marginBottom: 14 },
  headerTextBox: { flex: 1, minWidth: 0 }, 
  sectionTitle: { color: "#1E293B", fontSize: 20, fontWeight: "800", letterSpacing: -0.3 }, 
  sectionSubtitle: { color: "#64748B", fontSize: 11.5, fontWeight: "600", marginTop: 3 },
  viewAllPill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: "#334155", marginLeft: 8 },
  viewAllPillText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", marginRight: 2 },
  
  pairCard: { height: 210, backgroundColor: "#FFFFFF", borderRadius: 22, paddingVertical: 14, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#E2E8F0" },
  pairDonor: { flex: 1, minWidth: 0, alignItems: "center", justifyContent: "center", paddingHorizontal: 2 }, 
  pairDivider: { width: 1, height: 110, backgroundColor: "#F1F5F9", marginHorizontal: 4 },
  sliderAvatarWrap: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#CBD5E1" },
  sliderAvatarImg: { width: 50, height: 50, borderRadius: 25 }, 
  sliderAvatarText: { color: "#475569", fontSize: 20, fontWeight: "800" },
  sliderVerified: { position: "absolute", right: -2, bottom: -2, width: 17, height: 17, borderRadius: 9, backgroundColor: "#475569", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFFFFF" },
  sliderName: { marginTop: 9, color: "#1E293B", fontSize: 12.5, fontWeight: "800", textAlign: "center", width: "100%" },
  
  // ⚡ ગ્રીન બેકગ્રાઉન્ડ રિમૂવ કરેલું છે
  sliderMetaRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 5 },
  sliderMetaText: { color: "#64748B", fontSize: 10.5, fontWeight: "600", marginLeft: 3 }, 

  sliderAmountPill: { marginTop: 9, width: "100%", paddingVertical: 7, borderRadius: 12, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center" },
  sliderAmountLabel: { color: "#64748B", fontSize: 9, fontWeight: "700" }, 
  sliderAmountValue: { color: "#0F172A", fontSize: 13, fontWeight: "800" },
  dotsRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#CBD5E1", marginHorizontal: 3 }, 
  dotActive: { width: 18, backgroundColor: "#475569" },
  
  donorCard: { width: "100%", height: 90, backgroundColor: "#FFFFFF", borderRadius: 19, marginBottom: 8, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  donorCardPressed: { opacity: 0.8 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  avatarImage: { width: 48, height: 48, borderRadius: 24 }, 
  avatarText: { color: "#475569", fontSize: 18, fontWeight: "800" },
  avatarVerified: { position: "absolute", right: -3, bottom: -2, width: 17, height: 17, borderRadius: 9, backgroundColor: "#475569", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFFFFF" },
  donorMiddle: { flex: 1, marginLeft: 10 }, 
  donorName: { color: "#1E293B", fontSize: 15.5, fontWeight: "800", letterSpacing: -0.2 },
  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 3 }, 
  infoText: { color: "#64748B", fontSize: 10.5, fontWeight: "600", marginLeft: 4 },
  mobileText: { color: "#94A3B8", fontSize: 9.5, fontWeight: "600", marginLeft: 4 },
  amountCapsule: { minWidth: 78, paddingHorizontal: 8, paddingVertical: 10, borderRadius: 16, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center" },
  amountLabel: { color: "#64748B", fontSize: 9, fontWeight: "700", marginBottom: 1 }, 
  amountText: { color: "#0F172A", fontSize: 14, fontWeight: "800" },
  historyRoot: { flex: 1, backgroundColor: "#F8FAFC" },
  historyHeader: { minHeight: 70, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  historyTitleBox: { flex: 1, marginLeft: 11 }, 
  historyTitle: { color: "#1E293B", fontSize: 18, fontWeight: "800" }, 
  historySubtitle: { color: "#64748B", fontSize: 11, fontWeight: "600", marginTop: 2 },
  searchBox: { height: 49, marginHorizontal: 12, marginTop: 12, marginBottom: 5, paddingHorizontal: 13, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", flexDirection: "row", alignItems: "center" },
  searchInput: { flex: 1, color: "#0F172A", fontSize: 13, fontWeight: "600", marginLeft: 8 },
  historyList: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 30 },
  viewAllFooterButton: { height: 50, borderRadius: 14, backgroundColor: "#334155", flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 10, gap: 8 },
  viewAllTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  emptyBox: { alignItems: "center", paddingTop: 100 },
  emptyTitle: { color: "#64748B", fontSize: 15, fontWeight: "700" },
});

export default React.memo(RecentDonorsSection);
