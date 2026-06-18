import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { kv } from '@vercel/kv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, '..', 'data.json');
const ADMIN_PIN = process.env.ADMIN_PIN || '1234';

app.use(cors());
app.use(express.json());

// Prevent caching of API responses
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Predefined Punishments
const DEFAULT_PUNISHMENTS = [
  { id: 'p1', label: '🤫 Minor Offence (Talking, side comments, distracting)', points: -0.5 },
  { id: 'p2', label: '🗣️ Moderate Offence (Talking over player, hints, arguing)', points: -1 },
  { id: 'p3', label: '⚠️ Major Offence (Disruption, cheating, insults, ignoring warnings)', points: -2 },
  { id: 'p4', label: '🚫 Custom Penalty', points: 0 }
];

// Initial Mock Data
const INITIAL_DATA = {
  currentDay: 1,
  teams: [
    { id: 't1', name: 'Team NHF', score: 0, members: ['p1_u', 'p2_u', 'p3_u', 'p4_u'], warnings: 0 },
    { id: 't2', name: 'Team Misfits', score: 0, members: ['p5_u', 'p6_u', 'p7_u', 'p8_u'], warnings: 0 },
    { id: 't3', name: 'Team DTTI', score: 0, members: ['p9_u', 'p10_u', 'p11_u', 'p12_u'], warnings: 0 }
  ],
  players: [
    { id: 'p1_u', name: 'Deen', teamId: 't1', score: 0, isCommittee: true },
    { id: 'p2_u', name: 'Wale', teamId: 't1', score: 0, isCommittee: false },
    { id: 'p3_u', name: 'Joy', teamId: 't1', score: 0, isCommittee: false },
    { id: 'p4_u', name: 'Hauwa', teamId: 't1', score: 0, isCommittee: false },
    { id: 'p5_u', name: 'Frank', teamId: 't2', score: 0, isCommittee: true },
    { id: 'p6_u', name: 'Justice', teamId: 't2', score: 0, isCommittee: false },
    { id: 'p7_u', name: 'Matilda', teamId: 't2', score: 0, isCommittee: false },
    { id: 'p8_u', name: 'Jules', teamId: 't2', score: 0, isCommittee: false },
    { id: 'p9_u', name: 'Dunsin', teamId: 't3', score: 0, isCommittee: false },
    { id: 'p10_u', name: 'Temi', teamId: 't3', score: 0, isCommittee: false },
    { id: 'p11_u', name: 'Tife', teamId: 't3', score: 0, isCommittee: true },
    { id: 'p12_u', name: 'Ify', teamId: 't3', score: 0, isCommittee: false }
  ],
  logs: []
};

// Helper: Recalculate Warnings for teams on the current active day
const recalculateWarnings = (data) => {
  if (data && data.teams && data.logs) {
    for (const team of data.teams) {
      team.warnings = data.logs.filter(
        log => log.targetType === 'team' && 
               log.targetId === team.id && 
               log.day === data.currentDay && 
               log.description && log.description.includes('Warning')
      ).length;
    }
  }
};

// Helper: Read DB
const readData = async () => {
  let data;
  if (process.env.KV_REST_API_URL) {
    try {
      data = await kv.get('leaderboard_state');
      if (!data) {
        data = INITIAL_DATA;
        await kv.set('leaderboard_state', INITIAL_DATA);
      }
    } catch (err) {
      console.error('Error reading from Vercel KV, falling back to local fallback if available', err);
      data = INITIAL_DATA;
    }
  } else {
    try {
      if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_DATA, null, 2));
        data = INITIAL_DATA;
      } else {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        data = JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error reading data file, resetting to initial', err);
      data = INITIAL_DATA;
    }
  }
  recalculateWarnings(data);
  return data;
};

// Helper: Write DB
const writeData = async (data) => {
  recalculateWarnings(data);
  if (process.env.KV_REST_API_URL) {
    try {
      await kv.set('leaderboard_state', data);
    } catch (err) {
      console.error('Error writing to Vercel KV', err);
      throw new Error('Database write error (KV)');
    }
  } else {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Error writing data file', err);
      throw new Error('Database write error (local)');
    }
  }
};

// Middleware: Verify Admin PIN
const verifyPin = (req, res, next) => {
  const { pin } = req.body;
  if (pin !== ADMIN_PIN) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Admin PIN' });
  }
  next();
};

