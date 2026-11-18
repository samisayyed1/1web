# 1WEB website redesign

A redesign of [1web.com](https://www.1web.com/) for 1WEB, a growth marketing agency from Canada. The homepage speaks to startups and growing brands; fundraising work has its own page.

**Live:** https://samisayyed1.github.io/1web/

## What's inside

- **Static pages**: `index.html` (startups and brands) and `nonprofits.html` (charities). No build step. Hosted on GitHub Pages.
- **Brand**: keeps the original 1WEB logo, rebuilt as a crisp vector (`assets/img/logo.svg`, `logo-white.svg`). Uses the brand purple (#9236C3, #532B79 → #773E96) and the orange → gold gradient (#E27C1F → #FCB514).
- **Type**: Mona Sans (variable width and weight), from Google Fonts.
- **Motion**:
  - [GSAP 3.15](https://gsap.com/) with ScrollTrigger and SplitText.
  - [Lenis](https://github.com/darkroomengineering/lenis) smooth scrolling on desktop. Touch devices keep native momentum scrolling.
- **Hero**: a custom WebGL "silk" shader (`assets/js/gl.js`) that reacts to the cursor.
  - It renders at a fixed pixel budget and pauses when off-screen or in a background tab.
  - With reduced motion it shows a single still frame.
- **Booking**: every "Book a call" button opens the Calendly popup on the page. If Calendly can't load, it opens Calendly in a new tab instead. The contact form pre-fills Calendly with the visitor's details.
- **Resilience**:
  - Respects `prefers-reduced-motion`.
  - All content stays visible if the animation CDN fails.
  - Tested in Chromium and WebKit at 320 px, 360 px, 390 px, 820 px and 1440 px widths.

## Structure

```
index.html            homepage: startups and growing brands
nonprofits.html       fundraising work for charities and nonprofits
assets/css/main.css
assets/js/main.js     interactions, scroll motion, menu, FAQ, booking
assets/js/gl.js       hero shader
assets/img/           logo, favicon, share image, partner logos, testimonial photos
```

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Content notes

The copy avoids em dashes and stock agency phrasing on purpose. Keep it that way when editing.

**Placeholders to confirm before launch.** Each one has a dashed gold outline on the page (class `tbc`), and a `TBC` comment marks it in the HTML.

- Hero and "By the numbers": ad spend managed (`$XM+`), average ROAS (`X.X×`) and client retention (`XX%`).
- Case studies for Zown, Product Faculty and World Travel Awards. The headline metric is a placeholder, and the scope line and channel chips are a best guess.
- Client names in the logo strip are text wordmarks. Swap in official logo files when they're available.
- Partner badges are text placeholders. Swap in the official Google Partner and Meta Business Partner badge artwork.

The Human Concern International story and every figure on the nonprofits page come from the current 1web.com. The original site gives two different figures for team size, "50+ marketers" and "35+ marketers", so confirm which is right.
