#!/usr/bin/env python3
"""Generate the animated "NEO-CITY" profile README visuals.

Every asset is a self-contained animated SVG (CSS + SMIL, no JavaScript, no
external fonts) so GitHub renders it directly inside the README.

Static scenes are rebuilt from the data below. The live-stats panel is rebuilt
from the GitHub REST API (set GITHUB_TOKEN to raise the rate limit). A daily
GitHub Action re-runs this script so the stats and "recently shipped" ticker
stay current.
"""
from __future__ import annotations

import datetime as dt
import json
import math
import os
import random
import urllib.request
from html import escape
from pathlib import Path

USER = os.environ.get("PROFILE_USER", "Sivanesanbalu")
OUT = Path(__file__).resolve().parent.parent / "assets" / "neo"
OUT.mkdir(parents=True, exist_ok=True)

SANS = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif"
MONO = "'JetBrains Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace"

CYAN, PINK, VIOLET, AMBER, GREEN = "#00f0ff", "#ff2bd6", "#8b5cf6", "#ffb800", "#3dff9a"
BG, PANEL, INK, DIM = "#05040f", "#0c0a22", "#e8f6ff", "#8a90b8"


def svg(w: int, h: int, body: str, style: str = "", label: str = "") -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" '
        f'role="img" aria-label="{escape(label)}"><title>{escape(label)}</title>'
        f"<style>text{{font-family:{SANS}}}.m{{font-family:{MONO}}}{style}</style>{body}</svg>"
    )


def write(name: str, content: str) -> None:
    (OUT / name).write_text(content, encoding="utf-8")
    print(f"wrote assets/neo/{name} ({len(content):,} bytes)")


def t(x, y, s, size=14, fill=INK, weight=400, anchor="start", cls="", extra=""):
    c = f' class="{cls}"' if cls else ""
    return (f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" font-weight="{weight}" '
            f'text-anchor="{anchor}"{c} {extra}>{escape(s)}</text>')



# ─────────────────────────────────────────────────────── 3D ENGINE ──
# Real 3D: geometry is built in 3D, rotated, perspective-projected per frame,
# and the frames are played back with SMIL. Depth drives size, brightness
# and front/back occlusion.
def rx(p, a):
    x, y, z = p; c, s_ = math.cos(a), math.sin(a)
    return (x, y * c - z * s_, y * s_ + z * c)


def ry(p, a):
    x, y, z = p; c, s_ = math.cos(a), math.sin(a)
    return (x * c + z * s_, y, -x * s_ + z * c)


def rz(p, a):
    x, y, z = p; c, s_ = math.cos(a), math.sin(a)
    return (x * c - y * s_, x * s_ + y * c, z)


def proj(p, cx, cy, f=420.0):
    k = f / (f + p[2])
    return cx + p[0] * k, cy + p[1] * k, k


def icosphere(subdiv=1):
    r5 = 1 / math.sqrt(5)
    v = [(0, -1, 0), (0, 1, 0)]
    v += [(2 * r5 * math.cos(math.radians(72 * i)), -r5, 2 * r5 * math.sin(math.radians(72 * i))) for i in range(5)]
    v += [(2 * r5 * math.cos(math.radians(72 * i + 36)), r5, 2 * r5 * math.sin(math.radians(72 * i + 36))) for i in range(5)]
    A, B = (lambda i: 2 + i % 5), (lambda i: 7 + i % 5)
    faces = []
    for i in range(5):
        faces += [(0, A(i), A(i + 1)), (1, B(i + 1), B(i)), (A(i), B(i), A(i + 1)), (A(i + 1), B(i), B(i + 1))]
    for _ in range(subdiv):
        cache, nf = {}, []

        def mid(a, b):
            key = (min(a, b), max(a, b))
            if key not in cache:
                m = [(v[a][j] + v[b][j]) / 2 for j in range(3)]
                n = math.sqrt(sum(c * c for c in m))
                v.append(tuple(c / n for c in m)); cache[key] = len(v) - 1
            return cache[key]
        for a, b, c in faces:
            ab, bc, ca = mid(a, b), mid(b, c), mid(c, a)
            nf += [(a, ab, ca), (b, bc, ab), (c, ca, bc), (ab, bc, ca)]
        faces = nf
    edges = sorted({(min(a, b), max(a, b)) for f in faces for a, b in ((f[0], f[1]), (f[1], f[2]), (f[2], f[0]))})
    return v, edges


CUBE_V = [(x, y, z) for x in (-1, 1) for y in (-1, 1) for z in (-1, 1)]
CUBE_E = [(a, b) for a in range(8) for b in range(a + 1, 8) if sum(CUBE_V[a][i] != CUBE_V[b][i] for i in range(3)) == 1]
OCTA_V = [(1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1)]
OCTA_E = [(a, b) for a in range(6) for b in range(a + 1, 6) if OCTA_V[a] != tuple(-c for c in OCTA_V[b])]


def wire3d(verts, edges, cx, cy, size, sym, frames, dur, tilt, color, node_color=None, node_r=0.0,
           width=1.4, f=420.0, spin=ry):
    """Rotating wireframe: one <line> per edge, coordinates + depth-shaded opacity per frame."""
    fr = []
    for i in range(frames + 1):
        ang = sym * i / frames
        fr.append([proj(tuple(c * size for c in rx(spin(p, ang), tilt)), cx, cy, f) + (rx(spin(p, ang), tilt)[2],) for p in verts])
    kt = ";".join(f"{i / frames:.4f}" for i in range(frames + 1))
    out = []

    def anim(attr, vals):
        return f'<animate attributeName="{attr}" values="{";".join(vals)}" keyTimes="{kt}" dur="{dur}s" repeatCount="indefinite"/>'
    for a, b in edges:
        xa = [f"{fr[i][a][0]:.1f}" for i in range(frames + 1)]
        ya = [f"{fr[i][a][1]:.1f}" for i in range(frames + 1)]
        xb = [f"{fr[i][b][0]:.1f}" for i in range(frames + 1)]
        yb = [f"{fr[i][b][1]:.1f}" for i in range(frames + 1)]
        op = [f"{max(.12, min(1, .55 - (fr[i][a][3] + fr[i][b][3]) / 2 * .5)):.2f}" for i in range(frames + 1)]
        out.append(f'<line stroke="{color}" stroke-width="{width}" stroke-linecap="round" x1="{xa[0]}" y1="{ya[0]}" x2="{xb[0]}" y2="{yb[0]}" stroke-opacity="{op[0]}">'
                   + anim("x1", xa) + anim("y1", ya) + anim("x2", xb) + anim("y2", yb) + anim("stroke-opacity", op) + "</line>")
    if node_r:
        for k in range(len(verts)):
            xs = [f"{fr[i][k][0]:.1f}" for i in range(frames + 1)]
            ys = [f"{fr[i][k][1]:.1f}" for i in range(frames + 1)]
            rs = [f"{node_r * fr[i][k][2] ** 2:.2f}" for i in range(frames + 1)]
            op = [f"{max(.15, min(1, .6 - fr[i][k][3] * .55)):.2f}" for i in range(frames + 1)]
            out.append(f'<circle fill="{node_color or color}" cx="{xs[0]}" cy="{ys[0]}" r="{rs[0]}">'
                       + anim("cx", xs) + anim("cy", ys) + anim("r", rs) + anim("opacity", op) + "</circle>")
    return "".join(out)


