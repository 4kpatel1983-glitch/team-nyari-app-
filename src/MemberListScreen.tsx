// src/MemberListScreen.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Animated, Easing, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import IDCardModal from './IDCardModal';
import { fetchAllMembers, supabase, type Member } from './supabaseClient';

const C = {
  bg: '#F7F3EC', white: '#FFFFFF', charcoal: '#202B29', charcoal2: '#34413D',
  sage: '#587567', sageDark: '#405B4F', sageSoft: '#E8EEE9', gold: '#B4935A',
  goldSoft: '#F3EBDD', blue: '#4E6F91', blueSoft: '#EAF0F7', border: '#DFDED6', muted: '#7A817D',
};

export type DemoMember = {
  id: string;
  name: string;
  mobile: string;
  address: string;
  photo: string | null;
  houseNo?: string;
  areaLocality?: string;
  pincode?: string;
  district: string;
  taluka: string;
  city: string;
  state?: string;
  service: string;
  role: string;
  leadershipStatus?: 'NONE' | 'PENDING_ADMIN_APPROVAL' | 'APPROVED';
};

const PAGE_SIZE = 20; 

const normalizeMobile = (m: string = '') => m.replace(/\D/g, '').slice(-10);
const normalize = (v: string = '') => v.toString().trim().toLowerCase().replace(/\s+/g, ' ');
const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'TN';
  if (words.length === 1) return words[0].slice(0, 2);
  return `${words[0]?.charAt(0) ?? ''}${words[1]?.charAt(0) ?? ''}`;
};
const maskMobile = (mobile: string): string => {
  const clean = normalizeMobile(mobile);
  if (clean.length !== 10) return '••••••••••';
  return `${clean.slice(0, 7)}***`;
};

const toLocalMember = (m: Member): DemoMember => ({
  id: m.member_id || 'N/A', 
  name: m.name || 'સભ્ય', 
  mobile: m.mobile || '',
  address: [m.city, m.district].filter(Boolean).join(', '), 
  photo: m.photo_url || null,
  district: m.district || '', 
  taluka: (m as any).taluka || '', 
  city: m.city || '', 
  state: 'Gujarat',
  service: m.role || '', 
  role: m.role || '', 
  leadershipStatus: 'NONE',
  houseNo: (m as any).houseNo || '', 
  areaLocality: (m as any).areaLocality || '', 
  pincode: (m as any).pincode || ''
});

const SkeletonCard = React.memo(() => {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.memberCard, { opacity }]}>
      <View style={[styles.avatarWrap, { backgroundColor: '#E8EEE9' }]} />
      <View style={styles.memberContent}>
        <View style={styles.topLine}>
          <View style={{ flex: 1, height: 16, backgroundColor: '#E8EEE9', borderRadius: 4, marginRight: 10 }} />
          <View style={{ width: 55, height: 14, backgroundColor: '#E8EEE9', borderRadius: 4 }} />
        </View>
        <View style={{ marginTop: 8, width: 90, height: 18, backgroundColor: '#E8EEE9', borderRadius: 6 }} />
        <View style={{ marginTop: 10, width: '65%', height: 12, backgroundColor: '#E8EEE9', borderRadius: 4 }} />
      </View>
    </Animated.View>
  );
});

type Props = { navigation?: { goBack: () => void } };

