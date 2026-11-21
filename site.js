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

  // Release notes, newest first, straight from the update server.
  const list = document.getElementById("releases");
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const inline = (s) => esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "$1");
  const markdown = (text) => {
    let html = "";
    let open = false;
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) continue;
      const h = /^#{1,6}\s+(.*)$/.exec(line);
      const b = /^[-*]\s+(.*)$/.exec(line);
      if (b) {
        if (!open) { html += "<ul>"; open = true; }
        html += `<li>${inline(b[1])}</li>`;
        continue;
      }
      if (open) { html += "</ul>"; open = false; }
      html += h ? `<h3>${inline(h[1])}</h3>` : `<p>${inline(line)}</p>`;
    }
    return html + (open ? "</ul>" : "");
  };
  const date = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  };
  // update.json names the update server; the app reads the same file.
  fetch("update.json", { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : {}))
    .then((cfg) => (cfg.feed ? fetch(`${cfg.feed.replace(/\/$/, "")}/v1/releases`, { cache: "no-cache" }) : null))
    .then((r) => (r && r.ok ? r.json() : []))
    .then((releases) => {
      if (!Array.isArray(releases) || releases.length === 0) return;
      list.innerHTML = releases
        .map((r) => `<li class="release"><div class="release-version">${esc(r.version)}<span class="release-date">${esc(date(r.date))}</span></div><div class="release-body">${markdown(r.notes || "")}</div></li>`)
        .join("");
    })
    .catch(() => {});
})();