# ───────────────────────────────────────────────────────────── HERO ──
def hero() -> str:
    W, H, HZ = 1200, 460, 338
    rnd = random.Random(7)
    b = []
    b.append(f"""<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="#030014"/><stop offset=".55" stop-color="#1a0840"/><stop offset="1" stop-color="#4a0d5c"/></linearGradient>
<linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="#ffe066"/><stop offset=".45" stop-color="#ff7a3d"/><stop offset="1" stop-color="{PINK}"/></linearGradient>
<linearGradient id="name" x1="0" y1="0" x2="1" y2="0">
 <stop offset="0" stop-color="{CYAN}"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="{PINK}"/>
 <animateTransform attributeName="gradientTransform" type="translate" values="-1 0;1 0;-1 0" dur="8s" repeatCount="indefinite"/></linearGradient>
<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="#2a0640"/><stop offset="1" stop-color="#05000f"/></linearGradient>
<linearGradient id="scan" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="{CYAN}" stop-opacity="0"/><stop offset=".5" stop-color="{CYAN}" stop-opacity=".18"/><stop offset="1" stop-color="{CYAN}" stop-opacity="0"/></linearGradient>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="soft"><feGaussianBlur stdDeviation="18"/></filter>
<mask id="sunMask"><rect width="{W}" height="{H}" fill="#fff"/>""")
    for i in range(7):
        y = 290 + i * 9
        b.append(f'<rect x="0" y="{y}" width="{W}" height="{1.5 + i * 0.9:.1f}" fill="#000"/>')
    b.append(f"""</mask>
<clipPath id="frame"><rect width="{W}" height="{H}" rx="18"/></clipPath>
</defs><g clip-path="url(#frame)">
<rect width="{W}" height="{H}" fill="url(#sky)"/>""")
    # stars
    for _ in range(90):
        x, y, r = rnd.uniform(0, W), rnd.uniform(0, HZ - 60), rnd.choice([0.6, 0.9, 1.3])
        d, dl = rnd.uniform(2, 5), rnd.uniform(0, 5)
        b.append(f'<circle class="tw" cx="{x:.0f}" cy="{y:.0f}" r="{r}" fill="#fff" '
                 f'style="animation-duration:{d:.1f}s;animation-delay:-{dl:.1f}s"/>')
    # shooting star
    b.append(f'<line class="shoot" x1="0" y1="0" x2="-90" y2="-30" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0"/>')
    # sun
    b.append(f'<circle cx="600" cy="{HZ}" r="150" fill="{PINK}" opacity=".35" filter="url(#soft)" class="pulse"/>')
    b.append(f'<circle cx="600" cy="{HZ}" r="118" fill="url(#sun)" mask="url(#sunMask)"/>')

    def skyline(seed, base_h, var_h, color, windows, cls):
        r = random.Random(seed)
        parts, x = [], 0
        while x < W:
            w = r.randint(28, 78)
            h = base_h + r.randint(0, var_h)
            parts.append(f'<rect x="{x}" y="{HZ - h}" width="{w}" height="{h}" fill="{color}"/>')
            if r.random() < .25:
                parts.append(f'<rect x="{x + w // 2 - 1}" y="{HZ - h - 18}" width="2" height="18" fill="{color}"/>'
                             f'<circle class="blink" cx="{x + w // 2}" cy="{HZ - h - 19}" r="2" fill="#ff3355" style="animation-delay:-{r.uniform(0, 2):.1f}s"/>')
            if windows:
                for wy in range(HZ - h + 8, HZ - 6, 11):
                    for wx in range(x + 5, x + w - 6, 9):
                        if r.random() < .28:
                            col = r.choice(["#ffd36b", "#ffd36b", CYAN, PINK])
                            fl = ' class="fl"' if r.random() < .2 else ""
                            parts.append(f'<rect{fl} x="{wx}" y="{wy}" width="4" height="5" fill="{col}" '
                                         f'opacity=".85" style="animation-delay:-{r.uniform(0, 6):.1f}s"/>')
            x += w + r.randint(0, 6)
        g = "".join(parts)
        return f'<g class="{cls}"><g>{g}</g><g transform="translate({W} 0)">{g}</g></g>'

    b.append(skyline(1, 30, 62, "#1d0b44", False, "far"))
    b.append(skyline(2, 14, 52, "#0a041d", True, "near"))
    # floor grid
    b.append(f'<rect x="0" y="{HZ}" width="{W}" height="{H - HZ}" fill="url(#floor)"/>')
    b.append(f'<line x1="0" y1="{HZ}" x2="{W}" y2="{HZ}" stroke="{PINK}" stroke-width="2" filter="url(#glow)"/>')
    for k in range(-14, 15):
        b.append(f'<line x1="{600 + k * 14}" y1="{HZ}" x2="{600 + k * 140}" y2="{H}" stroke="{PINK}" stroke-opacity=".45"/>')
    for i in range(6):
        b.append(f'<line class="gl" x1="0" y1="{HZ}" x2="{W}" y2="{HZ}" stroke="{PINK}" stroke-opacity=".7" '
                 f'style="animation-delay:-{i * 0.5:.1f}s"/>')
    # rain
    for _ in range(70):
        x, y, d = rnd.uniform(0, W + 200), rnd.uniform(-H, 0), rnd.uniform(.7, 1.4)
        b.append(f'<line class="rain" x1="{x:.0f}" y1="{y:.0f}" x2="{x - 6:.0f}" y2="{y + 18:.0f}" stroke="{CYAN}" '
                 f'stroke-opacity=".35" style="animation-duration:{d:.2f}s;animation-delay:-{rnd.uniform(0, 2):.2f}s"/>')
    # name with glitch
    name = "SIVANESAN B"
    common = f'x="600" y="150" text-anchor="middle" font-size="86" font-weight="900" letter-spacing="8"'
    for k in range(14, 0, -1):  # 3D extrusion whose depth direction swings like a slow camera orbit
        mix = k / 14
        col = "#%02x%02x%02x" % (int(150 - 110 * mix), int(40 - 32 * mix), int(200 - 130 * mix))
        vals = ";".join(f"{k * 1.15 * math.sin(a):.1f} {k * 0.95 * math.cos(a) + k * .25:.1f}" for a in (-.75, .75, -.75))
        b.append(f'<text {common} fill="{col}"><animateTransform attributeName="transform" type="translate" values="{vals}" '
                 f'keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur="7s" repeatCount="indefinite"/>{name}</text>')
    b.append(f'<g class="bob">{wire3d(CUBE_V, CUBE_E, 130, 120, 34, math.pi / 2, 30, 4, -.45, CYAN, CYAN, 3.2, 1.8)}</g>')
    b.append(f'<g class="bob2">{wire3d(OCTA_V, OCTA_E, 1072, 122, 44, math.pi / 2, 30, 5, .35, PINK, AMBER, 3.2, 1.8)}</g>')
    b.append(f'<text {common} fill="{PINK}" opacity=".8" class="g1">{name}</text>')
    b.append(f'<text {common} fill="{CYAN}" opacity=".8" class="g2">{name}</text>')
    b.append(f'<text {common} fill="url(#name)" filter="url(#glow)" class="g0">{name}</text>')
    # rotating typed roles
    roles = ["> AI Engineer", "> Multi-Agent Architect", "> Voice AI Builder",
             "> RAG + LLM Systems", "> IEEE '25 Author"]
    cyc = 3.2 * len(roles)
    cw = 26 * 0.6
    for i, role in enumerate(roles):
        wid = len(role) * cw + 4
        x0 = 600 - wid / 2
        s, e1, e2, e3 = (i * 3.2) / cyc, (i * 3.2 + 1.2) / cyc, (i * 3.2 + 2.6) / cyc, (i * 3.2 + 3.1) / cyc
        kt = sorted({0, s, e1, e2, e3, 1})
        vals = {0: 0, s: 0, e1: wid, e2: wid, e3: 0, 1: 0}
        kts = ";".join(f"{k:.4f}" for k in kt)
        vs = ";".join(f"{vals[k]:.1f}" for k in kt)
        cx = ";".join(f"{x0 + vals[k]:.1f}" for k in kt)
        op = ";".join("1" if s <= k < e3 and k != e3 else "0" for k in kt)
        b.append(f'<clipPath id="r{i}"><rect x="{x0:.1f}" y="180" height="40" width="0">'
                 f'<animate attributeName="width" values="{vs}" keyTimes="{kts}" dur="{cyc}s" repeatCount="indefinite"/></rect></clipPath>')
        b.append(f'<text class="m" x="{x0:.1f}" y="210" font-size="26" fill="{AMBER}" clip-path="url(#r{i})" filter="url(#glow)">{escape(role)}</text>')
        b.append(f'<rect y="188" width="13" height="28" fill="{AMBER}" opacity="0"><animate attributeName="x" values="{cx}" keyTimes="{kts}" dur="{cyc}s" repeatCount="indefinite"/>'
                 f'<animate attributeName="opacity" values="{op}" keyTimes="{kts}" calcMode="discrete" dur="{cyc}s" repeatCount="indefinite"/></rect>')
    b.append(f'<rect x="300" y="226" width="600" height="30" rx="15" fill="#05040f" fill-opacity=".55"/>')
    b.append(t(600, 246, "Building low-latency Voice AI, RAG copilots & autonomous agent systems", 17, "#cfd6ff", 500, "middle"))
    # HUD
    b.append(f'<g class="m" font-size="12" fill="{CYAN}">'
             f'<circle cx="34" cy="30" r="5" fill="{GREEN}" class="blink"/>'
             f'<text x="46" y="34" class="m" font-size="12" fill="{CYAN}">SYS.ONLINE // COIMBATORE · IN</text>'
             f'<text x="1166" y="34" class="m" font-size="12" fill="{CYAN}" text-anchor="end">NEURAL·CORE v26.11 ▮▮▮▮▯</text>'
             f'<text x="34" y="440" class="m" font-size="12" fill="{PINK}">github.com/{USER}</text>'
             f'<text x="1166" y="440" class="m" font-size="12" fill="{PINK}" text-anchor="end">LAT 11.01°N · LON 76.96°E</text></g>')
    for (x, y, sx, sy) in [(16, 16, 1, 1), (1184, 16, -1, 1), (16, 444, 1, -1), (1184, 444, -1, -1)]:
        b.append(f'<path d="M{x} {y + sy * 26}V{y}H{x + sx * 26}" fill="none" stroke="{CYAN}" stroke-width="2"/>')
    b.append(f'<rect class="scan" x="0" y="-80" width="{W}" height="80" fill="url(#scan)"/>')
    b.append("</g>")
    style = f"""
.tw{{animation:tw 3s ease-in-out infinite}}@keyframes tw{{50%{{opacity:.15}}}}
.far{{animation:pan 90s linear infinite}}.near{{animation:pan 45s linear infinite}}
@keyframes pan{{to{{transform:translateX(-{W}px)}}}}
.fl{{animation:fl 3s steps(1) infinite}}@keyframes fl{{30%{{opacity:.1}}60%{{opacity:.85}}80%{{opacity:.2}}}}
.blink{{animation:bl 1.4s steps(1) infinite}}@keyframes bl{{50%{{opacity:.15}}}}
.gl{{animation:gl 3s cubic-bezier(.55,0,1,.45) infinite}}@keyframes gl{{from{{transform:translateY(0);opacity:0}}15%{{opacity:.8}}to{{transform:translateY({H - HZ}px);opacity:1}}}}
.rain{{animation:rain 1s linear infinite}}@keyframes rain{{to{{transform:translate(-60px,{H + 80}px)}}}}
.pulse{{animation:pu 4s ease-in-out infinite;transform-origin:600px {HZ}px}}@keyframes pu{{50%{{transform:scale(1.12);opacity:.55}}}}
.scan{{animation:sc 7s linear infinite}}@keyframes sc{{to{{transform:translateY({H + 80}px)}}}}
.g1{{animation:g1 5s steps(1) infinite}}.g2{{animation:g2 5s steps(1) infinite}}.g0{{animation:g0 5s steps(1) infinite}}
@keyframes g1{{0%,86%,100%{{transform:translate(0,0);opacity:0}}88%{{transform:translate(-7px,2px);opacity:.85}}91%{{transform:translate(5px,-3px)}}94%{{transform:translate(-3px,0)}}}}
@keyframes g2{{0%,86%,100%{{transform:translate(0,0);opacity:0}}88%{{transform:translate(7px,-2px);opacity:.85}}91%{{transform:translate(-5px,3px)}}94%{{transform:translate(3px,1px)}}}}
@keyframes g0{{0%,87%,100%{{transform:none}}89%{{transform:skewX(-8deg)}}92%{{transform:translateX(4px)}}}}
.bob{{animation:bob 6s ease-in-out infinite}}.bob2{{animation:bob 7s ease-in-out -3s infinite}}@keyframes bob{{50%{{transform:translateY(-14px)}}}}
.shoot{{animation:sh 9s ease-out infinite}}@keyframes sh{{0%,80%{{transform:translate(1300px,30px);opacity:0}}82%{{opacity:1}}92%,100%{{transform:translate(700px,230px);opacity:0}}}}
"""
    return svg(W, H, "".join(b), style, "Sivanesan B — animated neon city hero: AI Engineer, Multi-Agent Architect, Voice AI Builder")


