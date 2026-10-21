// src/AboutScreen.tsx
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StatusBar, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HindVadodara_400Regular, HindVadodara_500Medium, HindVadodara_600SemiBold, HindVadodara_700Bold } from '@expo-google-fonts/hind-vadodara';
import { fetchAppContent, AppContent } from './supabaseClient';

const TEAM_LOGO = require('../asset.png');
const COLORS = { bg: '#F6F9F8', white: '#FFFFFF', primary: '#0E7B6E', primaryDark: '#0A5F55', primarySoft: '#E2F0ED', text: '#10302B', muted: '#6F8782', border: '#E1EBE8' };

const AboutScreen = () => {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ HindRegular: HindVadodara_400Regular, HindMedium: HindVadodara_500Medium, HindSemiBold: HindVadodara_600SemiBold, HindBold: HindVadodara_700Bold });
  const [dbData, setDbData] = useState<AppContent | null>(null);

  useEffect(() => {
    fetchAppContent('about_us').then((data) => {
      if (data) setDbData(data);
    });
  }, []);

  if (!fontsLoaded) return <View style={[styles.loadingScreen, { paddingTop: insets.top }]}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  const fontFamilyRegular = fontsLoaded ? 'HindRegular' : undefined;
  const fontFamilyMedium = fontsLoaded ? 'HindMedium' : undefined;
  const fontFamilyBold = fontsLoaded ? 'HindBold' : undefined;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }}>
        
        <View style={styles.centerHeader}>
          <View style={styles.logoFrame}><Image source={TEAM_LOGO} style={styles.logoImage} resizeMode="contain" /></View>
          <Text style={[styles.brandTitle, { fontFamily: fontFamilyBold }]}>{dbData?.title || 'TEAM NYARI'}</Text>
          <Text style={[styles.brandSubtitle, { fontFamily: fontFamilyMedium }]}>{dbData?.subtitle || 'માનવતા • પ્રામાણિકતા • જવાબદારી'}</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}><Ionicons name="shield-checkmark" size={13} color="#FFFFFF" /><Text style={[styles.heroBadgeText, { fontFamily: fontFamilyBold }]}>પારદર્શિતા • પ્રામાણિકતા • જવાબદારી</Text></View>
          <Text style={[styles.heroHeading, { fontFamily: fontFamilyBold }]}>અમારો મુખ્ય હેતુ</Text>
          <Text style={[styles.heroBody, { fontFamily: fontFamilyRegular }]}>
            {dbData?.description || 'અમારો હેતુ માત્ર દાન એકત્ર કરવાનો નથી, પરંતુ જરૂરિયાતમંદ પરિવારો સુધી સાચી મદદ પહોંચાડવાનો, તેમના જીવનમાં આશાનું કિરણ પ્રગટાવવાનો અને દાન આપનાર દરેક વ્યક્તિના વિશ્વાસને જાળવી રાખવાનો છે.'}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}><View style={styles.cardIconBox}><Ionicons name="gift-outline" size={18} color={COLORS.primary} /></View><Text style={[styles.cardTitle, { fontFamily: fontFamilyBold }]}>તમારું દાન, પરિવાર સુધી — પુરાવા સાથે</Text></View>
          <Text style={[styles.cardBody, { fontFamily: fontFamilyRegular }]}>તમે જે જરૂરિયાતમંદ પરિવાર માટે દાન આપો છો, તે રકમ Team Nyari દ્વારા સંબંધિત પરિવારના સહાય કેસ માટે નિર્ધારિત સમયગાળા દરમિયાન એકત્રિત કરવામાં આવે છે.{'\n\n'}આ સમયગાળો સંબંધિત કેસના વિડિયો વિભાગમાં દર્શાવવામાં આવે છે. નિર્ધારિત સમયગાળો પૂર્ણ થયા પછી, તે કેસ માટે એકત્રિત થયેલી સંપૂર્ણ દાનની રકમ સંબંધિત પરિવારને આપવામાં આવશે.{'\n\n'}સહાયની રકમ પરિવાર સુધી પહોંચાડ્યા બાદ, ચુકવણીના ઉપલબ્ધ પુરાવા — જેમ કે બેંક પાસબુકની સંબંધિત એન્ટ્રીનો ફોટો, UPI અથવા બેંક ટ્રાન્સફરનો સ્ક્રીનશૉટ, અથવા રોકડ સહાય આપવામાં આવી હોય તો તેની યોગ્ય નોંધ અને ફોટો/વિડિયો — સંબંધિત કેસના વિડિયો વિભાગમાં મૂકવામાં આવશે.{'\n\n'}આ રીતે દાન આપનાર વ્યક્તિ સંબંધિત પરિવારની સહાય પ્રક્રિયા અને રકમ પહોંચાડ્યાના ઉપલબ્ધ પુરાવા જોઈ શકશે.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}><View style={styles.cardIconBox}><Ionicons name="git-network-outline" size={18} color={COLORS.primary} /></View><Text style={[styles.cardTitle, { fontFamily: fontFamilyBold }]}>તમારા દાનની સંપૂર્ણ પ્રક્રિયા</Text></View>
          <View style={styles.stepsContainer}>
            <StepItem number="01" title="દાન એકત્રિત થાય છે" desc="સંબંધિત પરિવારના કેસ માટે નિર્ધારિત સમયગાળા દરમિયાન." fontBold={fontFamilyBold} fontRegular={fontFamilyRegular} />
            <StepItem number="02" title="સમયગાળો પૂર્ણ થાય છે" desc="કેસમાં દર્શાવેલી અંતિમ તારીખ મુજબ." fontBold={fontFamilyBold} fontRegular={fontFamilyRegular} />
            <StepItem number="03" title="પરિવારને સહાય આપવામાં આવે છે" desc="એકત્રિત થયેલી સંપૂર્ણ રકમની ચુકવણીની પ્રક્રિયા મુજબ." fontBold={fontFamilyBold} fontRegular={fontFamilyRegular} />
            <StepItem number="04" title="પુરાવો જુઓ" desc="ઉપલબ્ધ ચુકવણીનો પુરાવો સંબંધિત કેસના વિડિયો વિભાગમાં." fontBold={fontFamilyBold} fontRegular={fontFamilyRegular} isLast />
          </View>
        </View>

        <View style={styles.featureContainer}>
          <FeatureCard icon="eye-outline" title="પારદર્શિતા" text="દરેક સહાયની નોંધ અને ઉપલબ્ધ પુરાવા." fontBold={fontFamilyBold} fontRegular={fontFamilyRegular} />
          <FeatureCard icon="heart-outline" title="સીધી મદદ" text="જરૂરિયાતમંદ પરિવાર સુધી સહાય પહોંચાડવાનો પ્રયાસ." fontBold={fontFamilyBold} fontRegular={fontFamilyRegular} />
          <FeatureCard icon="shield-checkmark-outline" title="જવાબદારી અને વિશ્વાસ" text="દાનનો હેતુ, સહાયની પ્રક્રિયા અને હિસાબ પ્રત્યે જવાબદારી." fontBold={fontFamilyBold} fontRegular={fontFamilyRegular} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}><View style={styles.cardIconBox}><Ionicons name="sparkles-outline" size={18} color={COLORS.primary} /></View><Text style={[styles.cardTitle, { fontFamily: fontFamilyBold }]}>સેવા અને સમર્પણ</Text></View>
          <Text style={[styles.cardBody, { fontFamily: fontFamilyRegular }]}>દરેક રૂપિયાની જવાબદારી, દરેક પરિવાર માટે માનવતા.{'\n\n'}નિર્ધારિત સમયગાળા દરમિયાન એકત્રિત થયેલી સહાય સંબંધિત પરિવાર સુધી પહોંચાડવાની પ્રક્રિયા પૂર્ણ કરવામાં આવે છે. સહાય પહોંચાડવા સંબંધિત ઉપલબ્ધ વિગતો અને પુરાવા અમારી એપના વિડિયો વિભાગમાં જોઈ શકાય છે.</Text>
        </View>

        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} style={{ marginTop: 1 }} />
          <Text style={[styles.noteText, { fontFamily: fontFamilyMedium }]}>દરેક સહાય કેસની પરિસ્થિતિ અલગ હોય છે. દાન કરતાં પહેલાં સંબંધિત પરિવારની વિગતો, સહાયનો હેતુ અને કેસની ઉપલબ્ધ માહિતી તપાસો. વિડિયો વિભાગમાં ઉપલબ્ધ પુરાવા પણ જુઓ.</Text>
        </View>
      </ScrollView>
    </View>
  );
};

