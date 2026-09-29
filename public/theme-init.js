(function () {
  try {
    var preference = localStorage.getItem('theme') || 'system';
    var dark = preference === 'dark' || (preference === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
})();