# ───────────────────────────────────────────────────────── TERMINAL ──
def terminal() -> str:
    W, H = 600, 400
    lines = [
        ("$ whoami", True),
        ("Sivanesan B · AI/ML Engineer · Coimbatore, IN", False),
        ("$ cat role.txt", True),
        ("GenAI Executive & Forward Deployed Engineer", False),
        ("@ Nunes Instruments (Aug 2026 → now)", False),
        ("$ ls ~/skills", True),
        ("llm/  rag/  agents/  voice-ai/  vision/  mlops/", False),
        ("$ python paper.py --name eco-transformers", True),
        ("IEEE ICNGCS '25 · CO₂ ↓58% · inference ↑56%", False),
        ("$ echo $STATUS", True),
        ("open to AI · GenAI · Voice AI collaborations", False),
    ]
    DUR, cw = 20.0, 13 * 0.6
    b = [f"""<defs><linearGradient id="tb" x1="0" x2="1"><stop offset="0" stop-color="#1b1640"/><stop offset="1" stop-color="#2a1050"/></linearGradient>
<filter id="gl"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<rect x="1" y="1" width="{W - 2}" height="{H - 2}" rx="14" fill="{PANEL}" stroke="{VIOLET}" stroke-opacity=".6"/>
<path d="M1 15a14 14 0 0 1 14-14h{W - 30}a14 14 0 0 1 14 14v21H1z" fill="url(#tb)"/>
<circle cx="24" cy="19" r="6" fill="#ff5f57"/><circle cx="44" cy="19" r="6" fill="#febc2e"/><circle cx="64" cy="19" r="6" fill="#28c840"/>
{t(300, 24, "sivanesan@neural-core: ~", 13, DIM, 400, "middle", "m")}"""]
    tm, y = 0.6, 66
    for i, (txt, cmd) in enumerate(lines):
        wid = len(txt) * cw + 6
        d = len(txt) * 0.045 if cmd else 0.15
        s, e = tm / DUR, (tm + d) / DUR
        b.append(f'<clipPath id="c{i}"><rect x="22" y="{y - 15}" height="22" width="0"><animate attributeName="width" '
                 f'values="0;0;{wid:.0f};{wid:.0f};0" keyTimes="0;{s:.4f};{e:.4f};.97;1" dur="{DUR}s" repeatCount="indefinite"/></rect></clipPath>')
        if cmd:
            b.append(f'<text class="m" x="24" y="{y}" font-size="13" clip-path="url(#c{i})">'
                     f'<tspan fill="{GREEN}">$</tspan><tspan fill="{INK}">{escape(txt[1:])}</tspan></text>')
        else:
            col = AMBER if "IEEE" in txt else CYAN
            b.append(f'<text class="m" x="24" y="{y}" font-size="13" fill="{col}" clip-path="url(#c{i})">{escape(txt)}</text>')
        tm += d + (0.35 if cmd else 0.7)
        y += 28 if not cmd or True else 0
        if not cmd and i + 1 < len(lines) and lines[i + 1][1]:
            y += 6
    s = tm / DUR
    b.append(f'<rect x="24" y="{y - 14}" width="9" height="17" fill="{GREEN}" opacity="0" filter="url(#gl)">'
             f'<animate attributeName="opacity" values="0;1;0;1;0;1;0" keyTimes="0;{s:.3f};{s + .03:.3f};{s + .06:.3f};{s + .09:.3f};{s + .12:.3f};1" '
             f'calcMode="discrete" dur="{DUR}s" repeatCount="indefinite"/></rect>')
    return svg(W, H, "".join(b), "", "Animated terminal introducing Sivanesan B")


