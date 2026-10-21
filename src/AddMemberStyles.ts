// src/AddMemberStyles.ts
import { StyleSheet } from 'react-native';

export const C = {
  // ─────────────────────────────────────────
  // PREMIUM WARM CREAM & SAGE THEME
  // ─────────────────────────────────────────
  bg: '#F6F4EE',          // ક્રીમ બેકગ્રાઉન્ડ
  white: '#FFFFFF',

  text: '#202B29',        // ડાર્ક ચારકોલ
  muted: '#7A817D',       // લાઈટ ગ્રે-ગ્રીન

  border: '#E1DFD7',      // સોફ્ટ બોર્ડર

  // Main brand colors
  rama: '#17483D',        // ડાર્ક સેજ ગ્રીન (બટન અને મુખ્ય એક્સેન્ટ)
  ramaDark: '#0E352D',    // વધુ ડાર્ક સેજ
  ramaSoft: '#E8EEE9',    // લાઈટ સેજ બેકગ્રાઉન્ડ

  // Accent
  gold: '#B4935A',        // ગોલ્ડ કલર (આઈકોન અને હાઈલાઈટ માટે)
  goldSoft: '#F2EBDD',    // લાઈટ ગોલ્ડ બેકગ્રાઉન્ડ

  // Success
  green: '#587567',       // સેજ ગ્રીન
  greenDark: '#405B4F',
  greenSoft: '#E8EEE9',

  // Error
  red: '#C94B4B',
  redSoft: '#FBEAEA',

  shadow: '#9DB4B8',
  softGrey: '#F9F8F6',
};

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },

  // ─────────────────────────────────────────
  // HEADER
  // ─────────────────────────────────────────
  header: {
    backgroundColor: C.white,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logoBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logo: { width: 45, height: 45 },
  brandTextWrap: { marginLeft: 11, flex: 1 },
  brand: { color: '#202B29', fontSize: 17, fontWeight: '900', letterSpacing: 1.3 },
  headerTitle: { marginTop: 1, color: C.text, fontSize: 16, fontWeight: '800', fontFamily: 'HindVadodara_700Bold' },

  // ─────────────────────────────────────────
  // CONTENT
  // ─────────────────────────────────────────
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  section: { marginBottom: 16 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  sectionIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: C.ramaSoft, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  sectionTitle: { color: C.text, fontSize: 16, fontWeight: '800', fontFamily: 'HindVadodara_700Bold' },
  sectionSub: { color: C.muted, fontSize: 11.5, marginTop: -1, fontFamily: 'HindVadodara_400Regular' },

  // ─────────────────────────────────────────
  // COMMON CARD
  // ─────────────────────────────────────────
  card: {
    backgroundColor: C.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    shadowColor: '#0E352D',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  // ─────────────────────────────────────────
  // PROFILE
  // ─────────────────────────────────────────
  profileCard: {
    minHeight: 96,
    backgroundColor: C.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePhotoCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: C.ramaSoft, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', borderWidth: 2, borderColor: '#D3DFD7',
  },
  profileImage: { width: '100%', height: '100%' },
  profilePlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  profileText: { flex: 1, marginLeft: 13 },
  profileTitle: { color: C.text, fontSize: 15, fontWeight: '800' },
  profileHint: { color: C.muted, fontSize: 11.5, marginTop: 3, fontFamily: 'HindVadodara_400Regular' },
  photoAction: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.ramaSoft, alignItems: 'center', justifyContent: 'center' },

  // ─────────────────────────────────────────
  // FORM FIELDS
  // ─────────────────────────────────────────
  fieldWrap: { marginBottom: 12 },
  fieldDisabled: { opacity: 0.78 },
  fieldLabel: { color: C.text, fontSize: 12.5, fontWeight: '700', marginBottom: 6, fontFamily: 'HindVadodara_700Bold' },
  inputBox: {
    minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: C.border,
    backgroundColor: '#FCFBF9', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center',
  },
  inputBoxDisabled: { backgroundColor: '#F4F2ED', borderColor: '#E1DFD7' },
  input: { flex: 1, color: C.text, fontSize: 13.5, marginLeft: 9, paddingVertical: 0, fontFamily: 'HindVadodara_400Regular' },
  
  innerDivider: { height: 1, backgroundColor: '#EEEDE7', marginVertical: 4, marginBottom: 14 },
  addressMiniTitle: { color: C.rama, fontSize: 13.5, fontWeight: '800', marginBottom: 11, fontFamily: 'HindVadodara_700Bold' },
  row: { flexDirection: 'row', gap: 9 },
  half: { flex: 1 },
  
  pincodeWrap: { position: 'relative' },
  pincodeStatus: { position: 'absolute', right: 12, bottom: 23 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.greenSoft, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 4 },
  verifiedText: { color: C.greenDark, fontSize: 9.5, fontWeight: '800', marginLeft: 3 },
  
  gpsButton: {
    position: 'absolute', right: 95, bottom: 21, flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.rama, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, zIndex: 10,
  },
  gpsButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', marginLeft: 4 },

  countryBox: {
    minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: C.border,
    backgroundColor: '#F9F8F6', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 4,
  },
  countryText: { flex: 1, marginLeft: 9 },
  countryLabel: { color: C.muted, fontSize: 9.5 },
  countryValue: { color: C.text, fontSize: 13, fontWeight: '800', marginTop: 1 },
  lockedCard: { backgroundColor: '#F4F2ED', borderColor: '#E1DFD7' },

  // ─────────────────────────────────────────
  // ROLE CARD
  // ─────────────────────────────────────────
  roleCard: {
    minHeight: 76, backgroundColor: C.white, borderWidth: 1, borderColor: C.border,
    borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center',
  },
  roleIconBox: { width: 48, height: 48, borderRadius: 15, backgroundColor: C.ramaSoft, alignItems: 'center', justifyContent: 'center' },
  roleTextWrap: { flex: 1, marginLeft: 11 },
  roleGujarati: { color: C.text, fontSize: 14, fontWeight: '800', fontFamily: 'HindVadodara_700Bold' },
  roleEnglish: { color: C.muted, fontSize: 10.5, marginTop: 2 },
  roleChange: { flexDirection: 'row', alignItems: 'center', paddingLeft: 8 },
  roleChangeText: { color: C.rama, fontSize: 11, fontWeight: '800', marginRight: 1 },

  // ─────────────────────────────────────────
  // SUBMIT BUTTON (Gold/Sage premium look)
  // ─────────────────────────────────────────
  submitWrap: { marginTop: 2, borderRadius: 17, overflow: 'hidden', elevation: 4 },
  submitDisabled: { elevation: 1 },
  submitButton: { minHeight: 57, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  submitIcon: { width: 31, height: 31, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', flex: 1, fontFamily: 'HindVadodara_700Bold' },
  bottomNote: { color: C.muted, textAlign: 'center', fontSize: 11, marginTop: 12, fontFamily: 'HindVadodara_400Regular' },

  // ─────────────────────────────────────────
  // MODALS (Rules, Photo, etc. - Cream Theme)
  // ─────────────────────────────────────────
  rulesOverlay: { flex: 1, backgroundColor: 'rgba(23,72,61,0.40)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 24 },
  rulesCard: { width: '100%', maxWidth: 430, maxHeight: '92%', backgroundColor: '#FFFFFF', borderRadius: 28, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  rulesTop: { paddingHorizontal: 17, paddingTop: 17, paddingBottom: 13, flexDirection: 'row', alignItems: 'center' },
  rulesTitleIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center' },
  rulesTitleWrap: { flex: 1, marginLeft: 11 },
  rulesBrand: { color: '#111111', fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  rulesTitle: { color: C.text, fontSize: 17, fontWeight: '800', marginTop: 1, fontFamily: 'HindVadodara_700Bold' },
  rulesDivider: { height: 1, backgroundColor: C.border },
  rulesScroll: { flexGrow: 0 },
  rulesContent: { paddingHorizontal: 14, paddingTop: 13 },
  
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FCFBF9', borderWidth: 1, borderColor: '#EEEDE7', borderRadius: 16, padding: 11, marginBottom: 8 },
  ruleNumber: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.ramaSoft, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  ruleNumberText: { color: C.ramaDark, fontSize: 10, fontWeight: '900' },
  ruleBody: { flex: 1 },
  ruleLabel: { color: C.rama, fontSize: 9, fontWeight: '900', letterSpacing: 0.8, marginBottom: 2 },
  ruleText: { color: C.text, fontSize: 11.2, lineHeight: 18, fontFamily: 'HindVadodara_400Regular' },

  acceptRow: { marginHorizontal: 14, marginTop: 8, paddingHorizontal: 11, paddingVertical: 10, borderWidth: 1, borderColor: C.border, borderRadius: 15, backgroundColor: '#F9F8F6', flexDirection: 'row', alignItems: 'center' },
  acceptRowActive: { backgroundColor: C.ramaSoft, borderColor: '#C2D6CB' },
  checkbox: { width: 23, height: 23, borderRadius: 7, borderWidth: 1.7, borderColor: '#B9CBCD', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  checkboxActive: { backgroundColor: C.rama, borderColor: C.rama },
  acceptText: { flex: 1, color: C.text, fontSize: 11.2, lineHeight: 17, fontFamily: 'HindVadodara_400Regular' },
  rulesContinueWrap: { marginHorizontal: 14, marginTop: 10, borderRadius: 15, overflow: 'hidden' },
  rulesContinue: { minHeight: 50, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  rulesContinueText: { flex: 1, color: '#FFFFFF', fontSize: 12.5, fontWeight: '800', fontFamily: 'HindVadodara_700Bold' },
  rulesFooter: { color: C.muted, fontSize: 9.5, textAlign: 'center', marginTop: 8, marginBottom: 11, fontFamily: 'HindVadodara_400Regular' },

  modalCenterBg: { flex: 1, backgroundColor: 'rgba(23,72,61,0.40)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  
  photoOptionCard: { width: '100%', maxWidth: 390, backgroundColor: '#FFFFFF', borderRadius: 25, padding: 21, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  photoOptionIcon: { width: 58, height: 58, borderRadius: 19, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 11 },
  photoOptionTitle: { color: C.text, fontSize: 18, fontWeight: '800', fontFamily: 'HindVadodara_700Bold' },
  photoOptionSub: { color: C.muted, fontSize: 12, marginTop: 4, fontFamily: 'HindVadodara_400Regular' },
  photoOptionRow: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 17 },
  photoChoice: { flex: 1, minHeight: 95, borderWidth: 1, borderColor: C.border, borderRadius: 17, backgroundColor: '#FCFBF9', alignItems: 'center', justifyContent: 'center' },
  photoChoiceIcon: { width: 45, height: 45, borderRadius: 14, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  photoChoiceText: { color: C.text, fontSize: 12.5, fontWeight: '800' },
  photoCancel: { width: '100%', height: 45, borderRadius: 14, backgroundColor: C.softGrey, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  photoCancelText: { color: C.muted, fontSize: 12.5, fontWeight: '800' },

  pinPopupCard: { width: '100%', maxWidth: 390, backgroundColor: '#FFFFFF', borderRadius: 25, padding: 21, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  pinErrorIcon: { width: 61, height: 61, borderRadius: 20, backgroundColor: C.redSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  pinPopupTitle: { color: C.text, fontSize: 18, fontWeight: '800', textAlign: 'center', fontFamily: 'HindVadodara_700Bold' },
  pinPopupText: { color: C.muted, fontSize: 12.5, lineHeight: 21, textAlign: 'center', marginTop: 8, fontFamily: 'HindVadodara_400Regular' },
  pinErrorButton: { width: '100%', minHeight: 48, borderRadius: 14, marginTop: 17, backgroundColor: C.rama, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  pinPopupButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', marginRight: 6, fontFamily: 'HindVadodara_700Bold' },

  validationCard: { width: '100%', maxWidth: 390, backgroundColor: '#FFFFFF', borderRadius: 27, padding: 21, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  validationIcon: { width: 64, height: 64, borderRadius: 21, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 11 },
  validationTitle: { color: C.text, fontSize: 20, fontWeight: '800', textAlign: 'center', fontFamily: 'HindVadodara_700Bold' },
  validationSub: { color: C.muted, fontSize: 11.5, textAlign: 'center', marginTop: 3, fontFamily: 'HindVadodara_400Regular' },
  validationMessageBox: { width: '100%', minHeight: 58, backgroundColor: '#F9F8F6', borderWidth: 1, borderColor: C.border, borderRadius: 16, marginTop: 16, paddingHorizontal: 12, paddingVertical: 11, flexDirection: 'row', alignItems: 'center' },
  validationMessage: { flex: 1, color: C.text, fontSize: 12.5, lineHeight: 19, marginLeft: 8, fontFamily: 'HindVadodara_400Regular' },
  validationButton: { width: '100%', minHeight: 49, borderRadius: 15, backgroundColor: C.rama, marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  validationButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', marginRight: 7, fontFamily: 'HindVadodara_700Bold' },

  modalBg: { flex: 1, backgroundColor: 'rgba(23,72,61,0.40)', justifyContent: 'flex-end' },
  roleModal: { maxHeight: '88%', backgroundColor: C.white, borderTopLeftRadius: 27, borderTopRightRadius: 27, paddingTop: 10, paddingHorizontal: 16, paddingBottom: 16 },
  modalHandle: { width: 42, height: 4, borderRadius: 10, backgroundColor: '#D3DFD7', alignSelf: 'center', marginBottom: 15 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  modalTitle: { color: C.text, fontSize: 18, fontWeight: '800', fontFamily: 'HindVadodara_700Bold' },
  modalSub: { color: C.muted, fontSize: 11, marginTop: 1, fontFamily: 'HindVadodara_400Regular' },
  closeButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.softGrey, alignItems: 'center', justifyContent: 'center' },
  roleList: { paddingBottom: 8 },
  
  roleOption: { minHeight: 66, borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', marginBottom: 9, backgroundColor: '#FCFBF9' },
  roleOptionActive: { borderColor: '#C2D6CB', backgroundColor: C.ramaSoft },
  roleOptionIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: C.ramaSoft, alignItems: 'center', justifyContent: 'center' },
  roleOptionIconActive: { backgroundColor: C.rama },
  roleOptionText: { flex: 1, marginLeft: 10 },
  roleOptionGujarati: { color: C.text, fontSize: 13.5, fontWeight: '800', fontFamily: 'HindVadodara_700Bold' },
  roleOptionEnglish: { color: C.muted, fontSize: 10, marginTop: 1 },
  radio: { width: 23, height: 23, borderRadius: 12, borderWidth: 1.5, borderColor: '#C4D2D5', alignItems: 'center', justifyContent: 'center' },
  radioActive: { backgroundColor: C.rama, borderColor: C.rama },

  roleDetailCard: { width: '92%', maxWidth: 410, maxHeight: '88%', backgroundColor: '#FFFFFF', borderRadius: 28, padding: 19, borderWidth: 1, borderColor: C.border },
  roleDetailIcon: { width: 62, height: 62, borderRadius: 21, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 10 },
  roleDetailTitle: { color: C.text, fontSize: 20, fontWeight: '800', textAlign: 'center', fontFamily: 'HindVadodara_700Bold' },
  roleDetailEnglish: { color: C.rama, fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 1 },
  roleDesignationBadge: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: C.goldSoft, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6, marginTop: 10 },
  roleDesignationText: { color: C.text, fontSize: 10.5, fontWeight: '800', marginLeft: 5 },
  roleInfoBox: { backgroundColor: '#F9F8F6', borderWidth: 1, borderColor: C.border, borderRadius: 17, padding: 13, marginTop: 15 },
  roleInfoHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  roleInfoIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: C.ramaSoft, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  roleInfoTitle: { color: C.text, fontSize: 13, fontWeight: '800', fontFamily: 'HindVadodara_700Bold' },
  roleInfoText: { color: C.muted, fontSize: 11.5, lineHeight: 19, fontFamily: 'HindVadodara_400Regular' },
  roleRuleBox: { backgroundColor: C.ramaSoft, borderWidth: 1, borderColor: '#C2D6CB', borderRadius: 17, padding: 13, marginTop: 10 },
  roleRuleIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  roleRuleTitle: { color: C.ramaDark, fontSize: 13, fontWeight: '800', fontFamily: 'HindVadodara_700Bold' },
  roleRuleText: { color: '#405B4F', fontSize: 11.5, lineHeight: 19, fontFamily: 'HindVadodara_400Regular' },
  roleNoteRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12, paddingHorizontal: 3 },
  roleNoteText: { flex: 1, color: C.muted, fontSize: 10.5, lineHeight: 17, marginLeft: 7, fontFamily: 'HindVadodara_400Regular' },
  roleConfirmButton: { minHeight: 50, borderRadius: 15, backgroundColor: C.rama, marginTop: 14, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  roleConfirmIcon: { width: 29, height: 29, borderRadius: 9, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  roleConfirmText: { flex: 1, color: '#FFFFFF', fontSize: 13, fontWeight: '800', fontFamily: 'HindVadodara_700Bold' },
  changeRoleButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  changeRoleText: { color: C.muted, fontSize: 11.5, fontWeight: '700', marginLeft: 5, fontFamily: 'HindVadodara_400Regular' },
});