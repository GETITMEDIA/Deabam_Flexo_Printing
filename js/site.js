/*  =========================================================================
    Deabam Flexo Printers — site behaviour
    Dependency-free (no jQuery). Handles: sticky header, mobile drawer,
    scroll reveal, counters, FAQ accordion, gallery filter + lightbox,
    scroll progress, back-to-top and the quote/contact forms.
    ========================================================================= */
(function () {
  'use strict';

  var BIZ = {
    phone: '919443371441',
    phoneDisplay: '+91 94433 71441',
    whatsapp: '919443371441',
    email: 'deabamflexoprinters1988@gmail.com'
  };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------------------------------------------------------------------
     1. Sticky header + scroll progress + back-to-top
     --------------------------------------------------------------------- */
  function initScrollUI() {
    var header = $('.dx-header');
    var progress = $('.dx-progress');
    var toTop = $('.dx-fab__btn--top');
    var ticking = false;

    function update() {
      var y = window.pageYOffset || document.documentElement.scrollTop;

      if (header) header.classList.toggle('is-stuck', y >= 30);
      if (toTop) toTop.classList.toggle('is-shown', y >= 400);

      if (progress) {
        var doc = document.documentElement;
        var max = doc.scrollHeight - doc.clientHeight;
        progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
      }
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    update();

    if (toTop) {
      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }
  }

  /* ---------------------------------------------------------------------
     2. Mobile drawer navigation
     --------------------------------------------------------------------- */
  function initDrawer() {
    var drawer = $('#dxDrawer');
    var scrim = $('#dxScrim');
    if (!drawer || !scrim) return;

    var lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      drawer.classList.add('is-open');
      scrim.classList.add('is-open');
      document.body.classList.add('dx-locked');
      drawer.setAttribute('aria-hidden', 'false');
      $$('.dx-burger').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
      var first = $('.dx-drawer__close', drawer);
      if (first) first.focus();
    }

    function close() {
      drawer.classList.remove('is-open');
      scrim.classList.remove('is-open');
      document.body.classList.remove('dx-locked');
      drawer.setAttribute('aria-hidden', 'true');
      $$('.dx-burger').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    $$('.dx-burger').forEach(function (btn) { btn.addEventListener('click', open); });
    scrim.addEventListener('click', close);
    $$('.dx-drawer__close, .dx-drawer__nav a', drawer).forEach(function (el) {
      el.addEventListener('click', close);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
    });

    // Close the drawer if the viewport grows back to desktop width
    window.addEventListener('resize', function () {
      if (window.innerWidth > 991 && drawer.classList.contains('is-open')) close();
    });
  }

  /* ---------------------------------------------------------------------
     3. Scroll reveal + animated counters
     --------------------------------------------------------------------- */
  function initReveal() {
    var items = $$('[data-reveal]');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
        setTimeout(function () { el.classList.add('is-in'); }, delay);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    items.forEach(function (el) { io.observe(el); });
  }

  function initCounters() {
    var nums = $$('[data-count]');
    if (!nums.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      if (reduceMotion) { el.textContent = String(target); return; }
      var dur = 1400;
      var start = null;

      function tick(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        // easeOutExpo
        var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) window.requestAnimationFrame(tick);
      }
      window.requestAnimationFrame(tick);
    }

    if (!('IntersectionObserver' in window)) {
      nums.forEach(run);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          run(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------------------
     4. FAQ accordion
     --------------------------------------------------------------------- */
  function initFaq() {
    $$('.dx-faq').forEach(function (faq) {
      $$('.dx-faq__q', faq).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var item = btn.closest('.dx-faq__item');
          var isOpen = item.classList.contains('is-open');

          $$('.dx-faq__item', faq).forEach(function (other) {
            other.classList.remove('is-open');
            var q = $('.dx-faq__q', other);
            if (q) q.setAttribute('aria-expanded', 'false');
          });

          if (!isOpen) {
            item.classList.add('is-open');
            btn.setAttribute('aria-expanded', 'true');
          }
        });
      });
    });
  }

  /* ---------------------------------------------------------------------
     5. Gallery filter + lightbox
     --------------------------------------------------------------------- */
  function initGallery() {
    var groups = $$('[data-gallery]');
    if (!groups.length) return;

    var lb = document.createElement('div');
    lb.className = 'dx-lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML =
      '<button class="dx-lb__btn dx-lb__close" aria-label="Close viewer"><i class="fa fa-times"></i></button>' +
      '<button class="dx-lb__btn dx-lb__prev" aria-label="Previous image"><i class="fa fa-angle-left"></i></button>' +
      '<img alt="">' +
      '<button class="dx-lb__btn dx-lb__next" aria-label="Next image"><i class="fa fa-angle-right"></i></button>' +
      '<div class="dx-lb__count"></div>';
    document.body.appendChild(lb);

    var lbImg = $('img', lb);
    var lbCount = $('.dx-lb__count', lb);
    var current = [];
    var index = 0;
    var opener = null;

    function show(i) {
      if (!current.length) return;
      index = (i + current.length) % current.length;
      var src = current[index];
      lbImg.src = src.full;
      lbImg.alt = src.alt || 'Deabam Flexo Printers product photo';
      lbCount.textContent = (index + 1) + ' / ' + current.length;
    }

    function open(items, i, trigger) {
      current = items;
      opener = trigger;
      show(i);
      lb.classList.add('is-open');
      document.body.classList.add('dx-locked');
      $('.dx-lb__close', lb).focus();
    }

    function close() {
      lb.classList.remove('is-open');
      document.body.classList.remove('dx-locked');
      lbImg.src = '';
      if (opener && opener.focus) opener.focus();
    }

    $('.dx-lb__close', lb).addEventListener('click', close);
    $('.dx-lb__prev', lb).addEventListener('click', function () { show(index - 1); });
    $('.dx-lb__next', lb).addEventListener('click', function () { show(index + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });

    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });

    groups.forEach(function (group) {
      function visibleItems() {
        return $$('.dx-gal__item', group).filter(function (a) { return !a.hidden; });
      }

      group.addEventListener('click', function (e) {
        var link = e.target.closest('.dx-gal__item');
        if (!link || !group.contains(link)) return;
        e.preventDefault();
        var items = visibleItems();
        var list = items.map(function (a) {
          return { full: a.getAttribute('href'), alt: (a.querySelector('img') || {}).alt };
        });
        open(list, items.indexOf(link), link);
      });

      // Filter buttons bound to this gallery
      var filterId = group.getAttribute('data-gallery');
      var filterBar = $('[data-gallery-filter="' + filterId + '"]');
      if (!filterBar) return;

      filterBar.addEventListener('click', function (e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        var val = btn.getAttribute('data-filter');
        $$('button', filterBar).forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        $$('.dx-gal__item', group).forEach(function (item) {
          var match = val === '*' || item.getAttribute('data-cat') === val;
          item.hidden = !match;
          if (match) {
            item.style.animation = 'none';
            /* force reflow so the fade-in replays */
            void item.offsetWidth;
            item.style.animation = '';
          }
        });
      });
    });
  }

  /* ---------------------------------------------------------------------
     6. Enquiry / contact forms
     There is no server-side mail handler in this static build, so the form
     validates locally and then hands the enquiry to WhatsApp or the mail
     client — both reach the office immediately.
     --------------------------------------------------------------------- */
  function initForms() {
    $$('form[data-enquiry]').forEach(function (form) {
      var alertBox = $('.dx-alert', form);

      function fieldOf(input) { return input.closest('.dx-field'); }

      function setError(input, msg) {
        var field = fieldOf(input);
        if (!field) return;
        field.classList.toggle('is-invalid', !!msg);
        var slot = $('.dx-field__err', field);
        if (slot) slot.textContent = msg || '';
      }

      function validate() {
        var ok = true;
        $$('input, select, textarea', form).forEach(function (input) {
          if (input.type === 'submit' || input.type === 'button') return;
          var val = (input.value || '').trim();

          if (input.required && !val) {
            setError(input, 'This field is required.');
            ok = false;
            return;
          }
          if (input.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) {
            setError(input, 'Enter a valid email address.');
            ok = false;
            return;
          }
          if (input.type === 'tel' && val && !/^[0-9]{10}$/.test(val.replace(/\D/g, '').slice(-10))) {
            setError(input, 'Enter a valid 10-digit mobile number.');
            ok = false;
            return;
          }
          setError(input, '');
        });
        return ok;
      }

      $$('input, select, textarea', form).forEach(function (input) {
        input.addEventListener('input', function () { setError(input, ''); });
        input.addEventListener('blur', function () { if (input.value.trim()) validate(); });
      });

      function compose() {
        var lines = ['New enquiry from the Deabam Flexo Printers website', ''];
        $$('input, select, textarea', form).forEach(function (input) {
          if (input.type === 'submit' || input.type === 'button' || !input.name) return;
          var label = form.querySelector('label[for="' + input.id + '"]');
          var name = label ? label.textContent.replace('*', '').trim() : input.name;
          var val = (input.value || '').trim();
          if (val) lines.push(name + ': ' + val);
        });
        return lines.join('\n');
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validate()) {
          var bad = $('.dx-field.is-invalid input, .dx-field.is-invalid select, .dx-field.is-invalid textarea', form);
          if (bad) bad.focus();
          return;
        }

        var body = compose();
        var channel = form.getAttribute('data-enquiry');

        if (channel === 'whatsapp') {
          window.open('https://wa.me/' + BIZ.whatsapp + '?text=' + encodeURIComponent(body), '_blank', 'noopener');
        } else {
          window.location.href = 'mailto:' + BIZ.email +
            '?subject=' + encodeURIComponent('Website enquiry — Deabam Flexo Printers') +
            '&body=' + encodeURIComponent(body);
        }

        if (alertBox) {
          alertBox.classList.add('is-shown');
          alertBox.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        }
        form.reset();
      });

      // Secondary "send on WhatsApp" button inside the same form
      var waBtn = $('[data-send-whatsapp]', form);
      if (waBtn) {
        waBtn.addEventListener('click', function () {
          if (!validate()) return;
          window.open('https://wa.me/' + BIZ.whatsapp + '?text=' + encodeURIComponent(compose()), '_blank', 'noopener');
        });
      }
    });
  }

  /* ---------------------------------------------------------------------
     7. Home hero video — pause when offscreen, sound toggle
     --------------------------------------------------------------------- */
  function initHeroVideo() {
    var video = $('.dx-hero__media video');
    if (!video) return;

    // The showreel is a large file. Only load it on wide screens, when the
    // user has not asked for reduced motion and is not on a metered/slow
    // connection — everyone else keeps the poster image.
    var conn = navigator.connection || {};
    var heavyOk = window.innerWidth >= 992 &&
      !reduceMotion &&
      !conn.saveData &&
      !/2g/.test(conn.effectiveType || '');

    if (!heavyOk) return;

    var src = video.getAttribute('data-src');
    if (!src) return;
    video.src = src;
    video.load();

    video.addEventListener('playing', function () {
      video.classList.add('is-playing');
      var toggle = $('.dx-hero__sound');
      if (toggle) toggle.hidden = false;
    });

    video.play().catch(function () { /* autoplay blocked — poster stays */ });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            video.play().catch(function () {});
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.15 });
      io.observe(video);
    }

    var toggle = $('.dx-hero__sound');
    if (toggle) {
      toggle.addEventListener('click', function () {
        video.muted = !video.muted;
        toggle.innerHTML = '<i class="fa ' + (video.muted ? 'fa-volume-off' : 'fa-volume-up') + '"></i>';
        toggle.setAttribute('aria-label', video.muted ? 'Unmute showreel' : 'Mute showreel');
      });
    }
  }

  /* ---------------------------------------------------------------------
     8. Smooth in-page anchors
     --------------------------------------------------------------------- */
  function initAnchors() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      var id = link.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------------------------------------------------------------------
     9. Service tabs (home page) — replaces the old jQuery tab script
     --------------------------------------------------------------------- */
  function initTabs() {
    $$('[data-tabs]').forEach(function (wrap) {
      var buttons = $$('[data-tab]', wrap);
      var panels = $$('[data-panel]', wrap);
      if (!buttons.length) return;

      function activate(name) {
        buttons.forEach(function (b) {
          var on = b.getAttribute('data-tab') === name;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
          b.tabIndex = on ? 0 : -1;
        });
        panels.forEach(function (p) {
          var on = p.getAttribute('data-panel') === name;
          p.hidden = !on;
          if (on) {
            p.style.animation = 'none';
            void p.offsetWidth;
            p.style.animation = '';
          }
        });
      }

      buttons.forEach(function (b, i) {
        b.addEventListener('click', function () { activate(b.getAttribute('data-tab')); });
        b.addEventListener('keydown', function (e) {
          var next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
          if (next === null) return;
          e.preventDefault();
          var target = buttons[(next + buttons.length) % buttons.length];
          target.focus();
          activate(target.getAttribute('data-tab'));
        });
      });

      activate(buttons[0].getAttribute('data-tab'));
    });
  }

  /* ---------------------------------------------------------------------
     10. Year stamps
     --------------------------------------------------------------------- */
  function initYear() {
    $$('.current-year').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* --------------------------------------------------------------------- */
  function boot() {
    initScrollUI();
    initDrawer();
    initReveal();
    initCounters();
    initFaq();
    initGallery();
    initForms();
    initHeroVideo();
    initAnchors();
    initTabs();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
