import { supabase } from './supabaseClient.js';

/**
 * Add a user as a friend
 * @param {string} friendId - The ID of the user to add as friend
 * @returns {Promise<Object>} The created friendship record
 */
export async function addFriend(friendId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('friendships')
    .insert({
      user_id: user.id,
      friend_id: friendId
    })
    .select()
    .single();

  if (error) {
    // Handle duplicate friendship error gracefully
    if (error.code === '23505') { // unique_violation
      throw new Error('Вие вече сте приятели с този потребител');
    }
    throw error;
  }

  return data;
}

/**
 * Remove a friend
 * @param {string} friendId - The ID of the friend to remove
 * @returns {Promise<void>}
 */
export async function removeFriend(friendId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Delete both directions of friendship
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

  if (error) throw error;
}

/**
 * Check if two users are friends
 * @param {string} userId - First user ID
 * @param {string} friendId - Second user ID
 * @returns {Promise<boolean>}
 */
export async function areFriends(userId, friendId) {
  const { data, error } = await supabase
    .rpc('are_friends', { user_a: userId, user_b: friendId });

  if (error) throw error;
  return data;
}

/**
 * Get the current user's friends list (IDs and dates only)
 * @returns {Promise<Array>} Array of {friend_user_id, friendship_created_at}
 */
export async function getFriendsList() {
  const { data, error } = await supabase
    .rpc('get_friends_list');

  if (error) throw error;
  return data || [];
}

/**
 * Get friends with their full profiles
 * @returns {Promise<Array>} Array of profile objects with friendship_created_at
 */
export async function getFriendsWithProfiles() {
  const friendsList = await getFriendsList();
  
  if (!friendsList.length) return [];

  const friendIds = friendsList.map(f => f.friend_user_id);

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', friendIds);

  if (error) throw error;

  // Merge friendship metadata with profile data
  return (profiles || []).map(profile => {
    const friendship = friendsList.find(f => f.friend_user_id === profile.id);
    return {
      ...profile,
      friendship_created_at: friendship?.friendship_created_at
    };
  });
}

/**
 * Get count of friends for current user
 * @returns {Promise<number>}
 */
export async function getFriendsCount() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('friendships')
    .select('*', { count: 'exact', head: true })
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

  if (error) throw error;
  return count || 0;
}
