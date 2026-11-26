// Nocturne website: the iris reveal, the feature tour and the release notes.
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  // Navigation turns solid once the page moves.
  const nav = document.querySelector(".nav");
  // Scroll-linked pieces: the reveal and the sky warming towards dawn.
  const reveal = document.querySelector(".reveal");
  const stage = document.querySelector(".reveal-stage");
  let ticking = false;
  const frame = () => {
    ticking = false;
    const y = scrollY;
    nav.dataset.solid = String(y > 24);
    const max = Math.max(1, root.scrollHeight - innerHeight);
    root.style.setProperty("--dawn", Math.min(1, y / max).toFixed(3));
    if (!reduced && reveal) {
      const r = reveal.getBoundingClientRect();
      const span = Math.max(1, r.height - innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / span));
      stage.style.setProperty("--p", p.toFixed(4));
    }
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(frame);
    }
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  frame();
  if (reduced && stage) stage.style.setProperty("--p", "1");

  // The hero iris opens once on load, then leans a little towards the pointer.
  const hero = document.querySelector(".hero-iris");
  requestAnimationFrame(() => hero && hero.classList.add("ready"));
  if (hero && !reduced && matchMedia("(pointer: fine)").matches) {
    const iris = hero.querySelector(".iris");
    addEventListener("pointermove", (e) => {
      const x = e.clientX / innerWidth - 0.5;
      iris.style.setProperty("--tilt", `${(x * 14).toFixed(2)}deg`);
    }, { passive: true });
  }

  // Feature tour: a vertical tab list with arrow-key movement.
  const tabs = [...document.querySelectorAll('.tour-list [role="tab"]')];
  const select = (tab, focus) => {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    }
    if (focus) tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab, false));
    tab.addEventListener("keydown", (e) => {
      const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (step) {
        e.preventDefault();
        select(tabs[(i + step + tabs.length) % tabs.length], true);
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        select(tabs[e.key === "Home" ? 0 : tabs.length - 1], true);
      }
    });
  });

  // Runs `tick` every `ms` while `el` is on screen and the tab is visible.
  const whileVisible = (el, ms, tick) => {
    if (!el) return;
    let timer = 0;
    let seen = false;
    const sync = () => {
      clearInterval(timer);
      if (seen && !document.hidden) timer = setInterval(tick, ms);
    };
    new IntersectionObserver(([e]) => { seen = e.isIntersecting; sync(); }, { threshold: 0.35 }).observe(el);
    document.addEventListener("visibilitychange", sync);
  };

  // The window the iris opens onto: Home's featured film changes, as it does in the app.
  const shots = [...document.querySelectorAll(".window .shot")];
  if (!reduced && shots.length > 1) {
    let at = 0;
    whileVisible(document.querySelector(".window"), 4500, () => {
      shots[at].classList.remove("is-on");
      at = (at + 1) % shots.length;
      shots[at].classList.add("is-on");
    });
  }

  // A closer look: screens take turns, with a progress line under the current one.
  const look = document.querySelector(".look-stage");
  if (look) {
    const tabs2 = [...look.querySelectorAll('[role="tab"]')];
    const pics = [...look.querySelectorAll(".look-shot")];
    const SPAN = 6500;
    let current = 0;
    let started = performance.now();
    let paused = false;
    let visible = false;
    const show = (i, focus) => {
      current = (i + tabs2.length) % tabs2.length;
      tabs2.forEach((t, k) => {
        const on = k === current;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        t.style.setProperty("--fill", reduced ? "1" : "0");
        pics[k].classList.toggle("is-on", on);
      });
      // Load the next screen early so it never fades in half-drawn.
      const next = pics[(current + 1) % pics.length];
      if (next.loading === "lazy") next.loading = "eager";
      started = performance.now();
      if (focus) tabs2[current].focus();
    };
    tabs2.forEach((t, i) => {
      t.addEventListener("click", () => show(i, false));
      t.addEventListener("keydown", (e) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (step) { e.preventDefault(); show(current + step, true); }
      });
    });
    look.addEventListener("pointerenter", () => { paused = true; });
    look.addEventListener("pointerleave", () => { paused = false; started = performance.now() - parseFloat(tabs2[current].style.getPropertyValue("--fill") || "0") * SPAN; });
    look.addEventListener("focusin", () => { paused = true; });
    look.addEventListener("focusout", () => { paused = false; });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) started = performance.now(); }, { threshold: 0.3 }).observe(look);
    if (!reduced) {
      const loop = (now) => {
        if (paused || !visible || document.hidden) {
          started = now - parseFloat(tabs2[current].style.getPropertyValue("--fill") || "0") * SPAN;
        } else {
          const f = Math.min(1, (now - started) / SPAN);
          tabs2[current].style.setProperty("--fill", f.toFixed(4));
          if (f >= 1) show(current + 1, false);
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
    show(0, false);
  }
})();
