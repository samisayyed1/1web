# 1WEB — website redesign

A redesign of [1web.com](https://www.1web.com/) for 1WEB, a premier digital marketing agency from Canada.

**Live:** https://samisayyed1.github.io/1web/

## What's inside

- **Single static page**: no build step. Hosted on GitHub Pages.
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
index.html
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

All copy, stats, testimonials and partner logos come from the current 1web.com. The original site gives two different figures in places, "50+ marketers" and "35+ marketers", so confirm the stats before launch.
