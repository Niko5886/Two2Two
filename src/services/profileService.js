import { supabase } from './supabaseClient.js';

const BUCKET = 'profile-photos';
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

function assertFileSize(file) {
  if (file && file.size > MAX_FILE_BYTES) {
    throw new Error('File exceeds 5MB limit.');
  }
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchProfileWithPhotos(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;

  // Fetch photos ordered by primary and time
  const { data: photos, error: photosError } = await supabase
    .from('profile_photos')
    .select('*')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false })
    .order('uploaded_at', { ascending: false });

  if (photosError) throw photosError;

  return { profile: data, photos: photos || [] };
}

export async function updateProfile(userId, payload) {
  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function uploadProfilePhoto(userId, file, { setPrimary = false } = {}) {
  assertFileSize(file);
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) throw uploadError;

  const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(filePath).data.publicUrl;

  const { data, error } = await supabase
    .from('profile_photos')
    .insert({ user_id: userId, photo_url: publicUrl, is_primary: setPrimary })
    .select()
    .single();

  if (error) throw error;

  if (setPrimary) {
    // unset other primary
    await supabase
      .from('profile_photos')
      .update({ is_primary: false })
      .eq('user_id', userId)
      .neq('id', data.id);
  }

  return data;
}

export async function setPrimaryPhoto(userId, photoId) {
  const { error } = await supabase
    .from('profile_photos')
    .update({ is_primary: true })
    .eq('id', photoId)
    .eq('user_id', userId);

  if (error) throw error;

  await supabase
    .from('profile_photos')
    .update({ is_primary: false })
    .eq('user_id', userId)
    .neq('id', photoId);
}

export async function deletePhoto(userId, photoId) {
  const { error } = await supabase
    .from('profile_photos')
    .delete()
    .eq('id', photoId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function markLastSeen() {
  const { error } = await supabase.rpc('mark_last_seen');
  if (error) throw error;
}

export function calculateAge(birthDate) {
  if (!birthDate) return null;
  const dob = new Date(birthDate);
  const diff = Date.now() - dob.getTime();
  const ageDt = new Date(diff);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
}

export function formatLastSeen(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString();
}
