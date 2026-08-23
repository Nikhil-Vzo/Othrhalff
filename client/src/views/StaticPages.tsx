"use client";

import React from 'react';
import Link from 'next/link';
import { RotateCcw, Ghost, Shield, Heart, Briefcase, AlertTriangle, CheckCircle2, Lock, Scale } from 'lucide-react';

// --- Shared Layout Component ---
const PageLayout: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => {
  return (
    <main className="h-screen w-full overflow-y-auto overflow-x-hidden bg-black text-white font-sans selection:bg-neon selection:text-white p-6 pb-20 relative">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-neon/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-neon/50 text-gray-400 hover:text-white rounded-full transition-all mb-8 group shadow-sm hover:shadow-neon-sm"
        >
          <RotateCcw className="w-4 h-4 group-hover:-rotate-90 transition-transform text-gray-500 group-hover:text-neon" />
          <span className="text-sm font-bold tracking-wide">Back to Profile</span>
        </Link>

        <div className="flex items-center gap-4 mb-12">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-800 shadow-neon-sm shrink-0">
            {icon}
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-tight">{title}</h1>
        </div>

        <div className="bg-gray-900/30 border border-gray-800 rounded-3xl p-8 md:p-12 backdrop-blur-sm animate-fade-in leading-relaxed text-gray-300 space-y-8 text-sm md:text-base">
          {children}
        </div>

        <div className="mt-12 text-center text-gray-600 text-xs">
          &copy; {new Date().getFullYear()} Othrhalff Inc. All rights reserved.
        </div>
      </div>
    </main>
  );
};

// --- Page Components ---

export const About: React.FC = () => (
  <PageLayout title="About Us" icon={<Ghost className="w-8 h-8 text-neon" />}>
    <p className="text-xl text-white font-bold mb-4">We believe dating shouldn't be a popularity contest.</p>
    <p>
      Othrhalff was born in a dorm room with a simple mission: to bring connection back to campus life without the pressure of superficial swiping.
    </p>
    <div className="p-6 border border-yellow-500/30 bg-yellow-500/5 rounded-xl">
      <h4 className="text-yellow-500 font-bold mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Disclaimer</h4>
      <p className="text-xs text-yellow-200/70">
        Othrhalff is an independent platform and is <strong>not affiliated, associated, authorized, endorsed by, or in any way officially connected</strong> with any university, college, or educational institution mentioned on this site. All product and company names are trademarks™ or registered® trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them.
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
        <h3 className="text-neon font-bold mb-2">Authenticity</h3>
        <p className="text-sm">Real students, signed in with their Google accounts. No bots.</p>
      </div>
      <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
        <h3 className="text-neon font-bold mb-2">Privacy</h3>
        <p className="text-sm">You control when to reveal your identity.</p>
      </div>
      <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
        <h3 className="text-neon font-bold mb-2">Safety</h3>
        <p className="text-sm">Encrypted-in-transit chats, block &amp; report, 24h auto-deleting stories.</p>
      </div>
    </div>
  </PageLayout>
);

export const Careers: React.FC = () => (
  <PageLayout title="Careers" icon={<Briefcase className="w-8 h-8 text-neon" />}>
    <h2 className="text-2xl font-bold text-white mb-4">Join the Ghost Crew</h2>
    <p className="mb-6">
      We are a small, passionate team of developers, designers, and love engineers building the next generation of social discovery.
    </p>

    <div className="p-8 bg-gray-800/30 rounded-2xl border border-gray-700 text-center">
      <Ghost className="w-12 h-12 text-gray-600 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">No Open Positions</h3>
      <p className="text-gray-400">
        We aren't hiring right now, but we are always looking for talented campus ambassadors.
        If you think you can bring Othrhalff to your university, drop us a line!
      </p>
    </div>
  </PageLayout>
);



