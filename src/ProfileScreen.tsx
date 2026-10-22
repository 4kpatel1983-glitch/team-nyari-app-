// src/ProfileScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ActivityIndicator, Animated, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, AppState, Share, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import DonationModal from './components/DonationModal';
import IDCardModal from './IDCardModal';
import DonationReceiptModal from './components/DonationReceiptModal';
import NotificationsModal from './components/NotificationsModal';
import HelpSupportModal from './components/HelpSupportModal';
import PrivacyPolicyModal from './components/PrivacyPolicyModal';
import { fetchProfile, fetchMember, fetchDonations, uploadAvatar, getCachedMobile, updatePhotoUrl, updateMemberPhotoUrl, notifyProfileChanged } from './supabaseClient';

const COLORS = { bg: '#F6F9F8', white: '#FFFFFF', primary: '#0E7B6E', primaryDark: '#0A5F55', primarySoft: '#E5F2EF', primaryGlow: '#F0F7F5', text: '#0F2E2A', helper: '#5A6E6A', muted: '#7A918C', border: '#DCEAE6', red: '#C94B58', redSoft: '#FCEBEE' };

const MENU = [
  { title: 'મારું સભ્ય ઓળખપત્ર', subtitle: 'TEAM NYARI સભ્ય વિગતો', icon: 'card-outline', color: '#0A5F55', bg: '#F0F7F5', action: 'id' },
  { title: 'મારું દાન', subtitle: 'દાનની માહિતી અને ઇતિહાસ', icon: 'heart-outline', color: '#0E7B6E', bg: '#E5F2EF', action: 'donations' },
  { title: 'નોટિફિકેશન', subtitle: 'મહત્વપૂર્ણ સૂચનાઓ', icon: 'notifications-outline', color: '#3B7A6F', bg: '#F0F7F5', action: 'notifications' },
  { title: 'મદદ અને સંપર્ક', subtitle: 'અમારી ટીમનો સંપર્ક કરો', icon: 'headset-outline', color: '#0E7B6E', bg: '#E5F2EF', action: 'help' },
  { title: 'એપ શેર કરો', subtitle: 'તમારા મિત્રો સાથે શેર કરો', icon: 'share-social-outline', color: '#8B5CF6', bg: '#F3E8FF', action: 'share' },
  { title: 'TEAM NYARI વિશે', subtitle: 'અમારો હેતુ અને સેવા', icon: 'information-circle-outline', color: '#0A5F55', bg: '#F0F7F5', action: 'about' },
  { title: 'પ્રાઇવસી પોલિસી', subtitle: 'અમારા નિયમો અને શરતો', icon: 'shield-checkmark-outline', color: '#475569', bg: '#F1F5F9', action: 'privacy' },
] as const;

const PAGE_INFO: Record<string, { title: string; subtitle: string }> = {
  id: { title: 'સભ્ય ઓળખપત્ર', subtitle: 'TEAM NYARI સભ્ય વિગતો' },
  donations: { title: 'મારું દાન', subtitle: 'દાન સંબંધિત માહિતી' }
};

// ⚡ Props માં onGoToAbout ઉમેર્યું
type ProfileScreenProps = { onLogout?: () => void; onBack?: () => void; onGoToTeam?: () => void; onGoToAbout?: () => void; };
type LocalProfile = { name: string; imageUri: string | null; locationText: string; pincode?: string; mobile?: string; };
type LocalMember = { id: string; name: string; mobile: string; address: string; photo: string | null; district: string; taluka: string; city: string; state: string; service: string; role: string; } | null;

