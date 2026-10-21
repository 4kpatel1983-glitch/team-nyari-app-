// src/AddMemberScreen.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
  Animated, 
  Easing, 
  KeyboardAvoidingView, 
  Platform, 
  Pressable, 
  ScrollView, 
  Text, 
  View,
  Image
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { DemoMember } from './MemberListScreen';
import { C, styles } from './AddMemberStyles';
import { Field } from './AddMemberComponents';
import { 
  RulesModal, 
  PhotoOptionModal, 
  PincodeErrorModal, 
  ValidationModal, 
  RoleSelectionModal, 
  RoleDetailModal, 
  Role 
} from './AddMemberModals';
import IDCardModal from './IDCardModal';
import ThankYouModal from './ThankYouModal';
import { 
  createMember, 
  fetchMember, 
  fetchProfile, 
  uploadAvatar, 
  getCachedMobile, 
  syncProfileFromMember, 
  notifyProfileChanged 
} from './supabaseClient';

const TEAM_LOGO = require('../asset.png');

const normalizeMobile = (mobile: string = ''): string => mobile.replace(/\D/g, '').slice(-10);

const MEMBER_RULES = [
  { no: '01', text: 'સંસ્થાના દરેક સેવા કાર્યમાં આર્થિક દાન માત્ર અને માત્ર Team Nyari એપ દ્વારા જ કરવાનું રહેશે. કોઈ પણ પ્રકારનો રોકડ (Cash) વ્યવહાર કરવાનો રહેશે નહીં.' },
  { no: '02', text: 'સેવા કેસની સચોટતા અને પારદર્શિતા માટે ૧ મિનિટનો વિડીયો તથા જરૂરિયાતમંદ પરિવારની સાચી માહિતી આપવાની રહેશે.' },
  { no: '03', text: 'સંસ્થાની પૂર્વ મંજૂરી વગર કોઈ પણ વ્યક્તિ સંસ્થાના નામે નાણાકીય દાન એકત્રિત કરી શકશે નહીં.' },
  { no: '04', text: 'સભ્ય તરીકે જોડાઈને દરેક સભ્ય જરૂરિયાતમંદ પરિવાર અને સમાજની સાથે સેવા નિષ્ઠાપૂર્વક કરશે.' },
  { no: '05', text: 'મળેલું I-Card માત્ર સેવાકીય અને સંસ્થાના કામ માટે જ વાપરવાનું રહેશે.' },
  { no: '06', text: 'સંસ્થાના નિયમો વિરુદ્ધ કોઈ પ્રવૃત્તિ કરવામાં આવશે તો સભ્યપદ રદ થઇ શકે છે.' },
  { no: '07', text: 'Team Nyari ની સેવા, પારદર્શિતા અને શિસ્ત જાળવવામાં દરેક સભ્ય સહયોગ આપશે.' },
];

