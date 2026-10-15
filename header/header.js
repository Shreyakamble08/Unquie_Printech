/**
 * Unique Printech — Common Header Component loader
 *
 * Usage on any page:
 *   <div id="header-mount"></div>
 *   <link rel="stylesheet" href="/header/header.css">
 *   <script src="/header/header.js" defer></script>
 *
 * Requires http(s) — fetch() cannot read local files via file://.
 */
(function () {
    'use strict';

    if (window.__upHeaderBooted) return;
    window.__upHeaderBooted = true;

    var MOUNT_SELECTOR = '#header-mount';
    var HEADER_PATH = '/header/header.html';
    var DESKTOP_MIN = 1024;
    var TAG = '[UP header]';

    function setState(value) {
        document.documentElement.setAttribute('data-up-header', value);
    }
    function log() {
        try { console.info.apply(console, [TAG].concat([].slice.call(arguments))); } catch (e) { }
    }
    function safely(name, fn) {
        try { fn(); }
        catch (error) { console.error(TAG + ' "' + name + '" failed.', error); }
    }

    /* ----------------------------------------------------------------
       1. Mobile menu lookup — idempotent, safe to call many times
       ---------------------------------------------------------------- */
    function getHeader() { return document.getElementById('site-header'); }

    function getMenu() {
        // Prefer the menu inside the header, then any marked menu,
        // then the first #mobile-menu in the document.
        var header = getHeader();
        var menu =
            (header && header.querySelector('#mobile-menu')) ||
            document.querySelector('#mobile-menu[data-up-menu]') ||
            document.querySelector('#mobile-menu');
        if (!menu) return null;

        // Mark it so subsequent lookups find the same node.
        menu.setAttribute('data-up-menu', '1');

        // Move it to <body> so position:fixed is not affected by
        // any ancestor with transform/filter/perspective.
        if (menu.parentNode !== document.body) {
            document.body.appendChild(menu);
        }

        // Remove any *other* stray #mobile-menu nodes.
        var strays = document.querySelectorAll('#mobile-menu');
        for (var i = 0; i < strays.length; i++) {
            if (strays[i] !== menu && strays[i].parentNode) {
                strays[i].parentNode.removeChild(strays[i]);
            }
        }

        return menu;
    }

    function setGroup(group, open) {
        var trigger = group.querySelector('.mobile-nav-trigger');
        var sub = group.querySelector('.mobile-sub');
        group.classList.toggle('is-open', open);
        if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (sub) {
            sub.classList.toggle('is-open', open);
            sub.setAttribute('aria-hidden', open ? 'false' : 'true');
        }
    }

    function openMenu() {
        var header = getHeader();
        var menu = getMenu();
        if (!header || !menu) return;

        var btn = document.getElementById('menu-toggle');
        var ham = document.getElementById('hamburger-icon');
        var backdrop = document.getElementById('mobile-backdrop');

        menu.classList.add('is-open');
        menu.removeAttribute('inert');
        menu.setAttribute('aria-hidden', 'false');
        if (backdrop) backdrop.classList.add('is-open');
        if (ham) ham.classList.add('is-open');
        if (btn) {
            btn.setAttribute('aria-expanded', 'true');
            btn.setAttribute('aria-label', 'Close menu');
        }
        document.body.classList.add('mobile-menu-open');
    }

    function closeMenu() {
        var menu = getMenu();
        var btn = document.getElementById('menu-toggle');
        var ham = document.getElementById('hamburger-icon');
        var backdrop = document.getElementById('mobile-backdrop');

        if (menu && menu.contains(document.activeElement)) {
            if (btn) btn.focus();
            else document.activeElement.blur();
        }

        if (menu) {
            menu.classList.remove('is-open');
            menu.setAttribute('aria-hidden', 'true');
            menu.setAttribute('inert', '');
        }
        if (backdrop) backdrop.classList.remove('is-open');
        if (ham) ham.classList.remove('is-open');
        if (btn) {
            btn.setAttribute('aria-expanded', 'false');
            btn.setAttribute('aria-label', 'Open menu');
        }
        document.body.classList.remove('mobile-menu-open');
    }

    function isMenuOpen() {
        var menu = getMenu();
        return !!(menu && menu.classList.contains('is-open'));
    }

    function onDocumentClick(event) {
        var target = event.target;
        if (!target || !target.closest) return;

        // Close button (X)
        if (target.closest('#mobile-close')) {
            event.preventDefault();
            event.stopPropagation();
            closeMenu();
            return;
        }

        // Backdrop click
        if (target.closest('#mobile-backdrop')) {
            event.preventDefault();
            closeMenu();
            return;
        }

        // Hamburger toggle
        if (target.closest('#menu-toggle')) {
            event.preventDefault();
            event.stopPropagation();
            if (isMenuOpen()) closeMenu(); else openMenu();
            return;
        }

        // Accordion trigger inside mobile menu
        var trigger = target.closest('#mobile-menu .mobile-nav-trigger');
        if (trigger) {
            var menu = trigger.closest('#mobile-menu');
            var group = trigger.closest('[data-accordion]');
            if (!menu || !group) return;
            event.preventDefault();
            event.stopPropagation();
            var willOpen = !group.classList.contains('is-open');
            menu.querySelectorAll('[data-accordion]').forEach(function (other) {
                if (other !== group) setGroup(other, false);
            });
            setGroup(group, willOpen);
            return;
        }

        // Any link inside the mobile menu closes it
        if (target.closest('#mobile-menu a')) closeMenu();
    }

    function onKeydown(event) {
        if (event.key === 'Escape' && isMenuOpen()) closeMenu();
    }

    function onResize() {
        if (window.innerWidth >= DESKTOP_MIN) closeMenu();
    }

    document.addEventListener('click', onDocumentClick, true);
    document.addEventListener('keydown', onKeydown);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', function () { setTimeout(onResize, 120); });

    /* ----------------------------------------------------------------
       2. Loader
       ---------------------------------------------------------------- */
    function cleanMarkup(html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        doc.querySelectorAll('script').forEach(function (s) {
            if (s.parentNode) s.parentNode.removeChild(s);
        });
        var walker = doc.createTreeWalker(doc.documentElement, NodeFilter.SHOW_COMMENT, null);
        var comments = [];
        while (walker.nextNode()) comments.push(walker.currentNode);
        comments.forEach(function (c) { if (c.parentNode) c.parentNode.removeChild(c); });
        return doc.body.innerHTML;
    }

    function loadHeader() {
        var mount = document.querySelector(MOUNT_SELECTOR);
        if (!mount) { setState('error:no-#header-mount'); return; }
        if (mount.dataset.loaded === 'true') return;
        mount.dataset.loaded = 'true';

        setState('loading');

        fetch(HEADER_PATH, { cache: 'no-cache' })
            .then(function (response) {
                if (!response.ok) throw new Error('Header fetch failed: ' + response.status);
                return response.text();
            })
            .then(function (html) {
                mount.innerHTML = cleanMarkup(html);
                initHeader();
            })
            .catch(function (error) {
                mount.dataset.loaded = '';
                setState('error:' + (error && error.message ? error.message : 'fetch'));
                console.error(TAG + ' could not load header.', error);
            });
    }

    function initHeader() {
        var header = getHeader();
        if (!header) { setState('error:no-#site-header'); return; }

        getMenu(); // move menu to body first

        safely('mobile menu content', function () { ensureMobileGroups(header); });
        safely('active link', function () { setActiveLink(); });
        safely('desktop dropdowns', function () { initDropdowns(header); });
        safely('scroll shadow', function () { initScrollShadow(header); });
        safely('header offset', function () { setHeaderOffset(header); });

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () { setHeaderOffset(header); });
        }

        window.addEventListener('resize', function () { setHeaderOffset(header); });
        window.addEventListener('orientationchange', function () {
            setTimeout(function () { setHeaderOffset(header); }, 120);
        });

        setState('ready');
        log('ready');
    }

    /* ----------------------------------------------------------------
       3. Mobile Services accordion — verified rebuild
       ---------------------------------------------------------------- */
    var CARET_SVG = '<span class="mobile-caret" aria-hidden="true"></span>';

    function textOf(node) {
        if (!node) return '';
        var clone = node.cloneNode(true);
        clone.querySelectorAll('script, style, svg').forEach(function (el) {
            if (el.parentNode) el.parentNode.removeChild(el);
        });
        return (clone.textContent || '').replace(/\s+/g, ' ').trim();
    }

    function ensureMobileGroups(header) {
        var menu = getMenu();
        if (!menu) { console.warn(TAG + ': no #mobile-menu found'); return; }
        var inner = menu.querySelector('.mobile-inner');
        if (!inner) { console.warn(TAG + ': no .mobile-inner found'); return; }

        // 1. Remove any previously-built Services accordion
        inner.querySelectorAll('[data-accordion]').forEach(function (g) {
            if (g.parentNode) g.parentNode.removeChild(g);
        });

        // 2. Ensure Home/About flat group exists
        var homeAbout = inner.querySelector('.mobile-group-flat[data-up-home-about]');
        if (!homeAbout) {
            inner.querySelectorAll('.mobile-group-flat').forEach(function (g) {
                if (homeAbout) return;
                var t = textOf(g);
                if (t.indexOf('Home') !== -1 && t.indexOf('About') !== -1) {
                    homeAbout = g;
                }
            });
        }
        if (!homeAbout) {
            console.warn(TAG + ': Home/About flat group missing — creating it');
            homeAbout = document.createElement('div');
            homeAbout.className = 'mobile-group mobile-group-flat';
            homeAbout.innerHTML =
                '<a href="/index.html" data-nav-link class="mobile-flat-link">Home</a>' +
                '<a href="/about.html" data-nav-link class="mobile-flat-link">About</a>';
            var contact = inner.querySelector('.mobile-contact');
            if (contact && contact.parentNode) {
                contact.parentNode.insertBefore(homeAbout, contact.nextSibling);
            } else {
                inner.insertBefore(homeAbout, inner.firstChild);
            }
        }
        homeAbout.setAttribute('data-up-home-about', '1');

        // 3. Ensure the rest flat group exists (Gallery/Machinery/Contact)
        var rest = inner.querySelector('.mobile-group-flat[data-up-rest]');
        if (!rest) {
            inner.querySelectorAll('.mobile-group-flat').forEach(function (g) {
                if (rest || g === homeAbout) return;
                rest = g;
            });
        }
        if (!rest) {
            console.warn(TAG + ': rest flat group missing — creating it');
            rest = document.createElement('div');
            rest.className = 'mobile-group mobile-group-flat';
            rest.innerHTML =
                '<a href="/gallery.html" data-nav-link class="mobile-flat-link">Gallery</a>' +
                '<a href="/machinery.html" data-nav-link class="mobile-flat-link">Machinery</a>' +
                '<a href="/contact.html" data-nav-link class="mobile-flat-link">Contact Us</a>';
            var actions = inner.querySelector('.mobile-actions');
            if (actions && actions.parentNode) {
                actions.parentNode.insertBefore(rest, actions);
            } else {
                inner.appendChild(rest);
            }
        }
        rest.setAttribute('data-up-rest', '1');

        // 4. Build the Services accordion from the desktop dropdown
        var items = header.querySelectorAll('.desktop-nav [data-dropdown]');
        if (!items.length) {
            console.warn(TAG + ': no desktop dropdown found to build mobile accordion');
            return;
        }

        var frag = document.createDocumentFragment();
        items.forEach(function (item, i) {
            var trigger = item.querySelector('.nav-trigger');
            var panel = item.querySelector('.dropdown');
            if (!trigger) return;

            var key = (trigger.getAttribute('aria-controls') || ('menu' + i)).replace(/^dd-/, '');
            var subId = 'm-' + key;

            var group = document.createElement('div');
            group.className = 'mobile-group';
            group.setAttribute('data-accordion', '');

            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'mobile-nav-trigger';
            btn.setAttribute('aria-expanded', 'false');
            btn.setAttribute('aria-controls', subId);
            btn.appendChild(document.createTextNode(textOf(trigger)));
            btn.insertAdjacentHTML('beforeend', CARET_SVG);

            var sub = document.createElement('div');
            sub.id = subId;
            sub.className = 'mobile-sub';
            sub.setAttribute('aria-hidden', 'true');

            if (panel) {
                panel.querySelectorAll('a.dropdown-link').forEach(function (a) {
                    var link = document.createElement('a');
                    link.className = 'mobile-sub-link';
                    link.setAttribute('data-nav-link', '');
                    link.setAttribute('href', a.getAttribute('href') || '#');
                    var label = a.querySelector('.dropdown-label');
                    link.textContent = textOf(label || a);
                    sub.appendChild(link);
                });
            }

            group.appendChild(btn);
            group.appendChild(sub);
            frag.appendChild(group);
        });

        // 5. Insert accordion right after the Home/About group
        if (homeAbout.parentNode) {
            homeAbout.parentNode.insertBefore(frag, homeAbout.nextSibling);
        } else {
            inner.appendChild(frag);
        }

        log('mobile menu built',
            'homeAbout=' + !!homeAbout,
            'rest=' + !!rest,
            'accordions=' + inner.querySelectorAll('[data-accordion]').length);
    }

    /* ----------------------------------------------------------------
       4. Utilities
       ---------------------------------------------------------------- */
    function setHeaderOffset(header) {
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                var h = header.getBoundingClientRect().height;
                if (h > 0) {
                    document.body.style.paddingTop = h + 'px';
                    document.documentElement.style.setProperty('--header-height', h + 'px');
                }
            });
        });
    }

    function setActiveLink() {
        var currentPath = window.location.pathname.replace(/\/$/, '') || '/index.html';
        var currentSearch = window.location.search;

        document.querySelectorAll('[data-nav-link]').forEach(function (link) {
            var href = link.getAttribute('href');
            if (!href) return;
            var url;
            try { url = new URL(href, window.location.origin); }
            catch (e) { return; }

            var linkPath = url.pathname.replace(/\/$/, '') || '/index.html';
            if (linkPath !== currentPath) return;
            if (url.search !== currentSearch) return;

            link.classList.add('is-active');
            var parentItem = link.closest('.nav-item');
            if (parentItem) parentItem.classList.add('is-active');
        });
    }

    /* ----------------------------------------------------------------
       5. Desktop dropdowns — immediate hover, no dead zone
       ----------------------------------------------------------------
       Two-layer defence:
         (a) CSS bridge (.nav-item::after) spans the 12px gap.
         (b) JS checks relatedTarget on mouseleave — if the cursor is
             moving to a node still inside the same .nav-item, do not
             close the panel.
    ---------------------------------------------------------------- */
    function initDropdowns(header) {
        var items = header.querySelectorAll('[data-dropdown]');
        if (!items.length) return;

        var supportsHover = window.matchMedia('(hover: hover) and (min-width: 1024px)').matches;
        var VIEWPORT_PADDING = 16;

        function closeAll(except) {
            items.forEach(function (item) {
                if (item === except) return;
                item.classList.remove('is-open', 'dropdown-open-left');
                var trigger = item.querySelector('.nav-trigger');
                var panel = item.querySelector('.dropdown');
                if (trigger) trigger.setAttribute('aria-expanded', 'false');
                if (panel) panel.setAttribute('aria-hidden', 'true');
            });
        }

        function positionPanel(item) {
            var panel = item.querySelector('.dropdown-panel');
            if (!panel) return;
            item.classList.remove('dropdown-open-left');
            requestAnimationFrame(function () {
                var rect = panel.getBoundingClientRect();
                if (rect.right > window.innerWidth - VIEWPORT_PADDING) {
                    item.classList.add('dropdown-open-left');
                }
            });
        }

        function open(item) {
            closeAll(item);
            item.classList.add('is-open');
            var trigger = item.querySelector('.nav-trigger');
            var panel = item.querySelector('.dropdown');
            if (trigger) trigger.setAttribute('aria-expanded', 'true');
            if (panel) panel.setAttribute('aria-hidden', 'false');
            positionPanel(item);
        }

        function close(item) {
            item.classList.remove('is-open', 'dropdown-open-left');
            var trigger = item.querySelector('.nav-trigger');
            var panel = item.querySelector('.dropdown');
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
            if (panel) panel.setAttribute('aria-hidden', 'true');
        }

        items.forEach(function (item) {
            var trigger = item.querySelector('.nav-trigger');
            if (!trigger) return;

            // Click toggle (all devices)
            trigger.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (item.classList.contains('is-open')) close(item);
                else open(item);
            });

            // Hover — open on enter, close on leave with relatedTarget check
            if (supportsHover) {
                item.addEventListener('mouseenter', function () {
                    open(item);
                });

                item.addEventListener('mouseleave', function (event) {
                    var to = event.relatedTarget;
                    if (to && item.contains(to)) return;
                    close(item);
                });
            }

            // Close on dropdown link click
            item.querySelectorAll('.dropdown-link').forEach(function (link) {
                link.addEventListener('click', function () { close(item); });
            });
        });

        document.addEventListener('click', function (event) {
            if (!event.target.closest('[data-dropdown]')) closeAll(null);
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') closeAll(null);
        });

        window.addEventListener('resize', function () {
            items.forEach(function (item) {
                if (item.classList.contains('is-open')) positionPanel(item);
            });
        });
    }

    function initScrollShadow(header) {
        function toggleShadow() {
            header.classList.toggle('is-scrolled', window.scrollY > 8);
        }
        toggleShadow();
        window.addEventListener('scroll', toggleShadow, { passive: true });
    }

    window.upHeaderDebug = function () {
        var menu = document.getElementById('mobile-menu');
        var inner = menu && menu.querySelector('.mobile-inner');
        return {
            state: document.documentElement.getAttribute('data-up-header'),
            headerInDom: !!getHeader(),
            menuInDom: !!menu,
            menuParent: menu && menu.parentNode && menu.parentNode.nodeName,
            dropdowns: document.querySelectorAll('.desktop-nav [data-dropdown]').length,
            mobileAccordions: document.querySelectorAll('#mobile-menu [data-accordion]').length,
            mobileFlatGroups: document.querySelectorAll('#mobile-menu .mobile-group-flat').length,
            homeAboutGroup: !!(inner && inner.querySelector('[data-up-home-about]')),
            restGroup: !!(inner && inner.querySelector('[data-up-rest]')),
            flatLinks: document.querySelectorAll('#mobile-menu .mobile-flat-link').length,
            menuOpen: !!(menu && menu.classList.contains('is-open'))
        };
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadHeader);
    } else {
        loadHeader();
    }
})();