# ─────────────────────────────────────────────────────────── ORBIT ──
def orbit() -> str:
    W, H, CX, CY = 600, 400, 300, 192
    v, e = icosphere(1)
    b = [f"""<defs><radialGradient id="core"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".25" stop-color="{CYAN}" stop-opacity=".55"/><stop offset="1" stop-color="{VIOLET}" stop-opacity="0"/></radialGradient>
<radialGradient id="ball" cx=".38" cy=".32"><stop offset="0" stop-color="#3b2a8a" stop-opacity=".55"/><stop offset="1" stop-color="#0c0a22" stop-opacity=".2"/></radialGradient>
<filter id="g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<rect x="1" y="1" width="{W - 2}" height="{H - 2}" rx="14" fill="{PANEL}" stroke="{VIOLET}" stroke-opacity=".6"/>
{t(22, 32, "TECH ORBIT · REAL-TIME 3D", 12, DIM, 700, cls="m", extra='letter-spacing="3"')}
<ellipse cx="{CX}" cy="{CY + 125}" rx="150" ry="16" fill="{CYAN}" opacity=".08"/>"""]
    rings = [  # radius, tilt(x), roll(z), period, color, labels
        (100, 1.15, .26, 26, CYAN, ["Python", "PyTorch", "FastAPI", "Whisper"]),
        (145, 1.25, -.30, 38, PINK, ["LangGraph", "FAISS", "Hugging Face", "Vapi"]),
        (178, 1.36, .08, 50, AMBER, ["TypeScript", "Next.js", "PostgreSQL", "Supabase", "Docker"]),
    ]
    back, front = [], []
    N = 60
    for R, tx, tz, per, col, labels in rings:
        def P(phi):
            return rz(rx((R * math.cos(phi), 0, R * math.sin(phi)), tx), tz)
        pts = [P(2 * math.pi * i / 96) for i in range(97)]
        for want_back, dst in ((True, back), (False, front)):
            seg, dash = [], 'stroke-dasharray="3 5"' if want_back else ""
            for p in pts:
                if (p[2] > 0) == want_back:
                    x, y, _ = proj(p, CX, CY); seg.append(f"{x:.1f} {y:.1f}")
                elif seg:
                    dst.append(f'<path d="M{" L".join(seg)}" fill="none" stroke="{col}" stroke-opacity="{.18 if want_back else .5}" stroke-width="{1 if want_back else 1.6}" {dash}/>'); seg = []
            if seg:
                dst.append(f'<path d="M{" L".join(seg)}" fill="none" stroke="{col}" stroke-opacity="{.18 if want_back else .5}" stroke-width="{1 if want_back else 1.6}" {dash}/>')
        kt = ";".join(f"{i / N:.4f}" for i in range(N + 1))
        for j, name in enumerate(labels):
            ph0 = 2 * math.pi * j / len(labels)
            fr = [P(ph0 + 2 * math.pi * i / N) for i in range(N + 1)]
            pj = [proj(p, CX, CY) for p in fr]
            tr = ";".join(f"{x:.1f} {y:.1f}" for x, y, _ in pj)
            sc = ";".join(f"{k ** 1.6:.3f}" for _, _, k in pj)
            w = len(name) * 7.4 + 20
            pill = (f'<rect x="{-w / 2:.1f}" y="-12" width="{w:.1f}" height="24" rx="12" fill="#0c0a22" stroke="{col}" stroke-width="1.5"/>'
                    + t(0, 4.5, name, 12.5, INK, 600, "middle")
                    + f'<circle cx="{-w / 2 - 7:.1f}" cy="0" r="3" fill="{col}"/>')
            moving = (f'<g><animateTransform attributeName="transform" type="translate" values="{tr}" keyTimes="{kt}" dur="{per}s" repeatCount="indefinite"/>'
                      f'<g><animateTransform attributeName="transform" type="scale" values="{sc}" keyTimes="{kt}" dur="{per}s" repeatCount="indefinite"/>{pill}</g></g>')
            vis_f = ";".join("1" if p[2] <= 0 else "0" for p in fr)
            vis_b = ";".join("0" if p[2] <= 0 else ".55" for p in fr)
            back.append(f'<g><animate attributeName="opacity" values="{vis_b}" keyTimes="{kt}" calcMode="discrete" dur="{per}s" repeatCount="indefinite"/>{moving}</g>')
            front.append(f'<g filter="url(#g)"><animate attributeName="opacity" values="{vis_f}" keyTimes="{kt}" calcMode="discrete" dur="{per}s" repeatCount="indefinite"/>{moving}</g>')
    b += back
    b.append(f'<circle cx="{CX}" cy="{CY}" r="86" fill="url(#core)"><animate attributeName="r" values="80;92;80" dur="4s" repeatCount="indefinite"/></circle>')
    b.append(f'<circle cx="{CX}" cy="{CY}" r="60" fill="url(#ball)"/>')
    b.append(wire3d(v, e, CX, CY, 60, 2 * math.pi / 5, 24, 5, -.38, CYAN, "#ffffff", 3.4, 1.1))
    b.append(t(CX, CY + 8, "AI", 24, "#ffffff", 900, "middle", extra='filter="url(#g)"'))
    b += front
    return svg(W, H, "".join(b), "", "Real-time 3D tech orbit: a rotating geodesic AI core with Python, PyTorch, LangGraph, FAISS, Whisper, TypeScript and more orbiting in 3D")


