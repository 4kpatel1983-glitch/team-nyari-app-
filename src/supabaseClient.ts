// src/supabaseClient.ts
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rqlwdorppvuiulgdhhyg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxbHdkb3JwcHZ1aXVsZ2RoaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5OTEyNjYsImV4cCI6MjEwNzU2NzI2Nn0.EHgxI3UXmeS-i1hjLvwAkGh_NfVCR6ZBS8ufLCoR_Gg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});

export type Profile = { id?: string; mobile: string; name: string; pincode: string; location_text: string; photo_url: string; total_donated?: number; created_at?: string; updated_at?: string; };
export type Member = { id?: string; mobile: string; member_id?: string; name: string; photo_url: string; role: string; district: string; city: string; status: string; joined_at?: string; updated_at?: string; };
export type Sponsor = { id?: string; name: string; mobile: string; photo_url: string; amount: number; date?: string; note: string; created_at?: string; updated_at?: string; };
export type Donation = { id?: string; donor_mobile: string; donor_name: string; donor_photo: string; amount: number; case_id: string; receipt_no?: string; status: string; payment_ref?: string; date?: string; };
export type AppealCase = { id: string; title: string; subtitle?: string; location: string; thumbnailUrl: string; raisedAmount: number; durationSeconds: number; createdAt?: string; proofTitle: string; proofDescription: string; proofMediaUrl?: string; proofPhotoUrl?: string; proofVideoUrl?: string; proofAmount?: number; upiId?: string; payeeName?: string; isCompleted?: boolean; videoUrl?: string; };
export type CaseTransaction = { id: string; caseId: string; name: string; amount: number; date?: string; };
export type DonorFeed = { id: string; name: string; mobile: string; phone: string; amount: number; date?: string; avatar?: string; location?: string; isVerified?: boolean; };

export type AppContent = { title: string; subtitle: string; description: string; updated_at?: string; };

