// src/components/VideoDonationCard.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import DonationModal from './DonationModal';
import { fetchAppealCases, fetchCaseTransactions, subscribeLiveDonations, isLiveHealthy, AppealCase, CaseTransaction } from '../supabaseClient';

export type Transaction = CaseTransaction;

interface VideoDonationCardProps {
  cases?: AppealCase[];
}

const COLORS = { primary: '#0E7B6E', primaryDark: '#0A5F55', bg: '#F6F9F8', white: '#FFFFFF', text: '#10302B', textSoft: '#6F8782', border: '#E1EBE8', proofBg: '#E9F0ED', proofText: '#4F7169', disabledText: '#9BAAB0' };

const DEFAULT_PROOF_TITLE = 'મદદ પરિવાર સુધી પહોંચી ગઈ છે';
const DEFAULT_PROOF_STORY =
  'આ પરિવારની પરિસ્થિતિ જાણીને અમે મદદ કરવાનું નક્કી કર્યું હતું. સંજોગોવશાત્ અમે રૂબરૂ જઈ શક્યા નહીં, તેથી ગામના સરપંચશ્રીને મદદની રકમ આપી. તેમણે તે પરિવાર સુધી પહોંચાડી દીધી છે. પુરાવો નીચે ફોટો/વિડિયોમાં જુઓ.';

// created_at + duration thi sachu baki rahelu time (app khole tyare fari full thi shuru nahi thay)
const getRemainingSeconds = (item: AppealCase): number => {
  if (!item.createdAt) return Math.max(0, item.durationSeconds);
  const end = new Date(item.createdAt).getTime() + item.durationSeconds * 1000;
  return Math.max(0, Math.floor((end - Date.now()) / 1000));
};

const formatMoney = (amount: number) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
const timeAgo = (date?: string): string => {
  if (!date) return '';
  const t = new Date(date).getTime();
  if (isNaN(t)) return '';
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return 'હમણાં જ';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} મિનિટ પહેલાં`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} કલાક પહેલાં`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'ગઈકાલે';
  if (d < 7) return `${d} દિવસ પહેલાં`;
  return new Date(t).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const displayCaseId = (id: string) => `TN ${id.replace(/\D/g, '').padStart(3, '0')}`;

const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }
  return null;
};

const getYouTubeThumbnail = (url: string, quality: 'max' | 'high' = 'high'): string | null => {
  const id = getYouTubeId(url);
  if (!id) return null;
  const q = quality === 'max' ? 'maxresdefault' : 'hqdefault';
  return `https://img.youtube.com/vi/${id}/${q}.jpg`;
};

