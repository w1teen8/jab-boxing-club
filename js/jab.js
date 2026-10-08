/* =========================================================================
   JAB - concept landing page
   -------------------------------------------------------------------------
   One classic script, no modules, so the page also opens straight from the
   filesystem. Libraries are expected as globals: gsap, ScrollTrigger,
   Lenis, SplitType. Any of them missing degrades instead of throwing.

   Structure
     1  gates            reduced motion, breakpoint, failsafe
     2  film stage       fixed background, two slots, 400ms crossfade
     3  scroll           Lenis + ScrollTrigger wiring, anchors, keyboard
     4  rounds           dial arc, phase colour, jab wipe
     5  type             line-mask reveals
     6  pointer          focus-ring cursor, magnetic labels
     7  ticker           class times, one edge, slow
     8  figures          tabular count-up with a stepped tick
     9  coaches          per-coach loop on hover
    10  reel             horizontal pan driven by vertical scroll
    11  schedule         row morph via the View Transitions API
    12  prices           60ms staggered reveal
    13  timer            the first-class round timer
    14  bell             synthesised, never without a user action
    15  form             demo mode
   ========================================================================= */

(function () {
  "use strict";

  var html = document.documentElement;

  /* ---------------------------------------------------------------- 1 gates */

  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var deskQuery = window.matchMedia("(min-width: 768px)");
  var fineQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

  function reduced() { return reduceQuery.matches; }
  function desktop() { return deskQuery.matches; }

  var hasGsap = typeof window.gsap !== "undefined";
  var hasST = hasGsap && typeof window.ScrollTrigger !== "undefined";
  var hasLenis = typeof window.Lenis !== "undefined";
  var hasSplit = typeof window.SplitType !== "undefined";

  /* Append ?video=0 to the URL to see the page as mobile and reduced-motion
     users see it: the still plate is the shot, and nothing else changes.
     `have` is the manifest of loops that actually ship. Anything not listed
     stays on its still rather than firing a request that will 404. */
  var VIDEO = {
    enabled: !/[?&]video=0\b/.test(window.location.search),
    dir: "assets/video/",
    types: [["webm", "video/webm"], ["mp4", "video/mp4"]],
    have: {
      wraps: 1, jab: 1, pads: 1, night: 1,
      warmup: 1, stance: 1, bag: 1, stretch: 1,
      "coach-1": 1, "coach-2": 1, "coach-3": 1,
      "coach-4": 1, "coach-5": 1, "coach-6": 1
    }
  };

  function stillURL(name) { return "assets/stills/" + name + ".webp"; }

  /* If anything in here throws, drop the pre-hide so no text is ever lost. */
  function panic(err) {
    html.dataset.js = "off";
    if (window.console) window.console.error("[jab]", err);
  }
  window.addEventListener("error", function () { html.dataset.js = "off"; });

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* Attaches sources to a <video> once, then plays it. Resolves to false if
     playback is refused or the file is missing, so callers can stay on the
     still without a broken frame. */
  function attachAndPlay(video, name) {
    if (!VIDEO.enabled || !video || reduced() || !VIDEO.have[name]) return Promise.resolve(false);
    if (video.dataset.loaded !== name) {
      while (video.firstChild) video.removeChild(video.firstChild);
      VIDEO.types.forEach(function (t) {
        var s = document.createElement("source");
        s.src = VIDEO.dir + name + "." + t[0];
        s.type = t[1];
        video.appendChild(s);
      });
      video.dataset.loaded = name;
      video.preload = "auto";
      video.load();
    }
    var p = video.play();
    if (!p || !p.then) return Promise.resolve(true);
    return p.then(function () { return true; }).catch(function () { return false; });
  }

  function stopVideo(video) {
    if (!video) return;
    try { video.pause(); } catch (e) { /* nothing to pause */ }
    video.classList.remove("is-playing");
  }

  /* ---------------------------------------------------------- 2 film stage */

  var stage = (function () {
    var root = $("[data-stage]");
    if (!root) return { set: function () {} };

    var slots = $$("[data-slot]", root).map(function (el) {
      return { el: el, still: $("[data-still-layer]", el), video: $("video", el) };
    });
    if (slots.length < 2) return { set: function () {} };

    var active = 0;
    var currentName = null;

    slots[0].still.style.backgroundImage = "url(" + stillURL("wraps") + ")";

    function set(name) {
      if (!name || name === currentName) return;
      currentName = name;

      var next = slots[active === 0 ? 1 : 0];
      var prev = slots[active];

      next.still.style.backgroundImage = "url(" + stillURL(name) + ")";
      stopVideo(next.video);

      next.el.classList.add("is-active");
      prev.el.classList.remove("is-active");
      active = active === 0 ? 1 : 0;

      /* Only the active loop is allowed to run. */
      window.setTimeout(function () { stopVideo(prev.video); }, 420);

      if (VIDEO.enabled && desktop() && !reduced()) {
        attachAndPlay(next.video, name).then(function (ok) {
          if (ok && currentName === name) next.video.classList.add("is-playing");
        });
      }
    }

    return { set: set };
  })();

  /* ------------------------------------------------------------- 3 scroll */

  var lenis = null;

  function navHeight() {
    var n = parseInt(getComputedStyle(html).getPropertyValue("--nav-h"), 10);
    return isNaN(n) ? 68 : n;
  }

  function scrollToTarget(el) {
    var offset = -(navHeight() + 8);
    if (lenis) lenis.scrollTo(el, { offset: offset });
    else {
      var y = el.getBoundingClientRect().top + window.pageYOffset + offset;
      window.scrollTo(0, y);
    }
  }

  function setupScroll() {
    if (hasLenis && !reduced()) {
      lenis = new window.Lenis({
        lerp: 0.08,
        wheelMultiplier: 1,
        smoothWheel: true,
        /* Native touch scrolling: smoothing a thumb drag only adds lag. */
        syncTouch: false
      });

      if (hasST) {
        lenis.on("scroll", window.ScrollTrigger.update);
        window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        window.gsap.ticker.lagSmoothing(0);
      } else {
        var raf = function (t) { lenis.raf(t); window.requestAnimationFrame(raf); };
        window.requestAnimationFrame(raf);
      }
    }

    /* Anchors keep working, with the nav height accounted for. */
    document.addEventListener("click", function (ev) {
      var a = ev.target.closest ? ev.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.getElementById(id.slice(1));
      if (!el) return;
      ev.preventDefault();
      scrollToTarget(el);
      /* Keep the URL and the back button honest. */
      if (window.history && window.history.pushState) window.history.pushState(null, "", id);
    });

    /* Keyboard paging must not be swallowed by the smooth scroller. */
    document.addEventListener("keydown", function (ev) {
      if (!lenis) return;
      var t = ev.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;

      var page = window.innerHeight * 0.88;
      var to = null;
      if (ev.key === "PageDown") to = lenis.scroll + page;
      else if (ev.key === "PageUp") to = lenis.scroll - page;
      else if (ev.key === "Home") to = 0;
      else if (ev.key === "End") to = document.body.scrollHeight;
      if (to === null) return;
      ev.preventDefault();
      lenis.scrollTo(to, { duration: 0.6 });
    });

    /* Tabbing to something off screen has to bring it into view. */
    document.addEventListener("focusin", function (ev) {
      if (!lenis) return;
      var el = ev.target;
      if (!el || !el.getBoundingClientRect) return;
      var r = el.getBoundingClientRect();
      if (r.top < navHeight() || r.bottom > window.innerHeight) scrollToTarget(el);
    });
  }

  /* ------------------------------------------------------------- 4 rounds */

  var ARC = 2 * Math.PI * 21;

  var phase = (function () {
    var temp = $("[data-temp]");
    var arc = $("[data-dial-arc]");
    var locked = false; /* the running timer owns the colour while it runs */

    function apply(kind) {
      var c = kind === "rest" ? "var(--blue)" : "var(--red)";
      html.style.setProperty("--phase", c);
      if (temp) temp.style.background = c;
      if (arc) arc.style.stroke = c;
    }
    return {
      set: function (kind) { if (!locked) apply(kind); },
      force: function (kind) { apply(kind); },
      lock: function () { locked = true; },
      unlock: function (kind) { locked = false; apply(kind); }
    };
  })();

  var wipe = (function () {
    var el = $("[data-wipe]");
    var busy = false;
    return function () {
      if (!el || !hasGsap || reduced() || busy) return;
      busy = true;
      window.gsap.timeline({ onComplete: function () { busy = false; } })
        .set(el, { transformOrigin: "left center", scaleX: 0 })
        .to(el, { scaleX: 1, duration: 0.07, ease: "none" })
        .set(el, { transformOrigin: "right center" })
        .to(el, { scaleX: 0, duration: 0.07, ease: "none" });
    };
  })();

  function setupRounds(ctxSections) {
    var dialNum = $("[data-dial-num]");
    var arc = $("[data-dial-arc]");
    var first = true;

    if (arc) {
      arc.style.strokeDasharray = ARC;
      arc.style.strokeDashoffset = ARC;
    }

    ctxSections.forEach(function (sec) {
      var round = sec.getAttribute("data-round");
      var still = sec.getAttribute("data-still");
      var kind = sec.getAttribute("data-phase") || "work";

      window.ScrollTrigger.create({
        trigger: sec,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: function (self) {
          if (!self.isActive) return;
          if (dialNum) dialNum.textContent = round;
          stage.set(still);
          if (first) { first = false; phase.set(kind); return; }
          /* Between rounds is rest: the arc goes blue, then back to the
             round's own colour once the wipe has landed. */
          phase.set("rest");
          wipe();
          window.setTimeout(function () { phase.set(kind); }, 420);
        },
        onUpdate: function (self) {
          if (!arc) return;
          arc.style.strokeDashoffset = ARC * (1 - self.progress);
        }
      });
    });
  }

  /* --------------------------------------------------------------- 5 type */

  function revealLines() {
    var targets = $$("[data-lines]");
    if (!targets.length) return;

    if (!hasSplit || !hasST || reduced()) {
      targets.forEach(function (el) { el.style.opacity = 1; });
      return;
    }

    var splits = [];
    var dead = false;

    function runSplit() {
      if (dead) return;
      targets.forEach(buildOne);
      window.ScrollTrigger.refresh();
    }

    /* Splitting before the webfont lands bakes in the fallback's line breaks,
       which then stay wrong after the swap. Wait for the real metrics. */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(runSplit, runSplit);
    else window.setTimeout(runSplit, 500);

    function buildOne(el) {
      var inst = new window.SplitType(el, { types: "lines", lineClass: "line" });

      /* SplitType gives us the lines; the mask needs an inner element to move. */
      var inners = inst.lines.map(function (line) {
        var span = document.createElement("span");
        span.className = "line__in";
        while (line.firstChild) span.appendChild(line.firstChild);
        line.appendChild(span);
        return span;
      });

      window.gsap.set(el, { opacity: 1 });
      window.gsap.set(inners, { yPercent: 108 });
      window.gsap.to(inners, {
        yPercent: 0,
        duration: 0.72,
        ease: "power3.out",
        stagger: 0.07,
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });

      splits.push(inst);
    }

    /* Returned to the matchMedia context: on a breakpoint change the lines
       are un-split before they are measured and split again. `dead` stops a
       late fonts.ready from splitting text this context no longer owns. */
    return function () {
      dead = true;
      splits.forEach(function (s) { s.revert(); });
      splits.length = 0;
      targets.forEach(function (el) { el.style.opacity = 1; });
    };
  }

  /* ------------------------------------------------------------ 6 pointer */

  function setupCursor() {
    var root = $("[data-cursor]");
    var ring = $("[data-cursor-ring]");
    var trail = $("[data-cursor-trail]");
    if (!root || !ring || !hasGsap) return;

    html.dataset.cursor = "on";

    var rx = window.gsap.quickTo(ring, "x", { duration: 0.12, ease: "power3" });
    var ry = window.gsap.quickTo(ring, "y", { duration: 0.12, ease: "power3" });
    var tx = window.gsap.quickTo(trail, "x", { duration: 0.2, ease: "power2" });
    var ty = window.gsap.quickTo(trail, "y", { duration: 0.2, ease: "power2" });

    function move(ev) {
      rx(ev.clientX); ry(ev.clientY);
      tx(ev.clientX); ty(ev.clientY);
    }
    window.addEventListener("pointermove", move, { passive: true });

    /* The ring tightens over anything interactive. */
    var hot = 'a, button, input, select, summary, [data-coach]';
    function over(ev) {
      if (ev.target.closest && ev.target.closest(hot)) {
        window.gsap.to(ring, { scale: 0.55, borderWidth: 2, duration: 0.18 });
      }
    }
    function out(ev) {
      if (ev.target.closest && ev.target.closest(hot)) {
        window.gsap.to(ring, { scale: 1, borderWidth: 1, duration: 0.18 });
      }
    }
    document.addEventListener("pointerover", over);
    document.addEventListener("pointerout", out);

    return function () {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerout", out);
      delete html.dataset.cursor;
      window.gsap.set([ring, trail], { clearProps: "all" });
    };
  }

  function setupMagnetic() {
    if (!hasGsap) return;
    var cleanups = [];

    $$("[data-magnetic]").forEach(function (el) {
      var label = el.querySelector("span") || el;
      var qx = window.gsap.quickTo(label, "x", { duration: 0.3, ease: "power3" });
      var qy = window.gsap.quickTo(label, "y", { duration: 0.3, ease: "power3" });

      function move(ev) {
        var r = el.getBoundingClientRect();
        var dx = (ev.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (ev.clientY - (r.top + r.height / 2)) / (r.height / 2);
        /* 5px of pull. Any more and it stops reading as precision. */
        qx(Math.max(-1, Math.min(1, dx)) * 5);
        qy(Math.max(-1, Math.min(1, dy)) * 5);
      }
      function leave() { qx(0); qy(0); }

      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      cleanups.push(function () {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
        window.gsap.set(label, { clearProps: "x,y" });
      });
    });

    return function () { cleanups.forEach(function (fn) { fn(); }); };
  }

  /* ------------------------------------------------------------- 7 ticker */

  function setupTicker() {
    var track = $("[data-ticker-track]");
    if (!track || !hasGsap || reduced()) return;

    var set = track.querySelector(".ticker__set");
    if (!set) return;

    /* One clone is enough to loop a single repeating set without a visible join. */
    if (track.children.length < 2) track.appendChild(set.cloneNode(true));

    var vertical = desktop();
    var span = vertical ? set.offsetHeight : set.offsetWidth;
    if (!span) return;

    var prop = vertical ? "y" : "x";
    var from = {}; from[prop] = 0;
    var to = {};
    to[prop] = -span;
    to.duration = span / 26; /* about 26px a second: present, not nagging */
    to.ease = "none";
    to.repeat = -1;

    window.gsap.set(track, from);
    var tween = window.gsap.to(track, to);
    return function () { tween.kill(); window.gsap.set(track, { clearProps: "x,y" }); };
  }

  /* ------------------------------------------------------------ 8 figures */

  function setupFigures() {
    var nodes = $$("[data-count]");
    if (!nodes.length) return;

    nodes.forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-count")) || 0;
      var suffix = el.getAttribute("data-count-suffix") || "";
      var group = el.getAttribute("data-count-group") === "true";

      function render(v) {
        var n = Math.round(v);
        el.textContent = (group ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") : String(n)) + suffix;
      }

      if (!hasST || reduced()) { render(target); return; }

      var state = { v: 0 };
      render(0);
      window.gsap.to(state, {
        v: target,
        duration: 1.25,
        /* Stepped, so the figures tick over instead of gliding. */
        ease: "steps(26)",
        scrollTrigger: { trigger: el, start: "top 86%", once: true },
        onUpdate: function () { render(state.v); }
      });
    });
  }

  /* ------------------------------------------------------------ 9 coaches */

  function setupCoaches() {
    var coaches = $$("[data-coach]");
    if (!coaches.length) return;
    var cleanups = [];

    coaches.forEach(function (li) {
      var name = li.getAttribute("data-still");
      var video = $(".coach__video", li);
      /* The still is an <img> with loading="lazy", so the browser decides when
         to fetch it. Nothing to set here. */

      function enter() {
        attachAndPlay(video, name).then(function (ok) {
          if (ok) video.classList.add("is-playing");
        });
      }
      function leave() { stopVideo(video); }

      li.addEventListener("pointerenter", enter);
      li.addEventListener("pointerleave", leave);
      li.addEventListener("focusin", enter);
      li.addEventListener("focusout", leave);
      cleanups.push(function () {
        li.removeEventListener("pointerenter", enter);
        li.removeEventListener("pointerleave", leave);
        li.removeEventListener("focusin", enter);
        li.removeEventListener("focusout", leave);
        stopVideo(video);
      });
    });

    return function () { cleanups.forEach(function (fn) { fn(); }); };
  }

  /* --------------------------------------------------------------- 10 reel */

  function setupReel() {
    var pin = $("[data-reel-pin]");
    var track = $("[data-reel-track]");
    if (!pin || !track || !hasST || reduced()) return;

    var distance = function () { return Math.max(0, track.scrollWidth - window.innerWidth + 48); };
    if (distance() <= 0) return;

    window.gsap.to(track, {
      x: function () { return -distance(); },
      ease: "none",
      scrollTrigger: {
        trigger: pin,
        start: "top top",
        end: function () { return "+=" + distance(); },
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1
      }
    });
  }

  /* ----------------------------------------------------------- 11 schedule */

  var SCHEDULE = {
    first: {
      mon: [["07:00", "First time, 60 min", "Oksana Lysenko"], ["12:30", "First time, 60 min", "Andriy Kovalenko"], ["19:15", "First time, 75 min", "Oksana Lysenko"]],
      tue: [["08:15", "First time, 60 min", "Kateryna Rudenko"], ["19:15", "First time, 75 min", "Andriy Kovalenko"]],
      wed: [["07:00", "First time, 60 min", "Oksana Lysenko"], ["12:30", "First time, 60 min", "Dmytro Shevchuk"], ["19:15", "First time, 75 min", "Oksana Lysenko"]],
      thu: [["08:15", "First time, 60 min", "Kateryna Rudenko"], ["19:15", "First time, 75 min", "Taras Melnyk"]],
      fri: [["07:00", "First time, 60 min", "Andriy Kovalenko"], ["18:00", "First time, 60 min", "Oksana Lysenko"]],
      sat: [["10:00", "First time, 75 min", "Kateryna Rudenko"], ["12:00", "First time, 75 min", "Taras Melnyk"]],
      sun: [["11:00", "First time, 60 min", "Kateryna Rudenko"]]
    },
    beginner: {
      mon: [["08:15", "Beginner, 75 min", "Yuliia Bondar"], ["18:00", "Beginner, 75 min", "Taras Melnyk"], ["20:30", "Beginner, 60 min", "Dmytro Shevchuk"]],
      tue: [["07:00", "Beginner, 60 min", "Yuliia Bondar"], ["18:00", "Beginner, 75 min", "Oksana Lysenko"], ["20:30", "Beginner, 60 min", "Taras Melnyk"]],
      wed: [["08:15", "Beginner, 75 min", "Yuliia Bondar"], ["18:00", "Beginner, 75 min", "Dmytro Shevchuk"]],
      thu: [["07:00", "Beginner, 60 min", "Taras Melnyk"], ["18:00", "Beginner, 75 min", "Andriy Kovalenko"], ["20:30", "Beginner, 60 min", "Yuliia Bondar"]],
      fri: [["08:15", "Beginner, 75 min", "Dmytro Shevchuk"], ["19:15", "Beginner, 75 min", "Taras Melnyk"]],
      sat: [["13:30", "Beginner, 90 min", "Andriy Kovalenko"]],
      sun: [["12:30", "Beginner, 75 min", "Oksana Lysenko"]]
    },
    open: {
      mon: [["21:30", "Open mat, 60 min", "Coach on the floor"]],
      tue: [["21:30", "Open mat, 60 min", "Coach on the floor"]],
      wed: [["21:30", "Open mat, 60 min", "Coach on the floor"]],
      thu: [["21:30", "Open mat, 60 min", "Coach on the floor"]],
      fri: [["21:30", "Open mat, 60 min", "Coach on the floor"]],
      sat: [["15:00", "Open mat, 120 min", "Coach on the floor"]],
      sun: [["14:00", "Technique hour, 60 min", "Taras Melnyk"], ["15:30", "Open mat, 90 min", "Kateryna Rudenko"]]
    }
  };

  function setupSchedule() {
    var rowsHost = $("[data-sched-rows]");
    var daySwitch = $('[data-switch="day"]');
    var levelSwitch = $('[data-switch="level"]');
    if (!rowsHost || !daySwitch || !levelSwitch) return;

    var state = { day: "mon", level: "first" };

    function build() {
      var rows = (SCHEDULE[state.level] && SCHEDULE[state.level][state.day]) || [];
      rowsHost.textContent = "";

      if (!rows.length) {
        var none = document.createElement("div");
        none.className = "srow srow--empty";
        none.textContent = "Nothing at this level on this day.";
        rowsHost.appendChild(none);
        return;
      }

      rows.forEach(function (r, i) {
        var row = document.createElement("div");
        row.className = "srow";
        /* Named so the View Transition morphs row 1 into row 1. */
        row.style.viewTransitionName = "srow-" + (i + 1);

        var time = document.createElement("span");
        time.className = "srow__time";
        time.textContent = r[0];

        var cls = document.createElement("span");
        cls.className = "srow__class";
        cls.textContent = r[1];

        var coach = document.createElement("span");
        coach.className = "srow__coach";
        coach.textContent = r[2];

        row.appendChild(time); row.appendChild(cls); row.appendChild(coach);
        rowsHost.appendChild(row);
      });
    }

    function swap() {
      if (document.startViewTransition && !reduced()) document.startViewTransition(build);
      else build();
    }

    function wire(group, key) {
      group.addEventListener("click", function (ev) {
        var btn = ev.target.closest ? ev.target.closest("button") : null;
        if (!btn || !group.contains(btn)) return;
        if (state[key] === btn.getAttribute("data-value")) return;
        state[key] = btn.getAttribute("data-value");
        $$("button", group).forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === btn));
        });
        swap();
      });
    }

    wire(daySwitch, "day");
    wire(levelSwitch, "level");
    build();
  }

  /* ------------------------------------------------------------- 12 prices */

  function setupPrices() {
    var cards = $$("[data-price]");
    if (!cards.length) return;

    if (!hasST || reduced()) {
      cards.forEach(function (c) { c.style.opacity = 1; });
      return;
    }
    window.gsap.set(cards, { y: 26 });
    window.gsap.to(cards, {
      opacity: 1,
      y: 0,
      duration: 0.55,
      ease: "power2.out",
      /* 60ms between cards, and nothing else happens in this section. */
      stagger: 0.06,
      scrollTrigger: { trigger: cards[0].parentNode, start: "top 82%", once: true }
    });
  }

  function setupSpinePanels() {
    var panels = $$("[data-spine-panel]");
    if (!panels.length) return;
    if (!hasST || reduced()) {
      panels.forEach(function (p) { p.style.opacity = 1; });
      return;
    }
    panels.forEach(function (p) {
      window.gsap.to(p, {
        opacity: 1,
        duration: 0.5,
        ease: "none",
        scrollTrigger: { trigger: p, start: "top 85%", once: true }
      });
    });
  }

  /* ---------------------------------------------------------------- 14 bell */

  var bell = (function () {
    var ctx = null;
    var on = false;

    function ensure() {
      if (ctx) return ctx;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      return ctx;
    }

    return {
      get enabled() { return on; },
      /* Only ever called from a click, so nothing plays unprompted. */
      toggle: function () {
        on = !on;
        if (on) { var c = ensure(); if (c && c.state === "suspended") c.resume(); }
        return on;
      },
      ring: function () {
        if (!on) return;
        var c = ensure();
        if (!c) return;
        var t = c.currentTime;
        var out = c.createGain();
        out.gain.setValueAtTime(0.0001, t);
        out.gain.exponentialRampToValueAtTime(0.5, t + 0.006);
        out.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
        out.connect(c.destination);

        [784, 1180, 2360].forEach(function (f, i) {
          var o = c.createOscillator();
          var g = c.createGain();
          o.type = "sine";
          o.frequency.setValueAtTime(f, t);
          g.gain.setValueAtTime(i === 0 ? 1 : 0.42 / i, t);
          o.connect(g); g.connect(out);
          o.start(t);
          o.stop(t + 1.6);
        });
      }
    };
  })();

  /* --------------------------------------------------------------- 13 timer */

  var ROUNDS = [
    { title: "Warm-up", still: "warmup", line: "Rope, shoulders, hips. Eight minutes in you will be warmer than you expected and mildly annoyed about it." },
    { title: "Stance and guard", still: "stance", line: "Feet first, then hands. You will feel like you are standing wrong. Everyone does for about a week." },
    { title: "The jab", still: "jab", line: "One punch, both hands, a hundred times. Your shoulder will mention it tomorrow." },
    { title: "Pads with a coach", still: "pads", line: "First real contact. The coach calls a shot, you throw it. Nobody is hitting you back." },
    { title: "Bag rounds", still: "bag", line: "Three minutes alone with the bag. Your breathing will fall apart, and that is normal." },
    { title: "Stretching", still: "stretch", line: "Floor, quiet, the lights go cool. The part people skip and then regret." }
  ];
  var WORK = 180;
  var REST = 60;

  function setupTimer() {
    var root = $("[data-timer]");
    if (!root) return;

    var elPhase = $("[data-timer-phase]", root);
    var elClock = $("[data-timer-clock]", root);
    var elIndex = $("[data-timer-index]", root);
    var elTitle = $("[data-timer-title]", root);
    var elLine = $("[data-timer-line]", root);
    var elFill = $("[data-timer-fill]", root);
    var elStill = $("[data-timer-still]", root);
    var elVideo = $("[data-timer-video]", root);
    var elLive = $("[data-timer-live]", root);
    var btnToggle = $('[data-timer-act="toggle"]', root);
    var bellLabel = $("[data-timer-bell-label]", root);

    var i = 0;             /* round index */
    var resting = false;
    var running = false;
    var endsAt = 0;        /* absolute ms, so the clock cannot drift */
    var remaining = WORK * 1000;
    var raf = null;
    var lastShown = -1;

    function duration() { return (resting ? REST : WORK) * 1000; }

    function fmt(ms) {
      var s = Math.max(0, Math.ceil(ms / 1000));
      return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
    }

    function paintMedia() {
      var name = ROUNDS[i].still;
      if (elStill) {
        elStill.style.opacity = 0;
        window.setTimeout(function () {
          elStill.style.backgroundImage = "url(" + stillURL(name) + ")";
          elStill.style.opacity = 1;
        }, reduced() ? 0 : 200);
      }
      stopVideo(elVideo);
      if (running && !resting) {
        attachAndPlay(elVideo, name).then(function (ok) {
          if (ok) elVideo.classList.add("is-playing");
        });
      }
    }

    function paintText() {
      var r = ROUNDS[i];
      if (elIndex) elIndex.textContent = String(i + 1);
      if (elPhase) elPhase.textContent = resting ? "Rest" : running ? "Work" : "Ready";
      if (elTitle) elTitle.textContent = resting ? "Rest, one minute" : r.title;
      if (elLine) elLine.textContent = resting
        ? "Drink, breathe through your nose, stay on your feet. Sitting down makes the next round worse."
        : r.line;
      if (elLive) {
        elLive.textContent = resting
          ? "Rest, one minute, before round " + (i + 2) + " of 6."
          : "Round " + (i + 1) + " of 6. " + r.title + ", three minutes.";
      }
    }

    function paintClock(ms) {
      var s = Math.ceil(ms / 1000);
      if (s === lastShown) return;
      lastShown = s;
      if (elClock) elClock.textContent = fmt(ms);
    }

    function paintFill(ms) {
      if (!elFill) return;
      var p = 1 - Math.max(0, ms) / duration();
      elFill.style.transform = "scaleX(" + Math.min(1, Math.max(0, p)).toFixed(4) + ")";
    }

    function tick() {
      if (!running) return;
      var left = endsAt - Date.now();
      paintClock(left);
      paintFill(left);
      if (left <= 0) { advance(); return; }
      raf = window.requestAnimationFrame(tick);
    }

    function startPhase() {
      endsAt = Date.now() + duration();
      lastShown = -1;
      phase.force(resting ? "rest" : "work");
      paintText();
      paintMedia();
      bell.ring();
      if (raf) window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(tick);
    }

    function advance() {
      if (!resting) {
        if (i === ROUNDS.length - 1) { finish(); return; }
        resting = true;
      } else {
        resting = false;
        i += 1;
      }
      startPhase();
    }

    function finish() {
      running = false;
      resting = false;
      if (raf) window.cancelAnimationFrame(raf);
      phase.unlock("work");
      if (elPhase) elPhase.textContent = "Done";
      if (elClock) elClock.textContent = "0:00";
      if (elTitle) elTitle.textContent = "That was the hour";
      if (elLine) elLine.textContent = "Six rounds, eighteen minutes of work. A real class is the same shape with more of it. The trial sits in a first-time group, so the whole room is on round one with you.";
      if (elFill) elFill.style.transform = "scaleX(1)";
      if (btnToggle) btnToggle.querySelector("span").textContent = "Run it again";
      if (elLive) elLive.textContent = "The class is over. Book a trial below.";
      stopVideo(elVideo);
      root.dataset.finished = "true";
    }

    function play() {
      if (running) return;
      running = true;
      phase.lock();
      delete root.dataset.finished;
      if (btnToggle) btnToggle.querySelector("span").textContent = "Pause";
      endsAt = Date.now() + remaining;
      lastShown = -1;
      phase.force(resting ? "rest" : "work");
      paintText();
      paintMedia();
      if (raf) window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(tick);
    }

    function pause() {
      if (!running) return;
      running = false;
      remaining = Math.max(0, endsAt - Date.now());
      if (raf) window.cancelAnimationFrame(raf);
      if (btnToggle) btnToggle.querySelector("span").textContent = "Resume";
      if (elPhase) elPhase.textContent = "Paused";
      stopVideo(elVideo);
    }

    function reset() {
      running = false;
      resting = false;
      i = 0;
      remaining = WORK * 1000;
      if (raf) window.cancelAnimationFrame(raf);
      delete root.dataset.finished;
      phase.unlock("work");
      lastShown = -1;
      paintText();
      paintClock(remaining);
      paintFill(remaining);
      paintMedia();
      if (btnToggle) btnToggle.querySelector("span").textContent = "Start the class";
    }

    function skip() {
      /* Nobody should have to wait out three real minutes to see round four. */
      resting = false;
      i = (i + 1) % ROUNDS.length;
      remaining = WORK * 1000;
      if (running) startPhase();
      else {
        paintText(); paintClock(remaining); paintFill(remaining); paintMedia();
      }
    }

    root.addEventListener("click", function (ev) {
      var btn = ev.target.closest ? ev.target.closest("[data-timer-act]") : null;
      if (!btn) return;
      var act = btn.getAttribute("data-timer-act");
      if (act === "toggle") { running ? pause() : play(); }
      else if (act === "skip") skip();
      else if (act === "reset") reset();
      else if (act === "bell") {
        var on = bell.toggle();
        btn.setAttribute("aria-pressed", String(on));
        if (bellLabel) bellLabel.textContent = on ? "Bell on" : "Bell off";
        if (on) bell.ring();
      }
    });

    /* The clock is read from Date.now, so a backgrounded tab catches up
       instead of falling behind. */
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && running) { if (raf) window.cancelAnimationFrame(raf); raf = window.requestAnimationFrame(tick); }
    });

    reset();
  }

  /* ---------------------------------------------------------------- 15 form */

  function setupForm() {
    var form = $("[data-form]");
    if (!form) return;
    var status = $("[data-form-status]", form);

    function setError(input, msg) {
      var box = form.querySelector('[data-err-for="' + input.id + '"]');
      var field = input.closest(".field");
      if (box) {
        box.textContent = msg || "";
        box.hidden = !msg;
      }
      if (field) field.classList.toggle("is-bad", Boolean(msg));
      input.setAttribute("aria-invalid", msg ? "true" : "false");
    }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var name = form.elements.name;
      var contact = form.elements.contact;
      var bad = null;

      if (!name.value.trim()) { setError(name, "Tell us what to call you."); bad = bad || name; }
      else setError(name, "");

      var c = contact.value.trim();
      var looksEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c);
      var looksPhone = /^[+()\d\s-]{9,}$/.test(c);
      if (!c) { setError(contact, "An email or a phone number, either is fine."); bad = bad || contact; }
      else if (!looksEmail && !looksPhone) { setError(contact, "That does not look like an email or a phone number."); bad = bad || contact; }
      else setError(contact, "");

      if (bad) {
        if (status) { status.textContent = ""; status.removeAttribute("data-ok"); }
        bad.focus();
        return;
      }

      if (status) {
        /* textContent, never innerHTML: the name came from a text field. */
        status.textContent = "Thanks, " + name.value.trim() + ". In demo mode this is where the booking would be sent. Nothing left your browser.";
        status.setAttribute("data-ok", "true");
      }
      bell.ring();
      form.reset();
    });
  }

  /* ----------------------------------------------------------- 16 the close */

  function setupFoot() {
    var foot = $("[data-foot]");
    var arc = $("[data-dial-arc]");
    if (!foot || !hasST) return;

    window.ScrollTrigger.create({
      trigger: foot,
      start: "top 80%",
      once: true,
      onEnter: function () {
        /* The arc completes and the bell sounds once, if audio is on. */
        if (arc) arc.style.strokeDashoffset = 0;
        bell.ring();
      }
    });
  }

  /* ------------------------------------------------------------- count-in */

  function setupCountin() {
    var el = $("[data-countin]");
    if (!el) return;
    var skip = $("[data-countin-skip]", el);

    function dismiss() {
      html.dataset.countin = "off";
      try { window.sessionStorage.setItem("jab.countin", "1"); } catch (e) { /* private mode */ }
    }

    if (html.dataset.countin !== "on") { el.hidden = true; return; }

    el.hidden = false;
    try { window.sessionStorage.setItem("jab.countin", "1"); } catch (e) { /* private mode */ }

    if (skip) skip.addEventListener("click", dismiss);
    window.addEventListener("pointerdown", dismiss, { once: true });
    window.addEventListener("keydown", dismiss, { once: true });
    /* The CSS animation clears it on its own at 1.2s; this is the backstop. */
    window.setTimeout(dismiss, 1300);
  }

  /* ----------------------------------------------------- the hero wordmark */

  function setupWordmark() {
    var svg = $("[data-wordmark]");
    var text = $("[data-wordmark-text]");
    if (!svg || !text) return;

    function fit() {
      var b;
      try { b = text.getBBox(); } catch (e) { return; }
      if (!b || !b.width) return;
      var pad = b.height * 0.04;
      svg.setAttribute("viewBox", [b.x - pad, b.y - pad, b.width + pad * 2, b.height + pad * 2].join(" "));
    }

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit).catch(fit);
    else window.setTimeout(fit, 400);

    /* With real files, the footage plays inside the letterforms. */
    if (!VIDEO.enabled || reduced() || !desktop()) return;
    var fo = $("[data-wordmark-fo]");
    if (!fo) return;
    var v = document.createElement("video");
    v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute("playsinline", "");
    v.setAttribute("tabindex", "-1");
    fo.appendChild(v);
    attachAndPlay(v, "wraps").then(function (ok) { if (ok) fo.classList.add("is-playing"); });
  }

  /* ------------------------------------------------------------------ boot */

  function boot() {
    setupCountin();
    setupWordmark();
    setupScroll();
    setupSchedule();
    setupTimer();
    setupForm();

    if (!hasST) {
      /* No ScrollTrigger: show everything and keep the page usable. */
      html.dataset.js = "off";
      setupFigures();
      return;
    }

    window.gsap.registerPlugin(window.ScrollTrigger);
    window.ScrollTrigger.config({
      autoRefreshEvents: "visibilitychange,DOMContentLoaded,load,resize",
      ignoreMobileResize: true
    });

    var sections = $$("main > section[data-round]");

    /* gsap.matchMedia reverts a context when its query stops matching, which
       kills every ScrollTrigger and tween inside it and re-runs the setup.
       That is the whole resize story: no stale triggers, no leaks. */
    var mm = window.gsap.matchMedia();

    mm.add("all", function () {
      setupRounds(sections);
      setupFigures();
      setupPrices();
      setupSpinePanels();
      setupFoot();
      var undoLines = revealLines();
      return function () { if (undoLines) undoLines(); };
    });

    /* Desktop only: the reel hijack, the cursor, the magnetic labels. */
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", function () {
      setupReel();
      var a = setupTicker();
      var b = fineQuery.matches ? setupCursor() : null;
      var c = fineQuery.matches ? setupMagnetic() : null;
      return function () { [a, b, c].forEach(function (fn) { if (fn) fn(); }); };
    });

    /* Below 768px the reel is a stack and the ticker runs along the bottom. */
    mm.add("(max-width: 767px) and (prefers-reduced-motion: no-preference)", function () {
      var a = setupTicker();
      return function () { if (a) a(); };
    });

    mm.add("all", function () {
      var a = setupCoaches();
      return function () { if (a) a(); };
    });

    window.addEventListener("load", function () { window.ScrollTrigger.refresh(); });
  }

  try { boot(); } catch (err) { panic(err); }
})();
