# Specification: Othrhalff GitHub Wiki

This document outlines the design and page structure for Othrhalff's GitHub Wiki documentation.

## Goals
Provide comprehensive, modular developer documentation detailing the Othrhalff system's architecture, database schema, user flows, and local setup steps.

## Wiki Structure (Multi-Page Modular layout)

We will create a `wiki` directory containing the following markdown files:

1. `Home.md` - Main welcome page and quick navigation table of contents.
2. `_Sidebar.md` - Sidebar navigation for the GitHub Wiki.
3. `Architecture.md` - System architecture, tech stack components (Vite/React, Express, Supabase, Agora), and data-flow boundaries.
4. `Database-Schema.md` - Supabase database tables (profiles, confessions, swipes, matches, messages, calls) and Row-Level Security (RLS) policies.
5. `Feature-Guides.md` - Business logic behind unique Gen Z privacy features (Ghost Chemistry Match, Pulse-to-Ghost Bridge, Sparx stories/Radar heat-map, Duo Dates co-activities).
6. `Developer-Setup.md` - Setup instructions, environment variables configuration, local commands, and hosting deployment guide.

## Details of Proposed Pages

### Home.md
* Welcome banner & introduction to the anonymous campus social application.
* List of core value propositions.
* Modular index links.

### Architecture.md
* Detailed breakdown of the multi-tier client-server structure.
* Communication protocols between frontend, Node/Express token server, and Supabase database.
* Role-specific responsibilities (e.g. why backend server bypasses RLS using Service Role key for automated matching transactions).

### Database-Schema.md
* Documentation of all core database tables, field types, and descriptions:
  * `profiles`: identity metadata, verification, premium status.
  * `confessions`, `comments`, `poll_options`, `poll_votes`: feed post mechanics.
  * `swipes`, `matches`, `messages`, `calls`: match matchmaking system and chat interactions.
* RLS (Row Level Security) definitions.

### Feature-Guides.md
* In-depth flow explanations of:
  * Profile blur & countdown reveal logic.
  * Pulse-to-ghost confession matches.
  * Sparx hub: vertical feed, geolocated campus SVG heatmap, in-app viewfinder camera.
  * Duo Dates: synchronized stream and paint co-activities via PeerJS/Agora.

### Developer-Setup.md
* Environment variable configuration reference.
* Commands to install and run the workspaces concurrently (`npm run install:all`, `npm run dev`).
* Production build and deployment checklist.