const ProfileScreen = ({ onLogout, onGoToAbout }: ProfileScreenProps) => {
  const insets = useSafeAreaInsets();
  const [activePage, setActivePage] = useState('');
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [showIDCard, setShowIDCard] = useState(false);
  const [profileData, setProfileData] = useState<LocalProfile | null>(null);
  const [memberData, setMemberData] = useState<LocalMember>(null);
  
  const [totalDonated, setTotalDonated] = useState<number>(0);
  const [donationCount, setDonationCount] = useState<number>(0);
  const [serviceWorks, setServiceWorks] = useState<number>(0); 

  const [userDonationsList, setUserDonationsList] = useState<any[]>([]);
  const [showAllDonations, setShowAllDonations] = useState(false);

  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  
  const [photoPickerVisible, setPhotoPickerVisible] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [imageVersion, setImageVersion] = useState(0);
  const [photoStatus, setPhotoStatus] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const photoStatusOpacity = useRef(new Animated.Value(0)).current;

  const showPhotoStatus = useCallback((message: string, type: 'success' | 'error') => {
    setPhotoStatus({ visible: true, message, type });
    photoStatusOpacity.setValue(0);
    Animated.timing(photoStatusOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(photoStatusOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setPhotoStatus((p) => ({ ...p, visible: false })));
    }, 3000);
  }, [photoStatusOpacity]);

  const loadProfile = useCallback(async () => {
    let isMounted = true;
    try {
      const mobile = await getCachedMobile();
      if (!mobile) { return; }
      
      const fresh = await fetchProfile(mobile);
      if (fresh && isMounted) {
        setProfileData({ name: fresh.name || '', imageUri: fresh.photo_url || null, locationText: fresh.location_text || '', pincode: fresh.pincode || '', mobile: fresh.mobile || mobile });
        setImageVersion((v) => v + 1);
      }
      
      const member = await fetchMember(mobile);
      if (isMounted) {
        if (member && member.member_id) {
          setMemberData({ id: member.member_id, name: member.name || '', mobile: member.mobile || mobile, address: [member.city, member.district].filter(Boolean).join(', '), photo: member.photo_url || fresh?.photo_url || null, district: member.district || '', taluka: '', city: member.city || '', state: 'Gujarat', service: member.role || '', role: member.role || 'સભ્ય' });
        } else { 
          setMemberData(null); 
        }
      }

      const donations = await fetchDonations(mobile);
      if (isMounted) {
        setUserDonationsList(donations || []); 
        setTotalDonated((donations || []).reduce((sum, d) => sum + (Number(d.amount) || 0), 0));
        setDonationCount(donations?.length || 0);
        
        const uniqueCases = new Set((donations || []).map(d => d.case_id).filter(Boolean));
        setServiceWorks(uniqueCases.size);
      }
    } catch (e) {} finally {}
    return () => { isMounted = false; };
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") { loadProfile(); }
    });
    return () => subscription.remove();
  }, [loadProfile]);

  const saveNewPhoto = async (uri: string) => {
    try {
      setUploadingPhoto(true);
      const mobile = profileData?.mobile || (await getCachedMobile()) || '';
      if (!mobile) return setUploadingPhoto(false);
      const photoUrl = await uploadAvatar(uri, mobile);
      if (!photoUrl) return showPhotoStatus('Upload failed', 'error');
      const upd = await updatePhotoUrl(mobile, photoUrl);
      if (!upd.ok) return showPhotoStatus('DB update failed', 'error');
      await updateMemberPhotoUrl(mobile, photoUrl);
      
      const fresh = await fetchProfile(mobile);
      if (fresh && fresh.photo_url) {
        setProfileData({ name: fresh.name || '', imageUri: fresh.photo_url, locationText: fresh.location_text || '', pincode: fresh.pincode || '', mobile: fresh.mobile || mobile });
        setImageVersion((v) => v + 1);
        setMemberData((prev) => prev ? { ...prev, photo: photoUrl } : prev);
        notifyProfileChanged();
        showPhotoStatus('Photo updated!', 'success');
      }
    } catch (e) { showPhotoStatus('Failed', 'error'); } finally { setUploadingPhoto(false); }
  };

  const openCamera = async () => {
    setPhotoPickerVisible(false);
    setTimeout(async () => {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!result.canceled && result.assets?.length) await saveNewPhoto(result.assets[0].uri);
    }, 250);
  };

  const openGallery = async () => {
    setPhotoPickerVisible(false);
    setTimeout(async () => {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!result.canceled && result.assets?.length) await saveNewPhoto(result.assets[0].uri);
    }, 250);
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'નમસ્તે, હું તમને TEAM NYARI એપ શેર કરી રહ્યો છું. જરૂરિયાતમંદ પરિવારો સુધી સીધી મદદ પહોંચાડવા માટે આ એપ ડાઉનલોડ કરો. (Google Play Store લિંક અહીં આવશે)',
      });
    } catch (error) { console.log(error); }
  };

  const openReceipt = (item: any) => { setSelectedReceipt(item); setReceiptModalVisible(true); };

  const handleMenuAction = (action: string) => {
    if (action === 'notifications') setShowNotifModal(true);
    else if (action === 'help') setShowHelpModal(true);
    else if (action === 'share') handleShareApp();
    else if (action === 'privacy') setShowPrivacyModal(true);
    else if (action === 'about') { 
      if (onGoToAbout) onGoToAbout(); // ⚡ અહીંથી નવું પેજ ખૂલશે
    }
    else {
      if (action === 'donations') setShowAllDonations(false);
      setActivePage(action);
    }
  };

  const renderDetail = () => {
    if (!activePage) return null;
    const info = PAGE_INFO[activePage];
    return (
      <Modal visible={!!activePage} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setActivePage('')}>
        <View style={s.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setActivePage('')} />
          <View style={[s.detailSheet, { paddingBottom: Math.max(insets.bottom, 20), maxHeight: '90%' }]}>
            <View style={s.sheetHandle} />
            <View style={s.detailHeader}>
              <View style={{ flex: 1 }}><Text style={s.detailTitle}>{info.title}</Text><Text style={s.detailSubtitle}>{info.subtitle}</Text></View>
              <TouchableOpacity onPress={() => setActivePage('')} style={s.closeButton}><Ionicons name="close" size={18} color={COLORS.text} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.detailScroll}>
              
              {activePage === 'id' && (
                <>{memberData && memberData.id ? (
                  <View style={s.idCard}>
                    <View style={s.idTopRow}>
                      <View style={s.idLogo}><Ionicons name="hand-left" size={20} color="#FFFFFF" /></View>
                      <View style={{ flex: 1 }}><Text style={s.idBrand}>TEAM NYARI</Text><Text style={s.idTag}>સેવા • સમર્પણ • વિશ્વાસ</Text></View>
                      <Ionicons name="shield-checkmark" size={20} color={COLORS.primarySoft} />
                    </View>
                    <View style={s.idDivider} />
                    <Text style={s.idSmall}>સભ્ય ઓળખપત્ર</Text>
                    <Text style={s.idMember}>{memberData.name || '—'}</Text>
                    <Text style={s.idBody}>{memberData.address || '—'}</Text>
                    <View style={s.idBottom}><Text style={s.idNumber}>MEMBER ID: {memberData.id}</Text><Text style={s.idStatus}>VERIFIED</Text></View>
                    <TouchableOpacity style={[s.donateButton, { marginTop: 20 }]} onPress={() => { setActivePage(''); setTimeout(() => setShowIDCard(true), 250); }}>
                      <Ionicons name="card-outline" size={16} color="#FFFFFF" /><Text style={s.donateButtonText}>ID Card જુઓ</Text><Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={s.detailCard}>
                    <View style={s.detailIconCircle}><Ionicons name="ribbon-outline" size={28} color={COLORS.primary} /></View>
                    <Text style={[s.detailCardTitle, { textAlign: 'center' }]}>તમે હજુ સભ્ય નથી</Text>
                    <Text style={[s.detailBody, { textAlign: 'center', marginBottom: 0 }]}>Team Nyari પરિવારના ભાગ બનવા માટે નીચેના ટેબમાંથી "+ Team" પર ક્લિક કરો.</Text>
                  </View>
                )}</>
              )}

              {activePage === 'donations' && (
                <View style={s.detailCard}>
                  <View style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 18, padding: 20, alignItems: 'center', marginBottom: 20 }}>
                    <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>કુલ દાન</Text>
                    <Text style={{ color: '#0F172A', fontSize: 32, fontWeight: '900', marginTop: 6 }}>
                      ₹{totalDonated > 0 ? totalDonated.toLocaleString('en-IN') : '0'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
                      <Ionicons name="receipt-outline" size={14} color="#64748B" />
                      <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600' }}>કુલ {donationCount} વખત દાન કર્યું છે</Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 12 }}>દાનનો ઇતિહાસ</Text>

                  {userDonationsList.length > 0 ? (
                    <>
                      {(showAllDonations ? userDonationsList : userDonationsList.slice(0, 5)).map((item, index) => (
                        <View key={item.id || index} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>₹{item.amount}</Text>
                            <Text style={{ fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: '600' }}>કેસ ID: {item.case_id || 'સામાન્ય દાન'}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700' }}>
                              {item.date ? new Date(item.date).toLocaleDateString('gu-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 6, gap: 8 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '800' }}>SUCCESS</Text>
                              </View>
                              <Pressable onPress={() => openReceipt(item)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                <Ionicons name="document-text-outline" size={12} color="#334155" />
                                <Text style={{ fontSize: 9, color: '#334155', fontWeight: '800', marginLeft: 4 }}>Receipt</Text>
                              </Pressable>
                            </View>
                          </View>
                        </View>
                      ))}
                      {userDonationsList.length > 5 && (
                        <TouchableOpacity style={{ marginTop: 15, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12 }} onPress={() => setShowAllDonations(!showAllDonations)}>
                          <Text style={{ color: '#0F172A', fontWeight: '800', fontSize: 13 }}>{showAllDonations ? 'ઓછું જુઓ (Show Less)' : `બધા દાન જુઓ (${userDonationsList.length})`}</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  ) : (
                    <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginVertical: 20 }}>હજી સુધી કોઈ દાન કરેલ નથી.</Text>
                  )}
                </View>
              )}

              {/* ⚡ 'about' નો બ્લોક અહીંથી કાઢી નાખ્યો છે */}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[s.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <View style={s.topBar}>
        <View style={{ flex: 1 }}><Text style={s.topEyebrow}>તમારું એકાઉન્ટ</Text><Text style={s.topTitle}>મારી પ્રોફાઇલ</Text></View>
        <TouchableOpacity style={s.topIcon} onPress={() => setShowNotifModal(true)}><Ionicons name="notifications-outline" size={19} color={COLORS.text} /><View style={s.notificationDot} /></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingBottom: Math.max(insets.bottom, 22) }]}>
        <View style={s.profileHero}>
          <View style={s.heroGlowOne} /><View style={s.heroGlowTwo} />
          {photoStatus.visible && (
            <Animated.View style={[s.photoStatusBanner, photoStatus.type === 'error' && s.photoStatusError, { opacity: photoStatusOpacity }]}>
              <Ionicons name={photoStatus.type === 'success' ? 'checkmark-circle' : 'alert-circle'} size={14} color={photoStatus.type === 'error' ? COLORS.red : COLORS.primary} />
              <Text style={[s.photoStatusText, { color: photoStatus.type === 'error' ? COLORS.red : COLORS.primaryDark }]}>{photoStatus.message}</Text>
            </Animated.View>
          )}
          <View style={s.profileTopRow}>
            <View style={s.avatarWrap}>
              <View style={s.avatar}>
                {profileData?.imageUri ? (
                  <Image 
                    key={`img-${imageVersion}`} 
                    source={{ uri: `${profileData.imageUri}${profileData.imageUri.includes('?') ? '&' : '?'}v=${imageVersion}` }} 
                    style={s.avatarImage} 
                    resizeMode="cover" 
                  />
                ) : (
                  <Ionicons name="person" size={30} color={COLORS.primary} />
                )}
              </View>
              <TouchableOpacity style={s.avatarEdit} onPress={() => setPhotoPickerVisible(true)} disabled={uploadingPhoto}>
                {uploadingPhoto ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Ionicons name="create" size={12} color={COLORS.primary} />}
              </TouchableOpacity>
            </View>
            <View style={s.profileIdentity}>
              <Text style={s.welcomeLabel}>નમસ્કાર, સ્વાગત છે</Text>
              <Text style={s.profileName}>{profileData?.name || 'TEAM NYARI સભ્ય'}</Text>
              <View style={s.memberPill}><Ionicons name="location-outline" size={12} color={COLORS.primary} /><Text style={s.memberPillText} numberOfLines={1}>{profileData?.locationText || 'સભ્યની વિગતો બાકી'}</Text></View>
            </View>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
          </View>
          <View style={s.heroDivider} />
          <View style={s.profileFooter}>
            <View style={{ flex: 1 }}><Text style={s.profileFooterLabel}>મોબાઇલ નંબર</Text><Text style={s.profileFooterValue}>{profileData?.mobile || '—'}</Text></View>
            <TouchableOpacity style={s.viewIdButton} onPress={() => setActivePage('id')}><Text style={s.viewIdText}>ID જુઓ</Text><Ionicons name="arrow-forward" size={13} color="#FFFFFF" /></TouchableOpacity>
          </View>
        </View>

        <View style={s.statsRow}>
          <StatCard icon="heart-outline" label="કુલ દાન" value={totalDonated > 0 ? `₹${totalDonated.toLocaleString('en-IN')}` : '0'} />
          <StatCard icon="people-outline" label="કુલ પરિવાર ને મદદ" value={serviceWorks > 0 ? serviceWorks.toString() : '0'} />
          <StatCard icon="ribbon-outline" label="" value={memberData?.id ? 'સભ્ય' : 'દાતા'} />
        </View>

        <View style={s.sectionHeading}><View style={{ flex: 1 }}><Text style={s.sectionTitle}>એકાઉન્ટ અને સેવાઓ</Text><Text style={s.sectionSubtitle}>તમારી જરૂરિયાત મુજબ પસંદ કરો</Text></View><View style={s.sectionAccent} /></View>

        <View style={s.menuCard}>
          {MENU.map((item, index) => (
            <React.Fragment key={item.action}>
              <TouchableOpacity style={s.menuRow} onPress={() => handleMenuAction(item.action)}>
                <View style={[s.menuIcon, { backgroundColor: item.bg }]}><Ionicons name={item.icon as any} size={19} color={item.color} /></View>
                <View style={s.menuCopy}><Text style={s.menuTitle}>{item.title}</Text><Text style={s.menuSubtitle}>{item.subtitle}</Text></View>
                <View style={s.chevron}><Ionicons name="chevron-forward" size={14} color={COLORS.muted} /></View>
              </TouchableOpacity>
              {index !== MENU.length - 1 && <View style={s.menuDivider} />}
            </React.Fragment>
          ))}
        </View>

        <TouchableOpacity style={s.logoutButton} onPress={() => setLogoutVisible(true)}>
          <View style={s.logoutIcon}><Ionicons name="log-out-outline" size={17} color={COLORS.red} /></View>
          <Text style={s.logoutText}>લૉગઆઉટ</Text><Ionicons name="chevron-forward" size={14} color={COLORS.red} />
        </TouchableOpacity>

        <View style={s.footer}>
          <View style={s.footerLogo}><Ionicons name="hand-left" size={13} color={COLORS.primary} /></View>
          <Text style={s.footerBrand}>TEAM NYARI</Text><View style={s.footerDot} /><Text style={s.footerCaption}>સેવા ભાવથી</Text>
        </View>
        <Text style={s.version}>TEAM NYARI • PROFILE</Text>
      </ScrollView>

      {renderDetail()}
      
      <IDCardModal visible={showIDCard} onClose={() => setShowIDCard(false)} member={memberData ? { id: memberData.id, name: memberData.name, mobile: memberData.mobile, address: memberData.address, photo: memberData.photo || profileData?.imageUri || null, district: memberData.district, taluka: memberData.taluka, city: memberData.city, state: memberData.state, service: memberData.service, role: memberData.role, leadershipStatus: 'NONE' } : null} />
      
      <DonationReceiptModal visible={receiptModalVisible} onClose={() => setReceiptModalVisible(false)} receiptData={selectedReceipt} userData={{ name: profileData?.name || '', mobile: profileData?.mobile || '', photoUrl: profileData?.imageUri || null }} />
      
      <NotificationsModal visible={showNotifModal} onClose={() => setShowNotifModal(false)} />
      
      <HelpSupportModal visible={showHelpModal} onClose={() => setShowHelpModal(false)} />

      <PrivacyPolicyModal visible={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />

      <Modal visible={photoPickerVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setPhotoPickerVisible(false)}>
        <View style={s.pickerBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPhotoPickerVisible(false)} />
          <View style={[s.pickerSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={s.pickerHandle} /><Text style={s.pickerTitle}>Choose Photo</Text><Text style={s.pickerSubtitle}>ક્યાંથી ફોટો લેવો છે?</Text>
            <TouchableOpacity style={s.pickerOption} onPress={openCamera}><View style={s.pickerIconWrap}><Ionicons name="camera" size={20} color={COLORS.primary} /></View><View style={{ flex: 1 }}><Text style={s.pickerOptionTitle}>Camera</Text><Text style={s.pickerOptionSub}>નવો ફોટો લો</Text></View><Ionicons name="chevron-forward" size={18} color={COLORS.muted} /></TouchableOpacity>
            <TouchableOpacity style={s.pickerOption} onPress={openGallery}><View style={s.pickerIconWrap}><Ionicons name="images" size={20} color={COLORS.primary} /></View><View style={{ flex: 1 }}><Text style={s.pickerOptionTitle}>Gallery</Text><Text style={s.pickerOptionSub}>ગેલેરીમાંથી પસંદ કરો</Text></View><Ionicons name="chevron-forward" size={18} color={COLORS.muted} /></TouchableOpacity>
            <TouchableOpacity style={s.pickerCancel} onPress={() => setPhotoPickerVisible(false)}><Text style={s.pickerCancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={logoutVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setLogoutVisible(false)}>
        <View style={s.logoutBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setLogoutVisible(false)} />
          <View style={s.logoutDialog}>
            <View style={s.logoutDialogIcon}><Ionicons name="log-out-outline" size={24} color={COLORS.red} /></View>
            <Text style={s.logoutDialogTitle}>લૉગઆઉટ કરવું છે?</Text><Text style={s.logoutDialogBody}>શું તમે ખરેખર બહાર નીકળવા માંગો છો?</Text>
            <View style={s.logoutActions}>
              <TouchableOpacity style={s.cancelButton} onPress={() => setLogoutVisible(false)}><Text style={s.cancelText}>રહેવા દો</Text></TouchableOpacity>
              <TouchableOpacity style={s.confirmLogout} onPress={() => { setLogoutVisible(false); onLogout?.(); }}><Text style={s.confirmLogoutText}>લૉગઆઉટ</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const StatCard = React.memo(({ icon, label, value = '—' }: any) => (
  <View style={s.statCard}>
    <View style={s.statIcon}><Ionicons name={icon} size={16} color={COLORS.primary} /></View>
    <Text style={s.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    {label ? <Text style={s.statLabel}>{label}</Text> : null}
  </View>
));

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg }, topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  topEyebrow: { color: COLORS.helper, fontSize: 12, fontWeight: '600' }, topTitle: { fontSize: 22, color: COLORS.text, fontWeight: '800' },
  topIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  notificationDot: { position: 'absolute', width: 7, height: 7, borderRadius: 4, backgroundColor: '#E15A52', top: 9, right: 10, borderWidth: 1.5, borderColor: COLORS.white },
  scroll: { paddingHorizontal: 17, paddingTop: 2 },
  profileHero: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 22, padding: 17, overflow: 'hidden', marginBottom: 13, elevation: 4 },
  heroGlowOne: { position: 'absolute', width: 160, height: 160, borderRadius: 90, backgroundColor: COLORS.primarySoft, right: -45, top: -70, opacity: 0.6 },
  heroGlowTwo: { position: 'absolute', width: 110, height: 110, borderRadius: 60, backgroundColor: COLORS.primaryGlow, right: 20, bottom: -70 },
  photoStatusBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primarySoft, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#BFDDD7' },
  photoStatusError: { backgroundColor: COLORS.redSoft, borderColor: '#F1C6CC' }, photoStatusText: { flex: 1, fontSize: 11.5, fontWeight: '600' },
  profileTopRow: { flexDirection: 'row', alignItems: 'center' }, avatarWrap: { marginRight: 12, position: 'relative' },
  avatar: { width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#C9E1DB', backgroundColor: COLORS.primarySoft, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' }, avatarEdit: { position: 'absolute', right: -3, bottom: -3, width: 24, height: 24, borderRadius: 8, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C9E1DB', elevation: 3 },
  profileIdentity: { flex: 1, minWidth: 0 }, welcomeLabel: { color: COLORS.helper, fontSize: 11.5, fontWeight: '600' }, profileName: { fontSize: 17.5, color: COLORS.text, fontWeight: '800' },
  memberPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, marginTop: 5, backgroundColor: COLORS.primarySoft, maxWidth: '100%' },
  memberPillText: { color: COLORS.primaryDark, fontSize: 10.5, marginLeft: 4, fontWeight: '600' }, heroDivider: { height: 1, backgroundColor: COLORS.border, marginTop: 16, marginBottom: 12 },
  profileFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, profileFooterLabel: { color: COLORS.helper, fontSize: 11, fontWeight: '600' },
  profileFooterValue: { color: COLORS.text, fontSize: 13.5, marginTop: 2, fontWeight: '700' }, viewIdButton: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: COLORS.primary, gap: 6 },
  viewIdText: { color: '#FFFFFF', fontSize: 11.5, fontWeight: '700' }, statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  statValue: { fontSize: 15, color: COLORS.text, fontWeight: '800', maxWidth: '95%' }, statLabel: { fontSize: 10, color: COLORS.helper, fontWeight: '600', marginTop: 1 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 11, paddingHorizontal: 2 }, sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800' },
  sectionSubtitle: { color: COLORS.helper, fontSize: 11.5, marginTop: 1, fontWeight: '500' }, sectionAccent: { width: 28, height: 4, borderRadius: 3, backgroundColor: COLORS.primary, marginLeft: 8 },
  menuCard: { backgroundColor: COLORS.white, borderRadius: 22, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border }, menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, minHeight: 66 },
  menuIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, menuCopy: { flex: 1, minWidth: 0 },
  menuTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700' }, menuSubtitle: { color: COLORS.helper, fontSize: 11, marginTop: 1, fontWeight: '500' },
  chevron: { width: 26, height: 26, borderRadius: 9, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  menuDivider: { height: 1, backgroundColor: '#EEF5F3', marginLeft: 54 }, logoutButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#F1DCDD', borderRadius: 18, marginTop: 14, paddingHorizontal: 12, paddingVertical: 12 },
  logoutIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.redSoft, alignItems: 'center', justifyContent: 'center', marginRight: 11 }, logoutText: { flex: 1, color: COLORS.red, fontSize: 14, fontWeight: '700' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 22, gap: 6 }, footerLogo: { width: 22, height: 22, borderRadius: 8, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' },
  footerBrand: { color: COLORS.primaryDark, fontSize: 11.5, fontWeight: '800' }, footerDot: { width: 3.5, height: 3.5, borderRadius: 2, backgroundColor: '#A5C4BD' },
  footerCaption: { color: COLORS.helper, fontSize: 11, fontWeight: '500' }, version: { color: '#8EAFA8', fontSize: 9, textAlign: 'center', marginTop: 7, letterSpacing: 1.2, fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(10,35,30,0.65)', justifyContent: 'flex-end' }, detailSheet: { backgroundColor: COLORS.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10 },
  sheetHandle: { width: 40, height: 4.5, borderRadius: 5, backgroundColor: '#C2D9D3', alignSelf: 'center', marginBottom: 16 }, detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  detailTitle: { color: COLORS.text, fontSize: 19, fontWeight: '800' }, detailSubtitle: { color: COLORS.helper, fontSize: 11.5, fontWeight: '600' }, closeButton: { width: 38, height: 38, borderRadius: 13, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' },
  detailScroll: { paddingBottom: 20 }, detailCard: { backgroundColor: COLORS.white, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10 },
  detailIconCircle: { width: 52, height: 52, borderRadius: 17, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  detailCardTitle: { color: COLORS.text, fontSize: 17, marginBottom: 8, fontWeight: '800' }, detailBody: { color: COLORS.helper, fontSize: 13, marginBottom: 16, fontWeight: '600' },
  idCard: { backgroundColor: COLORS.primary, borderRadius: 22, padding: 20, marginBottom: 10 }, idTopRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  idLogo: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }, idBrand: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  idTag: { color: 'rgba(255,255,255,0.85)', fontSize: 10.5, fontWeight: '600' }, idDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginVertical: 16 },
  idSmall: { color: 'rgba(255,255,255,0.85)', fontSize: 11.5, fontWeight: '600' }, idMember: { color: '#FFFFFF', fontSize: 18, marginTop: 3, fontWeight: '800' },
  idBody: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 5, fontWeight: '600' }, idBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  idNumber: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' }, idStatus: { color: '#E5F2EF', fontSize: 9, fontWeight: '700' },
  donateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 14, padding: 12, marginTop: 16, height: 48 },
  donateButtonText: { flex: 1, textAlign: 'center', color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  aboutHero: { backgroundColor: COLORS.primarySoft, borderWidth: 1, borderColor: '#C9E1DB', borderRadius: 18, alignItems: 'center', padding: 20, marginBottom: 18 }, aboutLogo: { width: 56, height: 56, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  aboutBrand: { color: COLORS.text, fontSize: 20, fontWeight: '800' }, aboutTagline: { color: COLORS.primaryDark, fontSize: 11.5, textAlign: 'center', fontWeight: '600', marginTop: 2 },
  pickerBackdrop: { flex: 1, backgroundColor: 'rgba(10,35,30,0.65)', justifyContent: 'flex-end' }, pickerSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10 },
  pickerHandle: { width: 40, height: 4.5, borderRadius: 5, backgroundColor: '#C2D9D3', alignSelf: 'center', marginBottom: 16 }, pickerTitle: { fontSize: 18, color: COLORS.text, fontWeight: '800' },
  pickerSubtitle: { fontSize: 12.5, color: COLORS.helper, marginTop: 3, marginBottom: 16, fontWeight: '600' }, pickerOption: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.primaryGlow, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#C9E1DB' },
  pickerIconWrap: { width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' }, pickerOptionTitle: { fontSize: 14.5, color: COLORS.text, fontWeight: '700' },
  pickerOptionSub: { fontSize: 11.5, color: COLORS.helper, marginTop: 2, fontWeight: '600' }, pickerCancel: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF5F3', borderRadius: 14, height: 48, marginTop: 6 },
  pickerCancelText: { fontSize: 14, color: COLORS.text, fontWeight: '700' }, logoutBackdrop: { flex: 1, backgroundColor: 'rgba(10,35,30,0.7)', alignItems: 'center', justifyContent: 'center', padding: 25 },
  logoutDialog: { width: '100%', backgroundColor: COLORS.white, borderRadius: 24, padding: 22, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  logoutDialogIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: COLORS.redSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoutDialogTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' }, logoutDialogBody: { color: COLORS.helper, fontSize: 12.5, textAlign: 'center', marginTop: 6, marginBottom: 20, fontWeight: '600' },
  logoutActions: { flexDirection: 'row', width: '100%', gap: 9 }, cancelButton: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#EEF5F3', height: 48 },
  cancelText: { color: COLORS.text, fontSize: 14, fontWeight: '700' }, confirmLogout: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: COLORS.red, height: 48 },
  confirmLogoutText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});

export default React.memo(ProfileScreen);