const MemberListScreen = ({ navigation }: Props) => {
  const [members, setMembers] = useState<DemoMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<DemoMember | null>(null);
  const [showIDCard, setShowIDCard] = useState(false);

  const loadPage = useCallback(async (pageNum: number, isRefresh = false) => {
    if (isLoadingMore || (!hasMore && pageNum > 0)) return;
    
    if (pageNum > 0) setIsLoadingMore(true);
    
    try {
      const list = await fetchAllMembers(pageNum, PAGE_SIZE);
      
      if (isRefresh || pageNum === 0) {
        setMembers((list || []).map(toLocalMember));
        setPage(0);
      } else {
        setMembers((prev) => [...prev, ...(list || []).map(toLocalMember)]);
        setPage(pageNum);
      }
      
      setHasMore((list?.length || 0) === PAGE_SIZE);
    } catch (e) {
      console.log('Load members error:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore]);

  useEffect(() => {
    loadPage(0);

    const channel = supabase
      .channel('members-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'members' },
        (payload) => {
          const newMember = toLocalMember(payload.new as Member);
          setMembers((prev) => {
            if (prev.some(m => m.id === newMember.id)) return prev;
            return [newMember, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadPage]);

  const onRefresh = () => {
    setIsRefreshing(true);
    setHasMore(true);
    loadPage(0, true);
  };

  const loadMore = () => {
    if (hasMore && !isLoading && !isRefreshing && !isLoadingMore) {
      loadPage(page + 1);
    }
  };

  const filteredMembers = useMemo(() => {
    const query = normalize(search);
    if (!query) return members;
    return members.filter((m) => {
      const text = [m.name, m.id, m.mobile, m.role, m.city, m.district].map(normalize).join(' | ');
      return text.includes(query);
    });
  }, [members, search]);

  const handleMemberPress = useCallback((item: DemoMember) => {
    setSelectedMember(item);
    setShowIDCard(true);
  }, []);

  const renderMember = useCallback(({ item }: { item: DemoMember }) => (
    <Pressable onPress={() => handleMemberPress(item)} style={({ pressed }) => [styles.memberCard, pressed && styles.pressed]}>
      <View style={styles.avatarWrap}>
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.avatar} resizeMode="cover" />
        ) : (
          <View style={styles.avatarFallback}><Text style={styles.avatarText}>{getInitials(item.name)}</Text></View>
        )}
        <View style={styles.onlineDot} />
      </View>
      <View style={styles.memberContent}>
        <View style={styles.topLine}>
          <Text style={styles.memberName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.idChip}><Text style={styles.idChipText} numberOfLines={1}>{item.id}</Text></View>
        </View>
        <View style={styles.roleRow}>
          <View style={styles.roleBadge}>
            <Ionicons name="person-outline" size={11} color="#8B6D39" />
            <Text style={styles.roleBadgeText} numberOfLines={1}>{item.role || 'સભ્ય'}</Text>
          </View>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={C.muted} />
          <Text style={styles.locationText} numberOfLines={1}>{item.city || '—'} {item.district ? `• ${item.district}` : ''}</Text>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.mobileRow}>
            <Ionicons name="call-outline" size={13} color={C.muted} />
            <Text style={styles.mobileText}>{maskMobile(item.mobile)}</Text>
          </View>
          <View style={styles.memberTag}><View style={styles.memberTagDot} /><Text style={styles.memberTagText}>MEMBER</Text></View>
        </View>
      </View>
      <View style={styles.arrowBox}><Ionicons name="chevron-forward" size={18} color={C.muted} /></View>
    </Pressable>
  ), [handleMemberPress]);

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}><Ionicons name="people-outline" size={32} color={C.sage} /></View>
      <Text style={styles.emptyTitle}>હાલ કોઈ સભ્ય નથી</Text>
      <Text style={styles.emptySubtitle}>Team Management થી નવો સભ્ય ઉમેરો</Text>
      {search.length > 0 && (
        <Pressable onPress={() => setSearch('')} style={styles.emptyButton}><Text style={styles.emptyButtonText}>Search Clear કરો</Text></Pressable>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {navigation && (
              <Pressable onPress={navigation.goBack} style={styles.backButton}><Ionicons name="arrow-back" size={23} color={C.charcoal} /></Pressable>
            )}
            <View>
              <Text style={styles.headerTitle}>સભ્ય યાદી</Text>
              <Text style={styles.headerSubtitle}>TEAM NYARI • MEMBERS</Text>
            </View>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countNumber}>{isLoading ? '--' : members.length}</Text>
            <Text style={styles.countLabel}>LOADED</Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={21} color={C.muted} />
          <TextInput
            value={search} onChangeText={(v) => { setSearch(v); }}
            placeholder="નામ, ID, મોબાઇલ, શહેર..." placeholderTextColor="#9A9F9B"
            style={styles.searchInput} returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} style={styles.searchClear}><Ionicons name="close-circle" size={19} color={C.muted} /></Pressable>
          )}
        </View>

        <View style={styles.toolbar}>
          <View style={styles.toolbarInfo}>
            <Text style={styles.resultNumber}>{isLoading ? '...' : filteredMembers.length}</Text>
            <Text style={styles.resultText}>{search.trim() ? 'શોધ પરિણામ' : 'નોંધાયેલા સભ્યો'}</Text>
          </View>
          <View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
        </View>

        {isLoading ? (
          <View style={styles.listContent}>{[1, 2, 3].map((k) => <SkeletonCard key={k} />)}</View>
        ) : (
          <FlatList
            data={filteredMembers}
            keyExtractor={(item) => item.id + item.mobile} 
            renderItem={renderMember}
            contentContainerStyle={[styles.listContent, filteredMembers.length === 0 && styles.listEmptyContent]}
            showsVerticalScrollIndicator={false} 
            ListEmptyComponent={<EmptyState />}
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[C.sage]} tintColor={C.sage} />}
            ListFooterComponent={
              isLoadingMore ? (
                <ActivityIndicator size="small" color={C.sage} style={{ marginVertical: 20 }} />
              ) : !hasMore && filteredMembers.length > 0 ? (
                <Text style={{ textAlign: 'center', color: C.muted, marginVertical: 20, fontSize: 12, fontWeight: '600' }}>
                  ટીમ ન્યારીના બધા સભ્યો જોઈ લીધા
                </Text>
              ) : null
            }
          />
        )}
        <IDCardModal visible={showIDCard} onClose={() => { setShowIDCard(false); setSelectedMember(null); }} member={selectedMember} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg }, container: { flex: 1, backgroundColor: C.bg },
  header: { minHeight: 82, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerTitle: { fontSize: 25, fontWeight: '800', color: C.charcoal, letterSpacing: -0.5 },
  headerSubtitle: { marginTop: 2, fontSize: 9, fontWeight: '800', letterSpacing: 1.7, color: C.gold },
  countBadge: { minWidth: 62, height: 48, borderRadius: 15, backgroundColor: C.charcoal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9 },
  countNumber: { color: C.white, fontSize: 18, fontWeight: '800' }, countLabel: { color: '#C8D0CB', fontSize: 7, fontWeight: '800', letterSpacing: 1 },
  searchBox: { marginHorizontal: 20, height: 54, borderRadius: 17, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  searchInput: { flex: 1, marginLeft: 10, color: C.charcoal, fontSize: 14, fontWeight: '500', paddingVertical: 0 },
  searchClear: { padding: 4 },
  toolbar: { marginHorizontal: 20, marginTop: 12, marginBottom: 3, minHeight: 42, flexDirection: 'row', alignItems: 'center' },
  toolbarInfo: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  resultNumber: { color: C.charcoal, fontSize: 18, fontWeight: '900' }, resultText: { color: C.muted, fontSize: 11, fontWeight: '600' },
  liveBadge: { height: 34, paddingHorizontal: 10, borderRadius: 11, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#D56A55' }, liveText: { color: C.charcoal2, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 35 }, listEmptyContent: { flexGrow: 1, justifyContent: 'center' },
  memberCard: { minHeight: 122, backgroundColor: C.white, borderRadius: 21, borderWidth: 1, borderColor: C.border, marginBottom: 11, padding: 13, flexDirection: 'row', alignItems: 'flex-start', elevation: 1 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.995 }] },
  avatarWrap: { width: 62, height: 62, borderRadius: 19, position: 'relative', marginRight: 12 },
  avatar: { width: 62, height: 62, borderRadius: 19 }, avatarFallback: { width: 62, height: 62, borderRadius: 19, backgroundColor: C.sageSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: C.sageDark, fontSize: 19, fontWeight: '800' },
  onlineDot: { position: 'absolute', right: -2, bottom: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: C.sage, borderWidth: 3, borderColor: C.white },
  memberContent: { flex: 1, minWidth: 0 }, topLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  memberName: { flex: 1, color: C.charcoal, fontSize: 16, fontWeight: '800' },
  idChip: { backgroundColor: C.blueSoft, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 },
  idChipText: { color: C.blue, fontSize: 8.5, fontWeight: '900', letterSpacing: 0.4 },
  roleRow: { marginTop: 6, flexDirection: 'row' },
  roleBadge: { maxWidth: '82%', backgroundColor: C.goldSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 5 },
  roleBadgeText: { color: '#8B6D39', fontSize: 9.5, fontWeight: '800' },
  locationRow: { marginTop: 7, flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { flex: 1, color: C.muted, fontSize: 11, fontWeight: '600' },
  bottomRow: { marginTop: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  mobileRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mobileText: { color: C.charcoal2, fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  memberTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F3F0', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4 },
  memberTagDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.sage },
  memberTagText: { color: C.sageDark, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.7 },
  arrowBox: { width: 25, height: 50, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingHorizontal: 30 },
  emptyIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: C.sageSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { color: C.charcoal, fontSize: 18, fontWeight: '800' },
  emptySubtitle: { marginTop: 6, color: C.muted, fontSize: 12, fontWeight: '500', textAlign: 'center' },
  emptyButton: { marginTop: 18, backgroundColor: C.charcoal, borderRadius: 12, paddingHorizontal: 17, paddingVertical: 10 },
  emptyButtonText: { color: C.white, fontSize: 12, fontWeight: '800' },
});

export default React.memo(MemberListScreen);