const CountdownTimer: React.FC<{ durationSeconds: number; isCompleted?: boolean; onExpired?: () => void }> = ({ durationSeconds, isCompleted = false, onExpired }) => {
  const [remaining, setRemaining] = useState(Math.max(0, durationSeconds));
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    setRemaining(Math.max(0, durationSeconds));
    if (isCompleted || durationSeconds <= 0) return;

    const timer = setInterval(() => setRemaining((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [durationSeconds, isCompleted]);

  useEffect(() => {
    if (remaining === 0 && !isCompleted && !firedRef.current) {
      firedRef.current = true;
      onExpired?.();
    }
  }, [remaining, isCompleted, onExpired]);

  const expired = isCompleted || remaining <= 0;
  const shown = expired ? 0 : remaining;
  const days = Math.floor(shown / 86400);
  const hours = Math.floor((shown % 86400) / 3600);
  const minutes = Math.floor((shown % 3600) / 60);
  const seconds = shown % 60;
  const two = (v: number) => String(v).padStart(2, '0');

  return (
    <View style={[styles.timerWrap, expired && styles.timerWrapDone]}>
      {expired && <LinearGradient colors={['#149182', '#0A5F55']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />}
      <View style={styles.timerHeadingRow}>
        <View style={styles.timerHeadingLeft}>
          <View style={[styles.timerClockIcon, expired && styles.timerClockIconDone]}><Ionicons name={expired ? 'checkmark-done' : 'time-outline'} size={17} color={expired ? '#FFFFFF' : COLORS.primary} /></View>
          <Text style={[styles.timerHeading, expired && styles.timerHeadingDone]}>{expired ? 'મદદનો સમય પૂર્ણ થયો' : 'મદદ માટે સમય બાકી'}</Text>
        </View>
        {!expired && <View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveSmall}>LIVE</Text></View>}
      </View>
      <View style={styles.timeRow}>
        {[{ n: two(days), l: 'DAYS' }, { n: two(hours), l: 'HRS' }, { n: two(minutes), l: 'MIN' }, { n: two(seconds), l: 'SEC' }].map((t, i) => (
          <View key={i} style={[styles.timeCell, expired && styles.timeCellDone]}><Text style={[styles.timeNumber, expired && styles.timeNumberDone]}>{t.n}</Text><Text style={[styles.timeLabel, expired && styles.timeLabelDone]}>{t.l}</Text></View>
        ))}
      </View>
    </View>
  );
};

// ============================================================
// YOUTUBE VIDEO MODAL WITH ORIGIN FIX & FALLBACK
// ============================================================
export const YouTubeVideoModal: React.FC<{ visible: boolean; url: string; onClose: () => void }> = ({ visible, url, onClose }) => {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const videoId = useMemo(() => getYouTubeId(url), [url]);
  const APP_ORIGIN = 'https://teamnyari.app';

  useEffect(() => {
    if (visible) {
      setLoading(true);
    }
  }, [visible, url]);

  const handleWatchOnYouTube = () => {
    onClose();
    Linking.openURL(url);
  };

  const html = useMemo(() => {
    if (!videoId) return '';
    return `<!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            body, html { margin: 0; padding: 0; background-color: #000; width: 100%; height: 100%; overflow: hidden; }
            #player { width: 100%; height: 100%; }
          </style>
        </head>
        <body>
          <div id="player"></div>
          <script>
            var tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            var player;
            function onYouTubeIframeAPIReady() {
              player = new YT.Player('player', {
                videoId: '${videoId}',
                playerVars: { 
                  'autoplay': 1, 
                  'mute': 0, 
                  'controls': 1, 
                  'rel': 0, 
                  'playsinline': 1, 
                  'modestbranding': 0,
                  'enablejsapi': 1,
                  'origin': '${APP_ORIGIN}'
                },
                events: {
                  'onReady': function(event) {
                    event.target.playVideo();
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
                  },
                  'onError': function(event) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', code: event.data }));
                  }
                }
              });
            }
          </script>
        </body>
      </html>`;
  }, [videoId]);

  if (!videoId) return null;

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.videoModal}>
        <WebView
          ref={webViewRef}
          source={{ html, baseUrl: APP_ORIGIN }}
          style={styles.webview}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'ERROR') {
                setLoading(false);
                Alert.alert(
                  'વિડિયો એપમાં ચાલી શકતો નથી',
                  'આ વિડિયોના નિર્માતાએ તેને એપમાં ચલાવવાની પરવાનગી આપી નથી. શું તમે તેને YouTube પર જોવા માંગો છો?',
                  [
                    { text: 'ના', style: 'cancel', onPress: onClose },
                    { text: 'YouTube પર જુઓ', onPress: handleWatchOnYouTube }
                  ]
                );
              }
            } catch (e) {}
          }}
        />
        {loading && <View style={styles.videoLoading}><ActivityIndicator size="large" color="#FFFFFF" /></View>}

        <Pressable onPress={onClose} style={styles.videoClose}>
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </Pressable>
      </View>
    </Modal>
  );
};

