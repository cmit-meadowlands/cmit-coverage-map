# CMIT Coverage Map

Interactive 3D "Your Technology Team" map for CMIT Solutions of the Meadowlands.

| File | What it is |
|---|---|
| `index.html` | The whole page, one file. Logos are embedded. Three.js 0.169.0 loads from cdn.jsdelivr.net when a visitor clicks Start. |
| `wp-inventory.html` | Plain HTML list of every zone and object, to paste into a WordPress Custom HTML block below the embed (SEO). |
| `.nojekyll` | Tells GitHub Pages to serve files as-is. |
| `source/` | Build sources. Edit `source/map.js` (copy, links, positions, flows), then run `python3 source/build.py` (needs Pillow) to regenerate `index.html`. |

## Embed

```html
<iframe src="https://USERNAME.github.io/REPO/" title="CMIT coverage map" loading="lazy"
  allow="fullscreen" style="width:100%;height:min(85vh,800px);border:0"></iframe>
```

Deep links: `?focus=firewall` (any object or zone id), `?view=live` (plays the simulated day), `?view=data` (flows only, no day), `?view=live,compliance`.
`?inventory=1` shows regenerated WordPress inventory HTML with a Copy button.

Hotkeys: 0 overview, 1–4 office zones, 5 cloud, 6 SOC, 7 remote, 8 truck, D or L Live View, N next event, P pause, C Compliance, Esc close.

Live View plays a simulated 24-hour day scripted in `MAP.liveView` (times, copy, recap stats). The closing card offers an optional replay of the same day without CMIT.
