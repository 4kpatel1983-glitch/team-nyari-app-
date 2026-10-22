// src/components/PopupModal.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { AppPopup } from "../supabaseClient";

const COLORS = {
  white: "#FFFFFF",
  text: "#17272D",
  muted: "#5F6F73",
  teal: "#0F766E",
  tealDark: "#064E3B",
  tealSoft: "#E6F5F2",
  slate: "#33474D",
  border: "#CFE3DE",
  page: "#F4F8F7",
};

type Props = {
  visible: boolean;
  popup: AppPopup | null;
  onClose: () => void;
};

type PosterFields = {
  layout?: string | null;
  badge_text?: string | null;
  date_text?: string | null;
  person_name?: string | null;
  location?: string | null;
  phone?: string | null;
  rank_text?: string | null;
  amount_label?: string | null;
  amount?: string | null;
  footer_text?: string | null;
};

const PopupModal = ({ visible, popup, onClose }: Props) => {
  const { width, height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [nat, setNat] = useState({ w: 1, h: 1 });

  const imageUrl = (popup?.image_url || "").trim();
  const isPoster = ((popup as (AppPopup & PosterFields) | null)?.layout || "") === "poster";

  useEffect(() => {
    setImgFailed(false);
    setImgLoaded(false);
    if (!imageUrl || isPoster) return;
    let alive = true;
    Image.getSize(
      imageUrl,
      (w, h) => {
        if (alive && w > 0 && h > 0) setNat({ w, h });
      },
      () => {
        if (alive) setImgFailed(true);
      }
    );
    return () => {
      alive = false;
    };
  }, [imageUrl, isPoster]);

  useEffect(() => {
    if (visible && popup) {
      setMounted(true);
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      Animated.timing(progress, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, popup?.id]);

  if (!mounted || !popup) return null;

  const p = popup as AppPopup & PosterFields;
  const title = (p.title || "").trim();
  const message = (p.message || "").trim();
  const buttonText = (p.button_text || "").trim();
  const link = (p.button_link || "").trim();

  const openLink = () => {
    if (link) Linking.openURL(link).catch(() => {});
    onClose();
  };

  const cardStyle = {
    opacity: progress,
    transform: [
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
    ],
  };

  if (isPoster) {
    const maxW = Math.min(width - 32, 420);
    const pad = 16;
    const photoW = Math.round(Math.min(maxW * 0.3, 124));
    const photoH = Math.round(photoW * 1.18);

    const badge = (p.badge_text || "").trim();
    const dateText = (p.date_text || "").trim();
    const name = (p.person_name || "").trim();
    const location = (p.location || "").trim();
    const phone = (p.phone || "").trim();
    const rank = (p.rank_text || "").trim();
    const amountLabel = (p.amount_label || "").trim() || "સહયોગ રકમ";
    const amountRaw = (p.amount || "").trim();
    const amount = amountRaw && !/^[₹$]/.test(amountRaw) ? `₹${amountRaw}` : amountRaw;
    const footer = (p.footer_text || "").trim();
    const hasPhoto = imageUrl.length > 0 && !imgFailed;
    const showButton = buttonText.length > 0 || link.length > 0;
    const hasCaption = title.length > 0 || message.length > 0;

    return (
      <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: progress }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          </Animated.View>

          <Animated.View style={[{ width: maxW, maxHeight: height * 0.92 }, cardStyle]}>
            <View style={styles.closeRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 0 }}
            >
              <View style={[styles.poster, { padding: pad }]}>
                <View style={styles.decoBig} pointerEvents="none" />
                <View style={styles.decoRing} pointerEvents="none" />
                <View style={styles.decoDot} pointerEvents="none" />

                {(badge.length > 0 || dateText.length > 0) && (
                  <View style={styles.topRow}>
                    {badge.length > 0 ? (
                      <View style={styles.badge}>
                        <Ionicons name="ribbon-outline" size={18} color={COLORS.white} />
                        <Text style={styles.badgeText} numberOfLines={1}>
                          {badge}
                        </Text>
                      </View>
                    ) : (
                      <View />
                    )}
                    {dateText.length > 0 && (
                      <View style={styles.datePill}>
                        <Ionicons name="calendar-outline" size={15} color={COLORS.muted} />
                        <Text style={styles.dateText} numberOfLines={1}>
                          {dateText}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.mainRow}>
                  <View style={{ alignItems: "center" }}>
                    <Pressable
                      onPress={link ? openLink : undefined}
                      style={[styles.photoFrame, { width: photoW, height: photoH }]}
                    >
                      {hasPhoto ? (
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.photo}
                          resizeMode="cover"
                          onLoad={() => setImgLoaded(true)}
                          onError={() => setImgFailed(true)}
                        />
                      ) : (
                        <LinearGradient
                          colors={[COLORS.teal, COLORS.tealDark]}
                          style={[styles.photo, styles.photoFallback]}
                        >
                          <Ionicons name="person" size={36} color={COLORS.white} />
                        </LinearGradient>
                      )}
                      {hasPhoto && !imgLoaded && (
                        <View style={styles.loader}>
                          <ActivityIndicator color={COLORS.teal} />
                        </View>
                      )}
                    </Pressable>
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={16} color={COLORS.white} />
                    </View>
                    {rank.length > 0 && (
                      <View style={styles.rankPill}>
                        <Text style={styles.rankText}>{rank}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.info}>
                    {name.length > 0 && (
                      <Text style={styles.name} numberOfLines={2}>
                        {name}
                      </Text>
                    )}
                    {location.length > 0 && (
                      <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                          <Ionicons name="location-outline" size={16} color={COLORS.teal} />
                        </View>
                        <Text style={styles.infoText} numberOfLines={1}>
                          {location}
                        </Text>
                      </View>
                    )}
                    {phone.length > 0 && (
                      <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                          <Ionicons name="call-outline" size={16} color={COLORS.teal} />
                        </View>
                        <Text style={[styles.infoText, { flex: 1 }]} numberOfLines={1}>
                          {phone}
                        </Text>
                        <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.teal} />
                      </View>
                    )}
                  </View>
                </View>

                {amount.length > 0 && (
                  <View style={styles.amountCard}>
                    <View style={styles.amountHead}>
                      <View style={styles.iconBox}>
                        <Ionicons name="wallet-outline" size={17} color={COLORS.slate} />
                      </View>
                      <Text style={styles.amountLabel} numberOfLines={1}>
                        {amountLabel}
                      </Text>
                    </View>
                    <Text style={styles.amountValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                      {amount}
                    </Text>
                  </View>
                )}

                {footer.length > 0 && (
                  <View style={styles.footerLine}>
                    <View style={styles.footerRule} />
                    <View style={styles.footerCenter}>
                      <View style={styles.footerHeart}>
                        <Ionicons name="heart" size={15} color={COLORS.teal} />
                      </View>
                      <Text style={styles.footerText} numberOfLines={1}>
                        {footer}
                      </Text>
                    </View>
                    <View style={styles.footerRule} />
                  </View>
                )}

                {hasCaption && (
                  <View style={styles.caption}>
                    {title.length > 0 && <Text style={styles.captionTitle}>{title}</Text>}
                    {message.length > 0 && <Text style={styles.captionMsg}>{message}</Text>}
                  </View>
                )}

                {showButton && (
                  <TouchableOpacity activeOpacity={0.88} onPress={openLink} style={{ marginTop: 14 }}>
                    <LinearGradient
                      colors={[COLORS.teal, COLORS.tealDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryBtn}
                    >
                      <Text style={styles.primaryText}>{buttonText || "ખોલો"}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    );
  }

  const hasImage = imageUrl.length > 0 && !imgFailed;
  const hasText = title.length > 0 || message.length > 0;
  const showButton = buttonText.length > 0 || link.length > 0 || !hasImage;
  const buttonLabel = buttonText || "ઠીક છે";

  const hasChrome = hasText || showButton;
  const maxW = Math.min(width - 44, 400);
  const maxImgH = height * (hasChrome ? 0.5 : 0.78);
  const scale = Math.min(maxW / nat.w, maxImgH / nat.h);
  const fitW = nat.w * scale;
  const fitH = nat.h * scale;
  const imageOnly = hasImage && !hasChrome;
  const cardW = Math.round(imageOnly ? fitW : maxW);
  const imgH = Math.round(hasChrome ? Math.min((maxW * nat.h) / nat.w, maxImgH) : fitH);

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: progress }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.card, imageOnly && styles.cardBare, { width: cardW, maxHeight: height * 0.9 }, cardStyle]}>
          {hasImage ? (
            <Pressable
              onPress={link ? openLink : onClose}
              style={[styles.imageWrap, { width: cardW, height: imgH }]}
            >
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                resizeMode="cover"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgFailed(true)}
              />
              {!imgLoaded && (
                <View style={styles.loader}>
                  <ActivityIndicator size="large" color={COLORS.teal} />
                </View>
              )}
            </Pressable>
          ) : (
            <LinearGradient
              colors={[COLORS.teal, COLORS.tealDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroFallback}
            >
              <View style={styles.heroIconRing}>
                <Ionicons name="heart" size={34} color={COLORS.white} />
              </View>
            </LinearGradient>
          )}

          {hasText && (
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {title.length > 0 && <Text style={styles.title}>{title}</Text>}
              {message.length > 0 && <Text style={styles.message}>{message}</Text>}
            </ScrollView>
          )}

          {showButton && (
            <View style={[styles.footer, !hasText && styles.footerNoText]}>
              <TouchableOpacity activeOpacity={0.88} onPress={openLink}>
                <LinearGradient
                  colors={[COLORS.teal, COLORS.tealDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryText}>{buttonLabel}</Text>
                </LinearGradient>
              </TouchableOpacity>
              {link.length > 0 && (
                <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.laterBtn}>
                  <Text style={styles.laterText}>પછી</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 22 },
  backdrop: { backgroundColor: "rgba(8, 20, 18, 0.62)" },
  card: { backgroundColor: COLORS.white, borderRadius: 26, overflow: "hidden", elevation: 16, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } },
  cardBare: { backgroundColor: "transparent", elevation: 0, shadowOpacity: 0, borderRadius: 18 },
  imageWrap: { backgroundColor: COLORS.tealSoft },
  image: { width: "100%", height: "100%" },
  loader: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.tealSoft },
  heroFallback: { height: 120, alignItems: "center", justifyContent: "center" },
  heroIconRing: { width: 68, height: 68, borderRadius: 34, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  body: { flexGrow: 0 },
  bodyContent: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 6 },
  title: { fontSize: 21, lineHeight: 30, fontWeight: "800", color: COLORS.text, textAlign: "center" },
  message: { fontSize: 14.5, lineHeight: 23, color: COLORS.muted, textAlign: "center", marginTop: 8 },
  footer: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 20 },
  footerNoText: { paddingTop: 16 },
  primaryBtn: { height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  primaryText: { color: COLORS.white, fontSize: 16, fontWeight: "800", letterSpacing: 0.2 },
  laterBtn: { alignItems: "center", paddingTop: 12 },
  laterText: { fontSize: 13.5, fontWeight: "700", color: COLORS.muted },
  closeRow: { alignItems: "flex-end", marginBottom: 10 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.22)", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)", alignItems: "center", justifyContent: "center" },
  poster: { backgroundColor: COLORS.page, borderRadius: 30, borderWidth: 1.5, borderColor: COLORS.border, overflow: "hidden", elevation: 16, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } },
  decoBig: { position: "absolute", right: -70, top: 70, width: 210, height: 210, borderRadius: 105, backgroundColor: "rgba(15,118,110,0.07)" },
  decoRing: { position: "absolute", right: -40, bottom: -60, width: 170, height: 170, borderRadius: 85, borderWidth: 1.5, borderColor: "rgba(15,118,110,0.14)" },
  decoDot: { position: "absolute", right: 40, top: 108, width: 12, height: 12, borderRadius: 6, backgroundColor: "rgba(15,118,110,0.18)" },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  badge: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: COLORS.slate, paddingHorizontal: 14, height: 38, borderRadius: 19, flexShrink: 1 },
  badgeText: { color: COLORS.white, fontSize: 13, fontWeight: "800", letterSpacing: 1, flexShrink: 1 },
  datePill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, height: 34, borderRadius: 17, marginLeft: 8 },
  dateText: { color: COLORS.muted, fontSize: 12.5, fontWeight: "600" },
  mainRow: { flexDirection: "row", alignItems: "flex-start" },
  photoFrame: { borderRadius: 22, borderWidth: 3, borderColor: "#C9D3D6", backgroundColor: COLORS.tealSoft, overflow: "hidden" },
  photo: { width: "100%", height: "100%" },
  photoFallback: { alignItems: "center", justifyContent: "center" },
  checkBadge: { position: "absolute", right: -8, bottom: 34, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.teal, borderWidth: 2.5, borderColor: COLORS.white, alignItems: "center", justifyContent: "center" },
  rankPill: { marginTop: 10, backgroundColor: "#E3ECEC", borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  rankText: { color: COLORS.muted, fontSize: 14, fontWeight: "800" },
  info: { flex: 1, marginLeft: 16, paddingTop: 2 },
  name: { fontSize: 22, lineHeight: 30, fontWeight: "800", color: COLORS.slate, marginBottom: 8 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  iconBox: { width: 30, height: 30, borderRadius: 10, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  infoText: { fontSize: 15.5, fontWeight: "600", color: COLORS.muted, flexShrink: 1 },
  amountCard: { marginTop: 14, backgroundColor: COLORS.white, borderRadius: 20, borderWidth: 1, borderColor: "#E1EBE9", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, elevation: 3, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  amountHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  amountLabel: { fontSize: 15, fontWeight: "800", color: COLORS.text, flexShrink: 1 },
  amountValue: { marginTop: 6, fontSize: 36, lineHeight: 46, fontWeight: "900", color: "#0B0B0B" },
  footerLine: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  footerRule: { flex: 1, height: 1, backgroundColor: "#D3E0DD" },
  footerCenter: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10, maxWidth: "80%" },
  footerHeart: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.tealSoft, alignItems: "center", justifyContent: "center" },
  footerText: { fontSize: 13, fontWeight: "700", color: COLORS.muted, letterSpacing: 0.4, flexShrink: 1 },
  caption: { marginTop: 14, alignItems: "center" },
  captionTitle: { fontSize: 17, lineHeight: 26, fontWeight: "800", color: COLORS.text, textAlign: "center" },
  captionMsg: { fontSize: 14, lineHeight: 22, color: COLORS.muted, textAlign: "center", marginTop: 4 },
});

export default React.memo(PopupModal);