// ============================================================
// PROOF MODAL (નવું: title + story card, amount capsule કાઢી નાખ્યું)
// ============================================================
export const ProofModal: React.FC<{ visible: boolean; item: AppealCase | null; onClose: () => void; canUpload: boolean }> = ({ visible, item, onClose, canUpload }) => {
  const [photoOpen, setPhotoOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    if (!visible) { setPhotoOpen(false); setVideoOpen(false); }
  }, [visible]);

  if (!item) return null;

  const photoUrl = item.proofPhotoUrl || '';
  const videoLink = item.proofVideoUrl || '';
  const hasPhoto = canUpload && !!photoUrl;
  const hasVideo = canUpload && !!videoLink;
  const hasMedia = hasPhoto || hasVideo;
  const title = (item.proofTitle || '').trim() || DEFAULT_PROOF_TITLE;
  const story = (item.proofDescription || '').trim() || DEFAULT_PROOF_STORY;

  const openVideo = () => {
    if (getYouTubeId(videoLink)) setVideoOpen(true);
    else Linking.openURL(videoLink);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.proofModal}>
          <View style={styles.proofTop}>
            <View style={styles.proofIconCircle}>
              <Ionicons name={canUpload ? 'shield-checkmark' : 'time-outline'} size={22} color={COLORS.primary} />
            </View>
            <Pressable onPress={onClose} style={styles.modalClose}><Ionicons name="close" size={20} color="#617984" /></Pressable>
          </View>

          {canUpload ? (
            <>
              <View style={styles.proofVerified}>
                <Ionicons name="checkmark-circle" size={13} color={COLORS.primary} />
                <Text style={styles.proofVerifiedText}>ચકાસાયેલ મદદ</Text>
              </View>
              <Text style={styles.proofTitle}>{title}</Text>

              <View style={styles.proofStoryCard}>
                <View style={styles.proofStoryAccent} />
                <Text style={styles.proofStoryText}>{story}</Text>
              </View>

              {hasMedia && (
                <>
                  <Text style={styles.proofHint}>પ્રૂફ જુઓ</Text>
                  <View style={styles.proofMediaRow}>
                    {hasVideo && (
                      <Pressable onPress={openVideo} style={styles.proofMediaBtn}>
                        <LinearGradient colors={['#149182', '#0A5F55']} style={styles.proofMediaIcon}><Ionicons name="play" size={20} color="#FFFFFF" /></LinearGradient>
                        <Text style={styles.proofMediaText}>વિડિયો</Text>
                      </Pressable>
                    )}
                    {hasPhoto && (
                      <Pressable onPress={() => setPhotoOpen(true)} style={styles.proofMediaBtn}>
                        <LinearGradient colors={['#149182', '#0A5F55']} style={styles.proofMediaIcon}><Ionicons name="image" size={20} color="#FFFFFF" /></LinearGradient>
                        <Text style={styles.proofMediaText}>ફોટો</Text>
                      </Pressable>
                    )}
                  </View>
                </>
              )}
            </>
          ) : (
            <>
              <Text style={styles.proofTitle}>Proof સમય પૂર્ણ થયા પછી</Text>
              <Text style={styles.proofMainText}>સમય પૂર્ણ થયા પછી આ પરિવારને કરવામાં આવેલી મદદનો ફોટો અથવા બેંક/UPI પેમેન્ટનો પુરાવો અહીં દર્શાવી શકાશે.</Text>
            </>
          )}

          <Pressable onPress={onClose} style={styles.proofDoneButton}><Text style={styles.proofDoneText}>સમજાયું</Text></Pressable>
        </View>

        <YouTubeVideoModal visible={videoOpen} url={videoLink} onClose={() => setVideoOpen(false)} />

        <Modal visible={photoOpen} animationType="fade" presentationStyle="fullScreen" onRequestClose={() => setPhotoOpen(false)}>
          <View style={styles.photoViewer}>
            <Image source={{ uri: photoUrl }} style={styles.photoViewerImage} resizeMode="contain" />
            <Pressable onPress={() => setPhotoOpen(false)} style={styles.videoClose}>
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </Pressable>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const DonorAutoSlider = React.memo(({ transactions, frozen = false }: { transactions: Transaction[]; frozen?: boolean }) => {
  const scrollRef = useRef<ScrollView>(null);
  const offsetRef = useRef(0);
  const contentWidthRef = useRef(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [paused, setPaused] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const isSmallList = transactions.length <= 4;

  const repeatedData = useMemo(() => {
    if (transactions.length === 0) return [];
    if (isSmallList || frozen) return transactions;
    return [...transactions, ...transactions];
  }, [transactions, isSmallList, frozen]);

  useEffect(() => {
    if (paused || frozen || isSmallList || repeatedData.length === 0) return;

    const timer = setInterval(() => {
      const halfWidth = contentWidthRef.current / 2;
      if (halfWidth > 0) {
        offsetRef.current += 1.5;
        if (offsetRef.current >= halfWidth) offsetRef.current -= halfWidth;
        scrollRef.current?.scrollTo({ x: offsetRef.current, animated: false });
      }
    }, 50);

    return () => clearInterval(timer);
  }, [paused, frozen, repeatedData, isSmallList]);

  const pause = () => { if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current); setPaused(true); };
  const resumeLater = () => { if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current); resumeTimerRef.current = setTimeout(() => setPaused(false), 2500); };

  if (transactions.length === 0) return null;

  return (
    <ScrollView
      ref={scrollRef} horizontal showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      onTouchStart={pause} onTouchEnd={resumeLater} onScrollBeginDrag={pause} onMomentumScrollEnd={resumeLater}
      onScroll={(e) => { if (paused) offsetRef.current = e.nativeEvent.contentOffset.x; }}
      onContentSizeChange={(w) => { contentWidthRef.current = w; }}
      contentContainerStyle={styles.transactionScroll}
    >
      {repeatedData.map((transaction, index) => (
        <View key={`${transaction.id}-${index}`} style={styles.transactionChip}>
          <View style={styles.transactionAvatar}><Text style={styles.transactionAvatarText}>{transaction.name.charAt(0).toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.transactionName} numberOfLines={1}>{transaction.name}</Text>
            <Text style={styles.transactionTime} numberOfLines={1}>{timeAgo(transaction.date)}</Text>
          </View>
          <Text style={styles.transactionAmount}>₹{transaction.amount.toLocaleString('en-IN')}</Text>
        </View>
      ))}
    </ScrollView>
  );
});