# ───────────────────────────────────────────────────────── PROJECTS ──
PROJECTS = [
    ("voiceforge", "🎙️", "VoiceForge AI", "TypeScript", "#3178c6", "ACTIVE BUILD",
     "Multilingual voice-agent control plane: saved agents, incoming-call routing, call recording and provider usage tracking.",
     ["Next.js", "Vapi", "PostgreSQL"], "VoiceForge-AI"),
    ("offline-rag", "📦", "Offline Voice RAG", "Python", "#3572A5", "100% OFFLINE",
     "Warehouse inventory voice assistant running fully on-device with Whisper STT, a quantized Qwen LLM and FAISS search.",
     ["Whisper", "Qwen", "FAISS"], "RAG-Offline-Inventory-Management-System"),
    ("job-agent", "🤖", "AI Job Agent v2", "Python", "#3572A5", "MULTI-AGENT",
     "Autonomous multi-agent pipeline for job discovery, resume-intelligence matching and application tracking.",
     ["Agents", "LLM", "Automation"], "ai-job-agent-v2"),
    ("book-ai", "📚", "Book AI Vision", "HTML", "#e34c26", "92% ACCURACY",
     "Visual book recognition service using a fine-tuned ConvNeXt model with FAISS semantic similarity search.",
     ["ConvNeXt", "FAISS", "CV"], "Book_AI_Backend"),
    ("linguabridge", "🗣️", "LinguaBridge AI", "TypeScript", "#3178c6", "PROTOTYPE",
     "Tamil / Hindi live phone-call translation architecture with provider adapters and deterministic simulations.",
     ["Speech", "Translation", "Telephony"], "linguabridge-ai"),
    ("recruiter-cv", "🎯", "AI Recruiter + Vision", "JavaScript", "#f1e05a", "PROCTORED",
     "Conversational LLM interviews combined with real-time BlazeFace anti-cheating proctoring for candidates.",
     ["LLM", "BlazeFace", "Voice"], "AI_Recruiter_with_computer-vision"),
]


def wrap(s: str, n: int) -> list[str]:
    out, cur = [], ""
    for w in s.split():
        if len(cur) + len(w) + 1 > n:
            out.append(cur)
            cur = w
        else:
            cur = f"{cur} {w}".strip()
    return out + [cur]


