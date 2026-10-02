"""Derive public/landing-pages/marketlens.html from the byte-verified kage.html.

Run from anywhere:  python3 client/scripts/derive-marketlens.py
Edit the copy below, re-run, and commit the regenerated marketlens.html.

Only copy, link targets, the brand mark and the 3-D wordmark change. The scene,
styles, motion and DOM hooks (data-cam / data-view / data-chip / data-les /
data-fg / data-rv / ids) are left exactly as authored. Every replacement must
match exactly once, otherwise the script aborts.
"""
import hashlib, sys
from pathlib import Path

PAGES = Path(__file__).resolve().parent.parent / 'public' / 'landing-pages'
SRC = PAGES / 'kage.html'
DST = PAGES / 'marketlens.html'

html = open(SRC, encoding='utf-8').read()
assert hashlib.sha256(html.encode()).hexdigest().startswith('c8e06b90397a'), 'kage.html is not the canonical source'

def sub(old, new, count=1):
    global html
    found = html.count(old)
    if found != count:
        sys.exit(f'expected {count} match(es), found {found}: {old[:90]!r}')
    html = html.replace(old, new)

# ---------------------------------------------------------------- brand marks
LENS_MARK = ('<circle cx="19.5" cy="19.5" r="11.5" stroke="#dfe7e0" stroke-width="1.5"/>\n'
             '      <circle cx="19.5" cy="19.5" r="6.6" fill="#e0231c" fill-opacity=".9"/>\n'
             '      <path d="M28 28l9.5 9.5" stroke="#dfe7e0" stroke-width="1.5" stroke-linecap="round"/>')

# ---------------------------------------------------------------- head
sub('<title>Kage — Where stillness reveals the unseen</title>',
    '<title>MarketLens — See the market before you enter it</title>')
sub('content="A five-chapter night walk through a Kyoto mountain temple. Charred cypress, lantern light and a vermilion moon, rendered live in WebGL."',
    'content="MarketLens scans live Google Shopping results, measures pricing, merchants and ratings, and turns the evidence into an AI-written market brief."')

# Small additions for the parts the original never needed: Latin text in the
# slots that were set in the Japanese face, and the sign-in button in the bar.
sub('</style>\n</head>', '''
/* ================================================= MarketLens adaptations */
.les h3 em{ font-family:'NotoJP','Onest',sans-serif; }
.nav-cta{
  flex:0 0 auto; margin-left:clamp(18px,2.6vw,42px); display:inline-flex; align-items:center;
  height:34px; padding:0 18px; border:1px solid var(--line); border-radius:100px;
  font-size:10px; font-weight:500; letter-spacing:.22em; text-transform:uppercase; color:var(--bone);
  transition:background .45s var(--ease), color .45s var(--ease), border-color .45s;
}
.nav-cta:hover{ background:var(--bone); color:#05070a; border-color:var(--bone); }
@media (max-width:820px){
  .nav-cta{ margin-left:auto; height:30px; padding:0 14px; }
  .nav-cta + .nav-burger{ margin-left:16px; }
}
</style>
</head>''')

# ---------------------------------------------------------------- preloader
sub('''<circle cx="22" cy="24" r="9.5" stroke="#e0231c" stroke-width="1.2"/>
        <path d="M6 12h32M9.5 17h25M22 8v28" stroke="#dfe7e0" stroke-width="1.2"/>''',
    '''<circle cx="19.5" cy="19.5" r="11.5" stroke="#dfe7e0" stroke-width="1.2"/>
        <circle cx="19.5" cy="19.5" r="6.6" stroke="#e0231c" stroke-width="1.2"/>
        <path d="M28 28l9.5 9.5" stroke="#dfe7e0" stroke-width="1.2" stroke-linecap="round"/>''')
sub('<div class="pre-jp jp">影の道</div>', '<div class="pre-jp">MARKETLENS</div>')
sub('<span>Raising the mountain temple</span>', '<span>Loading market intelligence</span>')

