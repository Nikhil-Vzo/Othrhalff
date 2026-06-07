const fs = require('fs');
const path = require('path');

const routes = {
  'login': 'Login',
  'onboarding': 'Onboarding',
  'home': 'Home',
  'matches': 'Matches',
  'chat/[id]': 'Chat',
  'notifications': 'Notifications',
  'virtual-date': 'VirtualDate',
  'virtual-date/cinema': 'virtual-dates/CinemaDate',
  'virtual-date/music': 'virtual-dates/MusicDate',
  'profile': 'Profile',
  'profile/[id]': 'Profile',
  'developers': 'Developers',
  'confessions': 'Confessions',
  'blog': 'Blog',
  'about': 'StaticPages',
  'careers': 'Careers',
  'contact': 'Contact',
  'privacy': 'StaticPages',
  'terms': 'StaticPages',
  'safety': 'StaticPages',
  'guidelines': 'StaticPages'
};

const appDir = path.join(__dirname, 'app');

if (!fs.existsSync(appDir)) {
  fs.mkdirSync(appDir, { recursive: true });
}

for (const [routePath, componentPath] of Object.entries(routes)) {
  const dir = path.join(appDir, routePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Map the export correctly depending on the file
  let exportName = componentPath.split('/').pop();
  if (routePath === 'about') exportName = 'About';
  if (routePath === 'privacy') exportName = 'Privacy';
  if (routePath === 'terms') exportName = 'Terms';
  if (routePath === 'safety') exportName = 'Safety';
  if (routePath === 'guidelines') exportName = 'Guidelines';

  let relativeDots = '../'.repeat(routePath.split('/').length);

  const content = `"use client";\n\nimport { ${exportName} } from '${relativeDots}src/views/${componentPath}';\n\nexport default function Page() {\n  return <${exportName} />;\n}\n`;

  fs.writeFileSync(path.join(dir, 'page.tsx'), content);
}

console.log("Routes generated successfully.");
