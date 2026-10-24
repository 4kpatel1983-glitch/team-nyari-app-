// src/components/HomeComponents.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Donor } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HOME_CONTENT_PADDING = 14;
const SLIDE_WIDTH = SCREEN_WIDTH - HOME_CONTENT_PADDING * 2;
const H_PADDING = 4;

const STATUSBAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 48;

const C = {
  ink: '#34434A',
  muted: '#78878C',
  teal: '#16877E',
  tealDark: '#11665F',
  tealPale: '#EAF5F3',
  white: '#FFFFFF',
  pearl: '#F7F9F9',
  grey: '#EEF1F2',
  border: '#E0E6E8',
  green: '#219873',
  red: '#EF4444',
  darkGreen: '#0E7B6E',
};

type SponsorFields = Donor & {
  mobile?: string;
  note?: string;
  photo_url?: string;
  phone?: string;
  location?: string;
  avatar?: string;
  rank?: number;
  date?: string;
};

const formatMoney = (amount: number) =>
  Number(amount || 0).toLocaleString('en-IN');

const formatGujaratiDate = (dateStr?: string) => {
  if (!dateStr) return '—';

  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;

  const months = [
    'જાન્યુ', 'ફેબ્રુ', 'માર્ચ', 'એપ્રિલ',
    'મે', 'જૂન', 'જુલાઈ', 'ઑગસ્ટ',
    'સપ્ટે', 'ઑક્ટો', 'નવે', 'ડિસે',
  ];

  return `${parsed.getDate()} ${months[parsed.getMonth()]} ${parsed.getFullYear()}`;
};

const maskPhone = (phone?: string) => {
  if (!phone) return 'મોબાઇલ ઉપલબ્ધ નથી';

  const chars = String(phone).split('');
  let hidden = 0;

  for (let i = chars.length - 1; i >= 0 && hidden < 2; i--) {
    if (/\d/.test(chars[i])) {
      chars[i] = 'X';
      hidden++;
    }
  }

  return chars.join('');
};

const getName = (item: SponsorFields) => item.name || 'દાનવીર';
const getLocation = (item: SponsorFields) =>
  item.location || item.note || 'ગુજરાત';
const getPhone = (item: SponsorFields) => item.phone || item.mobile || '';
const getPhoto = (item: SponsorFields) => item.avatar || item.photo_url || '';