# ---------------------------------------------------------------- nav
sub('''<circle cx="22" cy="25" r="8.6" fill="#e0231c" fill-opacity=".9"/>
      <path d="M5 13h34M9 18.4h26M22 8.5v27" stroke="#dfe7e0" stroke-width="1.5"/>
      <path d="M14 35.5h16" stroke="#dfe7e0" stroke-width="1.2" stroke-opacity=".6"/>''', LENS_MARK)
sub('<span class="brand-tx"><b>KAGE</b><i>HIDDEN REALMS OF KYOTO</i></span>',
    '<span class="brand-tx"><b>MARKETLENS</b><i>MARKET INTELLIGENCE</i></span>')
sub('<span>Temples</span><span class="alt">伽藍</span>', '<span>Live data</span><span class="alt">SerpApi</span>')
sub('<span>Gardens</span><span class="alt">庭園</span>', '<span>Signals</span><span class="alt">Evidence</span>')
sub('<span>Rituals</span><span class="alt">神事</span>', '<span>Workflow</span><span class="alt">5 steps</span>')
sub('<span>Afterlight</span><span class="alt">残光</span>', '<span>Get started</span><span class="alt">Free scan</span>')
# A route link, kept out of .nav-link: the page resolves every .nav-link href
# as a section selector. The React host turns data-route clicks into routing.
sub('''  </nav>
  <button class="nav-burger"''', '''  </nav>
  <a class="nav-cta" href="/login" data-route="/login" data-route-auth="/dashboard" data-label-auth="Dashboard" data-cursor>Sign in</a>
  <button class="nav-burger"''')

# ---------------------------------------------------------------- hero
sub('<span class="dot"></span> Chapter 00 — The Hidden Gate',
    '<span class="dot"></span> E-commerce market intelligence')
sub('<span class="mask-line"><span>Where stillness</span></span>', '<span class="mask-line"><span>See the market</span></span>')
sub('<span class="mask-line"><span>reveals the</span></span>', '<span class="mask-line"><span>before you</span></span>')
sub('<span class="mask-line"><span>unseen.</span></span>', '<span class="mask-line"><span>enter it.</span></span>')
sub('''<p class="hero-sub body" data-rv="up">Enter Kyoto through its quiet thresholds, where ritual,
      craft, and memory shape the path.</p>''',
    '''<p class="hero-sub body" data-rv="up">Live Google Shopping data on prices, merchants and ratings,
      measured and explained before you invest in a product.</p>''')
sub('<span>Scroll to enter</span>', '<span>Scroll to explore</span>')
sub('<span class="tx"><b>Thresholds</b><p>Discover the hidden gates that open on to deeper paths.</p></span>',
    '<span class="tx"><b>Live scans</b><p>Pull current Google Shopping listings for any product.</p></span>')
sub('<span class="tx"><b>Still Gardens</b><p>Witness the courts where silence gently unfolds.</p></span>',
    '<span class="tx"><b>Price bands</b><p>See the spread, the median and the gaps between them.</p></span>')
sub('<span class="tx"><b>Sacred Craft</b><p>Embrace the hands and heritage that shape devotion.</p></span>',
    '<span class="tx"><b>Merchant share</b><p>Find out who already holds the shelf.</p></span>')
sub('<span class="tx"><b>Night Rituals</b><p>Explore the rites that awaken when the day is done.</p></span>',
    '<span class="tx"><b>AI briefs</b><p>Get an evidence-backed report you can share.</p></span>')
sub('aria-label="Preview: Sanmon, before the bell"', 'aria-label="Preview: the signals a scan surfaces"')
sub('<span class="peek-cap"><b class="jp">山門</b><i>Sanmon — before the bell</i></span>',
    '<span class="peek-cap"><b class="jp">LIVE</b><i>What a scan surfaces</i></span>')
sub('<div class="word-fb" aria-hidden="true">KAGE</div>', '<div class="word-fb" aria-hidden="true">LENS</div>')
sub('<span class="v jp">影の道</span>', '<span class="v jp">SIGNAL</span>')

# ---------------------------------------------------------------- chapter I · live data
sub('<span class="k"><b>01</b> — The Sanmon</span><span class="rule"></span><span class="k jp">山門</span>',
    '<span class="k"><b>01</b> — Live data</span><span class="rule"></span><span class="k jp">SERPAPI</span>')
