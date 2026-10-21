// src/components/VideoSearch.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, FlatList, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppealCase, fetchAppealCases } from '../supabaseClient';
import { AppealCardItem } from './VideoDonationCard';
import DonationModal from './DonationModal';
import { useLiveDonations } from '../useLiveDonations';

const PAGE_SIZE = 10;

const VideoSearch = () => {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [cases, setCases] = useState<AppealCase[]>([]);
  const [filtered, setFiltered] = useState<AppealCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [donationVisible, setDonationVisible] = useState(false);

  const loadData = useCallback(async (pageNum: number, isRefresh = false) => {
    const res = await fetchAppealCases(pageNum, PAGE_SIZE);
    if (isRefresh || pageNum === 0) { setCases(res); setPage(0); } 
    else { setCases(prev => [...prev, ...res]); setPage(pageNum); }
    setHasMore(res.length === PAGE_SIZE);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(0); }, [loadData]);
  useLiveDonations(() => loadData(0, true));

  useEffect(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) { setFiltered(cases); return; }
    setFiltered(cases.filter(c => c.title.toLowerCase().includes(q) || c.location.toLowerCase().includes(q) || c.id.includes(q)));
  }, [searchText, cases]);

  if (loading) return <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}><ActivityIndicator size="large" color="#0E7B6E" style={{ marginTop: 50 }} /></SafeAreaView>;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top > 0 ? insets.top : 10 }]}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#687572" style={styles.searchIcon} />
        <TextInput style={styles.searchInput} placeholder="નંબર લખો... (દા.ત. 001, 15)" value={searchText} onChangeText={setSearchText} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={() => { if (!searchText && hasMore) loadData(page + 1); }}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => <AppealCardItem item={item} onDonate={(i: any) => { setSelectedCase(i); setDonationVisible(true); }} />} 
      />
      {selectedCase && <DonationModal visible={donationVisible} onClose={() => setDonationVisible(false)} caseTitle={selectedCase.title} caseId={selectedCase.id} beneficiaryUpiId={selectedCase.upiId} beneficiaryPayeeName={selectedCase.payeeName} />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9F8' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', margin: 14, paddingHorizontal: 14, borderRadius: 16, height: 50, borderWidth: 1, borderColor: '#E4EBE8' },
  searchIcon: { marginRight: 10 }, 
  searchInput: { flex: 1, fontSize: 14, color: '#10302B' },
  listContent: { paddingBottom: 20, paddingHorizontal: 12 },
});

export default React.memo(VideoSearch);