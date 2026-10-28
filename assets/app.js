/* Transisi antar halaman — ringan, hanya opacity.
   Saat klik link internal, fade-out dulu baru pindah. */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function go(href) {
    if (reduce) { location.href = href; return; }
    document.body.style.transition = 'opacity .28s ease';
    document.body.style.opacity = '0';
    setTimeout(() => { location.href = href; }, 260);
  }

  // Fade-in saat halaman dibuka
  window.addEventListener('pageshow', () => {
    document.body.style.opacity = '1';
  });

  // Intersep link ber-data-nav
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-nav]');
    if (!a) return;
    const href = a.getAttribute('href') || a.dataset.nav;
    if (!href || href === '#') return;
    e.preventDefault();
    go(href);
  });

  // Simulasi tombol dengan loading (spinner) lalu pindah halaman
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-loading]');
    if (!btn) return;
    e.preventDefault();
    const target = btn.dataset.loading;
    const original = btn.innerHTML;
    btn.style.pointerEvents = 'none';
    btn.innerHTML = '<span class="spinner"></span> Memproses…';
    setTimeout(() => go(target), 1100);
  });

  // Toggle chip
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip || !chip.parentElement.classList.contains('chips')) return;
    chip.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
  });

  window.__go = go;
})();
