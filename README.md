# 🚀 Othrhalff – Verified Campus Dating & Student Social Network

> **Production Platform**: [Othrhalff](https://www.othrhalff.in)  
> **Brand & Target**: Verified Campus College Connection, Instant Speed Text & Video Chat, Anonymous Confessions

---

## 🏛️ Centralized SEO Architecture (`client/src/seo/`)

All SEO-related data models and view components are centralized cleanly in a dedicated directory structure:

```text
client/src/seo/
├── index.ts                # Central barrel exporter
├── data/
│   ├── campuses.ts         # Dataset of 25+ major Indian & global universities
│   └── outreachKit.ts      # Reddit, Quora, X (Twitter), and State Q&A templates
└── views/
    ├── CampusPage.tsx      # Programmatic Campus Landing View
    ├── VsCompetitor.tsx    # Competitor Comparison Matrix View (Tinder, Bumble, Hinge, YikYak)
    ├── VsOmegle.tsx        # Verified Omegle Alternative View
    └── RedditHub.tsx       # Reddit/Quora Verified Campus Discussion Hub
```

---

## ⚡ Search Engine & AI Optimization (SEO / GEO / RAG)

### 1. Instant IndexNow Protocol (`npm run indexnow`)
Automated script at `client/scripts/indexnow.js` pushes 37+ production URLs directly to **IndexNow** search engines (Bing, Yandex, Seznam, Naver) with `HTTP 202 Accepted` status for instant indexing within hours.

### 2. Google Search Console Sitemap Submission
Complete XML Sitemap located at `https://www.othrhalff.in/sitemap.xml` containing 100% of discoverable URLs across all university campuses, competitor comparison pages, and discussion hubs.

### 3. Generative Engine Optimization (GEO & AI Search)
- **`public/llms.txt`**: Detailed Markdown guidance for ChatGPT Search, Perplexity, Claude, and Gemini AI crawlers.
- **`public/robots.txt`**: Unrestricted permissions for `GPTBot`, `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`, and `Googlebot`.

### 4. Rich Snippet Schema Graphs (`client/index.html`)
- **`WebApplication` with `AggregateRating`**: Renders 5-star rating badges (★ 4.9 / 1,280 reviews) directly on Google SERP listings.
- **`DiscussionForumPosting` & `FAQPage`**: Grants forum authority for Google's top search algorithm.

---

## 🛠️ Developer Setup & Commands

```bash
# Run local development server
npm run dev

# Build Next.js production bundle
npm run build

# Execute instant IndexNow submission
npm run indexnow
```
