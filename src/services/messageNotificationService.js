import { getAuthUser, onAuthStateChange } from './authState.js';
import { fetchProfilesByIds } from './profileService.js';
import { subscribeToMessages } from './messageService.js';
import toast from '../components/toast/toast.js';

let isInitialized = false;
let messageSub = null;
let navigateToChat = null;
const profileCache = new Map();
const notifiedMessageIds = new Set();

function truncateText(text, max = 90) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
}

async function getSenderProfile(senderId) {
  if (profileCache.has(senderId)) {
    return profileCache.get(senderId);
  }

  try {
    const [profile] = await fetchProfilesByIds([senderId]);
    if (profile) {
      profileCache.set(senderId, profile);
      return profile;
    }
  } catch (error) {
    console.error('Failed to fetch sender profile for notification:', error);
  }

  return null;
}

function showSystemNotification({ username, content, senderId, avatarUrl }) {
  if (!('Notification' in window)) return;
  if (document.visibilityState === 'visible') return;
  if (Notification.permission !== 'granted') return;

  const notification = new Notification(`Ново съобщение от ${username}`, {
    body: truncateText(content, 110),
    icon: avatarUrl || '/favicon.ico',
    tag: `message-${senderId}`
  });

  notification.onclick = () => {
    window.focus();
    if (typeof navigateToChat === 'function') {
      navigateToChat(`/messages?userId=${senderId}`);
    }
    notification.close();
  };
}

async function handleIncomingMessage(newMsg) {
  const currentUser = getAuthUser();
  if (!currentUser) return;

  if (!newMsg || newMsg.receiver_id !== currentUser.id) return;

  window.dispatchEvent(new CustomEvent('messages:incoming', {
    detail: { message: newMsg }
  }));

  if (notifiedMessageIds.has(newMsg.id)) return;
  notifiedMessageIds.add(newMsg.id);

  const currentPath = window.location.pathname || '';
  if (currentPath.startsWith('/messages')) return;

  const senderProfile = await getSenderProfile(newMsg.sender_id);
  const username = senderProfile?.username || 'Непознат потребител';
  const avatarUrl = senderProfile?.avatar_url || null;

  toast.info(truncateText(newMsg.content, 120), {
    title: `💌 ${username}`,
    meta: `Ново съобщение • ${formatTime(newMsg.created_at)}`,
    duration: 7000,
    avatarUrl,
    actionLabel: 'Отвори чат',
    onAction: () => {
      if (typeof navigateToChat === 'function') {
        navigateToChat(`/messages?userId=${newMsg.sender_id}`);
      }
    }
  });

  showSystemNotification({
    username,
    content: newMsg.content,
    senderId: newMsg.sender_id,
    avatarUrl
  });
}

function subscribeForCurrentUser() {
  if (messageSub) {
    messageSub.unsubscribe();
    messageSub = null;
  }

  const user = getAuthUser();
  if (!user) return;

  messageSub = subscribeToMessages((newMsg) => {
    handleIncomingMessage(newMsg);
  });
}

export function initializeMessageNotifications({ navigate } = {}) {
  if (isInitialized) return;

  isInitialized = true;
  navigateToChat = navigate || null;

  if ('Notification' in window && Notification.permission === 'default') {
    window.addEventListener('click', () => Notification.requestPermission(), { once: true });
  }

  subscribeForCurrentUser();

  onAuthStateChange(() => {
    profileCache.clear();
    notifiedMessageIds.clear();
    subscribeForCurrentUser();
  });
}