export const AppealCardItem: React.FC<{ item: AppealCase; onDonate: (i: AppealCase) => void; onVideo: (i: AppealCase) => void; onProof: (i: AppealCase) => void; refreshKey?: number; }> = React.memo(({ item, onDonate, onVideo, onProof, refreshKey = 0 }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const remainingSeconds = useMemo(() => getRemainingSeconds(item), [item.createdAt, item.durationSeconds]);
  const [expired, setExpired] = useState(Boolean(item.isCompleted || remainingSeconds <= 0));

  useEffect(() => {
    if (item.isCompleted) setExpired(true);
  }, [item.isCompleted]);

  useEffect(() => {
    let mounted = true;
    fetchCaseTransactions(item.id, 10).then((res) => {
      if (mounted) setTransactions(res);
    });
    return () => { mounted = false; };
  }, [item.id, refreshKey]);

  const thumbUrl = item.videoUrl ? getYouTubeThumbnail(item.videoUrl, 'high') : item.thumbnailUrl;

  return (
    <View style={[styles.card, expired && styles.cardDone]}>
      <Pressable onPress={() => onVideo(item)} style={styles.heroPressable}>
        <Image source={{ uri: thumbUrl || '' }} style={styles.heroImage} resizeMode="cover" />
        <LinearGradient colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.55)']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFillObject} />
        <View style={styles.heroTopRow}>
          <View style={styles.caseBadge}><Text style={styles.caseBadgeText}>{displayCaseId(item.id)}</Text></View>
          {expired && <View style={styles.completedBadge}><Ionicons name="checkmark-circle" size={13} color="#FFFFFF" /><Text style={styles.completedText}>Completed</Text></View>}
        </View>
        <View style={styles.videoButton}><Ionicons name="play" size={12} color="#FFFFFF" /><Text style={styles.videoButtonText}>Video જુઓ</Text></View>
      </Pressable>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <View style={styles.locationBox}><Ionicons name="location-outline" size={13} color="#6E8792" /><Text style={styles.locationText} numberOfLines={1}>{item.location}</Text></View>
        </View>
        {!!item.subtitle && <Text style={styles.subtitle} numberOfLines={2}>{item.subtitle}</Text>}

        <CountdownTimer durationSeconds={remainingSeconds} isCompleted={item.isCompleted} onExpired={() => setExpired(true)} />

        <View style={styles.moneyActionRow}>
          <View style={styles.moneyBlock}><Text style={styles.moneyCaption}>{expired ? 'કુલ મળેલી મદદ' : 'અત્યાર સુધી મદદ'}</Text><Text style={[styles.moneyAmount, expired && styles.moneyAmountDone]}>{formatMoney(item.raisedAmount)}</Text></View>
          <View style={styles.actions}>
            <Pressable disabled={expired} onPress={() => onDonate(item)} style={[styles.donateButton, expired && styles.donateDisabled]}>
              <Text style={[styles.donateSymbol, expired && styles.donateDisabledText]}>₹</Text>
              <Text style={[styles.donateText, expired && styles.donateDisabledText]}>દાન</Text>
            </Pressable>
            <Pressable onPress={() => onProof(item)} style={[styles.proofButton, expired ? styles.proofButtonActive : styles.proofButtonDisabled]}>
              {expired && <LinearGradient colors={['#149182', '#0A5F55']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />}
              <Ionicons name={expired ? 'shield-checkmark' : 'lock-closed-outline'} size={15} color={expired ? '#FFFFFF' : COLORS.disabledText} />
              <Text style={[styles.proofButtonText, expired ? styles.proofButtonActiveText : styles.proofButtonDisabledText]}>Proof</Text>
            </Pressable>
          </View>
        </View>

        {transactions.length > 0 && (
          <View style={styles.transactionSection}>
            <View style={styles.transactionHeader}>
              <View style={styles.transactionTitleRow}><Ionicons name="swap-horizontal-outline" size={14} color="#66818D" /><Text style={styles.transactionTitle}>આ મદદમાં જોડાયેલા</Text></View>
              <Text style={styles.transactionCount}>{transactions.length}</Text>
            </View>
            <DonorAutoSlider transactions={transactions} frozen={expired} />
          </View>
        )}
      </View>
    </View>
  );
});

