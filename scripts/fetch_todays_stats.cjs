const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.join(__dirname, '../server/.env') });
dotenv.config({ path: path.join(__dirname, '../client/.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getStats() {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const now = new Date();
  const istMidnight = new Date(Math.floor((now.getTime() + istOffset) / 86400000) * 86400000 - istOffset);
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  console.log(`\n======================================================`);
  console.log(`  OTHRHALFF PLATFORM STATS AUDIT`);
  console.log(`  Current Time (IST): ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
  console.log(`  Today's Window (Since Midnight IST): ${istMidnight.toISOString()}`);
  console.log(`======================================================\n`);

  // 1. Profiles / Users
  const { count: totalProfiles, error: pErr } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { data: newProfilesToday, count: newProfilesTodayCount } = await supabase
    .from('profiles')
    .select('id, real_name, anonymous_id, university, created_at, gender', { count: 'exact' })
    .gte('created_at', istMidnight.toISOString());

  const { data: recentProfiles } = await supabase
    .from('profiles')
    .select('id, real_name, anonymous_id, university, created_at, gender')
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, real_name, university, gender, created_at, updated_at');

  // 2. Confessions
  const { count: totalConfessions, error: cErr } = await supabase
    .from('confessions')
    .select('*', { count: 'exact', head: true });

  const { data: confessionsToday, count: confessionsTodayCount } = await supabase
    .from('confessions')
    .select('id, text, college, branch, created_at, likes, comments_count', { count: 'exact' })
    .gte('created_at', istMidnight.toISOString());

  const { data: recentConfessions } = await supabase
    .from('confessions')
    .select('id, text, college, branch, created_at, likes, comments_count')
    .order('created_at', { ascending: false })
    .limit(5);

  // 3. Matches / Swipes
  let totalMatches = 0;
  let matchesToday = 0;
  try {
    const { count: tMatches } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true });
    totalMatches = tMatches || 0;

    const { count: tMatchesToday } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', istMidnight.toISOString());
    matchesToday = tMatchesToday || 0;
  } catch (e) {}

  // 4. Messages / Calls
  let totalMessages = 0;
  let messagesToday = 0;
  try {
    const { count: tMsgs } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });
    totalMessages = tMsgs || 0;

    const { count: tMsgsToday } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', istMidnight.toISOString());
    messagesToday = tMsgsToday || 0;
  } catch (e) {}

  // 5. PCO Song Requests
  let totalSongReqs = 0;
  let songReqsToday = 0;
  let recentSongs = [];
  try {
    const { count: tSongs } = await supabase
      .from('pco_song_requests')
      .select('*', { count: 'exact', head: true });
    totalSongReqs = tSongs || 0;

    const { data: songsTodayData, count: tSongsToday } = await supabase
      .from('pco_song_requests')
      .select('*', { count: 'exact' })
      .gte('requested_at', istMidnight.toISOString());
    songReqsToday = tSongsToday || 0;
    recentSongs = songsTodayData || [];
  } catch (e) {}

  // 6. Reports / Safety
  let totalReports = 0;
  let reportsToday = 0;
  try {
    const { count: tReps } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true });
    totalReports = tReps || 0;

    const { count: tRepsToday } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', istMidnight.toISOString());
    reportsToday = tRepsToday || 0;
  } catch (e) {}

  // 7. Support tickets
  let totalTickets = 0;
  let ticketsToday = 0;
  try {
    const { count: tTix } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true });
    totalTickets = tTix || 0;

    const { count: tTixToday } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', istMidnight.toISOString());
    ticketsToday = tTixToday || 0;
  } catch (e) {}

  // 8. Push Subscriptions
  let totalPushSubs = 0;
  try {
    const { count: tPush } = await supabase
      .from('push_subscriptions')
      .select('*', { count: 'exact', head: true });
    totalPushSubs = tPush || 0;
  } catch (e) {}

  console.log(`👤 USER PROFILES:`);
  console.log(` • Total Registered Users: ${totalProfiles || 0}`);
  console.log(` • New Users Today (IST):  ${newProfilesTodayCount || 0}`);
  if (newProfilesToday && newProfilesToday.length > 0) {
    console.log(`   Today's Signups:`, newProfilesToday);
  }
  if (recentProfiles && recentProfiles.length > 0) {
    console.log(`\n   Latest 5 Registered Users:`);
    recentProfiles.slice(0, 5).forEach(p => {
      console.log(`    - ${p.real_name || p.anonymous_id || 'User'} | Uni: ${p.university || 'N/A'} | Gender: ${p.gender || 'N/A'} | Joined: ${p.created_at}`);
    });
  }

  // Universities Breakdown
  if (allProfiles && allProfiles.length > 0) {
    const uniMap = {};
    allProfiles.forEach(p => {
      const u = p.university || 'Unspecified';
      uniMap[u] = (uniMap[u] || 0) + 1;
    });
    console.log(`\n • Top Campus Breakdown:`);
    Object.entries(uniMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .forEach(([uni, count]) => {
        console.log(`    - ${uni}: ${count} users`);
      });
  }

  console.log(`\n💬 CONFESSIONS & CAMPUS TEA:`);
  console.log(` • Total Confessions:      ${totalConfessions || 0}`);
  console.log(` • Confessions Today (IST): ${confessionsTodayCount || 0}`);
  if (confessionsToday && confessionsToday.length > 0) {
    console.log(`\n   Today's Confessions:`);
    confessionsToday.forEach(c => {
      console.log(`    - [${c.college || 'General'}] "${c.text.replace(/\n/g, ' ').substring(0, 80)}..." (❤️ ${c.likes || 0})`);
    });
  } else if (recentConfessions && recentConfessions.length > 0) {
    console.log(`\n   Most Recent Confessions:`);
    recentConfessions.forEach(c => {
      console.log(`    - [${c.college || 'General'}] "${c.text.replace(/\n/g, ' ').substring(0, 80)}..." (❤️ ${c.likes || 0}, Created: ${c.created_at})`);
    });
  }

  console.log(`\n❤️ MATCHES & INTERACTIONS:`);
  console.log(` • Total Matches Created:  ${totalMatches}`);
  console.log(` • Matches Today:          ${matchesToday}`);
  console.log(` • Total Messages:         ${totalMessages}`);
  console.log(` • Messages Today:         ${messagesToday}`);

  console.log(`\n📻 CAMPUS RADIO (PCO SPARX):`);
  console.log(` • Total Song Requests:    ${totalSongReqs}`);
  console.log(` • Requests Today:         ${songReqsToday}`);
  if (recentSongs.length > 0) {
    recentSongs.forEach(s => {
      console.log(`    - 🎵 "${s.track_name}" by ${s.track_artist} (Status: ${s.status})`);
    });
  }

  console.log(`\n🛡️ SAFETY & AUDIT:`);
  console.log(` • Total Reports:          ${totalReports}`);
  console.log(` • Reports Today:          ${reportsToday}`);
  console.log(` • Support Tickets:        ${totalTickets}`);
  console.log(` • Tickets Today:          ${ticketsToday}`);

  console.log(`\n🔔 NOTIFICATIONS & ENGAGEMENT:`);
  console.log(` • Active Web Push Subs:   ${totalPushSubs}`);

  console.log(`\n======================================================\n`);
}

getStats().catch(err => {
  console.error('Error fetching database stats:', err);
});
