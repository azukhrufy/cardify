# Cardify — Initial Development Brief

## Brand Identity

- **Name:** Cardify
- **Domain:** [cardify.my.id](https://cardify.my.id)
- **Tagline:** `Know what your influence is worth.`
- **One-liner:** `Cardify turns your social media dashboard into a rate card brands take seriously.`
- **Positioning:** Free, no-signup rate card calculator for influencers — the tool creators open before a brand asks "what's your rate?"
- **Watermark / attribution:** `Created with Cardify — cardify.my.id` (carried on every free-tier output, keeping the brand in front of the brands who receive the rate card).

## Product Description
Cardify is a website that helps influencers determine their rate card for endorsement or any opportunity. this website is split into two section :
    - Landing Page : It will describe what this website do, what this website can, and short tutorial about how to use this website.
    - Rate Card Calculator : this will separate into 3 sections, Tiktok, Youtube, and Instagram. Every section is separate by using Chakra UI Tabs (customize into 3 buttons Tiktok, Youtube, and Instagram). every tabs will calculate based on user upload their social media dashboard, about viewers, engagement and many more that will using as parameters to determine their rate card.

it will separate into : 
1. Phase 1 : it will develop initial component of the website, Header Menu, Footer, Hero Section, and another section in Landing page that define who we are. It will contain about Typography, Tagline, and content of landing page. Stack is fixed here: Next.js Pages Router, React 19, and Chakra UI v2 (theme tokens in `theme.js` — no Tailwind), so Phase 2 tabs inherit the same design system. Including code about web SEO — brand name, domain, and metadata all locked to `Cardify` / `cardify.my.id` so the brand is indexed under one identity from day one.
2. Phase 2 : initial development of Rate Card Calculator, develop of routes of Youtube, Tiktok, and Instagram Tab. Adjust Background to each tab follow that social media identity (youtube : red of youtube, tiktok : black of tiktok, instagram : purple of instagram). Develop some input forms (username, followers, etc), and upload forms (to upload their social media dashboard) to get insight from their social media dashboard. Including integrate with AI to determine their rate card based on their dashboard performance.
3. Phase 3 : Development about Download Generated Rate card, it will become pdf based. (maybe using html2canvas or jspdf). also in downloaded pdf document will include Cardify logo in the bottom center of document, watermarked `Created with Cardify — cardify.my.id` (since its free tier). Every downloaded PDF is a brand touchpoint — it lands in a brand manager's inbox with Cardify's name on it.

another phase will determined later.