/* બધા કાર્ડ માટે સતત પ્રીમિયમ એનિમેશન */
const BubbleDecoration = ({ rank = 1 }: { rank?: number }) => {
  const twinkle = useRef(new Animated.Value(0.4)).current;
  const float = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sparkleAnimation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(twinkle, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(float, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(twinkle, {
            toValue: 0.35,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(float, {
            toValue: 0,
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    const rotationAnimation = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 7000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    sparkleAnimation.start();
    rotationAnimation.start();

    return () => {
      sparkleAnimation.stop();
      rotationAnimation.stop();
    };
  }, [twinkle, float, rotate]);

  const sparkleStyle = (right: number, top: number, size: number) => ({
    position: 'absolute' as const,
    right,
    top,
    fontSize: size,
    opacity: twinkle,
    transform: [
      {
        scale: twinkle.interpolate({
          inputRange: [0.35, 1],
          outputRange: [0.75, 1.18],
        }),
      },
      {
        translateY: float.interpolate({
          inputRange: [0, 1],
          outputRange: [4, -5],
        }),
      },
    ],
  });

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Bubble decorations */}
      <View
        style={[
          styles.bubbleLarge,
          rank === 1 && styles.greyBubble,
          rank === 2 && styles.starBubble,
          rank === 3 && styles.luxeBubble,
        ]}
      />
      <View style={styles.bubbleSmall} />
      <View style={styles.bubbleOutline} />
      <View style={styles.bubbleAccent} />
      <View style={styles.bottomBubbleLarge} />
      <View style={styles.bottomBubbleSmall} />
      <View style={styles.bottomBubbleOutline} />
      <View style={styles.bottomBubbleAccent} />

      <Animated.View
        style={[styles.orbitRing, { transform: [{ rotate: rotation }] }]}
      />

      {/* TOP-MIDDLE BLANK ZONE (rank pill ↔ date chip) */}
      <Animated.Text style={[styles.sparkleOne, sparkleStyle(195, 18, 15)]}>
        ✦
      </Animated.Text>
      <Animated.Text style={[styles.sparkleTwo, sparkleStyle(125, 32, 12)]}>
        ✧
      </Animated.Text>
      <Animated.Text style={[styles.flowerOne, sparkleStyle(210, 40, 9)]}>
        ✿
      </Animated.Text>

      {/* TOP PADDING CORNERS (above rank pill / above date chip) */}
      <Animated.Text style={[styles.sparkleThree, sparkleStyle(322, 1, 10)]}>
        ✦
      </Animated.Text>
      <Animated.Text style={[styles.sparkleTwo, sparkleStyle(6, 1, 11)]}>
        ✧
      </Animated.Text>

      {/* TOP PADDING CENTER (very thin strip) */}
      <Animated.Text style={[styles.sparkleThree, sparkleStyle(155, 2, 9)]}>
        ✧
      </Animated.Text>

      {/* BOTTOM-LEFT BLANK (below photo card, above footer) */}
      <Animated.Text style={[styles.flowerTwo, sparkleStyle(280, 193, 12)]}>
        ✿
      </Animated.Text>
      <Animated.Text style={[styles.flowerOne, sparkleStyle(315, 214, 10)]}>
        ❀
      </Animated.Text>

      {/* BOTTOM PADDING (below footer text) */}
      <Animated.Text style={[styles.flowerOne, sparkleStyle(50, 250, 10)]}>
        ❋
      </Animated.Text>
      <Animated.Text style={[styles.sparkleOne, sparkleStyle(120, 251, 9)]}>
        ✦
      </Animated.Text>

      {rank === 3 && (
        <>
          <View style={styles.luxeRingOne} />
          <View style={styles.luxeRingTwo} />
          <View style={styles.luxeDotOne} />
          <View style={styles.luxeDotTwo} />
          <View style={styles.luxeLine} />
        </>
      )}
    </View>
  );
};

/* હેડર */
export const Header = () => (
  <View style={[styles.header, { paddingTop: STATUSBAR_HEIGHT + 8 }]}>
    <LinearGradient
      colors={['#0D9488', '#14B8A6', '#0F766E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.logoGradient}
    >
      <View style={styles.brandBlock}>
        <Text style={styles.headerTitle}>TEAM NYARI</Text>
        <View style={styles.headerSubtitleRow}>
          <Text style={styles.headerSubtitle}>દિલથી</Text>
          <Ionicons
            name="heart"
            size={10}
            color={C.red}
            style={{ marginHorizontal: 3 }}
          />
          <Text style={styles.headerSubtitle}>આપેલું દાન • સીધી મદદ</Text>
        </View>
      </View>
    </LinearGradient>
    <TouchableOpacity activeOpacity={0.75} style={styles.bellBtn}>
      <Ionicons name="notifications-outline" size={22} color={C.ink} />
      <View style={styles.redDot} />
    </TouchableOpacity>
  </View>
);

/* ટોપ દાનવીરો અને સ્પોન્સર સ્લાઇડર */
export const TopDonorsSlider = ({
  donors,
  variant,
}: {
  donors: Donor[];
  variant?: 'sponsor' | 'donor';
}) => {
  const isSponsor = variant === 'sponsor';
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList | null>(null);

  useEffect(() => {
    if (!donors || donors.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex(current => {
        const next = (current + 1) % donors.length;
        flatListRef.current?.scrollToIndex({
          index: next,
          animated: true,
        });
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [donors]);

  useEffect(() => {
    if (activeIndex >= donors.length) setActiveIndex(0);
  }, [activeIndex, donors.length]);

  if (!donors || donors.length === 0) return null;

  const renderCard = ({ item: rawItem }: { item: Donor }) => {
    const item = rawItem as SponsorFields;
    const rank = item.rank || 1;
    const isFirst = rank === 1;
    const photo = getPhoto(item);
    const location = getLocation(item);
    const phone = getPhone(item);

    const cardColors: [string, string, ...string[]] =
      rank === 1
        ? ['#E1E4E7', '#D5D9DE', '#C9CFD5']
        : rank % 4 === 2
        ? ['#FFFFFF', '#F0F7F7', '#E0EFED']
        : rank % 4 === 3
        ? ['#FFFFFF', '#F5F0F7', '#EDE5F0']
        : rank % 4 === 0
        ? ['#FFFFFF', '#F7F4EB', '#EEE8D8']
        : ['#FFFFFF', '#EFF3F8', '#E4EAF2'];

    return (
      <View style={styles.slide}>
        <View style={styles.cardShadow}>
          <View style={styles.cardClip}>
            <LinearGradient
              colors={cardColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <BubbleDecoration rank={rank} />

            <View style={styles.cardTopRow}>
              <View
                style={[
                  styles.rankPill,
                  isFirst && styles.rankPillFirst,
                ]}
              >
                <Ionicons
                  name={isSponsor ? 'ribbon-outline' : 'heart-outline'}
                  size={13}
                  color={isFirst ? '#FFFFFF' : C.teal}
                />
                <Text
                  style={[
                    styles.rankPillText,
                    isFirst && styles.rankPillTextFirst,
                  ]}
                >
                  {isSponsor
                    ? isFirst
                      ? 'TOP SPONSOR'
                      : `SPONSOR #${rank}`
                    : isFirst
                    ? 'TOP DONOR'
                    : `DONOR #${rank}`}
                </Text>
              </View>
              <View style={styles.dateChip}>
                <Ionicons name="calendar-outline" size={12} color={C.muted} />
                <Text style={styles.dateText}>
                  {formatGujaratiDate(item.date)}
                </Text>
              </View>
            </View>

            <View style={styles.cardMainRow}>
              <View style={styles.photoArea}>
                <View
                  style={[
                    styles.photoRing,
                    isFirst && styles.photoRingFirst,
                  ]}
                >
                  {photo ? (
                    <Image
                      source={{ uri: photo }}
                      style={styles.personPhoto}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.photoFallback}>
                      <Ionicons
                        name="person-outline"
                        size={34}
                        color="#91A6A8"
                      />
                    </View>
                  )}
                </View>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
                <View style={styles.photoRankBubble}>
                  <Text style={styles.photoRankText}>
                    #{String(rank).padStart(2, '0')}
                  </Text>
                </View>
              </View>

              <View style={styles.personInfo}>
                <Text style={styles.personName} numberOfLines={2}>
                  {getName(item)}
                </Text>

                <View style={styles.locationRow}>
                  <View style={styles.metaIconBubble}>
                    <Ionicons name="location-outline" size={13} color={C.teal} />
                  </View>
                  <Text style={styles.locationText} numberOfLines={2}>
                    {location}
                  </Text>
                </View>

                <View style={styles.phoneRow}>
                  <View style={styles.metaIconBubble}>
                    <Ionicons name="call-outline" size={12} color={C.muted} />
                  </View>
                  <Text style={styles.phoneText} numberOfLines={1}>
                    {maskPhone(phone)}
                  </Text>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={13}
                    color={C.teal}
                  />
                </View>

                <View
                  style={[
                    styles.sponsorAmountBox,
                    isSponsor && styles.sponsorAmountBoxPremium,
                  ]}
                >
                  <View style={styles.sponsorAmountLabelRow}>
                    <View
                      style={[
                        styles.amountMiniBubble,
                        isSponsor && styles.amountMiniBubblePremium,
                      ]}
                    >
                      <Ionicons
                        name="wallet-outline"
                        size={13}
                        color={isSponsor ? '#414B4E' : C.teal}
                      />
                    </View>
                    <Text
                      style={[
                        styles.sponsorAmountLabel,
                        isSponsor && styles.sponsorAmountLabelPremium,
                      ]}
                    >
                      {isSponsor ? 'સહયોગ રકમ' : 'કુલ દાન'}
                    </Text>
                  </View>
                  <View style={styles.amountNumberRow}>
                    <Text
                      style={[
                        styles.rupeeSymbol,
                        isSponsor && styles.amountTextPremium,
                      ]}
                    >
                      ₹
                    </Text>
                    <Text
                      style={[
                        styles.amountNumber,
                        isSponsor && styles.amountTextPremium,
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {formatMoney(item.amount)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.sponsorCardFooter}>
              <View style={styles.sponsorFooterLine} />
              <View style={styles.footerHeart}>
                <Ionicons name="heart" size={11} color={C.teal} />
              </View>
              <Text style={styles.sponsorFooterText}>
                TEAM NYARI • સીધી મદદ
              </Text>
              <View style={styles.sponsorFooterLine} />
            </View>
          </View>
        </View>
      </View>
    );
  };

  const handleScroll = (event: any) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / SLIDE_WIDTH,
    );

    if (index >= 0 && index < donors.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={donors}
        renderItem={renderCard}
        keyExtractor={(item, index) =>
          String((item as SponsorFields).id || `${index}`)
        }
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: SLIDE_WIDTH,
          offset: SLIDE_WIDTH * index,
          index,
        })}
        onScrollToIndexFailed={({ index }) => {
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({
              offset: index * SLIDE_WIDTH,
              animated: true,
            });
          }, 300);
        }}
      />

      <View style={styles.paginationDots}>
        {donors.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

type LiveDonationProps = {
  totalAmount?: number;
  totalDonations?: number;
};

/* લાઇવ દાન સારાંશ */
export const LiveDonationBanner = ({
  totalAmount = 0,
  totalDonations = 0,
}: LiveDonationProps) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <View style={styles.donationSection}>
      <View style={styles.summaryShadow}>
        <View style={styles.donationSummary}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryHeaderLeft}>
              <View style={styles.summaryIcon}>
                <MaterialCommunityIcons
                  name="hand-heart"
                  size={18}
                  color="#168575"
                />
              </View>
              <View>
                <Text style={styles.summaryEyebrow}>TEAM NYARI</Text>
                <Text style={styles.summaryTitle}>દાનની સફર</Text>
              </View>
            </View>

            <View style={styles.summaryLive}>
              <Animated.View
                style={[
                  styles.summaryLiveDot,
                  { transform: [{ scale: pulse }] },
                ]}
              />
              <Text style={styles.summaryLiveText}>LIVE</Text>
            </View>
          </View>

          <View style={styles.amountRow}>
            <View style={styles.amountCard}>
              <View style={styles.amountTopRow}>
                <View style={styles.amountIcon}>
                  <Ionicons name="wallet-outline" size={13} color="#168575" />
                </View>
                <Text style={styles.amountLabel}>કુલ પ્રાપ્ત રકમ</Text>
              </View>
              <Text style={styles.amountValue}>₹{formatMoney(totalAmount)}</Text>
              <View style={styles.amountBottom}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={12}
                  color="#168575"
                />
                <Text style={styles.amountHint}>અત્યાર સુધી</Text>
              </View>
            </View>

            <View style={styles.amountCard}>
              <View style={styles.amountTopRow}>
                <View style={styles.amountIcon}>
                  <Ionicons name="receipt-outline" size={13} color="#168575" />
                </View>
                <Text style={styles.amountLabel}>કુલ દાન</Text>
              </View>
              <Text style={styles.amountValueBig}>
                {formatMoney(totalDonations)}
              </Text>
              <View style={styles.amountBottom}>
                <Ionicons name="heart-outline" size={12} color="#168575" />
                <Text style={styles.amountHint}>થયેલા છે</Text>
              </View>
            </View>
          </View>

          <View style={styles.summaryFooter}>
            <View style={styles.footerLeft}>
              <Ionicons
                name="shield-checkmark-outline"
                size={13}
                color="#168575"
              />
              <Text style={styles.donationFooterText}>
                પારદર્શક રીતે જરૂરિયાતમંદ પરિવાર સુધી
              </Text>
            </View>
            <Text style={styles.footerTrust}>100% TRUST</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    minHeight: 92,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 11,
    backgroundColor: '#FAFCFC',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F2',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 17,
    marginRight: 11,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D5EFEB',
    elevation: 5,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 7,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoHeart: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandBlock: { justifyContent: 'center' },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.ink,
    letterSpacing: 0.7,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#718087',
    fontWeight: '500',
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6EAEC',
    elevation: 2,
    shadowColor: '#172033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },
  redDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.red,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  slide: { width: SLIDE_WIDTH, paddingHorizontal: H_PADDING },
  cardShadow: {
    elevation: 6,
    shadowColor: '#50696C',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 13,
  },
  cardClip: {
    minHeight: 238,
    borderRadius: 25,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D7E5E4',
    overflow: 'hidden',
    backgroundColor: '#F7F9F9',
  },
  bubbleLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bubbleLarge: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -65,
    top: 45,
    backgroundColor: 'rgba(22,135,126,0.055)',
  },
  bubbleSmall: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    right: 23,
    top: -24,
    backgroundColor: 'rgba(130,151,158,0.12)',
  },
  bubbleOutline: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    right: -26,
    bottom: -40,
    borderWidth: 1.2,
    borderColor: 'rgba(22,135,126,0.14)',
  },
  bubbleAccent: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    top: 88,
    right: 29,
    backgroundColor: 'rgba(22,135,126,0.16)',
  },
  greyBubble: { backgroundColor: 'rgba(100,116,139,0.09)' },
  starBubble: { backgroundColor: 'rgba(125,180,190,0.09)' },
  luxeBubble: { backgroundColor: 'rgba(15,118,110,0.07)' },

  bottomBubbleLarge: {
    position: 'absolute',
    width: 125,
    height: 125,
    borderRadius: 63,
    left: -52,
    bottom: -70,
    backgroundColor: 'rgba(22,135,126,0.075)',
  },
  bottomBubbleSmall: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    left: 42,
    bottom: -30,
    backgroundColor: 'rgba(181,160,112,0.10)',
  },
  bottomBubbleOutline: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    left: 5,
    bottom: -65,
    borderWidth: 1,
    borderColor: 'rgba(22,135,126,0.19)',
  },
  bottomBubbleAccent: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    left: 65,
    bottom: 19,
    backgroundColor: 'rgba(184,154,80,0.4)',
  },
  orbitRing: {
    position: 'absolute',
    width: 155,
    height: 155,
    borderRadius: 78,
    right: -72,
    bottom: -78,
    borderWidth: 1,
    borderColor: 'rgba(22,135,126,0.13)',
    borderStyle: 'dashed',
  },
  sparkleOne: {
    color: '#B89A50',
    fontWeight: '800',
    textShadowColor: 'rgba(184,154,80,0.45)',
    textShadowRadius: 8,
  },
  sparkleTwo: {
    color: '#8BAFB5',
    fontWeight: '800',
    textShadowColor: 'rgba(139,175,181,0.5)',
    textShadowRadius: 7,
  },
  sparkleThree: {
    color: '#D0B66D',
    textShadowColor: 'rgba(208,182,109,0.4)',
    textShadowRadius: 6,
  },
  flowerOne: {
    color: '#86AAA1',
    textShadowColor: 'rgba(134,170,161,0.4)',
    textShadowRadius: 7,
  },
  flowerTwo: {
    color: '#C2A9BC',
    textShadowColor: 'rgba(194,169,188,0.45)',
    textShadowRadius: 7,
  },
  luxeRingOne: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    right: -24,
    top: 54,
    borderWidth: 1,
    borderColor: 'rgba(15,118,110,0.12)',
  },
  luxeRingTwo: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    right: -5,
    top: 72,
    borderWidth: 1,
    borderColor: 'rgba(184,154,80,0.16)',
  },
  luxeDotOne: {
    position: 'absolute',
    right: 38,
    top: 62,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(184,154,80,0.55)',
  },
  luxeDotTwo: {
    position: 'absolute',
    right: 68,
    top: 145,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(15,118,110,0.35)',
  },
  luxeLine: {
    position: 'absolute',
    right: 18,
    top: 168,
    width: 48,
    height: 1,
    backgroundColor: 'rgba(15,118,110,0.14)',
    transform: [{ rotate: '-35deg' }],
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 15,
  },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E6F2F0',
    borderWidth: 1,
    borderColor: '#D2E7E3',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5,
  },
  rankPillFirst: { backgroundColor: '#465B60', borderColor: '#465B60' },
  rankPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: C.teal,
    letterSpacing: 0.55,
  },
  rankPillTextFirst: { color: '#FFFFFF' },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3E8E9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
    flexShrink: 1,
  },
  dateText: { fontSize: 9, fontWeight: '500', color: C.muted },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
  },
  photoArea: { width: 96, position: 'relative' },
  photoRing: {
    width: 92,
    height: 106,
    borderRadius: 23,
    padding: 3,
    backgroundColor: '#D8EAE7',
    borderWidth: 1,
    borderColor: '#C9E0DC',
  },
  photoRingFirst: { backgroundColor: '#D3DBDE', borderColor: '#C6D0D4' },
  personPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#E9EEF0',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  photoFallback: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#E8EFF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    right: -2,
    bottom: 22,
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: C.green,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRankBubble: {
    alignSelf: 'center',
    marginTop: 7,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 4,
    backgroundColor: '#E5ECEE',
    borderWidth: 1,
    borderColor: '#D7E0E2',
  },
  photoRankText: { fontSize: 10, fontWeight: '700', color: '#52656A' },
  personInfo: { flex: 1, minWidth: 0 },
  personName: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '600',
    color: '#35464B',
    marginBottom: 7,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  metaIconBubble: {
    width: 23,
    height: 23,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#E4E9EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    color: '#66777C',
    paddingTop: 2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  phoneText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '500',
    color: '#748287',
    letterSpacing: 0.3,
  },
  sponsorAmountBox: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: '#D5E6E3',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: '#16877E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 1,
  },
  sponsorAmountBoxPremium: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderColor: '#DDE3E4',
    shadowColor: '#263638',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  sponsorAmountLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amountMiniBubble: {
    width: 22,
    height: 22,
    borderRadius: 8,
    backgroundColor: '#E9F4F1',
    borderWidth: 1,
    borderColor: '#D7EAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountMiniBubblePremium: {
    backgroundColor: '#F0F2F2',
    borderColor: '#E0E4E5',
  },
  sponsorAmountLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#687B7D',
  },
  sponsorAmountLabelPremium: { fontWeight: '700', color: '#202729' },
  amountNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  rupeeSymbol: {
    fontSize: 19,
    fontWeight: '500',
    color: '#126F65',
    marginRight: 3,
  },
  amountNumber: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#126F65',
    letterSpacing: 0.15,
  },
  amountTextPremium: { color: '#202729', fontWeight: '800' },
  sponsorCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 13,
    gap: 7,
  },
  sponsorFooterLine: { flex: 1, height: 1, backgroundColor: '#DCE4E5' },
  footerHeart: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E5F1EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sponsorFooterText: {
    fontSize: 9,
    fontWeight: '500',
    color: '#78868A',
    letterSpacing: 0.2,
  },
  paginationDots: {
    height: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  dot: { height: 5, borderRadius: 3, marginHorizontal: 2.5 },
  activeDot: { width: 19, backgroundColor: C.teal },
  inactiveDot: { width: 5, backgroundColor: '#D2D8DC' },

  donationSection: { marginTop: 5, paddingHorizontal: 0 },
  summaryShadow: {
    elevation: 5,
    shadowColor: '#172033',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 7,
  },
  donationSummary: {
    backgroundColor: '#F1F3F3',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#B9DCD5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  summaryHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#E4EFED',
    borderWidth: 1,
    borderColor: '#C8DFDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  summaryEyebrow: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#178477',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#273437',
    marginTop: 1,
  },
  summaryLive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: '#E4EFED',
    borderWidth: 1,
    borderColor: '#C5DDD8',
  },
  summaryLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#168575',
    marginRight: 4,
  },
  summaryLiveText: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.6,
    color: '#16786D',
  },
  amountRow: { flexDirection: 'row', gap: 8 },
  amountCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 8,
    minHeight: 82,
    justifyContent: 'center',
  },
  amountTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  amountIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#D7EAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  amountLabel: {
    flex: 1,
    fontSize: 9,
    fontWeight: '800',
    color: '#5B696B',
    lineHeight: 12,
  },
  amountValue: {
    fontSize: 21,
    fontWeight: '900',
    color: C.darkGreen,
    letterSpacing: 0.2,
    marginTop: 4,
  },
  amountValueBig: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111111',
    letterSpacing: 0.2,
    marginTop: 2,
  },
  amountBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  amountHint: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#778385',
    marginLeft: 3,
  },
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#D5E2E0',
    marginTop: 9,
    paddingTop: 7,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  donationFooterText: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#687577',
    marginLeft: 4,
    flexShrink: 1,
  },
  footerTrust: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.4,
    color: '#168575',
    marginLeft: 6,
  },
});