def card(p, idx) -> str:
    _, icon, title, lang, lcol, status, desc, tags, _ = p
    W, H = 600, 250
    accent = [CYAN, PINK, AMBER, GREEN, VIOLET, "#ff6b6b"][idx % 6]
    per = 2 * (576 + 226)
    b = [f"""<defs><linearGradient id="bd" x1="0" x2="1"><stop offset="0" stop-color="{accent}"/><stop offset="1" stop-color="{VIOLET}"/></linearGradient>
<linearGradient id="glare" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".09"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<radialGradient id="blob" cx=".9" cy="0" r=".9"><stop offset="0" stop-color="{accent}" stop-opacity=".22"/><stop offset="1" stop-color="{accent}" stop-opacity="0"/></radialGradient>
<clipPath id="cp"><rect x="12" y="12" width="576" height="226" rx="18"/></clipPath>
<filter id="g" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<rect x="12" y="12" width="576" height="226" rx="18" fill="{PANEL}"/>
<rect x="12" y="12" width="576" height="226" rx="18" fill="url(#blob)"/>
<rect x="12" y="12" width="576" height="226" rx="18" fill="none" stroke="{accent}" stroke-opacity=".25"/>
<rect x="12" y="12" width="576" height="226" rx="18" fill="none" stroke="url(#bd)" stroke-width="2.5" stroke-dasharray="260 {per - 260}" filter="url(#g)">
<animate attributeName="stroke-dashoffset" from="0" to="-{per}" dur="6s" begin="-{idx}s" repeatCount="indefinite"/></rect>
<g clip-path="url(#cp)"><rect x="-200" y="0" width="160" height="{H}" fill="url(#glare)" transform="skewX(-20)">
<animate attributeName="x" values="-200;-200;800" keyTimes="0;.6;1" dur="7s" begin="{idx * 0.8}s" repeatCount="indefinite"/></rect></g>
<circle cx="62" cy="62" r="26" fill="{accent}" fill-opacity=".14" stroke="{accent}" stroke-opacity=".6">
<animate attributeName="r" values="26;29;26" dur="2.4s" repeatCount="indefinite"/></circle>
<text x="62" y="71" font-size="24" text-anchor="middle">{icon}</text>
{t(102, 58, title, 24, INK, 800)}
<circle cx="108" cy="78" r="5" fill="{lcol}"/>{t(118, 83, lang, 13, DIM, 500)}"""]
    pw = len(status) * 7.6 + 22
    b.append(f'<rect x="{570 - pw:.0f}" y="36" width="{pw:.0f}" height="24" rx="12" fill="{accent}" fill-opacity=".14" stroke="{accent}"/>'
             f'<circle cx="{582 - pw:.0f}" cy="48" r="3.5" fill="{accent}"><animate attributeName="opacity" values="1;.2;1" dur="1.4s" repeatCount="indefinite"/></circle>'
             + t(round(570 - pw / 2 + 5), 52.5, status, 11, accent, 700, "middle", "m"))
    for i, ln in enumerate(wrap(desc, 66)[:3]):
        b.append(t(36, 122 + i * 22, ln, 15, "#c9cfee", 400))
    x = 36
    for tag in tags:
        w = len(tag) * 7.2 + 20
        b.append(f'<rect x="{x}" y="194" width="{w:.0f}" height="24" rx="6" fill="#ffffff" fill-opacity=".05" stroke="#ffffff" stroke-opacity=".15"/>'
                 + t(round(x + w / 2), 210.5, tag, 12, INK, 500, "middle", "m"))
        x += w + 8
    b.append(t(566, 211, "view repo →", 13, accent, 600, "end", "m"))
    return svg(W, H, "".join(b), "", f"{title} — {desc}")


# ───────────────────────────────────────────────────────── TIMELINE ──
def timeline() -> str:
    W, H, Y, X0, X1 = 1200, 270, 135, 70, 1130
    nodes = [
        (180, "FOUNDATION", "B.Tech · AI & Data Science", "Kumaraguru College of Technology", CYAN, -1),
        (460, "JAN – JUL 2025", "Innovation Engineer Trainee", "Forge Innovation & Ventures", PINK, 1),
        (740, "2025 · IEEE ICNGCS", "Eco-Transformers published", "Carbon-efficient LLM inference", AMBER, -1),
        (1020, "AUG 2026 → NOW", "GenAI Exec & Forward Deployed Eng.", "Nunes Instruments", GREEN, 1),
    ]
    DUR = 8
    b = [f"""<defs><linearGradient id="ln" x1="0" x2="1"><stop offset="0" stop-color="{CYAN}"/><stop offset=".33" stop-color="{PINK}"/><stop offset=".66" stop-color="{AMBER}"/><stop offset="1" stop-color="{GREEN}"/></linearGradient>
<radialGradient id="pl"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="{CYAN}"/><stop offset="1" stop-color="{CYAN}" stop-opacity="0"/></radialGradient>
<filter id="g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<rect x="1" y="1" width="{W - 2}" height="{H - 2}" rx="18" fill="{PANEL}" stroke="{VIOLET}" stroke-opacity=".5"/>
<line x1="{X0}" y1="{Y}" x2="{X1}" y2="{Y}" stroke="url(#ln)" stroke-width="3" stroke-opacity=".35"/>
<line x1="{X0}" y1="{Y}" x2="{X1}" y2="{Y}" stroke="url(#ln)" stroke-width="3" stroke-dasharray="{X1 - X0}" filter="url(#g)">
<animate attributeName="stroke-dashoffset" values="{X1 - X0};0;0" keyTimes="0;.85;1" dur="{DUR}s" repeatCount="indefinite"/></line>
<circle r="16" cy="{Y}" fill="url(#pl)"><animate attributeName="cx" values="{X0};{X1};{X1}" keyTimes="0;.85;1" dur="{DUR}s" repeatCount="indefinite"/>
<animate attributeName="opacity" values="1;1;0" keyTimes="0;.85;.9" dur="{DUR}s" repeatCount="indefinite"/></circle>"""]
    for x, when, title, org, col, side in nodes:
        f = (x - X0) / (X1 - X0) * .85
        b.append(f'<circle cx="{x}" cy="{Y}" r="9" fill="{BG}" stroke="{col}" stroke-width="3"/>'
                 f'<circle cx="{x}" cy="{Y}" r="9" fill="none" stroke="{col}" stroke-width="2" opacity="0">'
                 f'<animate attributeName="r" values="9;9;30;30" keyTimes="0;{f:.3f};{f + .1:.3f};1" dur="{DUR}s" repeatCount="indefinite"/>'
                 f'<animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;{f:.3f};{f + .01:.3f};{f + .1:.3f};1" dur="{DUR}s" repeatCount="indefinite"/></circle>'
                 f'<circle cx="{x}" cy="{Y}" r="4" fill="{col}" filter="url(#g)"><animate attributeName="opacity" values=".3;.3;1;1" keyTimes="0;{f:.3f};{f + .01:.3f};1" dur="{DUR}s" repeatCount="indefinite"/></circle>')
        y0 = Y - 88 if side < 0 else Y + 40
        b.append(f'<line x1="{x}" y1="{Y + side * 14}" x2="{x}" y2="{Y + side * 30}" stroke="{col}" stroke-opacity=".6"/>')
        b.append(f'<g opacity=".25"><animate attributeName="opacity" values=".25;.25;1;1" keyTimes="0;{f:.3f};{f + .04:.3f};1" dur="{DUR}s" repeatCount="indefinite"/>'
                 + t(x, y0 + 4, when, 12, col, 700, "middle", "m", 'letter-spacing="1.5"')
                 + t(x, y0 + 28, title, 17, INK, 700, "middle")
                 + t(x, y0 + 50, org, 14, DIM, 500, "middle") + "</g>")
    return svg(W, H, "".join(b), "", "Career timeline: KCT B.Tech AI & DS, Forge Innovation trainee, IEEE Eco-Transformers paper, Nunes Instruments GenAI Executive")


