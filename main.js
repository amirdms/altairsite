/* =========================================================
   ALTAIR — interactions et animations
   - Défilement inertiel (Lenis) + ancres avec décalage d'en-tête
   - Menu mobile accessible (Échap, focus, défilement bloqué)
   - Ciel étoilé, étoile flottante, parallaxe
   - Révélations au défilement (GSAP + ScrollTrigger + DrawSVG)
   - Cartes lumineuses, inclinaison 3D, boutons magnétiques
   - Formulaire de contact (Formspree, repli e-mail)
   Tout le mouvement est coupé si « réduire les animations » est activé.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Réglages ---------- */
  var CONTACT_EMAIL = 'altair_agency_dz@gmail.com';
  var WHATSAPP = '0776700620';

  /* ---------- Utilitaires ---------- */
  var doc = document.documentElement;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var mq = function (q) { return window.matchMedia(q); };

  var reduceMotion = mq('(prefers-reduced-motion: reduce)').matches;
  var finePointer = mq('(hover: hover) and (pointer: fine)').matches;
  var desktopMQ = mq('(min-width: 768px)');

  var gsap = window.gsap;
  var hasGSAP = !!(gsap && window.ScrollTrigger);
  var motionOK = hasGSAP && !reduceMotion;
  var ScrollTrigger = window.ScrollTrigger;

  if (hasGSAP) {
    var plugins = [ScrollTrigger];
    if (window.DrawSVGPlugin) plugins.push(window.DrawSVGPlugin);
    gsap.registerPlugin.apply(gsap, plugins);
    gsap.defaults({ ease: 'expo.out', duration: 1 });
  }

  var header = $('#site-header');
  var hero = $('#accueil');

  /* ---------- File de tâches : l'initialisation est découpée en petits morceaux
     pour ne jamais bloquer le navigateur (page fluide dès le chargement) ---------- */
  var tasks = [];
  var later = function (fn) { tasks.push(fn); };
  var nextTick = function (cb) {
    if (window.scheduler && typeof window.scheduler.postTask === 'function') {
      window.scheduler.postTask(cb, { priority: 'user-visible' });
    } else {
      setTimeout(cb, 0);
    }
  };
  var runTasks = function () {
    var fn = tasks.shift();
    if (!fn) return;
    try { fn(); } catch (err) { if (window.console) console.error(err); }
    if (tasks.length) nextTick(runTasks);
  };

  /* =========================================================
     1. Défilement inertiel
     ========================================================= */
  var lenis = null;
  if (motionOK && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  var easeOutExpo = function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); };

  function scrollToHash(hash, focusTarget) {
    var el = hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (!el) return false;
    var toTop = el === hero;
    var offset = toTop ? 0 : -header.offsetHeight;
    var done = function () { if (focusTarget) el.focus({ preventScroll: true }); };

    if (lenis) {
      lenis.scrollTo(toTop ? 0 : el, { offset: offset, duration: 1.4, easing: easeOutExpo, force: true, onComplete: done });
    } else {
      var y = toTop ? 0 : el.getBoundingClientRect().top + window.pageYOffset + offset;
      window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
      done();
    }
    if (history.replaceState) history.replaceState(null, '', hash);
    return true;
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var hash = link.getAttribute('href');
    if (hash === '#' || !document.getElementById(decodeURIComponent(hash.slice(1)))) return;
    e.preventDefault();
    var fromMenu = menuOpen && menu.contains(link);
    if (fromMenu) closeMenu(false);
    scrollToHash(hash, link.classList.contains('skip-link') || fromMenu || e.detail === 0);
  });

  /* =========================================================
     2. Menu mobile
     ========================================================= */
  var toggle = $('.menu-toggle');
  var menu = $('#mobile-menu');
  var closeBtn = $('.menu-close');
  var menuOpen = false;
  var menuTl = null;
  var inertTargets = [$('.skip-link'), header, $('#main'), $('.site-footer'), $('.wa-float')];

  function setInert(state) {
    inertTargets.forEach(function (el) {
      if (!el) return;
      if (state) { el.setAttribute('inert', ''); } else { el.removeAttribute('inert'); }
    });
  }

  function menuCircle(radius) {
    var r = toggle.getBoundingClientRect();
    var x = r.left + r.width / 2;
    var y = r.top + r.height / 2;
    if (radius === 'full') {
      radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 20;
    }
    return 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)';
  }

  function openMenu() {
    if (menuOpen || !menu) return;
    menuOpen = true;
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    doc.classList.add('menu-open');
    if (lenis) lenis.stop();
    setInert(true);

    if (motionOK) {
      if (menuTl) menuTl.kill();
      menuTl = gsap.timeline();
      menuTl
        .fromTo(menu, { clipPath: menuCircle(0) }, { clipPath: menuCircle('full'), duration: 0.8, ease: 'expo.inOut' })
        .fromTo(closeBtn, { rotation: -90, scale: 0.6, opacity: 0 }, { rotation: 0, scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(2)' }, 0.3)
        .fromTo($$('.mobile-menu__link', menu), { yPercent: 70, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.8, stagger: 0.07 }, 0.3)
        .fromTo($$('.mobile-menu__footer > *', menu), { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.08 }, 0.5);
    }
    requestAnimationFrame(function () { closeBtn.focus(); });
  }

  function closeMenu(returnFocus) {
    if (!menuOpen) return;
    menuOpen = false;
    toggle.setAttribute('aria-expanded', 'false');
    doc.classList.remove('menu-open');
    setInert(false);
    if (lenis) lenis.start();

    var finish = function () {
      menu.hidden = true;
      if (hasGSAP) gsap.set([menu, closeBtn].concat($$('.mobile-menu__link, .mobile-menu__footer > *', menu)), { clearProps: 'all' });
    };
    if (motionOK) {
      if (menuTl) menuTl.kill();
      menuTl = gsap.timeline({ onComplete: finish });
      menuTl.to(menu, { clipPath: menuCircle(0), duration: 0.55, ease: 'expo.inOut' });
    } else {
      finish();
    }
    if (returnFocus !== false) toggle.focus();
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () { menuOpen ? closeMenu() : openMenu(); });
    closeBtn.addEventListener('click', function () { closeMenu(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuOpen) { e.preventDefault(); closeMenu(); }
    });
    var onBreakpoint = function (e) { if (e.matches && menuOpen) closeMenu(false); };
    if (desktopMQ.addEventListener) desktopMQ.addEventListener('change', onBreakpoint);
    else desktopMQ.addListener(onBreakpoint);
  }

  /* =========================================================
     3. En-tête : état au défilement, barre de progression, lien actif
     ========================================================= */
  var progress = $('.scroll-progress');
  var navLinks = $$('[data-nav]');

  later(function initHeader() {
    if (!hasGSAP) {
      var onScroll = function () { header.classList.toggle('is-scrolled', window.pageYOffset > 8); };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      return;
    }
    ScrollTrigger.create({
      start: 8,
      end: 'max',
      onToggle: function (self) { header.classList.toggle('is-scrolled', self.isActive); }
    });
    gsap.fromTo(progress, { x: 0, xPercent: -100 }, {
      x: 0,
      xPercent: 0,
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: reduceMotion ? true : 0.3 }
    });
    navLinks.forEach(function (link) {
      var section = document.getElementById(link.getAttribute('data-nav'));
      if (!section) return;
      ScrollTrigger.create({
        trigger: section,
        start: 'top 45%',
        end: 'bottom 45%',
        onToggle: function (self) { link.classList.toggle('is-active', self.isActive); }
      });
    });
  });

  /* ---------- Bouton WhatsApp flottant : visible après le hero, caché sur la section contact ---------- */
  later(function initWhatsAppFloat() {
    var btn = $('.wa-float');
    var contact = document.getElementById('contact');
    if (!btn || !window.IntersectionObserver) { if (btn) btn.classList.add('is-visible'); return; }
    var heroIn = true, contactIn = false;
    var update = function () { btn.classList.toggle('is-visible', !heroIn && !contactIn); };
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.target === hero) heroIn = e.isIntersecting;
        if (e.target === contact) contactIn = e.isIntersecting;
      });
      update();
    }, { rootMargin: '0px 0px -35% 0px' }).observe(hero);
    new IntersectionObserver(function (entries) {
      contactIn = entries[0].isIntersecting;
      update();
    }, { threshold: 0.12 }).observe(contact);
  });

  /* =========================================================
     4. Ciel étoilé du hero (canvas léger, en pause hors écran)
     ========================================================= */
  var sky = null;
  later(function () { sky = initSky(); });

  function initSky() {
    var canvas = $('.hero__sky');
    if (!canvas || !canvas.getContext) return null;
    var ctx = canvas.getContext('2d');
    var animate = !reduceMotion;
    var w = 0, h = 0, stars = [], raf = 0, running = false, visible = true;
    var px = 0, py = 0, tpx = 0, tpy = 0;
    var shoot = null, nextShoot = 0;
    var rand = function (a, b) { return a + Math.random() * (b - a); };

    function build() {
      var count = Math.min(240, Math.round((w * h) / (w < 768 ? 5200 : 6800)));
      stars = [];
      for (var i = 0; i < count; i++) {
        var big = Math.random() < 0.12;
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: big ? rand(0.9, 1.6) : rand(0.35, 0.9),
          a: big ? rand(0.6, 1) : rand(0.2, 0.75),
          s: rand(0.5, 2.2),
          p: Math.random() * Math.PI * 2,
          d: rand(0.15, 1),
          c: Math.random() < 0.28 ? '#C4B5FD' : '#FFFFFF'
        });
      }
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      if (!running) draw(performance.now());
    }

    function spawnShoot(t) {
      var fromLeft = Math.random() < 0.5;
      var angle = (fromLeft ? 1 : -1) * rand(0.35, 0.6);
      shoot = {
        x: rand(w * 0.15, w * 0.85),
        y: rand(0, h * 0.35),
        vx: Math.cos(angle) * (fromLeft ? 1 : -1),
        vy: Math.abs(Math.sin(angle)),
        len: rand(90, 170),
        dist: rand(220, 420),
        t0: t,
        life: rand(800, 1100)
      };
      nextShoot = t + rand(4500, 9000);
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      px += (tpx - px) * 0.06;
      py += (tpy - py) * 0.06;
      for (var i = 0; i < stars.length; i++) {
        var st = stars[i];
        var tw = animate ? 0.55 + 0.45 * Math.sin(t * 0.001 * st.s + st.p) : 1;
        var x = st.x - px * 26 * st.d;
        var y = st.y - py * 26 * st.d;
        ctx.globalAlpha = st.a * tw;
        ctx.fillStyle = st.c;
        if (st.r < 0.9) {
          ctx.fillRect(x, y, st.r * 2, st.r * 2);
        } else {
          ctx.beginPath();
          ctx.arc(x, y, st.r, 0, 6.2832);
          ctx.fill();
        }
      }
      if (animate) {
        if (!nextShoot) nextShoot = t + 2200;
        if (!shoot && t > nextShoot) spawnShoot(t);
        if (shoot) {
          var k = (t - shoot.t0) / shoot.life;
          if (k >= 1) {
            shoot = null;
          } else {
            var e = 1 - Math.pow(1 - k, 3);
            var hx = shoot.x + shoot.vx * shoot.dist * e;
            var hy = shoot.y + shoot.vy * shoot.dist * e;
            var tx = hx - shoot.vx * shoot.len;
            var ty = hy - shoot.vy * shoot.len;
            var fade = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8;
            var grad = ctx.createLinearGradient(hx, hy, tx, ty);
            grad.addColorStop(0, 'rgba(255,255,255,' + 0.95 * fade + ')');
            grad.addColorStop(0.3, 'rgba(196,181,253,' + 0.45 * fade + ')');
            grad.addColorStop(1, 'rgba(124,58,237,0)');
            ctx.globalAlpha = 1;
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(hx, hy);
            ctx.lineTo(tx, ty);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    function loop(t) {
      draw(t);
      raf = requestAnimationFrame(loop);
    }
    function start() {
      if (running || !animate || !visible || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    resize();
    canvas.classList.add('is-ready');

    var resizeQueued = false;
    var queueResize = function () {
      if (resizeQueued) return;
      resizeQueued = true;
      requestAnimationFrame(function () { resizeQueued = false; resize(); });
    };
    if (window.ResizeObserver) new ResizeObserver(queueResize).observe(canvas);
    else window.addEventListener('resize', queueResize);

    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        hero.classList.toggle('is-offscreen', !visible);
        visible ? start() : stop();
      }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    start();

    return {
      pointer: function (x, y) { tpx = x; tpy = y; },
      canvas: canvas
    };
  }

  /* =========================================================
     5. Grande étoile : flottement, suivi du pointeur, parallaxe
     ========================================================= */
  if (motionOK && hero) later(function initHeroStar() {
    var starScroll = $('.hero__star-scroll');
    var starFloat = $('.hero__star-float');

    var floatTl = gsap.timeline({ repeat: -1, yoyo: true, delay: 1.7, defaults: { ease: 'sine.inOut' } })
      .to(starFloat, { yPercent: -5, rotation: 5, duration: 3.4 });

    gsap.to(starScroll, {
      yPercent: 35,
      rotation: 35,
      scale: 0.72,
      opacity: 0.25,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 }
    });
    if (sky) {
      gsap.to(sky.canvas, {
        yPercent: 25,
        ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
      });
    }
    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      onLeave: function () { floatTl.pause(); },
      onEnterBack: function () { floatTl.resume(); }
    });

    if (finePointer) {
      var sxTo = gsap.quickTo(starFloat, 'x', { duration: 1.4, ease: 'power3.out' });
      var syTo = gsap.quickTo(starFloat, 'y', { duration: 1.4, ease: 'power3.out' });
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - 0.5;
        var ny = (e.clientY - r.top) / r.height - 0.5;
        sxTo(nx * 46);
        syTo(ny * 46);
        if (sky) sky.pointer(nx, ny);
      });
      hero.addEventListener('pointerleave', function () {
        sxTo(0); syTo(0);
        if (sky) sky.pointer(0, 0);
      });
    }
  });

  /* =========================================================
     6. Révélations au défilement
     ========================================================= */
  // Découpe un titre en mots, chacun dans un masque (le texte reste lisible par les lecteurs d'écran)
  function splitWords(el) {
    var text = el.textContent.replace(/[ \t\n\r]+/g, ' ').trim();
    var words = text.split(' ');
    var frag = document.createDocumentFragment();
    var list = [];
    words.forEach(function (w, i) {
      var mask = document.createElement('span');
      mask.className = 'split-word-mask';
      mask.setAttribute('aria-hidden', 'true');
      var word = document.createElement('span');
      word.className = 'split-word';
      word.textContent = w;
      mask.appendChild(word);
      frag.appendChild(mask);
      if (i < words.length - 1) frag.appendChild(document.createTextNode(' '));
      list.push(word);
    });
    el.setAttribute('aria-label', text);
    el.textContent = '';
    el.appendChild(frag);
    return {
      words: list,
      revert: function () { el.textContent = text; el.removeAttribute('aria-label'); }
    };
  }

  var once = function (trigger, start) {
    return { trigger: trigger, start: start || 'top 85%', once: true };
  };
  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();

  if (motionOK) {
    // Sur-titres : balayage de gauche à droite
    later(function () {
      $$('[data-reveal="eyebrow"]').forEach(function (el) {
        gsap.fromTo(el,
          { autoAlpha: 0, x: -16, clipPath: 'inset(0% 100% 0% 0%)' },
          { autoAlpha: 1, x: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: 1, scrollTrigger: once(el, 'top 90%'), clearProps: 'clipPath' });
      });
    });

    // Blocs de texte : éléments qui montent en cascade
    $$('[data-reveal="stack"]').forEach(function (group) {
      later(function () {
        var items = $$(':scope > :not([data-split])', group);
        gsap.from(items, { autoAlpha: 0, y: 28, duration: 1.1, stagger: 0.1, scrollTrigger: once(group) });
      });
    });

    // Cartes « À propos »
    $$('[data-reveal="cards"]').forEach(function (list) {
      later(function () {
        gsap.from(list.children, {
          autoAlpha: 0,
          y: 60,
          rotationX: -18,
          transformPerspective: 900,
          transformOrigin: '50% 0%',
          duration: 1.2,
          stagger: 0.1,
          scrollTrigger: once(list, 'top 88%'),
          clearProps: 'transform'
        });
      });
    });

    // Cartes services : arrivée, icônes qui éclosent et se dessinent
    $$('[data-reveal="services"]').forEach(function (grid) {
      later(function () {
        var tl = gsap.timeline({ scrollTrigger: once(grid, 'top 84%') });
        tl.from($$('.services__item', grid), {
          autoAlpha: 0,
          y: 90,
          rotationX: -16,
          transformPerspective: 1000,
          transformOrigin: '50% 0%',
          duration: 1.3,
          stagger: 0.13,
          clearProps: 'transform'
        })
          .from($$('.icon-tile', grid), { scale: 0, rotation: -120, duration: 1, ease: 'back.out(2.2)', stagger: 0.13, clearProps: 'transform' }, 0.25);
        if (window.DrawSVGPlugin) {
          tl.from($$('.icon-tile svg > *', grid), { drawSVG: '0%', duration: 1.2, ease: 'power2.inOut', stagger: 0.035 }, 0.45);
        }
      });
    });

    // Formulaire : la carte glisse, puis les champs apparaissent un à un
    $$('[data-reveal="form"]').forEach(function (formEl) {
      later(function () {
        var tl = gsap.timeline({ scrollTrigger: once(formEl, 'top 88%') });
        tl.from(formEl, { autoAlpha: 0, y: 70, scale: 0.97, duration: 1.2, clearProps: 'transform' })
          .from($$(':scope > .form-row > .field, :scope > .field, :scope > .form-submit', formEl), { autoAlpha: 0, y: 22, duration: 0.9, stagger: 0.08 }, 0.25);
      });
    });

    // Pied de page
    later(function () {
      gsap.from('.site-footer__inner > *', { autoAlpha: 0, y: 18, duration: 1, stagger: 0.1, scrollTrigger: once('.site-footer', 'top 98%') });
    });

    // Titres H2 : mots qui montent depuis un masque (découpés une fois la police prête,
    // un titre par tâche)
    later(function () {
      Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 800); })]).then(function () {
        $$('[data-split]').forEach(function (el) {
          tasks.push(function splitTitle() {
            var split = splitWords(el);
            gsap.from(split.words, {
              yPercent: 118,
              rotation: 5,
              duration: 1.15,
              stagger: 0.055,
              scrollTrigger: once(el, 'top 88%'),
              onComplete: function () { split.revert(); }
            });
          });
        });
        tasks.push(function () { ScrollTrigger.refresh(); });
        nextTick(runTasks);
      });
    });
  }

  /* =========================================================
     7. Cartes : lumière qui suit le pointeur + inclinaison 3D
     ========================================================= */
  if (finePointer) later(function initCardGlow() {
    // le défilement déplace les cartes : on invalide les mesures en cache (sans relire la mise en page)
    var layoutVersion = 0;
    window.addEventListener('scroll', function () { layoutVersion++; }, { passive: true });

    $$('[data-glow]').forEach(function (card) {
      var rect = null;
      var rectVersion = -1;
      var queued = false;
      var lastX = 0, lastY = 0;
      var tilt = motionOK && card.hasAttribute('data-tilt');
      var rx, ry;
      if (tilt) {
        gsap.set(card, { transformPerspective: 900 });
        rx = gsap.quickTo(card, 'rotationX', { duration: 0.7, ease: 'power3.out' });
        ry = gsap.quickTo(card, 'rotationY', { duration: 0.7, ease: 'power3.out' });
      }
      card.addEventListener('pointermove', function (e) {
        lastX = e.clientX; lastY = e.clientY;
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () {
          queued = false;
          if (!rect || rectVersion !== layoutVersion) {
            rect = card.getBoundingClientRect();
            rectVersion = layoutVersion;
          }
          var x = lastX - rect.left;
          var y = lastY - rect.top;
          card.style.setProperty('--mx', x + 'px');
          card.style.setProperty('--my', y + 'px');
          if (tilt) {
            ry(((x / rect.width) - 0.5) * 9);
            rx(-((y / rect.height) - 0.5) * 7);
          }
        });
      });
      card.addEventListener('pointerleave', function () {
        rect = null;
        if (tilt) { rx(0); ry(0); }
      });
    });
  });

  /* =========================================================
     8. Boutons magnétiques (ordinateur uniquement)
     ========================================================= */
  if (motionOK && finePointer) later(function initMagnetic() {
    $$('[data-magnetic]').forEach(function (btn) {
      var xTo = gsap.quickTo(btn, 'x', { duration: 0.6, ease: 'power3.out' });
      var yTo = gsap.quickTo(btn, 'y', { duration: 0.6, ease: 'power3.out' });
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.28);
        yTo((e.clientY - r.top - r.height / 2) * 0.4);
      });
      btn.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
  });

  /* =========================================================
     9. Formulaire de contact
     ========================================================= */
  var form = $('#contact-form');
  if (form) {
    form.noValidate = true;
    var endpoint = form.getAttribute('action') || '';
    var configured = /^https:\/\/formspree\.io\/f\/[A-Za-z0-9]+$/.test(endpoint) && endpoint.indexOf('VOTRE_ID') === -1;
    var demo = form.hasAttribute('data-demo'); // page d'aperçu : rien n'est envoyé
    var submitBtn = $('.contact-form__submit', form);
    var submitLabel = $('.btn__label', submitBtn);
    var defaultLabel = submitLabel.textContent;
    var status = $('.form-status', form);
    var fields = $$('input[required], textarea[required]', form);
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    var messages = {
      name: { missing: 'Indiquez votre nom.', short: 'Votre nom doit contenir au moins 2 caractères.' },
      email: { missing: 'Indiquez votre adresse e-mail.', invalid: 'Cette adresse e-mail ne semble pas valide (ex. : nom@exemple.com).' },
      message: { missing: 'Décrivez votre projet en quelques mots.', short: 'Votre message est un peu court : 10 caractères minimum.' }
    };

    var errorFor = function (input) {
      var value = input.value.trim();
      var m = messages[input.name] || {};
      if (!value) return m.missing || 'Ce champ est obligatoire.';
      if (input.type === 'email' && !emailRe.test(value)) return m.invalid;
      var min = parseInt(input.getAttribute('minlength') || '0', 10);
      if (min && value.length < min) return m.short;
      return '';
    };

    var showError = function (input, text) {
      var box = document.getElementById(input.id + '-error');
      if (text) {
        input.setAttribute('aria-invalid', 'true');
        if (box) {
          var wasHidden = box.hidden;
          box.textContent = text;
          box.hidden = false;
          if (wasHidden && motionOK) gsap.from(box, { autoAlpha: 0, y: -6, duration: 0.5 });
        }
      } else {
        input.removeAttribute('aria-invalid');
        if (box) { box.hidden = true; box.textContent = ''; }
      }
    };

    var validate = function (input) {
      var text = errorFor(input);
      showError(input, text);
      return !text;
    };

    fields.forEach(function (input) {
      input.addEventListener('blur', function () {
        if (input.value.trim() || input.dataset.touched) { input.dataset.touched = '1'; validate(input); }
      });
      input.addEventListener('input', function () {
        if (input.dataset.touched || input.getAttribute('aria-invalid')) validate(input);
      });
    });

    var setStatus = function (state, text) {
      status.dataset.state = state || '';
      status.textContent = text || '';
      if (text && motionOK) gsap.fromTo(status, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.6 });
    };

    var setLoading = function (on) {
      submitBtn.disabled = on;
      submitBtn.classList.toggle('is-loading', on);
      submitBtn.setAttribute('aria-busy', on ? 'true' : 'false');
      submitLabel.textContent = on ? 'Envoi en cours…' : defaultLabel;
    };

    var burst = function () {
      if (!motionOK) return;
      var r = submitBtn.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top + r.height / 2;
      for (var i = 0; i < 16; i++) {
        var s = document.createElement('span');
        s.className = 'burst-star' + (i % 3 === 0 ? ' burst-star--violet' : '');
        s.setAttribute('aria-hidden', 'true');
        document.body.appendChild(s);
        var angle = (i / 16) * Math.PI * 2 + Math.random() * 0.35;
        var dist = 70 + Math.random() * 110;
        gsap.set(s, { left: cx, top: cy, xPercent: -50, yPercent: -50, scale: 0 });
        gsap.to(s, { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist * 0.75, scale: 0.5 + Math.random() * 0.8, rotation: 180, duration: 1.1, ease: 'expo.out' });
        gsap.to(s, { autoAlpha: 0, duration: 0.5, delay: 0.6, onComplete: s.remove.bind(s) });
      }
    };

    // Erreurs renvoyées par Formspree : { errors: [{ field, code, message }] }
    var handleServerErrors = function (httpStatus, errors) {
      var firstField = null;
      var formLevel = [];
      errors.forEach(function (err) {
        var input = err.field ? form.querySelector('[name="' + err.field + '"]') : null;
        if (input && fields.indexOf(input) > -1) {
          var m = messages[input.name] || {};
          var text = err.code === 'TYPE_EMAIL' ? m.invalid
            : (err.code === 'REQUIRED_FIELD_MISSING' || err.code === 'REQUIRED_FIELD_EMPTY') ? m.missing
            : err.message;
          showError(input, text || 'Vérifiez ce champ.');
          input.dataset.touched = '1';
          if (!firstField) firstField = input;
        } else {
          formLevel.push(err.code || '');
        }
      });
      if (firstField) {
        setStatus('error', 'Merci de corriger les champs indiqués.');
        firstField.focus();
        return;
      }
      var text;
      if (httpStatus === 429) text = 'Trop d’envois en peu de temps. Patientez une minute puis réessayez.';
      else if (formLevel.indexOf('FORM_NOT_FOUND') > -1 || formLevel.indexOf('INACTIVE') > -1 || formLevel.indexOf('PROJECT_NOT_FOUND') > -1) text = 'Le formulaire est momentanément indisponible.';
      else text = 'L’envoi n’a pas abouti.';
      setStatus('error', text + ' Réessayez ou écrivez-nous sur WhatsApp au ' + WHATSAPP + '.');
    };

    var mailtoFallback = function (data) {
      var body = 'Nom : ' + data.get('name') + '\nE-mail : ' + data.get('email') + '\nBesoin : ' + data.get('service') + '\n\n' + data.get('message');
      var href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent('Nouveau projet — ' + data.get('service')) + '&body=' + encodeURIComponent(body);
      window.location.href = href;
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (submitBtn.disabled) return;
      setStatus('', '');

      var firstInvalid = null;
      fields.forEach(function (input) {
        input.dataset.touched = '1';
        if (!validate(input) && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) {
        setStatus('error', 'Merci de corriger les champs indiqués.');
        firstInvalid.focus();
        return;
      }

      var data = new FormData(form);
      // Robot détecté (champ piège rempli) : on fait comme si tout allait bien
      if (data.get('_gotcha')) { form.reset(); setStatus('success', 'Merci ! Votre message a bien été envoyé.'); return; }

      if (demo) {
        setLoading(true);
        setTimeout(function () {
          setLoading(false);
          form.reset();
          fields.forEach(function (input) { delete input.dataset.touched; showError(input, ''); });
          setStatus('success', 'Aperçu : le formulaire fonctionne. Sur le site en ligne, ce message arrivera dans la boîte e-mail d’Altair.');
          burst();
        }, 900);
        return;
      }

      if (!configured) {
        mailtoFallback(data);
        setStatus('success', 'Votre application e-mail s’ouvre avec votre message prêt à envoyer.');
        return;
      }

      setLoading(true);
      var controller = window.AbortController ? new AbortController() : null;
      var timer = controller ? setTimeout(function () { controller.abort(); }, 15000) : 0;

      fetch(endpoint, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
        signal: controller ? controller.signal : undefined
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (json) { return { ok: res.ok, status: res.status, json: json }; });
        })
        .then(function (r) {
          if (r.ok) {
            form.reset();
            fields.forEach(function (input) { delete input.dataset.touched; showError(input, ''); });
            setStatus('success', 'Merci ! Votre message a bien été envoyé. Nous vous répondons très vite.');
            burst();
          } else {
            handleServerErrors(r.status, (r.json && r.json.errors) || []);
          }
        })
        .catch(function () {
          setStatus('error', 'Connexion impossible. Vérifiez votre réseau et réessayez, ou écrivez-nous sur WhatsApp au ' + WHATSAPP + '.');
        })
        .then(function () {
          clearTimeout(timer);
          setLoading(false);
        });
    });
  }

  // Lance l'initialisation différée, morceau par morceau
  nextTick(runTasks);
})();