function StepItem({ number, title, desc, fontBold, fontRegular, isLast = false }: any) {
  return (
    <View style={[styles.stepItem, !isLast && styles.stepItemBorder]}>
      <View style={styles.stepBadge}><Text style={[styles.stepNumber, { fontFamily: fontBold }]}>{number}</Text></View>
      <View style={styles.stepContent}><Text style={[styles.stepTitle, { fontFamily: fontBold }]}>{title}</Text><Text style={[styles.stepDesc, { fontFamily: fontRegular }]}>{desc}</Text></View>
    </View>
  );
}

function FeatureCard({ icon, title, text, fontBold, fontRegular }: any) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIconBox}><Ionicons name={icon} size={20} color={COLORS.primary} /></View>
      <Text style={[styles.featureTitle, { fontFamily: fontBold }]}>{title}</Text>
      <Text style={[styles.featureText, { fontFamily: fontRegular }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  root: { flex: 1, backgroundColor: COLORS.bg },
  centerHeader: { alignItems: 'center', marginBottom: 18, marginTop: 4 },
  logoFrame: { width: 68, height: 68, borderRadius: 22, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#C7E2DC', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4, marginBottom: 10 },
  logoImage: { width: 48, height: 48 },
  brandTitle: { fontSize: 22, lineHeight: 28, color: COLORS.text, letterSpacing: 1.2, includeFontPadding: false },
  brandSubtitle: { marginTop: 3, fontSize: 12, lineHeight: 18, color: COLORS.muted, includeFontPadding: false },
  heroCard: { backgroundColor: COLORS.primary, borderRadius: 24, padding: 20, marginBottom: 12, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 14, elevation: 5 },
  heroBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 12, gap: 5 },
  heroBadgeText: { color: '#FFFFFF', fontSize: 9.5, letterSpacing: 0.5 },
  heroHeading: { fontSize: 19, lineHeight: 26, color: '#FFFFFF', marginBottom: 8, includeFontPadding: false },
  heroBody: { fontSize: 12.5, lineHeight: 20, color: 'rgba(255,255,255,0.92)', includeFontPadding: false },
  card: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 9 },
  cardIconBox: { width: 34, height: 34, borderRadius: 11, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, lineHeight: 22, color: COLORS.text, includeFontPadding: false, flex: 1 },
  cardBody: { fontSize: 12.5, lineHeight: 20, color: COLORS.muted, includeFontPadding: false },
  stepsContainer: { marginTop: 4 },
  stepItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, gap: 12 },
  stepItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F4F3' },
  stepBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  stepNumber: { fontSize: 11, color: COLORS.primary },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 13, color: COLORS.text, includeFontPadding: false },
  stepDesc: { fontSize: 11, color: COLORS.muted, lineHeight: 16, marginTop: 2, includeFontPadding: false },
  featureContainer: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  featureCard: { flex: 1, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: 11, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  featureIconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  featureTitle: { fontSize: 12, lineHeight: 17, color: COLORS.text, includeFontPadding: false },
  featureText: { marginTop: 3, fontSize: 9.5, lineHeight: 14, color: COLORS.muted, includeFontPadding: false },
  noteBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: COLORS.primarySoft, borderWidth: 1, borderColor: '#C7E2DC', borderRadius: 16, padding: 14 },
  noteText: { flex: 1, fontSize: 11.5, lineHeight: 18, color: COLORS.primaryDark, includeFontPadding: false },
});

export default React.memo(AboutScreen);