export const Privacy: React.FC = () => (
  <PageLayout title="Privacy Policy" icon={<Lock className="w-8 h-8 text-neon" />}>
    <div className="space-y-8 text-sm">
      <div className="p-4 bg-neon/5 border border-neon/20 rounded-xl mb-6">
        <p className="font-bold text-neon mb-1">TL;DR</p>
        <p className="text-gray-400">We collect the minimum needed to run the app. Your real name is hidden from other users until you match or reveal it. We never sell your data — not to anyone, including universities.</p>
      </div>

      <p className="text-gray-500">Last updated: August 2026. This policy is published under India's Digital Personal Data Protection Act, 2023 ("DPDP Act") and applies to the Othrhalff platform at othrhalff.in.</p>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">1. Who We Are</h3>
        <p>
          Othrhalff ("we", "us") is an independent student platform. We are NOT affiliated with, endorsed by, or acting on behalf of any university, college, or educational institution. University names appearing on the platform are provided by users themselves or used solely to help students find peers from the same campus.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">2. What Data We Collect</h3>
        <ul className="list-disc pl-5 space-y-2 mt-2 text-gray-400">
          <li><strong>Account Data (from Google Sign-In):</strong> your name, email address, and profile photo as provided by Google. Used to create and identify your account.</li>
          <li><strong>Profile Data:</strong> display name, gender, college/university, branch, year, interests, bio, date of birth, and avatar you provide. Your display name and photo are hidden from other users until a mutual match occurs or you choose to reveal them.</li>
          <li><strong>Content You Post:</strong> chat messages with matches, glimpses (photo stories auto-deleted after 24 hours), anonymous confessions, and reactions.</li>
          <li><strong>Interaction Data:</strong> swipes, matches, blocks, reports, and song requests — used to operate matching and safety features.</li>
          <li><strong>Technical Data:</strong> device/browser information, IP address, and crash logs — used for security, abuse prevention, and fixing bugs.</li>
          <li><strong>Analytics:</strong> anonymized usage events (e.g., "swipe right", "message sent") via Google Analytics to improve the product.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">3. What We Do NOT Collect</h3>
        <ul className="list-disc pl-5 space-y-2 mt-2 text-gray-400">
          <li>We do not access your university's internal systems, student records, or academic data.</li>
          <li>We do not read your personal Google account data beyond what Google shows you during sign-in consent.</li>
          <li>We do not track your location via GPS.</li>
          <li>We do not sell, rent, or trade your personal data to third parties — including universities, advertisers, or data brokers.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">4. How Your Data Is Stored & Secured</h3>
        <ul className="list-disc pl-5 space-y-2 mt-2 text-gray-400">
          <li>Data is hosted on Supabase (PostgreSQL) and cloud infrastructure with encryption in transit (TLS) and at rest.</li>
          <li>Row Level Security restricts database access so users can only read/write data they are permitted to.</li>
          <li>Glimpses are automatically deleted after 24 hours by scheduled jobs.</li>
          <li>Chat messages are stored server-side to deliver them reliably and sync across your devices. They are encrypted in transit but are <strong>not end-to-end encrypted</strong>; we can technically access message content, and will only do so to investigate verified reports of abuse, harassment, or illegal activity, or when legally required.</li>
          <li>Video/audio calls run on Agora. Call media streams are peer-to-peer/relay through Agora's network per their security terms and are not recorded by us.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">5. What Other Users Can See</h3>
        <p>Your display name, avatar, university, branch/year, interests, and bio are visible to matched users. Anonymous features (confessions, anonymous glimpses) hide your identity by design. We show an online-presence indicator to your matches.</p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">6. Third-Party Processors</h3>
        <p>We rely on these providers strictly to operate the service: Supabase (database/auth/storage), Agora (video/audio), Vercel &amp; Render (hosting), Google (sign-in, analytics, push). Each processes data under its own privacy terms. We never share your data with universities or colleges.</p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">7. Your Rights (DPDP Act, 2023)</h3>
        <ul className="list-disc pl-5 space-y-2 mt-2 text-gray-400">
          <li><strong>Access & Correction:</strong> view and correct your profile anytime from the Profile page.</li>
          <li><strong>Erasure:</strong> request deletion of your account and personal data via in-app support or the Grievance Officer below. We will erase within 30 days, except data we must retain for legal compliance or active safety investigations.</li>
          <li><strong>Withdrawal of Consent:</strong> you may stop using the service and request erasure at any time; withdrawal does not affect prior processing done lawfully.</li>
          <li><strong>Grievance Redressal:</strong> if you believe your data was mishandled, contact our Grievance Officer (below). We respond within 30 days. You may also escalate to the Data Protection Board of India.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">8. Data Retention</h3>
        <p>Profile and account data are retained while your account is active. Glimpses auto-expire after 24 hours. On account deletion, profile data, messages, matches, and content are erased within 30 days. Anonymized, aggregated analytics are retained indefinitely.</p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">9. Children's Data</h3>
        <p>Othrhalff is strictly for users aged 18 and above who are enrolled university students. We do not knowingly collect data from anyone under 18. If we learn a user is under 18, the account and data are deleted immediately.</p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">10. Grievance Officer</h3>
        <p>
          Per the DPDP Act and IT Rules, our Grievance Officer can be reached at <a href="mailto:othrhalff@gmail.com" className="text-neon hover:underline">othrhalff@gmail.com</a> — or raise an in-app ticket from Profile → Contact Support. Include "Privacy Grievance" in your message.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">11. Policy Changes</h3>
        <p>If we make material changes, we will notify you in-app before they take effect. Continued use after notification constitutes acceptance.</p>
      </section>
    </div>
  </PageLayout>
);

