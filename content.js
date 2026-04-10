let currentImage = null;
let currentOpacity = 0.7;

let currentLogo = null;
let currentLogoSize = 32;

function applyBackground(img, op) {
  const target = document.querySelector('.scroller'); 
  if (target && img) {
    target.style.setProperty('background-image', `linear-gradient(rgba(0, 0, 0, ${op}), rgba(0, 0, 0, ${op})), url('${img}')`, 'important');
    target.style.setProperty('background-size', 'cover', 'important');
    target.style.setProperty('background-position', 'center', 'important');
    target.style.setProperty('background-repeat', 'no-repeat', 'important');
    target.style.setProperty('background-color', 'transparent', 'important');
  }
}

function applyLogo(logoSrc, size) {
  const logoImg = document.querySelector('a[data-testid="menu-button-home"] img');
  
  if (logoImg) {
    if (logoSrc) {
      logoImg.src = logoSrc;
      logoImg.removeAttribute('srcset'); 
    }

    if (size) {
      logoImg.style.setProperty('height', size + 'px', 'important');
      logoImg.style.setProperty('width', 'auto', 'important');

    }
  }
}

chrome.storage.local.get(['savedImage', 'savedOpacity', 'savedLogo', 'savedLogoSize'], (result) => {
  if (result.savedImage) currentImage = result.savedImage;
  if (result.savedOpacity) currentOpacity = result.savedOpacity;
  
  if (result.savedLogo) currentLogo = result.savedLogo;
  if (result.savedLogoSize) currentLogoSize = result.savedLogoSize;

  applyBackground(currentImage, currentOpacity);
  applyLogo(currentLogo, currentLogoSize);
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'preview') {
    if (msg.type === 'opacity') {
      currentOpacity = msg.value;
      applyBackground(currentImage, currentOpacity);
    }
    if (msg.type === 'image') {
      currentImage = msg.value;
      applyBackground(currentImage, currentOpacity);
    }
    if (msg.type === 'logo') {
      currentLogo = msg.value;
      applyLogo(currentLogo, currentLogoSize);
    }
    if (msg.type === 'logoSize') {
      currentLogoSize = msg.value;
      applyLogo(currentLogo, currentLogoSize);
    }
  }
});

const observer = new MutationObserver(() => {
  if (currentImage) applyBackground(currentImage, currentOpacity);
  applyLogo(currentLogo, currentLogoSize);
});

observer.observe(document.body, { childList: true, subtree: true });
