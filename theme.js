// Tema claro/oscuro con persistencia en localStorage
(function(){
  const STORAGE_KEY = 'ui-theme'; // 'light' | 'dark'
  const body = document.body;

  const ICONS = {
    sun: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 4V2M12 22v-2M4.93 4.93L3.51 3.51M20.49 20.49l-1.42-1.42M4 12H2m20 0h-2M4.93 19.07L3.51 20.49M20.49 3.51l-1.42 1.42M12 8a4 4 0 100 8 4 4 0 000-8z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    moon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
  };

  function applySaved(){
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light') body.classList.add('theme-light');
      else body.classList.remove('theme-light');
    } catch(_) {}
  }

  function renderIcon(){
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const isLight = body.classList.contains('theme-light');
    btn.innerHTML = isLight ? ICONS.sun : ICONS.moon;
    btn.setAttribute('aria-pressed', String(isLight));
    btn.title = isLight ? 'Cambiar a oscuro' : 'Cambiar a claro';
  }

  function toggleTheme(){
    const isLight = body.classList.toggle('theme-light');
    try { localStorage.setItem(STORAGE_KEY, isLight ? 'light' : 'dark'); } catch(_) {}
    renderIcon();
  }

  function init(){
    applySaved();
    const btn = document.getElementById('themeToggle');
    if (btn) btn.addEventListener('click', toggleTheme);
    renderIcon();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
