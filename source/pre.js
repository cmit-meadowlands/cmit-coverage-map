/* ==========================================================================
   Helpers shared by the page, the hidden semantic list and the WP export.
   No DOM access in the functions above the "DOM" line (Node reuses them).
   ========================================================================== */
const CMAP = (() => {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const words = s => s.split(/\s+/).filter(w => /[A-Za-z0-9]/.test(w));
  const isShort = s => words(s).length <= 3;
  /* Brand rule: 1–3 word headers are Title Case + Black; 4+ words are sentence case + Medium. */
  const display = s => isShort(s) ? s.replace(/(^|[\s(/-])([a-z])/g, (m, a, b) => a + b.toUpperCase()) : s;
  const linkOf = key => MAP.linkBase + MAP.links[key].path;
  const allObjects = () => MAP.zones.flatMap(z => z.objects.map(o => ({ ...o, zone: z })));

  /* Paste-ready inventory for the WordPress page (SEO lives on the host page). */
  function inventoryHTML() {
    const L = [];
    L.push('<section class="cmit-coverage-inventory">');
    L.push('  <h2>Everything your technology team covers</h2>');
    L.push(`  <p>${esc(MAP.office.name)} manages and protects every part of a small business's technology: ${esc(MAP.office.descriptor)}. Here is the full list from our interactive coverage map.</p>`);
    for (const z of MAP.zones) {
      L.push(`  <h3>${esc(display(z.name))}</h3>`);
      L.push(`  <p>${esc(z.blurb)}</p>`);
      L.push('  <ul>');
      for (const o of z.objects) {
        L.push('    <li>');
        L.push(`      <h4>${esc(display(o.name))}</h4>`);
        L.push(`      <p>${esc(o.summary)}</p>`);
        L.push('      <ul>' + o.bullets.map(b => `<li>${esc(b)}</li>`).join('') + '</ul>');
        L.push(`      <p><a href="${esc(linkOf(o.link))}">${esc(MAP.links[o.link].label)}</a></p>`);
        L.push('    </li>');
      }
      L.push('  </ul>');
    }
    L.push(`  <p><a href="${esc(MAP.cta.href)}">${esc(MAP.cta.label)}</a></p>`);
    L.push('</section>');
    return L.join('\n');
  }

  return { esc, words, isShort, display, linkOf, allObjects, inventoryHTML };
})();
if (typeof module !== "undefined") module.exports = { MAP, CMAP };

/* ---------------------------------- DOM ---------------------------------- */
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const { esc, display, linkOf } = CMAP;
    /* Visually hidden semantic list for screen readers. */
    const sr = document.getElementById("sr-inventory");
    if (sr) {
      sr.innerHTML = `<h2>Technology that ${esc(MAP.office.name)} manages and protects</h2><ul>` +
        MAP.zones.map(z => `<li><h3>${esc(display(z.name))}</h3><p>${esc(z.blurb)}</p><ul>` +
          z.objects.map(o => `<li><h4>${esc(display(o.name))}</h4><p>${esc(o.summary)}</p><ul>${o.bullets.map(b => `<li>${esc(b)}</li>`).join("")}</ul><a href="${esc(linkOf(o.link))}" target="_blank" rel="noopener">${esc(MAP.links[o.link].label)}</a></li>`).join("") +
          `</ul></li>`).join("") + `</ul>`;
    }
    /* Poster copy from MAP. */
    const P = MAP.poster;
    const set = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };
    set("poster-pre", P.preheader); set("poster-title", P.title); set("poster-body", P.body); set("start-label", P.button);
    const cta = document.getElementById("cta");
    if (cta) { cta.href = MAP.cta.href; cta.textContent = MAP.cta.label; }
    /* ?inventory=1 shows the paste-ready HTML for the WordPress page. */
    if (new URLSearchParams(location.search).has("inventory")) {
      const box = document.getElementById("export");
      box.hidden = false;
      box.querySelector("textarea").value = CMAP.inventoryHTML();
      box.querySelector("button").addEventListener("click", async e => {
        const ta = box.querySelector("textarea"); ta.select();
        try { await navigator.clipboard.writeText(ta.value); } catch (_) { document.execCommand("copy"); }
        e.target.textContent = "Copied";
      });
    }
  });
}
