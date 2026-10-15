/* ============================================================
   components.js
   Loads shared header.html + footer.html and wires up their
   behaviour: mobile drawer, dropdowns, active link, year.
   Requires the site to be served over http:// (not file://).
   ============================================================ */

(function () {
  const HEADER_URL = 'components/header.html';
  const FOOTER_URL = 'components/footer.html';

  const currentPage =
    (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  /* ---------------- Fragment loader ---------------- */
  async function loadFragment(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load ' + url + ': ' + res.status);
    return res.text();
  }

  async function injectHeader() {
    const mount = document.querySelector('[data-component="header"]');
    if (!mount) return;
    try {
      mount.innerHTML = await loadFragment(HEADER_URL);
    } catch (err) {
      console.error(err);
      mount.innerHTML =
        '<p style="padding:12px;background:#fee;color:#c00;font:14px system-ui">' +
        'Header failed to load. Please serve the site over http:// ' +
        '(e.g. <code>npx serve .</code> or VS Code Live Server).' +
        '</p>';
    }
  }

  async function injectFooter() {
    const mount = document.querySelector('[data-component="footer"]');
    if (!mount) return;
    try {
      mount.innerHTML = await loadFragment(FOOTER_URL);
    } catch (err) {
      console.error(err);
      mount.innerHTML =
        '<p style="padding:12px;background:#fee;color:#c00;font:14px system-ui">' +
        'Footer failed to load. Please serve the site over http://.' +
        '</p>';
    }
  }

  /* ---------------- Active-link highlight ---------------- */
  function markActiveLink() {
    document.querySelectorAll('[data-nav]').forEach(function (el) {
      if (el.dataset.nav.toLowerCase() === currentPage) {
        el.classList.add('text-brand-magenta', 'font-semibold');
      }
    });
  }

  /* ---------------- Mobile drawer ---------------- */
  function wireMobileDrawer() {
    const toggle   = document.getElementById('mobile-toggle');
    const drawer   = document.getElementById('mobile-drawer');
    const close    = document.getElementById('mobile-close');
    const backdrop = document.getElementById('mobile-backdrop');
    if (!toggle || !drawer) return;

    const open = function () {
      drawer.classList.remove('translate-x-full');
      backdrop.classList.remove('opacity-0', 'pointer-events-none');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };

    const shut = function () {
      drawer.classList.add('translate-x-full');
      backdrop.classList.add('opacity-0', 'pointer-events-none');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    toggle.addEventListener('click', open);
    if (close)    close.addEventListener('click', shut);
    if (backdrop) backdrop.addEventListener('click', shut);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') shut();
    });

    // Auto-close the drawer when a link is tapped
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', shut);
    });
  }

  /* ---------------- Dropdown keyboard support ---------------- */
  function wireDropdownKeyboard() {
    document.querySelectorAll('.dropdown').forEach(function (dd) {
      const btn = dd.querySelector('button');
      if (!btn) return;
      btn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          dd.classList.toggle('open');
        }
        if (e.key === 'Escape') dd.classList.remove('open');
      });
    });
  }

  /* ---------------- Footer year ---------------- */
  function setYear() {
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------------- Boot ---------------- */
  document.addEventListener('DOMContentLoaded', async function () {
    await Promise.all([injectHeader(), injectFooter()]);
    markActiveLink();
    wireMobileDrawer();
    wireDropdownKeyboard();
    setYear();
  });
})();