const VideoDonationCard: React.FC<VideoDonationCardProps> = ({ cases: suppliedCases }) => {
  const [cases, setCases] = useState<AppealCase[]>(suppliedCases || []);
  const [loading, setLoading] = useState(!suppliedCases);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [selectedCase, setSelectedCase] = useState<AppealCase | null>(null);
  const [donationVisible, setDonationVisible] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [proofVisible, setProofVisible] = useState(false);
  const [proofCase, setProofCase] = useState<AppealCase | null>(null);
  const [proofCanUpload, setProofCanUpload] = useState(false);

  const loadPage = useCallback(async (pageNum: number) => {
    if (isLoadingMore || (!hasMore && pageNum > 0)) return;
    if (pageNum > 0) setIsLoadingMore(true);

    const res = await fetchAppealCases(pageNum, 10);

    if (pageNum === 0) {
      setCases(res);
      setPage(0);
    } else {
      setCases(prev => [...prev, ...res]);
      setPage(pageNum);
    }
    setHasMore(res.length === 10);

    setIsLoadingMore(false);
    setLoading(false);
  }, [isLoadingMore, hasMore]);

  useEffect(() => {
    if (suppliedCases) return;
    loadPage(0);
  }, [suppliedCases, loadPage]);

  // ---------- LIVE UPDATE: amount + transactions ----------
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const silentRefresh = useCallback(async () => {
    const fresh = await fetchAppealCases(0, 10);
    if (fresh.length > 0) {
      setCases((prev) => {
        const map = new Map(fresh.map((c) => [c.id, c]));
        const known = new Set(prev.map((c) => c.id));
        const added = fresh.filter((c) => !known.has(c.id));
        return [...added, ...prev.map((c) => map.get(c.id) || c)];
      });
    }
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (suppliedCases) return;
    const unsub = subscribeLiveDonations(() => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(silentRefresh, 600);
    });
    // realtime na chale to backup: darek 12 sec e chupchap refresh
    const poll = setInterval(() => { if (!isLiveHealthy()) silentRefresh(); }, 12000);
    return () => {
      unsub();
      clearInterval(poll);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [suppliedCases, silentRefresh]);

  const Header = (
    <View style={styles.sectionHeaderWrapper}>
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.sectionTitleRow}><View style={styles.sectionDot} /><Text style={styles.sectionTitle}>તાત્કાલિક મદદ</Text></View>
        <Text style={styles.sectionSubtitle}>જરૂરિયાતમંદ પરિવાર સુધી સીધી મદદ</Text>
      </View>
      <Pressable style={styles.liveHelpButton}>
        <LinearGradient colors={['#149182', '#0A5F55']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.liveHelpGradient}>
          <View style={styles.liveHelpDot} /><Text style={styles.liveHelpText}>LIVE HELP</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );

  if (loading) {
    return <View style={styles.container}><View style={styles.loadingContent}>{Header}<ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} /></View></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cases}
        extraData={refreshKey}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
        ListHeaderComponent={Header}
        onEndReached={() => loadPage(page + 1)}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
          ) : !hasMore && cases.length > 0 ? (
            <View style={styles.footerContainer}><View style={styles.footerLine} /><Text style={styles.footerText}>તમે બધી જ અપીલ જોઈ લીધી છે</Text></View>
          ) : null
        }
        renderItem={({ item }) => (
          <AppealCardItem
            item={item}
            refreshKey={refreshKey}
            onDonate={(i) => { setSelectedCase(i); setDonationVisible(true); }}
            onVideo={(i) => { if (!i.videoUrl) return Alert.alert('Video ઉપલબ્ધ નથી'); setVideoUrl(i.videoUrl); setVideoVisible(true); }}
            onProof={(i) => { setProofCase(i); setProofCanUpload(Boolean(i.isCompleted) || getRemainingSeconds(i) <= 0); setProofVisible(true); }}
          />
        )}
      />

      <YouTubeVideoModal visible={videoVisible} url={videoUrl} onClose={() => { setVideoVisible(false); setVideoUrl(''); }} />
      <ProofModal visible={proofVisible} item={proofCase} canUpload={proofCanUpload} onClose={() => { setProofVisible(false); setProofCase(null); }} />
      {selectedCase && (
        <DonationModal
          visible={donationVisible}
          onClose={() => { setDonationVisible(false); setSelectedCase(null); setTimeout(silentRefresh, 1200); }}
          caseTitle={selectedCase.title}
          caseId={selectedCase.id}
          beneficiaryUpiId={selectedCase.upiId}
          beneficiaryName={selectedCase.payeeName}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', alignSelf: 'stretch', backgroundColor: COLORS.bg },
  loadingContent: { paddingHorizontal: 4, paddingTop: 4 },
  flatListContent: { paddingHorizontal: 4, paddingTop: 4, paddingBottom: 20 },
  sectionHeaderWrapper: { width: '97%', alignSelf: 'center', marginTop: 12, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  sectionHeaderLeft: { flex: 1, paddingRight: 10 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginRight: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#10302B', letterSpacing: -0.3 },
  sectionSubtitle: { marginTop: 5, fontSize: 11, color: '#6F8782', fontWeight: '500' },
  liveHelpButton: { borderRadius: 22, overflow: 'hidden', elevation: 4 },
  liveHelpGradient: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  liveHelpDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#FFFFFF', marginRight: 7 },
  liveHelpText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, color: '#FFFFFF' },
  card: { width: '100%', alignSelf: 'stretch', marginBottom: 13, borderRadius: 17, backgroundColor: COLORS.white, overflow: 'hidden', borderWidth: 1, borderColor: '#E1EBE8', elevation: 3 },
  heroPressable: { width: '100%', height: 178, overflow: 'hidden', position: 'relative', backgroundColor: '#E2F0ED' },
  heroImage: { width: '100%', height: '100%' },
  heroTopRow: { position: 'absolute', top: 11, left: 11, right: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  caseBadge: { paddingHorizontal: 10, height: 27, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center' },
  caseBadgeText: { fontSize: 10, fontWeight: '700', color: '#10302B', letterSpacing: 0.4 },
  completedBadge: { height: 27, paddingHorizontal: 9, borderRadius: 14, backgroundColor: 'rgba(14,123,110,0.92)', flexDirection: 'row', alignItems: 'center' },
  completedText: { marginLeft: 4, fontSize: 9, fontWeight: '600', color: '#FFFFFF' },
  videoButton: { position: 'absolute', right: 11, bottom: 11, height: 32, paddingHorizontal: 11, borderRadius: 16, backgroundColor: 'rgba(16,48,43,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', flexDirection: 'row', alignItems: 'center' },
  videoButtonText: { marginLeft: 5, fontSize: 10, fontWeight: '600', color: '#FFFFFF' },
  body: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10 },
  titleRow: { width: '100%', minHeight: 26, flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1, fontSize: 14, lineHeight: 19, fontWeight: '600', color: '#10302B', letterSpacing: -0.1 },
  subtitle: { marginTop: 3, fontSize: 10, lineHeight: 15, color: '#6F8782' },
  locationBox: { maxWidth: 105, marginLeft: 8, paddingLeft: 7, flexDirection: 'row', alignItems: 'center' },
  locationText: { marginLeft: 3, fontSize: 10, color: '#6F8782' },
  timerWrap: { marginTop: 8, padding: 9, borderRadius: 15, backgroundColor: '#F6F9F8', borderWidth: 1, borderColor: '#E1EBE8' },
  timerHeadingRow: { minHeight: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  timerHeadingLeft: { flexDirection: 'row', alignItems: 'center' },
  timerClockIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E2F0ED', alignItems: 'center', justifyContent: 'center' },
  timerHeading: { marginLeft: 8, fontSize: 11, fontWeight: '500', color: '#6F8782' },
  liveBadge: { height: 22, paddingHorizontal: 7, borderRadius: 11, backgroundColor: '#E2F0ED', flexDirection: 'row', alignItems: 'center' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#0E7B6E' },
  liveSmall: { marginLeft: 4, fontSize: 8, fontWeight: '600', letterSpacing: 0.8, color: '#6F8782' },
  cardDone: { borderColor: '#0E7B6E', borderWidth: 1.5, backgroundColor: '#F4FBF9', elevation: 5 },
  timerWrapDone: { backgroundColor: '#0E7B6E', borderColor: '#0A5F55', overflow: 'hidden' },
  timerClockIconDone: { backgroundColor: 'rgba(255,255,255,0.2)' },
  timerHeadingDone: { color: '#FFFFFF', fontWeight: '700' },
  timeCellDone: { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.28)', elevation: 0 },
  timeNumberDone: { color: '#FFFFFF' },
  timeLabelDone: { color: 'rgba(255,255,255,0.75)' },
  moneyAmountDone: { color: '#0E7B6E' },
  timeRow: { width: '100%', flexDirection: 'row', gap: 6 },
  timeCell: { flex: 1, minHeight: 48, borderRadius: 11, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E1EBE8', alignItems: 'center', justifyContent: 'center', elevation: 1 },
  timeNumber: { fontSize: 19, lineHeight: 22, fontWeight: '600', color: '#10302B', letterSpacing: -0.3 },
  timeLabel: { marginTop: 2, fontSize: 8, fontWeight: '500', color: '#6F8782' },
  moneyActionRow: { marginTop: 9, minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  moneyBlock: { flex: 1, paddingRight: 8 },
  moneyCaption: { fontSize: 9, color: '#6F8782' },
  moneyAmount: { marginTop: 1, fontSize: 17, fontWeight: '600', color: '#10302B', letterSpacing: -0.2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  donateButton: { height: 40, minWidth: 76, paddingHorizontal: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  donateSymbol: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  donateText: { marginLeft: 4, fontSize: 11, fontWeight: '600', color: '#FFFFFF' },
  donateDisabled: { backgroundColor: '#E9F0ED' },
  donateDisabledText: { color: '#9BAAB0' },
  proofButton: { height: 40, minWidth: 82, paddingHorizontal: 13, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden' },
  proofButtonActive: { backgroundColor: '#0E7B6E', borderColor: '#0A5F55', elevation: 5, shadowColor: '#0E7B6E', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  proofButtonActiveText: { color: '#FFFFFF', fontWeight: '700' },
  proofButtonDisabled: { backgroundColor: '#F6F9F8', borderColor: '#E1EBE8' },
  proofButtonText: { marginLeft: 5, fontSize: 11, fontWeight: '600', color: '#4F7169' },
  proofButtonDisabledText: { color: '#A2AFB4' },
  transactionSection: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E1EBE8' },
  transactionHeader: { height: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  transactionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  transactionTitle: { marginLeft: 5, fontSize: 9, fontWeight: '500', color: '#6F8782' },
  transactionCount: { minWidth: 19, height: 19, paddingHorizontal: 5, borderRadius: 10, backgroundColor: '#E2F0ED', textAlign: 'center', textAlignVertical: 'center', fontSize: 8, fontWeight: '600', color: '#0E7B6E', overflow: 'hidden' },
  transactionScroll: { paddingTop: 6, paddingBottom: 1, paddingRight: 5, gap: 6 },
  transactionChip: { width: 145, minHeight: 45, paddingHorizontal: 7, paddingVertical: 6, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E1EBE8', flexDirection: 'row', alignItems: 'center' },
  transactionAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E2F0ED', alignItems: 'center', justifyContent: 'center', marginRight: 7 },
  transactionAvatarText: { fontSize: 10, fontWeight: '600', color: '#0E7B6E' },
  transactionName: { fontSize: 9.5, fontWeight: '500', color: '#10302B' },
  transactionTime: { marginTop: 1, fontSize: 7.5, color: '#6F8782' },
  transactionAmount: { marginLeft: 4, fontSize: 10, fontWeight: '600', color: '#0E7B6E' },
  videoModal: { flex: 1, backgroundColor: '#000000' },
  webview: { flex: 1, backgroundColor: '#000000' },
  videoLoading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000' },
  videoClose: { position: 'absolute', top: Platform.OS === 'ios' ? 52 : 25, right: 16, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.68)', alignItems: 'center', justifyContent: 'center', zIndex: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(16,48,43,0.45)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  proofModal: { width: '100%', maxWidth: 420, borderRadius: 24, backgroundColor: '#FFFFFF', padding: 18 },
  proofTop: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  proofIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E2F0ED', alignItems: 'center', justifyContent: 'center' },
  modalClose: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#E9F0ED', alignItems: 'center', justifyContent: 'center' },
  proofTitle: { marginTop: 10, fontSize: 20, lineHeight: 27, fontWeight: '800', color: '#10302B', letterSpacing: -0.2 },
  proofMainText: { marginTop: 8, fontSize: 12, lineHeight: 19, color: '#6F8782' },
  proofVerified: { marginTop: 14, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 24, borderRadius: 12, backgroundColor: '#E2F0ED' },
  proofVerifiedText: { fontSize: 10, fontWeight: '700', color: '#0E7B6E' },
  proofStoryCard: { marginTop: 12, flexDirection: 'row', borderRadius: 16, backgroundColor: '#F6F9F8', borderWidth: 1, borderColor: '#E1EBE8', overflow: 'hidden' },
  proofStoryAccent: { width: 4, backgroundColor: '#0E7B6E' },
  proofStoryText: { flex: 1, padding: 14, fontSize: 13, lineHeight: 21, color: '#33504A' },
  proofDoneButton: { marginTop: 16, height: 43, borderRadius: 14, backgroundColor: '#E2F0ED', alignItems: 'center', justifyContent: 'center' },
  proofDoneText: { fontSize: 11, fontWeight: '600', color: '#0E7B6E' },
  proofHint: { marginTop: 14, fontSize: 11, fontWeight: '600', color: '#6F8782', textAlign: 'center' },
  proofMediaRow: { marginTop: 10, flexDirection: 'row', justifyContent: 'center', gap: 14 },
  proofMediaBtn: { flex: 1, maxWidth: 130, paddingVertical: 14, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E1EBE8', alignItems: 'center' },
  proofMediaIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  proofMediaText: { marginTop: 8, fontSize: 11, fontWeight: '600', color: '#10302B' },
  photoViewer: { flex: 1, backgroundColor: '#000000' },
  photoViewerImage: { flex: 1, width: '100%' },
  footerContainer: { paddingVertical: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  footerLine: { width: 40, height: 3, backgroundColor: '#D3E0DC', borderRadius: 2, marginBottom: 10 },
  footerText: { fontSize: 11, fontWeight: '600', color: '#6F8782', letterSpacing: 0.5 },
});

export default VideoDonationCard;