sub('<h2 class="display h-sec" data-rv="up">Charred cypress, worn stone, one gate left open.</h2>',
    '<h2 class="display h-sec" data-rv="up">Real listings, real prices, no guesswork.</h2>')
sub('''<p class="lead" data-rv="up">Kage begins where the city stops: a mountain gate of cedar burned black,
        standing in its own weather. The soot is not decoration. It is how a board is taught to survive a
        hundred rainy seasons, and the first thing this place asks you to understand.</p>''',
    '''<p class="lead" data-rv="up">MarketLens starts where intuition stops. Every scan collects live
        Google Shopping listings for your query, in the marketplace you choose, and records each price,
        merchant, rating and review count exactly as observed.</p>''')
sub('''<p class="body" data-rv="up">Climb the worn steps and the worship hall lifts out of the mist, its paper
        screens lit from inside like a lantern the size of a house. Above the eaves a vermilion moon holds
        its place, patient, half hidden. Nothing here is in a hurry. Neither, for the next ninety minutes,
        are you.</p>''',
    '''<p class="body" data-rv="up">From that evidence it derives the numbers a launch decision needs:
        price spread and median, merchant concentration, rating quality and the features competitors keep
        repeating. Nothing is invented. Every figure traces back to a listing you can open.</p>''')
sub('<span>Cross the threshold</span>', '<span>See the signals</span>')
sub('''<div><b>05</b><span>Chapters</span></div>
    <div><b>92</b><span>Minutes</span></div>
    <div><b>1611</b><span>Hall raised</span></div>
    <div><b>∞</b><span>Stillness</span></div>''',
    '''<div><b>40</b><span>Listings per scan</span></div>
    <div><b>08</b><span>Marketplaces</span></div>
    <div><b>04</b><span>Opportunity checks</span></div>
    <div><b>02</b><span>Export formats</span></div>''')

# ---------------------------------------------------------------- chapter II · signals
sub('<span class="k"><b>02</b> — Still Gardens</span><span class="rule"></span><span class="k jp">庭園</span>',
    '<span class="k"><b>02</b> — Signals</span><span class="rule"></span><span class="k jp">EVIDENCE</span>')
sub('<div class="card-lab"><b>Approach</b><span class="jp">参道</span></div>',
    '<div class="card-lab"><b>Pricing</b><span class="jp">SPREAD</span></div>')
sub('<div class="card-meta"><span>The long climb</span><span>01 / 03</span></div>',
    '<div class="card-meta"><span>Price bands and gaps</span><span>01 / 03</span></div>')
sub('<div class="card-lab"><b>Lanterns</b><span class="jp">灯籠</span></div>',
    '<div class="card-lab"><b>Merchants</b><span class="jp">SHARE</span></div>')
sub('<div class="card-meta"><span>Lantern court</span><span>02 / 03</span></div>',
    '<div class="card-meta"><span>Who holds the shelf</span><span>02 / 03</span></div>')
sub('<div class="card-lab"><b>Moonwater</b><span class="jp">月影</span></div>',
    '<div class="card-lab"><b>Opportunities</b><span class="jp">GAPS</span></div>')
sub('<div class="card-meta"><span>The wet court</span><span>03 / 03</span></div>',
    '<div class="card-meta"><span>Where to enter</span><span>03 / 03</span></div>')

# ---------------------------------------------------------------- chapter III · workflow
sub('<span class="k"><b>03</b> — Sacred Craft</span><span class="rule"></span><span class="k jp">手業</span>',
    '<span class="k"><b>03</b> — Workflow</span><span class="rule"></span><span class="k jp">5 STEPS</span>')
sub('<h2 class="display h-sec" data-rv="up">Five chapters. Ninety minutes. One quiet mind.</h2>',
    '<h2 class="display h-sec" data-rv="up">Five steps. One query. One clear brief.</h2>')