# ───────────────────────────────────────────────────────── RESEARCH ──
def research() -> str:
    W, H = 1200, 300
    b = [f"""<defs><filter id="g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<linearGradient id="eco" x1="0" x2="1"><stop offset="0" stop-color="{GREEN}"/><stop offset="1" stop-color="{CYAN}"/></linearGradient>
<linearGradient id="spd" x1="0" x2="1"><stop offset="0" stop-color="{AMBER}"/><stop offset="1" stop-color="{PINK}"/></linearGradient></defs>
<rect x="1" y="1" width="{W - 2}" height="{H - 2}" rx="18" fill="{PANEL}" stroke="{GREEN}" stroke-opacity=".45"/>
{t(40, 52, "IEEE ICNGCS 2025 · PUBLISHED RESEARCH", 12, GREEN, 700, cls="m", extra='letter-spacing="2"')}
{t(40, 98, "ECO-TRANSFORMERS", 38, INK, 900, extra='letter-spacing="2"')}"""]
    for i, ln in enumerate(["Carbon-efficient & accelerated inference through", "self-pruning and activation freezing in LLMs."]):
        b.append(t(40, 134 + i * 24, ln, 16, "#c9cfee"))
    b.append(t(40, 210, "🏆 Best Final Year Project — AI & DS, KCT", 15, AMBER, 600))
    b.append(t(40, 246, "DOI 10.1109/ICNGCS64900.2025.11183217", 12, DIM, 400, cls="m"))
    # neural net with pruning / freezing
    layers = [(520, 4), (620, 5), (720, 5), (820, 3)]
    pts = [[(x, 150 + (j - (n - 1) / 2) * 44) for j in range(n)] for x, n in layers]
    rnd = random.Random(3)
    DUR = 6
    for li in range(len(pts) - 1):
        for a in pts[li]:
            for c in pts[li + 1]:
                pruned = rnd.random() < .45
                anim = (f'<animate attributeName="stroke-opacity" values=".55;.55;0;0;.55" keyTimes="0;.3;.45;.9;1" dur="{DUR}s" repeatCount="indefinite"/>' if pruned else
                        f'<animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite"/>')
                dash = '' if pruned else ' stroke-dasharray="4 6"'
                b.append(f'<line x1="{a[0]}" y1="{a[1]}" x2="{c[0]}" y2="{c[1]}" stroke="{PINK if pruned else CYAN}" stroke-opacity=".55" stroke-width="1.2"{dash}>{anim}</line>')
    for li, col in enumerate(pts):
        for (x, y) in col:
            frozen = li in (1, 2) and rnd.random() < .45
            anim = (f'<animate attributeName="fill" values="{VIOLET};{VIOLET};#bfe9ff;#bfe9ff;{VIOLET}" keyTimes="0;.45;.55;.9;1" dur="{DUR}s" repeatCount="indefinite"/>' if frozen else "")
            b.append(f'<circle cx="{x}" cy="{y}" r="9" fill="{VIOLET}" stroke="#fff" stroke-opacity=".5" filter="url(#g)">{anim}</circle>')
    b.append(t(670, 270, "✂ prune  ·  ❄ freeze  ·  ⚡ infer", 13, DIM, 500, "middle", "m"))
    # metric bars
    for i, (lab, val, grad, desc, frm, to) in enumerate([
        ("CO₂ EMISSIONS", "−58%", "eco", "lower carbon footprint", 300, 126),
        ("INFERENCE SPEED", "+56%", "spd", "faster LLM inference", 0, 300)]):
        y = 92 + i * 104
        b.append(t(880, y, lab, 12, DIM, 700, cls="m", extra='letter-spacing="2"'))
        b.append(f'<rect x="880" y="{y + 14}" width="280" height="14" rx="7" fill="#ffffff" fill-opacity=".07"/>')
        if i == 0:
            b.append(f'<rect x="880" y="{y + 14}" height="14" rx="7" fill="url(#{grad})" width="280">'
                     f'<animate attributeName="width" values="280;280;118;118;280" keyTimes="0;.1;.4;.95;1" dur="{DUR}s" repeatCount="indefinite"/></rect>')
        else:
            b.append(f'<rect x="880" y="{y + 14}" height="14" rx="7" fill="url(#{grad})" width="180">'
                     f'<animate attributeName="width" values="180;180;280;280;180" keyTimes="0;.1;.4;.95;1" dur="{DUR}s" repeatCount="indefinite"/></rect>')
        b.append(f'<g opacity="0"><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.35;.45;.93;1" dur="{DUR}s" repeatCount="indefinite"/>'
                 + t(880, y + 66, val, 34, GREEN if i == 0 else AMBER, 900, extra='filter="url(#g)"')
                 + t(985, y + 60, desc, 14, "#c9cfee") + "</g>")
    return svg(W, H, "".join(b), "", "Eco-Transformers research: 58% lower CO2 and 56% faster LLM inference via self-pruning and activation freezing")


# ─────────────────────────────────────────────────────── LIVE STATS ──
LANG_COLORS = {"Python": "#3572A5", "TypeScript": "#3178c6", "JavaScript": "#f1e05a", "HTML": "#e34c26",
               "Jupyter Notebook": "#DA5B0B", "C++": "#f34b7d", "R": "#198CE7", "CSS": "#663399"}