export const Terms: React.FC = () => (
  <PageLayout title="Terms of Service" icon={<Scale className="w-8 h-8 text-neon" />}>
    <div className="space-y-8 text-sm">
      <div className="p-4 border-l-4 border-red-500 bg-red-500/10 mb-6">
        <p className="font-bold text-white">Critical Disclaimer</p>
        <p className="text-gray-400 mt-1">
          Othrhalff is NOT affiliated with, authorized by, or endorsed by any university or college. All institution names are trademarks of their respective owners, used nominatively for identification only. By using this app, you acknowledge this is a private, independent service.
        </p>
      </div>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">1. Acceptance & Eligibility</h3>
        <p>By accessing Othrhalff you agree to these Terms. You must be at least 18 years old and a currently enrolled university student. One account per person. We may suspend accounts that violate eligibility.</p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">2. Non-Affiliation With Institutions</h3>
        <p>
          Othrhalff is an independent entity with no connection to any university or college. Institution names appear only because users self-report their campus, or as descriptive references to help students find peers. We do not claim any ownership, sponsorship, partnership, or endorsement by any educational institution. If you are an institution representative and want your name handled differently, contact us and we will work with you.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">3. Your Account & Conduct</h3>
        <p>You agree NOT to:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2 text-gray-400">
          <li>Misrepresent your identity, enrollment status, or impersonate university officials/staff or other people.</li>
          <li>Harass, bully, stalk, threaten, or intimidate other users.</li>
          <li>Post illegal content, hate speech, nudity, sexual content involving minors, or violent/extremist material.</li>
          <li>Use the service for academic dishonesty, scams, spam, commercial solicitation, or prostitution.</li>
          <li>Scrape, reverse-engineer, overload, or attempt to breach the platform or other users' accounts.</li>
          <li>Share another person's private information (doxxing) without consent.</li>
        </ul>
        <p className="mt-2 text-red-400">Violation results in immediate suspension or permanent ban, and we may report illegal activity to relevant authorities.</p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">4. User Content & License</h3>
        <p>You own what you post. By posting content (messages, glimpses, confessions, avatars), you grant Othrhalff a limited, non-exclusive, worldwide license to host, store, and display it solely to operate the service. Confessions and anonymous glimpses are posted anonymously by design; you remain responsible for their content. Do not post anything defamatory, infringing, or that violates another person's privacy or dignity.</p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">5. Safety & Interactions</h3>
        <p>
          Othrhalff connects you with other students. We verify nothing about offline behavior and cannot vouch for any user. You are solely responsible for your interactions. Follow our Safety Tips: keep conversations on-platform until comfortable, meet in public places, and never share financial details, addresses, or dorm specifics. Use Block &amp; Report for anything unsafe.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">6. Moderation & Reporting</h3>
        <p>We moderate reported content and accounts. We may remove content, warn, suspend, or ban users at our discretion for violations of these Terms or community guidelines. We cooperate with law enforcement where legally required.</p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">7. Availability & Changes</h3>
        <p>The service is provided "as is" and "as available." We may modify, pause, or discontinue any feature at any time. We are not liable for downtime, data loss from unauthorized access beyond our reasonable controls, or losses caused by other users.</p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">8. Limitation of Liability</h3>
        <p className="uppercase text-xs font-bold text-gray-500 mb-2">Read Carefully</p>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, OTHRHALFF, ITS FOUNDERS, AND CONTRIBUTORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES — INCLUDING LOSS OF PROFITS, DATA, GOODWILL, OR REPUTATION — ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE, THE CONDUCT OR CONTENT OF ANY USER, UNAUTHORIZED ACCESS TO OR ALTERATION OF YOUR DATA, OR ANY OTHER MATTER RELATING TO THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM SHALL NOT EXCEED INR 500 OR THE AMOUNT YOU PAID US IN THE PRIOR 12 MONTHS, WHICHEVER IS LOWER.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">9. Indemnification</h3>
        <p>
          You agree to indemnify and hold Othrhalff harmless from any claims, disputes, demands, liabilities, damages, losses, and costs (including reasonable legal fees) arising out of your use of the Service, your content, or your violation of these Terms or any third party's rights — including any claim brought by a university related to your use of its name on the platform.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">10. Governing Law & Disputes</h3>
        <p>These Terms are governed by the laws of India. Courts in Chhattisgarh shall have exclusive jurisdiction over disputes, subject to mandatory consumer-protection rights available to you under Indian law.</p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">11. Contact</h3>
        <p>Questions about these Terms? Email <a href="mailto:othrhalff@gmail.com" className="text-neon hover:underline">othrhalff@gmail.com</a> or raise an in-app ticket from Profile → Contact Support.</p>
      </section>
    </div>
  </PageLayout>
);