// --- Endpoints ---

// Get Leaderboard Data
app.get('/api/leaderboard', async (req, res) => {
  const data = await readData();
  res.json({
    ...data,
    predefinedPunishments: DEFAULT_PUNISHMENTS
  });
});

// Verify PIN Validity
app.post('/api/admin/verify', (req, res) => {
  const { pin } = req.body;
  if (pin === ADMIN_PIN) {
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, error: 'Incorrect PIN' });
  }
});

// Award Points / Apply Punishment
app.post('/api/score', verifyPin, async (req, res) => {
  const { targetType, targetId, points, description, day } = req.body;
  
  if (!targetType || !targetId || points === undefined || !day) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const data = await readData();
  let targetName = '';

  if (targetType === 'player') {
    const player = data.players.find(p => p.id === targetId);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    player.score += Number(points);
    targetName = player.name;
  } else if (targetType === 'team') {
    const team = data.teams.find(t => t.id === targetId);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    team.score += Number(points);
    targetName = team.name;
  } else {
    return res.status(400).json({ error: 'Invalid target type' });
  }

  // Create Log Entry
  const newLog = {
    id: 'l_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    timestamp: new Date().toISOString(),
    day: Number(day),
    targetType,
    targetId,
    targetName,
    points: Number(points),
    description: description || (points < 0 ? 'Punishment applied' : 'Points awarded')
  };

  data.logs.unshift(newLog); // Prepend to show newest first
  await writeData(data);

  res.json({ success: true, leaderboard: { ...data, predefinedPunishments: DEFAULT_PUNISHMENTS } });
});

// Manage Entities (Add Player/Team)
app.post('/api/setup/update', verifyPin, async (req, res) => {
  const { players, teams, currentDay } = req.body;
  const data = await readData();

  if (players) data.players = players;
  if (teams) data.teams = teams;
  if (currentDay !== undefined) data.currentDay = Number(currentDay);

  await writeData(data);
  res.json({ success: true, leaderboard: { ...data, predefinedPunishments: DEFAULT_PUNISHMENTS } });
});

// Issue Warning to Team
app.post('/api/team/warn', verifyPin, async (req, res) => {
  const { targetId, day } = req.body;
  if (!targetId || !day) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const data = await readData();
  const team = data.teams.find(t => t.id === targetId);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  // Create Log Entry for Warning
  const newLog = {
    id: 'l_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    timestamp: new Date().toISOString(),
    day: Number(day),
    targetType: 'team',
    targetId: team.id,
    targetName: team.name,
    points: 0,
    description: `⚠️ General Warning Issued: Subsequent offences will incur deductions.`
  };

  data.logs.unshift(newLog);
  await writeData(data);

  res.json({ success: true, leaderboard: { ...data, predefinedPunishments: DEFAULT_PUNISHMENTS } });
});

// Delete a Log Entry (Revert Score)
app.post('/api/score/revert', verifyPin, async (req, res) => {
  const { logId } = req.body;
  if (!logId) return res.status(400).json({ error: 'Missing logId' });

  const data = await readData();
  const logIndex = data.logs.findIndex(l => l.id === logId);
  if (logIndex === -1) return res.status(404).json({ error: 'Log entry not found' });

  const log = data.logs[logIndex];

  // Revert the scores
  if (log.targetType === 'player') {
    const player = data.players.find(p => p.id === log.targetId);
    if (player) player.score -= log.points;
  } else if (log.targetType === 'team') {
    const team = data.teams.find(t => t.id === log.targetId);
    if (team) {
      team.score -= log.points;
    }
  }

  // Remove the log
  data.logs.splice(logIndex, 1);
  await writeData(data);

  res.json({ success: true, leaderboard: { ...data, predefinedPunishments: DEFAULT_PUNISHMENTS } });
});

// Reset Database
app.post('/api/reset', verifyPin, async (req, res) => {
  await writeData(INITIAL_DATA);
  res.json({ success: true, leaderboard: { ...INITIAL_DATA, predefinedPunishments: DEFAULT_PUNISHMENTS } });
});

// Serve frontend in production (for local testing/building)
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Fallback all other routes to frontend in production
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Only start Express port listener if NOT deployed on Vercel as a Serverless Function
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;