def api(path: str):
    req = urllib.request.Request(f"https://api.github.com{path}", headers={"Accept": "application/vnd.github+json", "User-Agent": "neo-profile-builder"})
    tok = os.environ.get("GITHUB_TOKEN")
    if tok:
        req.add_header("Authorization", f"Bearer {tok}")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def stats() -> str:
    user = api(f"/users/{USER}")
    repos = []
    for page in range(1, 5):
        chunk = api(f"/users/{USER}/repos?per_page=100&page={page}&type=owner&sort=pushed")
        repos += chunk
        if len(chunk) < 100:
            break
    own = [r for r in repos if not r["fork"] and r["name"] != USER]
    stars = sum(r["stargazers_count"] for r in own)
    langs: dict[str, int] = {}
    for r in own:
        if r["language"]:
            langs[r["language"]] = langs.get(r["language"], 0) + 1
    top = sorted(langs.items(), key=lambda kv: -kv[1])[:6]
    created = dt.datetime.fromisoformat(user["created_at"].replace("Z", "+00:00"))
    now = dt.datetime.now(dt.timezone.utc)
    days = (now - created).days
    month_ago = now - dt.timedelta(days=30)
    active = sum(1 for r in own if dt.datetime.fromisoformat(r["pushed_at"].replace("Z", "+00:00")) > month_ago)
    recent = [r["name"] for r in sorted(own, key=lambda r: r["pushed_at"], reverse=True)[:10]]

    W, H = 1200, 320
    b = [f"""<defs><filter id="g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<clipPath id="tk"><rect x="250" y="262" width="920" height="40"/></clipPath>
<linearGradient id="fade" x1="0" x2="1"><stop offset="0" stop-color="{PANEL}"/><stop offset=".04" stop-color="{PANEL}" stop-opacity="0"/><stop offset=".96" stop-color="{PANEL}" stop-opacity="0"/><stop offset="1" stop-color="{PANEL}"/></linearGradient></defs>
<rect x="1" y="1" width="{W - 2}" height="{H - 2}" rx="18" fill="{PANEL}" stroke="{CYAN}" stroke-opacity=".45"/>
<circle cx="40" cy="38" r="5" fill="{GREEN}"><animate attributeName="opacity" values="1;.2;1" dur="1.4s" repeatCount="indefinite"/></circle>
{t(54, 43, "LIVE GITHUB TELEMETRY", 13, CYAN, 700, cls="m", extra='letter-spacing="2"')}
{t(1160, 43, "auto-refreshed " + now.strftime("%d %b %Y") + " UTC", 12, DIM, 400, "end", "m")}"""]
    tiles = [(str(len(own)), "PROJECTS", CYAN), (str(stars), "STARS EARNED", AMBER),
             (str(active), "ACTIVE · 30 DAYS", PINK), (str(len(langs)), "LANGUAGES", GREEN),
             (f"{days:,}", "DAYS ON GITHUB", VIOLET)]
    for i, (v, lab, col) in enumerate(tiles):
        x, y = 40 + i * 112, 70
        b.append(f'<g opacity="0" transform="translate(0 12)"><animate attributeName="opacity" from="0" to="1" begin="{i * .25}s" dur=".6s" fill="freeze"/>'
                 f'<animateTransform attributeName="transform" type="translate" from="0 12" to="0 0" begin="{i * .25}s" dur=".6s" fill="freeze"/>'
                 f'<rect x="{x}" y="{y}" width="100" height="160" rx="12" fill="#ffffff" fill-opacity=".04" stroke="{col}" stroke-opacity=".4"/>'
                 + t(x + 50, y + 82, v, 34, col, 900, "middle", extra='filter="url(#g)"')
                 + "".join(t(x + 50, y + 116 + j * 16, part, 10, DIM, 700, "middle", "m") for j, part in enumerate(lab.split(" · ") if "·" in lab else lab.split(" ", 1)))
                 + "</g>")
    total = sum(n for _, n in top) or 1
    b.append(t(640, 86, "LANGUAGE MIX · by repository", 12, DIM, 700, cls="m", extra='letter-spacing="1.5"'))
    for i, (lang, n) in enumerate(top):
        y = 108 + i * 24
        w = 300 * n / top[0][1]
        col = LANG_COLORS.get(lang, "#9aa4ff")
        b.append(t(640, y + 11, lang, 13, INK, 600)
                 + f'<rect x="800" y="{y}" width="300" height="14" rx="7" fill="#ffffff" fill-opacity=".05"/>'
                 f'<rect x="800" y="{y}" height="14" rx="7" fill="{col}" width="0"><animate attributeName="width" from="0" to="{w:.0f}" begin="{.4 + i * .15:.2f}s" dur="1.2s" fill="freeze" calcMode="spline" keySplines=".2 .8 .2 1" keyTimes="0;1"/></rect>'
                 + t(1160, y + 11, f"{100 * n / total:.0f}%", 12, DIM, 600, "end", "m"))
    b.append(f'<line x1="40" y1="252" x2="1160" y2="252" stroke="#ffffff" stroke-opacity=".08"/>')
    b.append(t(40, 287, "▸ RECENTLY SHIPPED", 13, AMBER, 700, cls="m", extra='letter-spacing="1.5"'))
    ticker = "   ◆   ".join(recent) + "   ◆   "
    tw = len(ticker) * 13 * 0.6
    b.append(f'<g clip-path="url(#tk)"><g><animateTransform attributeName="transform" type="translate" from="0 0" to="-{tw:.0f} 0" dur="{max(20, tw / 40):.0f}s" repeatCount="indefinite"/>'
             + t(250, 287, ticker, 13, INK, 500, cls="m") + t(round(250 + tw), 287, ticker, 13, INK, 500, cls="m") + "</g></g>")
    b.append(f'<rect x="250" y="262" width="920" height="40" fill="url(#fade)"/>')
    return svg(W, H, "".join(b), "", f"Live GitHub stats for {USER}: {len(own)} projects, {stars} stars, {len(langs)} languages")


# ─────────────────────────────────────────────── DIVIDER + FOOTER ──
def divider() -> str:
    W, H = 1200, 24
    body = f"""<defs><linearGradient id="d" x1="0" x2="1"><stop offset="0" stop-color="{CYAN}" stop-opacity="0"/><stop offset=".5" stop-color="{CYAN}"/><stop offset="1" stop-color="{PINK}" stop-opacity="0"/></linearGradient>
<filter id="g" x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<line x1="0" y1="12" x2="{W}" y2="12" stroke="{VIOLET}" stroke-opacity=".35"/>
<rect y="10" width="260" height="4" rx="2" fill="url(#d)" filter="url(#g)"><animate attributeName="x" values="-260;{W}" dur="3.5s" repeatCount="indefinite"/></rect>
<rect x="594" y="6" width="12" height="12" transform="rotate(45 600 12)" fill="{BG}" stroke="{PINK}"/>"""
    return svg(W, H, body, "", "divider")


def footer() -> str:
    W, H = 1200, 200

    def wave(amp, y, col, op, dur, ph):
        pts = " ".join(f"L{x} {y + amp * math.sin(x / 1200 * 4 * math.pi + ph):.1f}" for x in range(0, 2401, 40))
        return (f'<path d="M0 {y} {pts} L2400 {H} L0 {H}Z" fill="{col}" fill-opacity="{op}">'
                f'<animateTransform attributeName="transform" type="translate" from="0 0" to="-1200 0" dur="{dur}s" repeatCount="indefinite"/></path>')
    body = (f'<defs><filter id="g" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>'
            + wave(14, 120, VIOLET, .35, 14, 0) + wave(18, 135, PINK, .28, 10, 1.4) + wave(12, 150, CYAN, .3, 7, 2.6)
            + t(600, 62, "Let's build something useful.", 32, INK, 800, "middle", extra='filter="url(#g)"')
            + t(600, 96, "thanks for visiting · see you in the commits", 14, DIM, 500, "middle", "m"))
    return svg(W, H, body, "", "Let's build something useful — thanks for visiting")


if __name__ == "__main__":
    write("hero.svg", hero())
    write("terminal.svg", terminal())
    write("orbit.svg", orbit())
    write("timeline.svg", timeline())
    write("research.svg", research())
    write("divider.svg", divider())
    write("footer.svg", footer())
    for i, p in enumerate(PROJECTS):
        write(f"card-{p[0]}.svg", card(p, i))
    try:
        write("stats.svg", stats())
    except Exception as exc:  # keep the previous stats panel if the API is unavailable
        print(f"stats skipped: {exc}")
