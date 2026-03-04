import './toast.css';

let toastContainer = null;
let toastIdCounter = 0;

const ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ'
};

const TITLES = {
  success: 'Успех',
  error: 'Грешка',
  warning: 'Внимание',
  info: 'Информация'
};

function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

function createToastElement(type, message, title, duration, avatarUrl, meta, actionLabel, onAction) {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.dataset.toastId = toastIdCounter++;

  const visual = document.createElement('div');
  visual.className = 'toast__icon';

  if (avatarUrl) {
    visual.classList.add('toast__avatar-wrap');
    const avatar = document.createElement('img');
    avatar.className = 'toast__avatar';
    avatar.src = avatarUrl;
    avatar.alt = 'avatar';
    visual.appendChild(avatar);
  } else {
    visual.textContent = ICONS[type] || ICONS.info;
  }

  const content = document.createElement('div');
  content.className = 'toast__content';

  const titleEl = document.createElement('p');
  titleEl.className = 'toast__title';
  titleEl.textContent = title || TITLES[type] || 'Известие';

  const messageEl = document.createElement('p');
  messageEl.className = 'toast__message';
  messageEl.textContent = message;

  content.appendChild(titleEl);
  content.appendChild(messageEl);

  if (meta) {
    const metaEl = document.createElement('p');
    metaEl.className = 'toast__meta';
    metaEl.textContent = meta;
    content.appendChild(metaEl);
  }

  if (actionLabel && typeof onAction === 'function') {
    const actionBtn = document.createElement('button');
    actionBtn.className = 'toast__action';
    actionBtn.type = 'button';
    actionBtn.textContent = actionLabel;
    actionBtn.onclick = () => {
      onAction();
      removeToast(toast);
    };
    content.appendChild(actionBtn);
  }

  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast__close';
  closeBtn.innerHTML = '×';
  closeBtn.setAttribute('aria-label', 'Затвори');
  closeBtn.onclick = () => removeToast(toast);

  toast.appendChild(visual);
  toast.appendChild(content);
  toast.appendChild(closeBtn);

  if (duration > 0) {
    const progress = document.createElement('div');
    progress.className = 'toast__progress toast__progress--active';
    progress.style.animationDuration = `${duration}ms`;
    toast.appendChild(progress);

    setTimeout(() => removeToast(toast), duration);
  }

  return toast;
}

function removeToast(toast) {
  if (!toast || !toast.parentElement) return;

  toast.classList.add('toast--leaving');
  setTimeout(() => {
    if (toast.parentElement) {
      toast.parentElement.removeChild(toast);
    }
  }, 300);
}

export function showToast(message, options = {}) {
  const {
    type = 'info',
    title = null,
    duration = 4000,
    avatarUrl = null,
    meta = null,
    actionLabel = null,
    onAction = null
  } = options;

  const container = ensureContainer();
  const toast = createToastElement(type, message, title, duration, avatarUrl, meta, actionLabel, onAction);
  container.appendChild(toast);

  return toast;
}

export function toast(message, options = {}) {
  return showToast(message, options);
}

toast.success = (message, options = {}) => {
  return showToast(message, { ...options, type: 'success' });
};

toast.error = (message, options = {}) => {
  return showToast(message, { ...options, type: 'error' });
};

toast.warning = (message, options = {}) => {
  return showToast(message, { ...options, type: 'warning' });
};

toast.info = (message, options = {}) => {
  return showToast(message, { ...options, type: 'info' });
};

export default toast;