sub('''<p class="body-lg" data-rv="up">Each chapter is a walk, not a lecture. You arrive at the gate, climb the
      steps, sit with the lantern, and leave with one thing worth keeping.</p>''',
    '''<p class="body-lg" data-rv="up">Every scan follows the same path, from a single search to a report
      you can share, so each market you study is measured the same way.</p>''')
sub('''<h3>The Hidden Gate<em class="jp">山門</em></h3>
      <p>Why a gate is a sentence, and what you agree to when you walk under one.</p>
      <span class="t">14 min</span>''',
    '''<h3>Define the query<em class="jp">INPUT</em></h3>
      <p>Name a product or category, pick a marketplace and set an optional price bracket.</p>
      <span class="t">Query</span>''')
sub('''<h3>Borrowed Scenery<em class="jp">借景</em></h3>
      <p>Shakkei: composing with a mountain you will never own.</p>
      <span class="t">18 min</span>''',
    '''<h3>Harvest listings<em class="jp">SERPAPI</em></h3>
      <p>Live Google Shopping results are collected and normalised into clean product records.</p>
      <span class="t">Live</span>''')
sub('''<h3>Charred Cypress<em class="jp">焼杉</em></h3>
      <p>Yakisugi: burning a board black so the weather will let it live.</p>
      <span class="t">21 min</span>''',
    '''<h3>Measure the market<em class="jp">METRICS</em></h3>
      <p>Price spread and distribution, merchant share, ratings and recurring product features.</p>
      <span class="t">Derived</span>''')
sub('''<h3>Lantern Light<em class="jp">灯籠</em></h3>
      <p>How a single ember decides the scale of everything around it.</p>
      <span class="t">17 min</span>''',
    '''<h3>Surface signals<em class="jp">GAPS</em></h3>
      <p>Price gaps, under-served features, weak ratings and concentrated merchants, each with evidence.</p>
      <span class="t">Scored</span>''')
sub('''<h3>The Vermilion Moon<em class="jp">朱月</em></h3>
      <p>Why the moon burns red over the valley, and what the garden does with it.</p>
      <span class="t">22 min</span>''',
    '''<h3>Read the brief<em class="jp">GEMINI</em></h3>
      <p>An AI-written summary with risks and limitations, exported as Markdown or printed to PDF.</p>
      <span class="t">Report</span>''')

# ---------------------------------------------------------------- chapter IV · get started
sub('<div class="eyebrow" data-rv="fade">Chapter 04 — Afterlight</div>',
    '<div class="eyebrow" data-rv="fade">04 — Get started</div>')
sub('<h2 class="display" data-rv="up">Afterlight</h2>', '<h2 class="display" data-rv="up">Clarity</h2>')
sub('''<p class="body-lg" data-rv="up">The gate does not close behind you. Take the walk whenever the noise
    gets loud — it is always the same path, and never the same light.</p>''',
    '''<p class="body-lg" data-rv="up">Bring one product idea and leave with the evidence to back it, or a
    clear reason to walk away. Create an account with email or Google and run your first scan.</p>''')
sub('''<a class="cta" href="#top" data-rv="fade" data-cursor>
    <i></i><span>Begin the walk</span>''',
    '''<a class="cta" href="/signup" data-route="/signup" data-route-auth="/new-scan" data-label-auth="Start a new scan" data-rv="fade" data-cursor>
    <i></i><span>Start your first scan</span>''')

# ---------------------------------------------------------------- footer
sub('''<circle cx="22" cy="25" r="8.6" fill="#e0231c" fill-opacity=".9"/>
        <path d="M5 13h34M9 18.4h26M22 8.5v27" stroke="#dfe7e0" stroke-width="1.5"/>''',
    LENS_MARK.replace('\n      ', '\n        '))
sub('''<p>A five-chapter night walk through a Kyoto mountain temple. Three illustrated garden field notes
        sit inside a live Three.js sanctuary.</p>''',
    '''<p>Evidence-backed market intelligence for e-commerce sellers. Live Google Shopping data, measured
        and explained before you invest.</p>''')