const ROLES: Role[] = [
  { id: 1, name: 'Video Anchor', gujarati: 'એન્કર / વીડિયો પ્રેઝન્ટર', subtitle: 'Video Anchor', responsibility: 'ઘરે બેસીને ૧ મિનિટનો ઇન્ટ્રો વિડીયો રેકોર્ડ કરવો.', rule: 'પોતાની ક્ષમતા મુજબ દાન કરવું.', note: 'ઘરે બેસીને સેવા કરવી.', designation: 'Video Anchor' },
  { id: 2, name: 'General Member', gujarati: 'સામાન્ય સભ્ય / સપોર્ટર', subtitle: 'General Member / Supporter', responsibility: 'કોઈ ફરજિયાત જવાબદારી નથી.', rule: 'દાન માત્ર એપ મારફતે કરવું.', note: 'અનુકૂળતા મુજબ સહયોગ.', designation: 'General Member / Supporter' },
  { id: 3, name: 'Ground Service', gujarati: 'ગ્રાઉન્ડ સર્વિસ', subtitle: 'Ground Service', responsibility: 'પરિવારના ઘરે રૂબરૂ જઈ ખરાઈ કરવી.', rule: 'લોકોને એપ વિશે માહિતગાર કરવા.', note: 'ગ્રાઉન્ડ લેવલ પર સેવા.', designation: 'Ground Service Member' },
  { id: 4, name: 'Active Member', gujarati: 'સક્રિય સભ્ય / દાતા', subtitle: 'Active Member / Donor', responsibility: 'દરેક કેસમાં સ્વેચ્છાએ દાન આપવું.', rule: 'દાન માત્ર એપ દ્વારા.', note: 'સક્રિય રીતે જોડાવું.', designation: 'Active Member / Donor' },
  { id: 5, name: 'Social Media', gujarati: 'સોશિયલ મીડિયા & પ્રચાર', subtitle: 'Social Media', responsibility: 'કેસ, વીડિયો શેર કરવા.', rule: 'લોકોને જોડવા.', note: 'માહિતી પહોંચાડવી.', designation: 'Social Media Member' },
  { id: 6, name: 'Video Editor', gujarati: 'વીડિયો એડિટર', subtitle: 'Video Editor', responsibility: 'Raw videos edit કરવા.', rule: 'વિશ્વસનીય content બનાવવું.', note: 'Professional content.', designation: 'Video Editor' },
  { id: 7, name: 'Emergency Service', gujarati: 'ઇમરજન્સી સર્વિસ', subtitle: 'Emergency Service', responsibility: 'Emergency સમયે ઝડપથી મદદ.', rule: 'આર્થિક સહાય એપ દ્વારા.', note: 'ઝડપી પ્રતિસાદ.', designation: 'Emergency Service Member' },
];

const DEFAULT_ROLE = ROLES[1];

const AddMemberSkeleton = React.memo(() => {
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

  const Block = ({ style }: any) => <Animated.View style={[{ backgroundColor: '#E1DFD7', borderRadius: 10 }, style, { opacity: pulse }]} />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={{ flex: 1, backgroundColor: C.bg, paddingHorizontal: 18, paddingTop: 12 }}>
         <Block style={{ width: 120, height: 24, marginBottom: 20 }} />
         <Block style={{ width: '100%', height: 120, borderRadius: 20 }} />
      </View>
    </SafeAreaView>
  );
});

type Props = { navigation?: { navigate: (screen: string) => void; goBack: () => void; } };

const AddMemberScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [memberId, setMemberId] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [houseNo, setHouseNo] = useState('');
  const [areaLocality, setAreaLocality] = useState('');
  const [pincode, setPincode] = useState('');
  const [cityVillage, setCityVillage] = useState('');
  const [taluka, setTaluka] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Gujarat');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeVerified, setPincodeVerified] = useState(false);
  const [pincodePopup, setPincodePopup] = useState(false);
  const [photoOptionOpen, setPhotoOptionOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [roleDetailOpen, setRoleDetailOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>(DEFAULT_ROLE);
  const [pendingRole, setPendingRole] = useState<Role>(DEFAULT_ROLE);
  const [validationPopup, setValidationPopup] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [rulesPopup, setRulesPopup] = useState(true);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [registrationUnlocked, setRegistrationUnlocked] = useState(false);
  const [registrationLocked, setRegistrationLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkingMember, setCheckingMember] = useState(true);
  const [alreadyMemberId, setAlreadyMemberId] = useState<string | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [statusBanner, setStatusBanner] = useState({ visible: false, message: '', type: 'error' as 'error' | 'info' });
  const [showIDCard, setShowIDCard] = useState(false);
  const [registeredMemberData, setRegisteredMemberData] = useState<DemoMember | null>(null);

  const pageAnim = useRef(new Animated.Value(0)).current;
  const popupScale = useRef(new Animated.Value(0.82)).current;
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const rulesScale = useRef(new Animated.Value(0.88)).current;
  const rulesOpacity = useRef(new Animated.Value(0)).current;
  const pincodeRequest = useRef(0);

  const showStatusBanner = useCallback((message: string, type: 'error' | 'info' = 'error') => {
    setStatusBanner({ visible: true, message, type });
    setTimeout(() => setStatusBanner((prev) => ({ ...prev, visible: false })), 5000);
  }, []);

  useEffect(() => {
    Animated.timing(pageAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    Animated.parallel([Animated.spring(rulesScale, { toValue: 1, friction: 7, tension: 75, useNativeDriver: true }), Animated.timing(rulesOpacity, { toValue: 1, duration: 220, useNativeDriver: true })]).start();
  }, [pageAnim, rulesScale, rulesOpacity]);

  useEffect(() => {
    const init = async () => {
      try {
        const loginMobile = await getCachedMobile();
        if (!loginMobile) return setCheckingMember(false);
        const clean = loginMobile.replace(/\D/g, '').slice(-10);
        setMobile(clean);
        if (clean.length !== 10) return setCheckingMember(false);
        const profile = await fetchProfile(loginMobile);
        const member = await fetchMember(loginMobile);
        const memberExists = member && member.member_id && String(member.mobile || '').replace(/\D/g, '').slice(-10) === clean;

        if (memberExists) {
          setAlreadyMemberId(member!.member_id!);
          setMemberId(member!.member_id!);
          setRegistrationUnlocked(true);
          setRegistrationLocked(true);
          setRulesPopup(false);
          
          setName(member!.name || profile?.name || '');
          setPhoto(member!.photo_url || profile?.photo_url || null);
          setCityVillage(member!.city || '');
          setDistrict(member!.district || '');
          setPincode(profile?.pincode || '');
          setPincodeVerified(true);

          await syncProfileFromMember(clean, member!.name || profile?.name || '', member!.photo_url || profile?.photo_url || '', member!.city && member!.district ? `${member!.city}, ${member!.district}` : profile?.location_text || '', profile?.pincode || '');
          notifyProfileChanged();
          setRegisteredMemberData({ id: member!.member_id!, name: member!.name || '', mobile: member!.mobile || clean, address: [member!.city, member!.district].filter(Boolean).join(', '), photo: member!.photo_url || null, houseNo: '', areaLocality: '', pincode: '', district: member!.district || '', taluka: '', city: member!.city || '', state: 'Gujarat', service: member!.role || '', role: member!.role || 'સભ્ય', leadershipStatus: 'NONE' });
        } else if (profile) {
          if (profile.name && profile.name.trim()) setName(profile.name.trim());
          if (profile.photo_url && profile.photo_url.trim()) setPhoto(profile.photo_url.trim());
          if (profile.pincode) { setPincode(profile.pincode); setPincodeVerified(true); }
          if (profile.location_text) {
            const parts = profile.location_text.split(',').map((p) => p.trim()).filter(Boolean);
            if (parts.length >= 1) setCityVillage(parts[0] || '');
            if (parts.length >= 2) setTaluka(parts[1] || '');
            if (parts.length >= 3) setDistrict(parts[2] || '');
            if (parts.length >= 4) setState(parts[3] || 'Gujarat');
            setPincodeVerified(true);
          }
        }
      } catch (e) {} finally { setCheckingMember(false); }
    };
    init();
  }, []);

  const closeRulesPopup = useCallback(() => {
    Animated.parallel([Animated.timing(rulesScale, { toValue: 0.92, duration: 150, useNativeDriver: true }), Animated.timing(rulesOpacity, { toValue: 0, duration: 130, useNativeDriver: true })]).start(() => setRulesPopup(false));
  }, [rulesScale, rulesOpacity]);

  const acceptRulesAndContinue = () => { if (!rulesAccepted) return; setRegistrationUnlocked(true); closeRulesPopup(); };

  const showValidationPopup = (message: string) => {
    setValidationMessage(message); setValidationPopup(true); popupScale.setValue(0.82); popupOpacity.setValue(0);
    Animated.parallel([Animated.spring(popupScale, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }), Animated.timing(popupOpacity, { toValue: 1, duration: 220, useNativeDriver: true })]).start();
  };

  const closeValidationPopup = () => {
    Animated.parallel([Animated.timing(popupScale, { toValue: 0.88, duration: 160, useNativeDriver: true }), Animated.timing(popupOpacity, { toValue: 0, duration: 130, useNativeDriver: true })]).start(() => setValidationPopup(false));
  };

  const openGallery = async () => {
    if (registrationLocked) return; setPhotoOptionOpen(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return showStatusBanner('Gallery માટે permission આપવું પડશે.', 'error');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (!result.canceled && result.assets?.length) setPhoto(result.assets[0].uri);
  };

  const openCamera = async () => {
    if (registrationLocked) return; setPhotoOptionOpen(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return showStatusBanner('Camera માટે permission આપવું પડશે.', 'error');
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (!result.canceled && result.assets?.length) setPhoto(result.assets[0].uri);
  };

  const handlePincodeChange = (value: string) => {
    if (registrationLocked) return;
    const clean = value.replace(/\D/g, '').slice(0, 6);
    setPincode(clean); setPincodeVerified(false);
    if (clean.length < 6) { setCityVillage(''); setTaluka(''); setDistrict(''); setState('Gujarat'); return; }
    fetchPincode(clean);
  };

  const fetchPincode = async (pin: string) => {
    const requestId = ++pincodeRequest.current;
    setPincodeLoading(true); setPincodeVerified(false);
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await response.json();
      if (requestId !== pincodeRequest.current) return;
      const result = data?.[0];
      if (result?.Status === 'Success' && result.PostOffice?.length) {
        const post = result.PostOffice[0];
        setCityVillage(post.Name || ''); setDistrict(post.District || ''); setTaluka(post.Block || ''); setState(post.State || 'Gujarat'); setPincodeVerified(true);
      } else { setPincodePopup(true); }
    } catch { if (requestId === pincodeRequest.current) setPincodePopup(true); } finally { if (requestId === pincodeRequest.current) setPincodeLoading(false); }
  };

  const handleGetLocation = async () => {
    if (registrationLocked) return;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return showStatusBanner('Location permission આપો.', 'error');
      setPincodeLoading(true);
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const geocode = await Location.reverseGeocodeAsync({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      if (geocode && geocode.length > 0) {
        const addr = geocode[0];
        setPincode(addr.postalCode || ''); setCityVillage(addr.city || addr.subregion || ''); setTaluka(addr.district || ''); setDistrict(addr.region || ''); setState(addr.region || 'Gujarat');
        if (addr.postalCode) await fetchPincode(addr.postalCode); else setPincodeVerified(false);
      }
    } catch (e) { showStatusBanner('લોકેશન મળી શક્યું નથી.', 'error'); } finally { setPincodeLoading(false); }
  };

  const openRole = () => { if (registrationLocked) return; setPendingRole(selectedRole); setRoleOpen(true); };
  const selectRole = (role: Role) => { if (registrationLocked) return; setPendingRole(role); setRoleOpen(false); setTimeout(() => setRoleDetailOpen(true), 180); };
  const confirmRole = () => { if (registrationLocked) return; setSelectedRole(pendingRole); setRoleDetailOpen(false); };

  const submitMember = async () => {
    if (registrationLocked) return;
    
    const cleanName = name.trim(); const cleanMobile = normalizeMobile(mobile); const cleanHouse = houseNo.trim(); const cleanArea = areaLocality.trim(); const cleanPin = pincode.replace(/\D/g, ''); const cleanCity = cityVillage.trim(); const cleanTaluka = taluka.trim(); const cleanDistrict = district.trim(); const cleanState = state.trim() || 'Gujarat';
    if (!cleanName) return showValidationPopup('કૃપા કરીને તમારું નામ લખો.');
    if (cleanMobile.length !== 10) return showValidationPopup('સાચો મોબાઇલ નંબર લખો.');
    if (!cleanHouse) return showValidationPopup('કૃપા કરીને House No. લખો.');
    if (cleanPin.length !== 6) return showValidationPopup('સાચો પિનકોડ લખો.');
    if (!pincodeVerified) return showValidationPopup('સાચો Pincode verify કરો.');
    if (!cleanCity) return showValidationPopup('City / Village આપો.');
    if (!cleanTaluka) return showValidationPopup('Taluka આપો.');
    if (!cleanDistrict) return showValidationPopup('District આપો.');
    setSaving(true);
    try {
      const existing = await fetchMember(cleanMobile);
      if (existing && existing.member_id) { setSaving(false); return showStatusBanner('આ મોબાઇલ નંબરથી નોંધણી પહેલેથી થઈ ગઈ છે.', 'error'); }
      let uploadedPhotoUrl = photo || '';
      const isLocalFile = photo && (photo.startsWith('file://') || photo.startsWith('content://') || photo.startsWith('ph://'));
      if (isLocalFile) { const url = await uploadAvatar(photo, cleanMobile); uploadedPhotoUrl = url || photo; }
      const locationText = [cleanCity, cleanTaluka, cleanDistrict, cleanState].filter(Boolean).join(', ');
      
      // Create member (DB auto-generates member_id)
      const newMember = await createMember({ mobile: cleanMobile, name: cleanName, photo_url: uploadedPhotoUrl, role: selectedRole.gujarati, district: cleanDistrict, city: cleanCity, status: 'active' });
      if (!newMember) { setSaving(false); return showValidationPopup('સભ્ય save કરવામાં સમસ્યા આવી.'); }
      
      const supabaseMemberId = newMember.member_id || ''; // Handled by DB trigger now
      
      await syncProfileFromMember(cleanMobile, cleanName, uploadedPhotoUrl, locationText, cleanPin);
      notifyProfileChanged();
      const demoMember: DemoMember = { id: supabaseMemberId, name: cleanName, mobile: cleanMobile, address: [cleanHouse, cleanArea, cleanCity, cleanTaluka, cleanDistrict, cleanState, 'India'].filter(Boolean).join(', '), photo: uploadedPhotoUrl, houseNo: cleanHouse, areaLocality: cleanArea, pincode: cleanPin, district: cleanDistrict, taluka: cleanTaluka, city: cleanCity, state: cleanState, service: selectedRole.name, role: selectedRole.gujarati, leadershipStatus: 'NONE' };
      setMemberId(supabaseMemberId); setMobile(cleanMobile); setRegistrationLocked(true); setPhotoOptionOpen(false); setRoleOpen(false); setRoleDetailOpen(false); setRegisteredMemberData(demoMember);
      setShowThankYou(true); setSaving(false);
    } catch (err: any) { setSaving(false); showValidationPopup('સભ્ય save કરવામાં સમસ્યા આવી.'); }
  };

  const roleIcon = (id: number): keyof typeof Ionicons.glyphMap => {
    if (id === 1) return 'mic-outline'; if (id === 2) return 'person-outline'; if (id === 3) return 'walk-outline'; if (id === 4) return 'heart-outline'; if (id === 5) return 'share-social-outline'; if (id === 6) return 'videocam-outline'; return 'medkit-outline';
  };

  if (checkingMember) return <AddMemberSkeleton />;

  if (alreadyMemberId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F4EE' }} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 30, flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
          
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{ 
              width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFFFFF', 
              alignItems: 'center', justifyContent: 'center', marginBottom: 16, 
              borderWidth: 1, borderColor: '#E1DFD7', elevation: 6, shadowColor: '#17483D', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16 
            }}>
              <Image source={TEAM_LOGO} style={{ width: 54, height: 54, borderRadius: 27 }} resizeMode="contain" />
            </View>
            
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#202B29', letterSpacing: -0.5, marginBottom: 4 }}>
              અભિનંદન! 🎉
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#17483D', marginBottom: 10 }}>
              તમારી સેવાયાત્રા શરૂ થઈ.
            </Text>
            
            <Text style={{ fontSize: 13, color: '#7A817D', textAlign: 'center', lineHeight: 20, paddingHorizontal: 10, fontWeight: '500' }}>
              તમે હવે <Text style={{ fontWeight: '800', color: '#17483D' }}>TEAM NYARI Foundation</Text> સાથે માનવતાની આ સુંદર પહેલનો હિસ્સો છો.
            </Text>
          </View>

          <View style={{ 
            width: '100%', marginBottom: 24, elevation: 6, shadowColor: '#17483D', 
            shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 15 
          }}>
            <View style={{ 
              width: '100%', backgroundColor: '#FFFFFF', borderRadius: 20, paddingVertical: 16, paddingHorizontal: 18, 
              borderWidth: 1, borderColor: '#E1DFD7', overflow: 'hidden', position: 'relative' 
            }}>
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#B4935A' }} />
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="shield-checkmark" size={15} color="#B4935A" />
                  <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#7A817D', letterSpacing: 0.5 }}>સભ્ય ઓળખ નંબર</Text>
                </View>
                <Ionicons name="wifi" size={18} color="#E1DFD7" style={{ transform: [{ rotate: '90deg' }] }} />
              </View>

              <View style={{ marginVertical: 6 }}>
                <Text style={{ fontSize: 26, fontWeight: '900', color: '#17483D', letterSpacing: 1.2 }}>{alreadyMemberId}</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 }}>
                <View>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 4 }}>સ્ટેટસ</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8EEE9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 5 }}>
                    <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#587567' }} />
                    <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#17483D' }}>સક્રિય સભ્ય</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#7A817D', letterSpacing: 0.5 }}>TEAM NYARI</Text>
                  <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#17483D', letterSpacing: 0.5, marginTop: 2 }}>FOUNDATION</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ width: '100%', gap: 10 }}>
            <Pressable 
              onPress={() => setShowIDCard(true)} 
              style={({ pressed }) => [
                { width: '100%', borderRadius: 26, overflow: 'hidden', elevation: 4, shadowColor: '#17483D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10 },
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
              ]}
            >
              <LinearGradient colors={['#17483D', '#0E352D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Ionicons name="card-outline" size={20} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 }}>તમારું ID Card જુઓ</Text>
              </LinearGradient>
            </Pressable>

            <Pressable 
              onPress={() => navigation?.goBack()} 
              style={({ pressed }) => [
                { width: '100%', height: 52, borderRadius: 26, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E1DFD7', alignItems: 'center', justifyContent: 'center' },
                pressed && { opacity: 0.8, backgroundColor: '#F9F8F6' }
              ]}
            >
              <Text style={{ color: '#202B29', fontSize: 14, fontWeight: '700' }}>હોમ પર પાછા જાઓ</Text>
            </Pressable>
          </View>

        </ScrollView>

        <IDCardModal visible={showIDCard} onClose={() => setShowIDCard(false)} member={registeredMemberData} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[styles.flex, { opacity: pageAnim, transform: [{ translateY: pageAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.logoBox}><Image source={TEAM_LOGO} style={styles.logo} resizeMode="contain" /></View>
              <View style={styles.brandTextWrap}><Text style={styles.brand}>TEAM NYARI</Text><Text style={styles.headerTitle}>નવા સભ્ય બનો</Text></View>
            </View>
          </View>

          <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {statusBanner.visible && (
              <View style={{ marginHorizontal: 16, marginTop: 10, marginBottom: 4, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: statusBanner.type === 'error' ? '#E5C7C7' : '#C2D6CB', backgroundColor: statusBanner.type === 'error' ? '#FBEAEA' : '#E8EEE9', flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <Ionicons name={statusBanner.type === 'error' ? 'alert-circle' : 'information-circle'} size={18} color={statusBanner.type === 'error' ? '#C94B4B' : C.rama} style={{ marginTop: 2 }} />
                <Text style={{ flex: 1, fontSize: 12.5, lineHeight: 20, color: statusBanner.type === 'error' ? '#9E3535' : C.ramaDark, fontWeight: '600' }}>{statusBanner.message}</Text>
                <Pressable onPress={() => setStatusBanner((p) => ({ ...p, visible: false }))} hitSlop={10}><Ionicons name="close" size={16} color={statusBanner.type === 'error' ? '#C94B4B' : C.rama} style={{ opacity: 0.6 }} /></Pressable>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.profileCard}>
                <Pressable onPress={() => setPhotoOptionOpen(true)} style={styles.profilePhotoCircle} disabled={registrationLocked}>
                  {photo ? <Image source={{ uri: photo }} style={styles.profileImage} resizeMode="cover" /> : <View style={styles.profilePlaceholder}><Ionicons name="camera-outline" size={29} color={C.rama} /></View>}
                </Pressable>
                <View style={styles.profileText}><Text style={styles.profileTitle}>Profile Photo</Text><Text style={styles.profileHint}>તમારો clear photo પસંદ કરો</Text></View>
                <Pressable onPress={() => setPhotoOptionOpen(true)} style={styles.photoAction} disabled={registrationLocked}><Ionicons name={photo ? 'create-outline' : 'camera-outline'} size={18} color={C.rama} /></Pressable>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <View style={styles.sectionIcon}><Ionicons name="person-outline" size={18} color={C.rama} /></View>
                <View><Text style={styles.sectionTitle}>સભ્યની માહિતી</Text><Text style={styles.sectionSub}>તમારી મૂળભૂત માહિતી</Text></View>
              </View>

              <View style={styles.card}>
                <Field label="નામ" placeholder="તમારું પૂરું નામ" value={name} onChangeText={setName} icon="person-outline" editable={!registrationLocked} />
                <Field label="મોબાઇલ નંબર" placeholder="10 અંકનો મોબાઇલ નંબર" value={mobile} onChangeText={() => {}} keyboardType="phone-pad" icon="call-outline" maxLength={10} editable={false} />
                <View style={styles.innerDivider} />
                <Text style={styles.addressMiniTitle}>સરનામું</Text>
                <View style={styles.row}>
                  <View style={styles.half}><Field label="House No." placeholder="House / Flat No." value={houseNo} onChangeText={setHouseNo} icon="home-outline" editable={!registrationLocked} /></View>
                  <View style={styles.half}><Field label="Street / Opp / Near" placeholder="Street / Opp / Near" value={areaLocality} onChangeText={setAreaLocality} icon="navigate-outline" editable={!registrationLocked} /></View>
                </View>
                <View style={styles.pincodeWrap}>
                  <Field label="Pincode" placeholder="6 અંકનો પિનકોડ" value={pincode} onChangeText={handlePincodeChange} keyboardType="number-pad" icon="location-outline" maxLength={6} editable={!registrationLocked} />
                  {!registrationLocked && (
                    <Pressable onPress={handleGetLocation} disabled={pincodeLoading} style={styles.gpsButton}><Ionicons name="locate" size={14} color="#FFFFFF" /><Text style={styles.gpsButtonText}>GPS</Text></Pressable>
                  )}
                  <View style={styles.pincodeStatus}>
                    {pincodeLoading ? <ActivityIndicator size="small" color={C.rama} /> : pincodeVerified ? <View style={styles.verifiedBadge}><Ionicons name="checkmark-circle" size={20} color={C.green} /><Text style={styles.verifiedText}>Verified</Text></View> : null}
                  </View>
                </View>
                <Field label="City / Village" placeholder="City અથવા Village" value={cityVillage} onChangeText={setCityVillage} icon="business-outline" editable={!registrationLocked} />
                <View style={styles.row}>
                  <View style={styles.half}><Field label="Taluka" placeholder="Taluka" value={taluka} onChangeText={setTaluka} icon="map-outline" editable={!registrationLocked} /></View>
                  <View style={styles.half}><Field label="District" placeholder="District" value={district} onChangeText={setDistrict} icon="map-outline" editable={!registrationLocked} /></View>
                </View>
                <Field label="State" placeholder="Gujarat" value={state || 'Gujarat'} onChangeText={setState} icon="globe-outline" editable={!registrationLocked} />
                <View style={styles.countryBox}>
                  <Ionicons name="flag-outline" size={18} color={C.rama} />
                  <View style={styles.countryText}><Text style={styles.countryLabel}>Country</Text><Text style={styles.countryValue}>India</Text></View>
                  <Ionicons name="lock-closed-outline" size={15} color={C.muted} />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <View style={styles.sectionIcon}><Ionicons name="people-outline" size={18} color={C.rama} /></View>
                <View><Text style={styles.sectionTitle}>Team Role</Text><Text style={styles.sectionSub}>તમારી ટીમની જવાબદારી પસંદ કરો</Text></View>
              </View>
              <Pressable onPress={openRole} style={styles.roleCard} disabled={registrationLocked}>
                <View style={styles.roleIconBox}><Ionicons name="people-outline" size={23} color={C.rama} /></View>
                <View style={styles.roleTextWrap}><Text style={styles.roleGujarati}>{selectedRole.gujarati}</Text><Text style={styles.roleEnglish}>{selectedRole.name}</Text></View>
                {!registrationLocked && <View style={styles.roleChange}><Text style={styles.roleChangeText}>Change</Text><Ionicons name="chevron-forward" size={18} color={C.rama} /></View>}
              </Pressable>
            </View>

            <Pressable disabled={saving || registrationLocked} onPress={submitMember} style={[styles.submitWrap, (saving || registrationLocked) && styles.submitDisabled]}>
              <LinearGradient 
                colors={registrationLocked ? ['#A0AAB2', '#8B969E'] : saving ? ['#BEB7B1', '#A9A19A'] : [C.rama, C.ramaDark]} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }} 
                style={styles.submitButton}
              >
                <View style={styles.submitIcon}>
                  {registrationLocked ? (
                    <Ionicons name="lock-closed" size={20} color="#8B969E" />
                  ) : saving ? (
                    <ActivityIndicator size="small" color={C.rama} />
                  ) : (
                    <Ionicons name="person-add-outline" size={20} color={C.rama} />
                  )}
                </View>
                <Text style={styles.submitText}>
                  {registrationLocked ? 'તમે સભ્ય બની ચૂક્યા છો ✅' : saving ? 'સેવ થઈ રહ્યું છે...' : 'સભ્ય તરીકે જોડાઓ'}
                </Text>
                {!registrationLocked && <Ionicons name="arrow-forward" size={21} color="#FFFFFF" />}
              </LinearGradient>
            </Pressable>
            
            <Text style={styles.bottomNote}>Team Nyari સાથે જોડાઈને સેવાકીય કાર્યમાં સહભાગી બનો ❤️</Text><View style={{ height: 35 }} />
          </ScrollView>
        </Animated.View>

        <RulesModal visible={rulesPopup} onClose={closeRulesPopup} rulesAccepted={rulesAccepted} setRulesAccepted={setRulesAccepted} onAccept={acceptRulesAndContinue} rulesScale={rulesScale} rulesOpacity={rulesOpacity} memberRules={MEMBER_RULES} />
        <PhotoOptionModal visible={photoOptionOpen} onClose={() => setPhotoOptionOpen(false)} openCamera={openCamera} openGallery={openGallery} />
        <PincodeErrorModal visible={pincodePopup} onClose={() => setPincodePopup(false)} />
        <ValidationModal visible={validationPopup} onClose={closeValidationPopup} validationMessage={validationMessage} popupScale={popupScale} popupOpacity={popupOpacity} />
        <RoleSelectionModal visible={roleOpen} onClose={() => setRoleOpen(false)} pendingRole={pendingRole} selectRole={selectRole} roles={ROLES} roleIcon={roleIcon} />
        <RoleDetailModal visible={roleDetailOpen} onClose={() => setRoleDetailOpen(false)} pendingRole={pendingRole} confirmRole={confirmRole} onChangeRole={() => { setRoleDetailOpen(false); setTimeout(() => setRoleOpen(true), 180); }} roleIcon={roleIcon} />
        <ThankYouModal visible={showThankYou} memberName={name || 'સભ્ય'} memberId={memberId} onClose={() => { setShowThankYou(false); setTimeout(() => setShowIDCard(true), 350); }} />
        <IDCardModal visible={showIDCard} onClose={() => setShowIDCard(false)} member={registeredMemberData} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default React.memo(AddMemberScreen);