export const Safety: React.FC = () => (
  <PageLayout title="Safety Tips" icon={<Shield className="w-8 h-8 text-neon" />}>
    <div className="space-y-6">
      <div className="flex gap-4">
        <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
        <div>
          <h3 className="text-white font-bold mb-1">Keep it on the app</h3>
          <p className="text-sm">Don't move to other messaging platforms until you feel completely comfortable. Our chat and calls are encrypted.</p>
        </div>
      </div>

      <div className="flex gap-4">
        <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
        <div>
          <h3 className="text-white font-bold mb-1">Meet in public</h3>
          <p className="text-sm">If you decide to meet in person, always choose a public place on campus, like the library, student center, or a busy coffee shop.</p>
        </div>
      </div>

      <div className="flex gap-4">
        <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
        <div>
          <h3 className="text-white font-bold mb-1">Guard your info</h3>
          <p className="text-sm">Even after matching, be careful about sharing your dorm room number, financial info, or home address.</p>
        </div>
      </div>

      <div className="mt-8 p-4 bg-neon/10 border border-neon/30 rounded-xl">
        <p className="text-neon font-bold text-sm text-center">
          If you ever feel unsafe, use the "Block & Report" button in the chat menu immediately. We take all reports seriously.
        </p>
      </div>
    </div>
  </PageLayout>
);

export const Guidelines: React.FC = () => (
  <PageLayout title="Guidelines" icon={<Heart className="w-8 h-8 text-neon" />}>
    <div className="space-y-8">
      <p className="text-lg font-medium text-white">
        Othrhalff is designed to be a safe, fun, and inclusive space. To keep it that way, we ask everyone to follow these simple rules.
      </p>

      <div className="space-y-6">
        <div className="flex items-start gap-4 p-4 bg-gray-800/30 rounded-xl">
          <CheckCircle2 className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-white font-bold mb-1">Be Respectful</h3>
            <p className="text-sm text-gray-400">Treat others how you want to be treated. Ghosting happens, but rudeness is a choice. Harassment is never okay.</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 bg-gray-800/30 rounded-xl">
          <CheckCircle2 className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-white font-bold mb-1">Be Honest</h3>
            <p className="text-sm text-gray-400">You are anonymous, not fake. Represent your interests and major truthfully. Catfishing is strictly prohibited.</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 bg-gray-800/30 rounded-xl">
          <CheckCircle2 className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-white font-bold mb-1">Zero Tolerance for Hate</h3>
            <p className="text-sm text-gray-400">Racism, sexism, homophobia, and transphobia result in an immediate and permanent IP ban. We protect our community fiercely.</p>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
);