const fileInput = document.getElementById('fileInput');
const bgFileName = document.getElementById('bgFileName');
const rangeInput = document.getElementById('overlayRange');
const opacityVal = document.getElementById('opacityVal');

const logoInput = document.getElementById('logoInput');
const logoFileName = document.getElementById('logoFileName');
const logoSizeInput = document.getElementById('logoSizeRange');
const logoSizeVal = document.getElementById('logoSizeVal');

const btnSave = document.getElementById('btnSave');
const btnFeedback = document.getElementById('btnFeedback');
const themeToggle = document.getElementById('themeToggle');
const langBtn = document.getElementById('langBtn');
const langMenu = document.getElementById('langMenu');
const overlay = document.getElementById('overlay');
const spinner = document.getElementById('spinner');
const checkArea = document.getElementById('checkArea');

let languages = {};
let currentLang = 'pt';

// --- I18N SYSTEM ---

async function loadLanguages() {
  try {
    const response = await fetch('../json/language.json');
    languages = await response.json();
    applyTranslations();
  } catch (e) { console.error('Error loading languages:', e); }
}

function applyTranslations() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (languages[currentLang] && languages[currentLang][key]) {
      el.textContent = languages[currentLang][key];
    }
  });
  
  // Update placeholders/labels if needed
  bgFileName.textContent = currentLang === 'pt' ? 'Escolher Imagem' : 'Escolher Imagem';
  logoFileName.textContent = currentLang === 'pt' ? 'Escolher Logo' : 'Escolher Logo';
}

langBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  langMenu.style.display = langMenu.style.display === 'flex' ? 'none' : 'flex';
});

document.addEventListener('click', () => {
  langMenu.style.display = 'none';
});

document.querySelectorAll('.lang-opt').forEach(opt => {
  opt.addEventListener('click', () => {
    currentLang = opt.getAttribute('data-lang');
    chrome.storage.local.set({ savedLang: currentLang });
    applyTranslations();
  });
});

// --- THEME MANAGEMENT ---

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  chrome.storage.local.set({ savedTheme: theme });
}

themeToggle.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  setTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

// --- INITIALIZATION ---

chrome.storage.local.get(['savedOpacity', 'savedLogoSize', 'savedTheme', 'savedLang'], (result) => {
  if (result.savedOpacity) {
    rangeInput.value = result.savedOpacity;
    updateOpacityLabel(result.savedOpacity);
  }
  if (result.savedLogoSize) {
    logoSizeInput.value = result.savedLogoSize;
    updateLogoSizeLabel(result.savedLogoSize);
  }
  if (result.savedTheme) setTheme(result.savedTheme);
  if (result.savedLang) currentLang = result.savedLang;
  loadLanguages();
});

function updateOpacityLabel(val) {
  opacityVal.textContent = Math.round(val * 100) + '%';
}

function updateLogoSizeLabel(val) {
  logoSizeVal.textContent = val + 'px';
}

// --- PREVIEW LOGIC ---

async function sendPreview(type, value) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { action: 'preview', type: type, value: value });
  }
}

rangeInput.addEventListener('input', () => {
  updateOpacityLabel(rangeInput.value);
  sendPreview('opacity', rangeInput.value);
});

logoSizeInput.addEventListener('input', () => {
  updateLogoSizeLabel(logoSizeInput.value);
  sendPreview('logoSize', logoSizeInput.value);
});

fileInput.addEventListener('change', () => {
  if (fileInput.files && fileInput.files[0]) {
    bgFileName.textContent = fileInput.files[0].name;
    const reader = new FileReader();
    reader.onload = (e) => sendPreview('image', e.target.result);
    reader.readAsDataURL(fileInput.files[0]);
  }
});

logoInput.addEventListener('change', () => {
  if (logoInput.files && logoInput.files[0]) {
    logoFileName.textContent = logoInput.files[0].name;
    const reader = new FileReader();
    reader.onload = (e) => sendPreview('logo', e.target.result);
    reader.readAsDataURL(logoInput.files[0]);
  }
});

// --- FEEDBACK ---

btnFeedback.addEventListener('click', () => {
  window.open('mailto:jeansaragosajr@gmail.com?subject=Feedback Digisac Extension');
});

// --- SAVE ANIMATION & LOGIC ---

btnSave.addEventListener('click', () => {
  const data = {
    savedOpacity: rangeInput.value,
    savedLogoSize: logoSizeInput.value
  };

  // Show Overlay & Spinner
  overlay.style.display = 'flex';
  spinner.style.display = 'block';
  checkArea.style.display = 'none';

  const finishSave = () => {
    chrome.storage.local.set(data, () => {
      // Transition to Checkmark
      setTimeout(() => {
        spinner.style.display = 'none';
        checkArea.style.display = 'flex';
        
        // Finalize and Reload
        setTimeout(async () => {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab) chrome.tabs.reload(tab.id);
          overlay.style.display = 'none';
        }, 1500);
      }, 800);
    });
  };

  let pendingReads = 0;

  if (fileInput.files && fileInput.files[0]) {
    pendingReads++;
    const reader = new FileReader();
    reader.onload = (e) => {
      data.savedImage = e.target.result;
      pendingReads--;
      if (pendingReads === 0) finishSave();
    };
    reader.readAsDataURL(fileInput.files[0]);
  }

  if (logoInput.files && logoInput.files[0]) {
    pendingReads++;
    const reader = new FileReader();
    reader.onload = (e) => {
      data.savedLogo = e.target.result;
      pendingReads--;
      if (pendingReads === 0) finishSave();
    };
    reader.readAsDataURL(logoInput.files[0]);
  }

  if (pendingReads === 0) finishSave();
});