sub('''<div><h4>Chapters</h4><ul>
      <li><a href="#gate" data-cursor>The Sanmon</a></li>
      <li><a href="#pathways" data-cursor>Still Gardens</a></li>
      <li><a href="#lessons" data-cursor>Sacred Craft</a></li>
      <li><a href="#eternity" data-cursor>Afterlight</a></li>
    </ul></div>''',
    '''<div><h4>Product</h4><ul>
      <li><a href="#gate" data-cursor>Live data</a></li>
      <li><a href="#pathways" data-cursor>Signals</a></li>
      <li><a href="#lessons" data-cursor>Workflow</a></li>
      <li><a href="#eternity" data-cursor>Get started</a></li>
    </ul></div>''')
sub('''<div><h4>Practice</h4><ul>
      <li><a href="#lessons" data-cursor>Borrowed scenery</a></li>
      <li><a href="#lessons" data-cursor>Lantern light</a></li>
      <li><a href="#lessons" data-cursor>Charred cypress</a></li>
      <li><a href="#lessons" data-cursor>Raked gravel</a></li>
    </ul></div>''',
    '''<div><h4>Marketplaces</h4><ul>
      <li><a href="/new-scan?c=in" data-route="/new-scan?c=in" data-cursor>India</a></li>
      <li><a href="/new-scan?c=us" data-route="/new-scan?c=us" data-cursor>United States</a></li>
      <li><a href="/new-scan?c=gb" data-route="/new-scan?c=gb" data-cursor>United Kingdom</a></li>
      <li><a href="/new-scan?c=de" data-route="/new-scan?c=de" data-cursor>Germany</a></li>
    </ul></div>''')
sub('''<div><h4>Elsewhere</h4><ul>
      <li><a href="#top" data-cursor>Journal</a></li>
      <li><a href="#top" data-cursor>Field notes</a></li>
      <li><a href="#top" data-cursor>Colophon</a></li>
    </ul></div>''',
    '''<div><h4>Account</h4><ul>
      <li><a href="/login" data-route="/login" data-route-auth="/dashboard" data-label-auth="Dashboard" data-cursor>Sign in</a></li>
      <li><a href="/signup" data-route="/signup" data-route-auth="/reports" data-label-auth="Reports" data-cursor>Create account</a></li>
      <li><a href="/new-scan" data-route="/new-scan" data-cursor>New scan</a></li>
    </ul></div>''')
sub('<span>© 2026 Kage — Kage no Michi</span>', '<span>© 2026 MarketLens</span>')
sub('<span class="jp">静けさは一つの技である</span>', '<span class="jp">Evidence over intuition</span>')
sub('<span>WebGL · Onest · Kyoto</span>', '<span>SerpApi · Gemini · WebGL</span>')

# ---------------------------------------------------------------- script
sub("const names = ['The Hidden Gate', 'The Sanmon', 'Still Gardens', 'Sacred Craft', 'Afterlight', 'Colophon'];",
    "const names = ['Overview', 'Live data', 'Signals', 'Workflow', 'Get started', 'Footer'];")
# The 3-D wordmark. The packaged Wordmark face is an Onest SemiBold subset that
# only carries K, A, G, E (and a few more), so LENS is set in the page's own
# embedded Onest Bold, which shares its drawing. Same four-letter width.
sub("['Reading the type', () => document.fonts && document.fonts.load('600 320px Wordmark')],",
    "['Reading the type', () => document.fonts && document.fonts.load('700 320px Onest')],")
sub("m.font = '600 ' + SZ + 'px Wordmark, sans-serif';", "m.font = '700 ' + SZ + 'px Onest, sans-serif';")
sub("const word = 'KAGE', gl = [];", "const word = 'LENS', gl = [];")
sub("    x.font = '600 ' + SZ + 'px Wordmark, sans-serif';", "    x.font = '700 ' + SZ + 'px Onest, sans-serif';")
sub("font-family:'Wordmark','Onest',sans-serif; font-weight:600; font-size:21.4vw;",
    "font-family:'Onest',sans-serif; font-weight:700; font-size:21.4vw;")

open(DST, 'w', encoding='utf-8').write(html)
print('wrote', DST, len(html.encode()), 'bytes')
