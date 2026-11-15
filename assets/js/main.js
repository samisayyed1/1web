/* 1WEB — interactions & motion */
(function () {
  'use strict';

  var d = document.documentElement;
  var body = document.body;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = mqReduce.matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var CAL_URL = 'https://calendly.com/sami-1web/30min';
  var lenis = null;

  /* ---------- Year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Calendly (loaded on intent, opened as popup; link fallback) ---------- */
  var calState = 0; // 0 idle, 1 loading, 2 ready, -1 failed
  function loadCalendly() {
    if (calState !== 0) return;
    calState = 1;
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = 'https://assets.calendly.com/assets/external/widget.css';
    document.head.appendChild(l);
    var s = document.createElement('script');
    s.src = 'https://assets.calendly.com/assets/external/widget.js'; s.async = true;
    s.onload = function () { calState = window.Calendly ? 2 : -1; };
    s.onerror = function () { calState = -1; };
    document.head.appendChild(s);
  }
  function calUrl(extra) {
    var u = CAL_URL + '?hide_gdpr_banner=1&primary_color=9236c3';
    return extra ? u + '&' + extra : u;
  }
  function watchCalendlyClose() {
    if (!window.MutationObserver) return;
    var mo = new MutationObserver(function () {
      if (!document.querySelector('.calendly-overlay')) {
        mo.disconnect();
        if (lenis) lenis.start();
      }
    });
    mo.observe(body, { childList: true });
  }
  function openCalendly(prefill) {
    if (calState === 2 && window.Calendly && window.Calendly.initPopupWidget) {
      window.Calendly.initPopupWidget({ url: calUrl(), prefill: prefill || {} });
      if (lenis) lenis.stop();
      watchCalendlyClose();
      return true;
    }
    return false;
  }
  $$('[data-book]').forEach(function (a) {
    ['pointerenter', 'focus', 'touchstart'].forEach(function (ev) { a.addEventListener(ev, loadCalendly, { passive: true, once: true }); });
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (openCalendly()) { e.preventDefault(); closeMenu(); }
      // otherwise the link opens Calendly in a new tab (native behaviour)
    });
  });
  // Warm up the booking widget once the page is idle.
  window.addEventListener('load', function () {
    var idle = window.requestIdleCallback || function (cb) { return setTimeout(cb, 2500); };
    setTimeout(function () { idle(loadCalendly); }, 3500);
  });

  /* ---------- Booking form ---------- */
  var form = $('[data-book-form]');
  if (form) {
    var note = $('.form__note', form);
    var noteDefault = note.textContent;
    form.addEventListener('focusin', loadCalendly, { once: true });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name, email = form.elements.email, org = form.elements.org;
      var goal = (form.querySelector('input[name="goal"]:checked') || {}).value || '';
      var ok = true;
      [name, email].forEach(function (f) { f.removeAttribute('aria-invalid'); });
      if (!name.value.trim()) { name.setAttribute('aria-invalid', 'true'); ok = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { email.setAttribute('aria-invalid', 'true'); ok = false; }
      if (!ok) {
        note.textContent = 'Please add your name and a valid email.';
        note.classList.add('is-error');
        (name.getAttribute('aria-invalid') ? name : email).focus();
        return;
      }
      note.textContent = noteDefault; note.classList.remove('is-error');
      var summary = [org.value.trim(), goal ? 'Wants to grow: ' + goal : ''].filter(Boolean).join(' — ');
      var prefill = { name: name.value.trim(), email: email.value.trim(), customAnswers: summary ? { a1: summary } : {} };
      if (!openCalendly(prefill)) {
        var qs = 'name=' + encodeURIComponent(prefill.name) + '&email=' + encodeURIComponent(prefill.email) + (summary ? '&a1=' + encodeURIComponent(summary) : '');
        window.open(calUrl(qs), '_blank', 'noopener');
      }
    });
  }

  /* ---------- FAQ accordion (animated <details>) ---------- */
  $$('.qa').forEach(function (det) {
    var sum = $('summary', det), panel = $('.qa__a', det);
    sum.addEventListener('click', function (e) {
      if (reduce || !panel.animate) return;
      e.preventDefault();
      if (det.dataset.busy) return;
      det.dataset.busy = '1';
      var opening = !det.open;
      if (opening) det.open = true;
      var h = panel.scrollHeight;
      var anim = panel.animate(
        opening ? [{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }] : [{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
        { duration: opening ? 520 : 380, easing: 'cubic-bezier(.16,1,.3,1)' }
      );
      anim.onfinish = function () {
        if (!opening) det.open = false;
        delete det.dataset.busy;
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      };
    });
  });

  /* ---------- Mobile menu ---------- */
  var menu = $('#menu');
  var toggle = $('[data-menu-toggle]');
  var menuOpen = false;
  function openMenu() {
    if (menuOpen) return;
    menuOpen = true;
    menu.hidden = false;
    body.classList.add('menu-open');
    toggle.setAttribute('aria-expanded', 'true');
    $('.sr-only', toggle).textContent = 'Close menu';
    if (lenis) lenis.stop();
    if (window.gsap && !reduce) {
      gsap.fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: .8, ease: 'expo.inOut' });
      gsap.fromTo($$('.menu__nav a, .menu__foot', menu), { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: .9, ease: 'expo.out', stagger: .05, delay: .25 });
    }
  }
  function closeMenu(cb) {
    if (!menuOpen) { if (typeof cb === 'function') cb(); return; }
    menuOpen = false;
    toggle.setAttribute('aria-expanded', 'false');
    $('.sr-only', toggle).textContent = 'Open menu';
    var done = function () {
      menu.hidden = true;
      body.classList.remove('menu-open');
      if (lenis) lenis.start();
      if (typeof cb === 'function') cb();
    };
    if (window.gsap && !reduce) {
      gsap.to(menu, { clipPath: 'inset(0 0 100% 0)', duration: .6, ease: 'expo.inOut', onComplete: done });
    } else done();
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () { menuOpen ? closeMenu() : openMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) { closeMenu(); toggle.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1000 && menuOpen) closeMenu(); });
  }

  /* ---------- Anchor links ---------- */
  function scrollToHash(hash) {
    var target = hash === '#top' ? $('#top') : $(hash);
    if (!target) return;
    var offset = hash === '#top' ? 0 : -16;
    if (lenis) lenis.scrollTo(target, { offset: offset, duration: 1.4, easing: function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); } });
    else {
      var y = target.getBoundingClientRect().top + window.pageYOffset + offset;
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    }
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var hash = a.getAttribute('href');
      if (hash.length < 2) return;
      if (!$(hash)) return;
      e.preventDefault();
      if (menuOpen) closeMenu(function () { scrollToHash(hash); });
      else scrollToHash(hash);
      if (history.replaceState) history.replaceState(null, '', hash === '#top' ? location.pathname : hash);
    });
  });

  /* ---------- Header + dock (scroll state) ---------- */
  var header = $('[data-header]');
  var dock = $('[data-dock]');
  var hero = $('.hero');
  var contact = $('#contact');
  var lastY = window.pageYOffset, ticking = false;
  function onScroll() {
    var y = window.pageYOffset;
    header.classList.toggle('is-scrolled', y > 24);
    if (!menuOpen) header.classList.toggle('is-hidden', y > lastY && y > 320);
    if (dock) {
      var heroH = hero ? hero.offsetHeight : window.innerHeight;
      var ctaTop = contact ? contact.getBoundingClientRect().top : Infinity;
      dock.classList.toggle('is-visible', y > heroH * .7 && ctaTop > window.innerHeight * .85);
    }
    lastY = y; ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Dots visual ---------- */
  $$('.feature__viz--dots').forEach(function (el) {
    var cols = window.innerWidth < 500 ? 16 : 22, rows = 6, html = '';
    el.style.setProperty('--cols', cols);
    for (var i = 0; i < cols * rows; i++) {
      var r = Math.random();
      var cls = r > .93 ? 'hot' : r > .55 ? 'on' : '';
      html += '<i class="' + cls + '" style="--d:' + (Math.random() * -3.2).toFixed(2) + 's"></i>';
    }
    el.innerHTML = html;
  });

  /* ---------- Stacking index for case cards ---------- */
  $$('[data-case]').forEach(function (c, i) { c.style.setProperty('--i', i); });

  /* =========================================================
     Motion (GSAP + Lenis). If the CDN failed, show everything.
     ========================================================= */
  if (!window.gsap || !window.ScrollTrigger) {
    d.classList.add('motion-fail');
    d.classList.remove('has-intro');
    $$('.feature').forEach(function (f) { f.classList.add('is-in'); });
    return;
  }
  window.__1webReady = true;
  gsap.registerPlugin(ScrollTrigger);
  var hasSplit = !!window.SplitText;
  if (hasSplit) gsap.registerPlugin(SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* Smooth scroll (desktop wheel/trackpad; touch keeps native momentum) */
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: .1, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* Background colour follows the section in view */
  var THEME = { ink: '#0B0611', plum: '#3B1A5A', cream: '#F4EFF8' };
  d.classList.add('bg-anim');
  var currentTheme = 'ink';
  function setTheme(t) {
    // Light sections paint their own background, so only dark-to-dark changes are animated.
    if (t === 'cream') return;
    if (t === currentTheme || !THEME[t]) return;
    currentTheme = t;
    gsap.to(body, { backgroundColor: THEME[t], duration: reduce ? 0 : .7, ease: 'power2.out', overwrite: true });
  }
  $$('main > section[data-theme], .footer').forEach(function (sec) {
    ScrollTrigger.create({
      trigger: sec, start: 'top 62%', end: 'bottom 62%',
      onToggle: function (self) { if (self.isActive) setTheme(sec.dataset.theme); }
    });
  });

  /* Active nav link */
  $$('.header__nav a').forEach(function (a) {
    var sec = $(a.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: function (self) { a.classList.toggle('is-active', self.isActive); } });
  });

  /* ---------- Split helpers ---------- */
  function splitLines(el, opts) {
    if (!hasSplit) { gsap.set(el, { visibility: 'visible' }); return null; }
    gsap.set(el, { visibility: 'visible' });
    return SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'sl', autoSplit: true,
      onSplit: function (self) { return opts(self); }
    });
  }

  /* ---------- Hero ---------- */
  var heroTitle = $('[data-hero-title]');
  var heroFades = $$('[data-hero-fade]');
  var heroTl = gsap.timeline({ paused: true });
  var heroStarted = false, heroLines = null;
  gsap.set(heroFades, { autoAlpha: 0, y: 26 });
  if (reduce) {
    gsap.set(heroTitle, { visibility: 'visible' });
    gsap.set(heroFades, { autoAlpha: 1, y: 0 });
  } else {
    // Returning the tween lets SplitText re-split on resize/font-load and keep the tween's progress.
    splitLines(heroTitle, function (self) {
      heroLines = gsap.from(self.lines, { yPercent: 112, duration: 1.3, ease: 'expo.out', stagger: .11, paused: !heroStarted });
      return heroLines;
    });
    heroTl.to(heroFades, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: .07 }, .3);
  }

  /* ---------- Intro ---------- */
  var intro = $('.intro');
  function startPage() {
    if (reduce || heroStarted) return;
    heroStarted = true;
    if (heroLines) heroLines.play();
    else gsap.set(heroTitle, { visibility: 'visible' });
    heroTl.play(0);
  }
  if (d.classList.contains('has-intro') && intro && !reduce) {
    if (lenis) lenis.stop();
    var parts = $$('.il', intro);
    var strokes = $$('.il-s1, .il-s2', intro);
    var solids = parts.filter(function (p) { return strokes.indexOf(p) < 0; });
    gsap.set(solids, { yPercent: 102 });
    gsap.set(strokes, { x: 46, y: -102 });
    var itl = gsap.timeline({ delay: .05 });
    itl.to(solids, { yPercent: 0, duration: .7, ease: 'expo.out', stagger: .04 }, 0)
       .to(strokes, { x: 0, y: 0, duration: .75, ease: 'expo.out', stagger: .05 }, .1)
       .from($$('.intro__tag span', intro), { yPercent: 110, duration: .6, ease: 'expo.out', stagger: .05 }, .15)
       .to(intro, { clipPath: 'inset(0 0 100% 0)', duration: .8, ease: 'expo.inOut' }, '+=.05')
       .add(startPage, '-=.55')
       .add(function () {
         intro.remove();
         d.classList.remove('has-intro');
         if (lenis) lenis.start();
         try { sessionStorage.setItem('1web-intro', '1'); } catch (e) {}
       });
  } else {
    if (intro) intro.remove();
    d.classList.remove('has-intro');
    // Fonts first so line splitting is accurate, but never wait long.
    var started = false;
    var go = function () { if (!started) { started = true; startPage(); } };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
    setTimeout(go, 450);
  }

  /* ---------- Section headings ---------- */
  $$('[data-split]').forEach(function (el) {
    if (reduce) { gsap.set(el, { visibility: 'visible' }); return; }
    splitLines(el, function (self) {
      return gsap.from(self.lines, {
        yPercent: 110, duration: 1.15, ease: 'expo.out', stagger: .09,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
  });

  /* ---------- Generic reveals ---------- */
  var reveals = $$('[data-reveal]');
  if (reduce) {
    gsap.set(reveals, { autoAlpha: 1, y: 0 });
  } else {
    gsap.set(reveals, { autoAlpha: 0, y: 34 });
    ScrollTrigger.batch(reveals, {
      start: 'top 90%', once: true,
      onEnter: function (batch) {
        // A fast scroll (or a nav jump) can fire dozens at once: show anything already scrolled past
        // immediately, and animate only what's on screen with a short, capped stagger.
        var inView = [], passed = [];
        batch.forEach(function (el) {
          (el.getBoundingClientRect().bottom < 0 ? passed : inView).push(el);
          if (el.classList.contains('feature')) el.classList.add('is-in');
        });
        if (passed.length) gsap.set(passed, { autoAlpha: 1, y: 0, overwrite: true });
        if (inView.length) gsap.to(inView, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', stagger: Math.min(.08, .32 / inView.length), overwrite: true });
      }
    });
  }
  // Features not using data-reveal-triggered visuals
  $$('.feature').forEach(function (f) {
    ScrollTrigger.create({ trigger: f, start: 'top 85%', once: true, onEnter: function () { f.classList.add('is-in'); } });
  });

  /* ---------- Manifesto: words light up with scroll ---------- */
  var mani = $('[data-scrub-words]');
  if (mani && hasSplit && !reduce) {
    SplitText.create(mani, {
      type: 'words', wordsClass: 'w', autoSplit: true,
      onSplit: function (self) {
        return gsap.fromTo(self.words, { opacity: .14 }, {
          opacity: 1, ease: 'none', stagger: .1,
          scrollTrigger: { trigger: mani, start: 'top 80%', end: 'bottom 50%', scrub: .5 }
        });
      }
    });
  }

  /* ---------- Counters ---------- */
  $$('[data-count]').forEach(function (el) {
    var end = parseFloat(el.dataset.count);
    var pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    if (reduce) return;
    var obj = { v: 0 };
    el.textContent = pre + '0' + suf;
    ScrollTrigger.create({
      trigger: el, start: 'top 92%', once: true,
      onEnter: function () {
        gsap.to(obj, { v: end, duration: 2.2, ease: 'power3.out', onUpdate: function () { el.textContent = pre + Math.round(obj.v) + suf; } });
      }
    });
  });

  /* ---------- Meters ---------- */
  $$('[data-meter]').forEach(function (m, i) {
    if (reduce) return;
    gsap.fromTo(m, { scaleX: 0 }, { scaleX: 1, duration: i === 0 ? 1.8 : 1.4, ease: i === 0 ? 'power2.inOut' : 'expo.out', delay: i === 0 ? 0 : .5, scrollTrigger: { trigger: m, start: 'top 88%', once: true } });
  });

  /* ---------- Marquee speeds up with scroll velocity ---------- */
  var mTrack = $('.marquee__track');
  if (mTrack && mTrack.getAnimations && !reduce) {
    var mAnim = mTrack.getAnimations()[0];
    var rate = 1, target = 1;
    if (lenis) lenis.on('scroll', function (e) { target = 1 + Math.min(Math.abs(e.velocity) * .18, 5); });
    gsap.ticker.add(function () {
      target += (1 - target) * .04;
      rate += (target - rate) * .12;
      if (mAnim) mAnim.playbackRate = rate;
    });
  }

  /* ---------- Magnetic CTAs ---------- */
  if (finePointer && !reduce) {
    $$('[data-magnetic]').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: .6, ease: 'power3.out' });
      var yTo = gsap.quickTo(el, 'y', { duration: .6, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * .22);
        yTo((e.clientY - (r.top + r.height / 2)) * .32);
      });
      el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
  }

  /* ---------- Responsive / motion-dependent pieces ---------- */
  var mm = gsap.matchMedia();

  // Stacking case studies (desktop with enough height)
  mm.add('(min-width: 900px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)', function () {
    var cases = $$('[data-case]');
    cases.forEach(function (c, i) {
      var next = cases[i + 1];
      if (!next) return;
      var tl = gsap.timeline({ scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 30%', scrub: true } });
      tl.to(c, { scale: .93, ease: 'none' }, 0).to($('.case__shade', c), { opacity: .5, ease: 'none' }, 0);
    });
  });

  // Hero parallax
  mm.add('(prefers-reduced-motion: no-preference)', function () {
    gsap.to('.hero__title', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__inner', { autoAlpha: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: '40% top', end: 'bottom top', scrub: true } });

    // Footer wordmark rises in
    gsap.from('.footer__mark svg', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: '.footer__mark', start: 'top bottom', end: 'bottom bottom', scrub: true } });

    // Channel rows drift in opposite directions
    $$('[data-drift]').forEach(function (row) {
      var dir = parseFloat(row.dataset.drift);
      gsap.fromTo(row, { xPercent: dir < 0 ? 0 : -22 }, {
        xPercent: dir < 0 ? -22 : 0, ease: 'none',
        scrollTrigger: { trigger: '.channels', start: 'top bottom', end: 'bottom top', scrub: .6 }
      });
    });
  });

  // Process: pinned horizontal scroll on desktop
  mm.add('(min-width: 1000px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)', function () {
    var section = $('.process');
    var track = $('[data-process-track]');
    var bar = $('[data-process-bar]');
    section.classList.add('is-h');
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: section, start: 'top top', end: function () { return '+=' + dist(); },
        pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1,
        // Refresh this pin before everything else so triggers below it include its scroll distance.
        refreshPriority: 1
      }
    });
    tl.to(track, { x: function () { return -dist(); }, ease: 'none' }, 0)
      .fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: 'none' }, 0);
    return function () { section.classList.remove('is-h'); gsap.set(track, { clearProps: 'transform' }); };
  });

  /* Refresh once fonts + images settle (prevents mis-measured pins) */
  // Triggers were created in code order, not page order — sort them top-to-bottom (pins first) then measure.
  ScrollTrigger.sort();
  ScrollTrigger.refresh();

  // Re-measure whenever the content height really changes (e.g. Safari re-flowing split headings
  // once the web font arrives), so every trigger below stays in sync with the layout.
  var mainEl = $('main'), lastMainH = 0, refreshT = 0;
  ScrollTrigger.addEventListener('refresh', function () { lastMainH = mainEl.offsetHeight; });
  if (window.ResizeObserver) {
    new ResizeObserver(function () {
      if (Math.abs(mainEl.offsetHeight - lastMainH) < 2) return;
      clearTimeout(refreshT);
      refreshT = setTimeout(function () { ScrollTrigger.refresh(); }, 180);
    }).observe(mainEl);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
