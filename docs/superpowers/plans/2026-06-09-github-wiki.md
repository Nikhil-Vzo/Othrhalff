# GitHub Wiki Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a complete, modular, and professional multi-page GitHub Wiki for Othrhalff inside a `wiki/` directory.

**Architecture:** We will create individual Markdown files for each section, along with a sidebar navigation page (`_Sidebar.md`), mapping directly to GitHub Wiki's native structure.

**Tech Stack:** Markdown, Git.

---

### Task 1: Create Home and Sidebar navigation

**Files:**
- Create: `wiki/Home.md`
- Create: `wiki/_Sidebar.md`

- [ ] **Step 1: Create the `wiki/Home.md` file**
  Create `wiki/Home.md` containing a welcome banner, introductory overview of Othrhalff, core pillars (Live Feed, Chat, Stories, Radar), and navigation links.
- [ ] **Step 2: Create the `wiki/_Sidebar.md` file**
  Create `wiki/_Sidebar.md` with links to all wiki pages in the standard GitHub Wiki sidebar format.
- [ ] **Step 3: Verify both files exist**
  Verify the files exist by listing the `wiki/` directory.

### Task 2: Create Architecture documentation

**Files:**
- Create: `wiki/Architecture.md`

- [ ] **Step 1: Create `wiki/Architecture.md`**
  Detail the client-server architecture, tech stack (Vite/React, Express, Supabase, Agora RTC, PeerJS), frontend layout structure, and backend API role.
- [ ] **Step 2: Verify Architecture file exists**
  Verify the file is created successfully.

### Task 3: Create Database Schema documentation

**Files:**
- Create: `wiki/Database-Schema.md`

- [ ] **Step 1: Create `wiki/Database-Schema.md`**
  Document the Supabase schema, detailing tables (`profiles`, `confessions`, `poll_options`, `poll_votes`, `swipes`, `matches`, `messages`, `calls`), relationships, and Row-Level Security (RLS) policies.
- [ ] **Step 2: Verify Database-Schema file exists**
  Verify the file is created successfully.

### Task 4: Create Feature Guides documentation

**Files:**
- Create: `wiki/Feature-Guides.md`

- [ ] **Step 1: Create `wiki/Feature-Guides.md`**
  Write detailed guides explaining the workflows for Ghost Matching, Pulse-to-Ghost Bridge, Sparx (TikTok-style stories, camera capture, heatmap radar), and Duo Dates.
- [ ] **Step 2: Verify Feature-Guides file exists**
  Verify the file is created successfully.

### Task 5: Create Developer Setup documentation

**Files:**
- Create: `wiki/Developer-Setup.md`

- [ ] **Step 1: Create `wiki/Developer-Setup.md`**
  Provide local installation steps, env file variables reference, running commands (`npm run install:all` and `npm run dev`), and deployment guidelines.
- [ ] **Step 2: Verify Developer-Setup file exists**
  Verify the file is created successfully.