export type AppPopup = {
  id: string;
  title: string;
  message: string;
  image_url?: string | null;
  button_text?: string | null;
  button_link?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export const STORAGE_KEYS = { SESSION_ACTIVE: '@nyari/session_active', USER_MOBILE: '@nyari/user_mobile' };

const liveListeners = new Set<() => void>();
let liveChannel: any = null;
let liveStartTimer: ReturnType<typeof setTimeout> | null = null;
let liveHealthy = false;

function fireLive() { liveListeners.forEach((cb) => { try { cb(); } catch {} }); }
export function isLiveHealthy(): boolean { return liveHealthy; }

export function subscribeLiveDonations(cb: () => void): () => void {
  liveListeners.add(cb);
  if (!liveChannel && !liveStartTimer) {
    liveStartTimer = setTimeout(() => {
      liveStartTimer = null;
      if (liveListeners.size === 0) return;
      try {
        let ch: any = null;
        ch = supabase.channel(`nyari-live-${Date.now()}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, fireLive)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, fireLive)
          .subscribe((status: string) => {
            liveHealthy = status === 'SUBSCRIBED';
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              liveHealthy = false; try { supabase.removeChannel(ch); } catch {}
              if (liveChannel === ch) liveChannel = null;
            }
          });
        liveChannel = ch;
      } catch { liveChannel = null; liveHealthy = false; }
    }, 2000);
  }
  return () => {
    liveListeners.delete(cb);
    if (liveListeners.size === 0) {
      if (liveStartTimer) { clearTimeout(liveStartTimer); liveStartTimer = null; }
      if (liveChannel) { try { supabase.removeChannel(liveChannel); } catch {} liveChannel = null; }
      liveHealthy = false;
    }
  };
}

const withTimeout = <T,>(promise: Promise<T>, ms: number = 8000): Promise<T> => {
  return Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Network Timeout')), ms))]);
};

export function mobileFormats(mobile: string): string[] {
  const raw = (mobile || '').trim(); const digits = raw.replace(/\D/g, ''); const clean10 = digits.slice(-10);
  const set = new Set<string>();
  if (raw) set.add(raw); if (digits) { set.add(digits); set.add(`+${digits}`); }
  if (clean10) { set.add(clean10); set.add(`+91${clean10}`); set.add(`91${clean10}`); set.add(`+${clean10}`); }
  return Array.from(set).filter(Boolean);
}

function sortByPriority<T extends Record<string, any>>(rows: T[], formats: string[], field: string): T[] {
  return [...rows].sort((a, b) => { const av = a[field] as string | undefined; const bv = b[field] as string | undefined; const ai = av ? formats.indexOf(av) : -1; const bi = bv ? formats.indexOf(bv) : -1; return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi); });
}

export async function compressImage(uri: string): Promise<string> {
  try { const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 300, height: 300 } }], { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }); return result.uri; } catch (e) { return uri; }
}

export async function uploadAvatar(localUri: string, mobile: string): Promise<string | null> {
  try {
    const compressed = await compressImage(localUri); const response = await fetch(compressed); const arrayBuffer = await response.arrayBuffer();
    const cleanMobile = mobile.replace(/[^0-9]/g, ''); const fileName = `${cleanMobile}_${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('avatars').upload(fileName, arrayBuffer, { contentType: 'image/jpeg', cacheControl: '3600', upsert: false });
    if (error) return null;
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    try { const { data: files } = await supabase.storage.from('avatars').list('', { search: cleanMobile, limit: 100 }); const old = (files || []).map((f) => f.name).filter((n) => n !== fileName && n.startsWith(cleanMobile)); if (old.length) await supabase.storage.from('avatars').remove(old); } catch {}
    return urlData.publicUrl;
  } catch (e) { return null; }
}

export async function fetchProfile(mobile: string): Promise<Profile | null> {
  try { const formats = mobileFormats(mobile); if (!formats.length) return null; const { data, error } = await withTimeout(supabase.from('profiles').select('*').in('mobile', formats)); if (error || !data || data.length === 0) return null; return sortByPriority(data as Profile[], formats, 'mobile')[0] || null; } catch (e) { return null; }
}

export async function upsertProfile(profile: Partial<Profile> & { mobile: string }): Promise<Profile | null> {
  try { const cleanMobile = profile.mobile.replace(/\D/g, '').slice(-10); const payload = { ...profile, mobile: cleanMobile }; const { data, error } = await supabase.from('profiles').upsert(payload, { onConflict: 'mobile' }).select().maybeSingle(); if (error) return null; return data as Profile; } catch (e) { return null; }
}

export async function updatePhotoUrl(mobile: string, photoUrl: string): Promise<{ ok: boolean; error?: string }> {
  try { const formats = mobileFormats(mobile); const { data, error } = await supabase.from('profiles').update({ photo_url: photoUrl, updated_at: new Date().toISOString() }).in('mobile', formats).select('id, photo_url'); if (!error && data && data.length > 0) return { ok: true }; return { ok: false, error: 'No row updated' }; } catch (e: any) { return { ok: false, error: e?.message }; }
}

export async function syncProfileFromMember(mobile: string, name: string, photoUrl: string, locationText: string, pincode?: string): Promise<boolean> {
  try { const formats = mobileFormats(mobile); const { data, error } = await supabase.from('profiles').update({ name, photo_url: photoUrl, location_text: locationText, pincode: pincode || '', updated_at: new Date().toISOString() }).in('mobile', formats).select('id'); return !error && !!data && data.length > 0; } catch (e) { return false; }
}

const profileListeners = new Set<() => void>();
export function onProfileChanged(cb: () => void) { profileListeners.add(cb); return () => profileListeners.delete(cb); }
export function notifyProfileChanged() { profileListeners.forEach((cb) => { try { cb(); } catch {} }); }

export async function fetchMember(mobile: string): Promise<Member | null> {
  try { const formats = mobileFormats(mobile); if (!formats.length) return null; const { data, error } = await withTimeout(supabase.from('members').select('*').in('mobile', formats)); if (error || !data || data.length === 0) return null; return sortByPriority(data as Member[], formats, 'mobile')[0] || null; } catch (e) { return null; }
}

export async function createMember(data: Partial<Member> & { mobile: string; name: string }): Promise<Member | null> {
  try { const cleanMobile = data.mobile.replace(/\D/g, '').slice(-10); const payload = { ...data, mobile: cleanMobile }; const { data: member, error } = await supabase.from('members').insert(payload).select().single(); if (error) return null; return member as Member; } catch (e) { return null; }
}

export async function fetchAllMembers(page: number = 0, pageSize: number = 20): Promise<Member[]> {
  try { const from = page * pageSize; const to = from + pageSize - 1; const { data, error } = await withTimeout(supabase.from('members').select('*').eq('status', 'active').order('joined_at', { ascending: false }).range(from, to)); if (error) return []; return (data || []) as Member[]; } catch (e) { return []; }
}

export async function updateMemberPhotoUrl(mobile: string, photoUrl: string): Promise<boolean> {
  try { const formats = mobileFormats(mobile); const { data, error } = await supabase.from('members').update({ photo_url: photoUrl, updated_at: new Date().toISOString() }).in('mobile', formats).select('id'); return !error && !!data && data.length > 0; } catch (e) { return false; }
}

export async function fetchMemberStats(): Promise<{ total: number; districts: number }> {
  try { const { data, error } = await withTimeout(supabase.from('members').select('district').eq('status', 'active')); if (error || !data) return { total: 0, districts: 0 }; const total = data.length; const districts = new Set(data.map((m) => (m.district || '').trim().toLowerCase()).filter((d) => d.length > 0)).size; return { total, districts }; } catch (e) { return { total: 0, districts: 0 }; }
}

export async function fetchTopSponsors(limit: number = 5): Promise<Sponsor[]> {
  try { const { data, error } = await withTimeout(supabase.from('sponsors').select('*').order('amount', { ascending: false }).limit(limit)); if (error) return []; return (data || []) as Sponsor[]; } catch (e) { return []; }
}

export async function fetchDonations(mobile: string): Promise<Donation[]> {
  try { const formats = mobileFormats(mobile); if (!formats.length) return []; const { data, error } = await withTimeout(supabase.from('donations').select('*').in('donor_mobile', formats).order('date', { ascending: false })); if (error) return []; return (data || []) as Donation[]; } catch (e) { return []; }
}

export async function fetchAllDonations(limit: number = 10): Promise<Donation[]> {
  try { const { data, error } = await withTimeout(supabase.from('donations').select('*').order('date', { ascending: false }).limit(limit)); if (error) return []; return (data || []) as Donation[]; } catch (e) { return []; }
}

export async function createDonation(data: Partial<Donation> & { donor_name: string; amount: number }): Promise<Donation | null> {
  try { const cleanMobile = data.donor_mobile ? data.donor_mobile.replace(/\D/g, '').slice(-10) : ''; const payload = { ...data, donor_mobile: cleanMobile }; const { data: donation, error } = await supabase.from('donations').insert(payload).select().single(); if (error) return null; return donation as Donation; } catch (e) { return null; }
}

export async function fetchDonorFeed(limit: number = 20, from: number = 0, to: number = 19): Promise<DonorFeed[]> {
  try {
    const { data, error } = await withTimeout(
      supabase.from('donations')
        .select('id, donor_mobile, donor_name, donor_photo, amount, date, case_id')
        .eq('status', 'success')
        .order('date', { ascending: false })
        .range(from, to)
    );
    if (error || !data) return [];

    const mobiles = [...new Set(data.map((d: any) => d.donor_mobile).filter(Boolean))];
    const locationMap: Record<string, string> = {};

    if (mobiles.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('mobile, location_text').in('mobile', mobiles);
      if (profiles) {
        profiles.forEach((p: any) => {
          if (p.location_text) {
            const parts = p.location_text.split(',').map((s: string) => s.trim()).filter(Boolean);
            if (parts.length >= 3) {
              locationMap[p.mobile] = `${parts[0]}, ${parts[2]}`;
            } else if (parts.length === 2) {
              locationMap[p.mobile] = parts[0];
            } else {
              locationMap[p.mobile] = parts[0];
            }
          }
        });
      }
    }

    return data.map((d: any) => ({
      id: d.id,
      name: d.donor_name || 'દાનવીર',
      mobile: d.donor_mobile || '',
      phone: d.donor_mobile || '',
      amount: Number(d.amount) || 0,
      date: d.date,
      avatar: d.donor_photo || undefined,
      location: locationMap[d.donor_mobile] || undefined,
      isVerified: true
    }));
  } catch (e) { return []; }
}

export async function fetchDonationStats(): Promise<{ total: number; yearTotal: number; donorCount: number }> {
  try {
    const { data, error } = await withTimeout(supabase.rpc('get_donation_stats'));
    if (error || !data) return { total: 0, yearTotal: 0, donorCount: 0 };
    return {
      total: Number(data.total) || 0,
      yearTotal: Number(data.year_total) || 0,
      donorCount: Number(data.donor_count) || 0
    };
  } catch (e) { return { total: 0, yearTotal: 0, donorCount: 0 }; }
}

export async function fetchCaseTransactions(caseId: string, limit: number = 20): Promise<CaseTransaction[]> {
  try { const { data, error } = await withTimeout(supabase.from('donations').select('id, case_id, donor_name, amount, date').eq('case_id', caseId).eq('status', 'success').order('date', { ascending: false }).limit(limit)); if (error || !data) return []; return data.map((d: any) => ({ id: d.id, caseId: d.case_id, name: d.donor_name || 'દાનવીર', amount: Number(d.amount) || 0, date: d.date })); } catch (e) { return []; }
}

export async function fetchAppealCases(page: number = 0, pageSize: number = 10): Promise<AppealCase[]> {
  try {
    const from = page * pageSize; const to = from + pageSize - 1;
    const { data, error } = await withTimeout(supabase.from('cases').select('*').order('created_at', { ascending: false }).range(from, to));
    if (error || !data) return [];
    return data.map((c: any) => ({ id: c.id, title: c.title || '', subtitle: c.subtitle || '', location: c.location || '', thumbnailUrl: c.thumbnail_url || '', raisedAmount: Number(c.raised_amount) || 0, durationSeconds: Number(c.duration_seconds) || 0, createdAt: c.created_at || '', proofTitle: c.proof_title || '', proofDescription: c.proof_description || '', proofMediaUrl: c.proof_media_url || '', proofPhotoUrl: c.proof_photo_url || '', proofVideoUrl: c.proof_video_url || '', proofAmount: Number(c.proof_amount) || 0, upiId: c.upi_id || '', payeeName: c.payee_name || '', isCompleted: Boolean(c.is_completed), videoUrl: c.video_url || '' }));
  } catch (e) { return []; }
}

export async function fetchPaymentSettings(): Promise<{ upiId: string; payeeName: string; supportMobile: string; privacyPolicy: string }> {
  try {
    const { data, error } = await withTimeout(supabase.from('settings').select('upi_id, payee_name, support_mobile, privacy_policy').limit(1).maybeSingle());
    if (error || !data) return { upiId: '', payeeName: 'TEAM NYARI', supportMobile: '9825344777', privacyPolicy: '' };
    return { upiId: data.upi_id || '', payeeName: data.payee_name || 'TEAM NYARI', supportMobile: data.support_mobile || '9825344777', privacyPolicy: data.privacy_policy || 'પોલિસી હાલમાં ઉપલબ્ધ નથી. કૃપા કરીને પછી પ્રયાસ કરો.' };
  } catch (e) { return { upiId: '', payeeName: 'TEAM NYARI', supportMobile: '9825344777', privacyPolicy: '' }; }
}

export async function fetchNotifications(mobile: string) {
  try { const cleanMobile = mobile.replace(/\D/g, '').slice(-10); const { data, error } = await withTimeout(supabase.from('notifications').select('*').or(`target_mobile.eq.${cleanMobile},target_mobile.eq.ALL`).order('created_at', { ascending: false })); if (error) return []; return data || []; } catch (e) { return []; }
}

export async function saveSession(mobile: string, profile?: any): Promise<void> {
  try { const cleanMobile = mobile.replace(/\D/g, '').slice(-10); await AsyncStorage.multiSet([[STORAGE_KEYS.SESSION_ACTIVE, 'true'], [STORAGE_KEYS.USER_MOBILE, cleanMobile]]); if (profile) await AsyncStorage.setItem('USER_PROFILE', JSON.stringify(profile)); } catch (e) {}
}

export async function getCachedMobile(): Promise<string | null> { try { return await AsyncStorage.getItem(STORAGE_KEYS.USER_MOBILE); } catch { return null; } }
export async function isSessionActive(): Promise<boolean> { try { const val = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_ACTIVE); return val === 'true'; } catch { return false; } }

export async function clearSession(): Promise<void> {
  try { await AsyncStorage.multiRemove([STORAGE_KEYS.SESSION_ACTIVE, STORAGE_KEYS.USER_MOBILE, 'USER_MOBILE', 'USER_PROFILE', '@nyari/user_profile']); } catch (e) {}
}

export async function keepAlive(): Promise<void> { try { await supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1); } catch {} }

export async function fetchAppContent(sectionKey: string): Promise<AppContent | null> {
  try {
    const { data, error } = await withTimeout(
      supabase.from('app_content').select('*').eq('section_key', sectionKey).single()
    );
    if (error || !data) return null;
    return data as AppContent;
  } catch (e) {
    return null;
  }
}

export async function fetchActivePopup(): Promise<AppPopup | null> {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('app_popups')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    );
    if (error || !data) return null;
    return data as AppPopup;
  } catch (e) {
    return null;
  }
}

export function subscribeLivePopups(cb: () => void): () => void {
  let ch: any = null;
  try {
    ch = supabase
      .channel(`nyari-popups-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_popups' }, () => {
        try { cb(); } catch {}
      })
      .subscribe();
  } catch (e) {
    ch = null;
  }
  return () => {
    if (ch) { try { supabase.removeChannel(ch); } catch {} }
  };
}
