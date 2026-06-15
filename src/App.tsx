import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Crown, 
  Trash2, 
  Plus, 
  Lock, 
  Unlock, 
  Users, 
  User, 
  Calendar, 
  RotateCcw, 
  Sparkles, 
  Check, 
  X,
  AlertTriangle,
  FileText,
  ChevronDown
} from 'lucide-react';

// --- Type Definitions ---
interface Player {
  id: string;
  name: string;
  teamId: string;
  score: number;
  isCommittee?: boolean;
}

interface Team {
  id: string;
  name: string;
  score: number;
  members: string[];
  warnings?: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  day: number;
  targetType: 'player' | 'team';
  targetId: string;
  targetName: string;
  points: number;
  description: string;
}

interface Punishment {
  id: string;
  label: string;
  points: number;
}

interface LeaderboardData {
  currentDay: number;
  teams: Team[];
  players: Player[];
  logs: LogEntry[];
  predefinedPunishments: Punishment[];
}

// Predefined Positive Achievements for Easy Selection
const PREDEFINED_ACHIEVEMENTS = [
  { id: 'a1', label: '👥 Group Game: 1st Place', points: 5 },
  { id: 'a2', label: '👥 Group Game: 2nd Place', points: 3 },
  { id: 'a3', label: '👥 Group Game: 3rd Place', points: 1 },
  { id: 'a4', label: '👥 Group Game: Failed/No Answer', points: 0 },
  { id: 'a5', label: '👤 Individual Game: Winner', points: 2 },
  { id: 'a6', label: '👤 Individual Game: Runner-up', points: 1 },
  { id: 'a7', label: '🌟 Bonus: Exceptional Performance', points: 1 },
  { id: 'a8', label: '⚡ Bonus: Fastest Correct Answer', points: 1 },
  { id: 'a9', label: '🤝 Bonus: Team Spirit & Good Sportsmanship', points: 1 },
  { id: 'a10', label: '⭐ Custom Points Award', points: 0 }
];

const RULES_DATA = [
  {
    title: '👥 Team Structure',
    subtitle: '3 Teams, Game Committee Representatives, Scoring',
    content: (
      <ul className="list-disc pl-5 space-y-1 text-slate-600 font-medium">
        <li><strong>3 Teams:</strong> The league is split into 3 distinct teams.</li>
        <li><strong>Game Committee:</strong> Each team has exactly one member of the Game Committee. They help manage the games, scoring, and timing.</li>
        <li><strong>Fair Decisions:</strong> If a committee member is playing in a round, the other committee members will confirm the decisions to maintain neutrality.</li>
        <li><strong>Points Transfer:</strong> Points won by individuals are automatically added to their team's leaderboard score.</li>
      </ul>
    )
  },
  {
    title: '🎮 Types of Games',
    subtitle: 'Group, Individual, and Just-for-Fun Rounds',
    content: (
      <ul className="list-disc pl-5 space-y-1 text-slate-600 font-medium">
        <li><strong>Group Games:</strong> Require full team participation or selected team spokespersons. Discuss and plan together!</li>
        <li><strong>Individual Games:</strong> Selected representatives play. Points won still contribute to the team total score. Once selected, players cannot be changed mid-round.</li>
        <li><strong>Just-for-Fun:</strong> Non-scored games played purely for fun. Basic conduct rules still apply. Scored/Non-scored status is announced beforehand.</li>
      </ul>
    )
  },
  {
    title: '📋 Game-Specific Rules',
    subtitle: 'Rules explanations, Stated consequences, Excuses',
    content: (
      <ul className="list-disc pl-5 space-y-1 text-slate-600 font-medium">
        <li><strong>Explanations:</strong> Before each game, the host will explain how to win, points awarded, limits, and forbidden behaviors.</li>
        <li><strong>No Excuses:</strong> "I did not know" does not count as an excuse once the rules have been explained.</li>
        <li><strong>Rules Enforcement:</strong> Anyone breaking the game rules will face stated consequences or general deductions.</li>
      </ul>
    )
  },
  {
    title: '🏆 Scoring System',
    subtitle: 'Standard Group & Individual points, Speed & Sportsmanship bonuses',
    content: (
      <div className="space-y-3 text-slate-600 font-medium">
        <div>
          <h5 className="font-extrabold text-brand-deep text-sm uppercase tracking-wide mb-1">Group Games:</h5>
          <ul className="list-disc pl-5 space-y-0.5">
            <li>🥇 1st Place: <strong className="text-brand-deep font-bold">+5 points</strong></li>
            <li>🥈 2nd Place: <strong className="text-brand-deep font-bold">+3 points</strong></li>
            <li>🥉 3rd Place: <strong className="text-brand-deep font-bold">+1 point</strong></li>
            <li>Failed attempt: <strong className="text-brand-deep font-bold">0 points</strong></li>
          </ul>
        </div>
        <div>
          <h5 className="font-extrabold text-brand-deep text-sm uppercase tracking-wide mb-1">Individual Games:</h5>
          <ul className="list-disc pl-5 space-y-0.5">
            <li>🏆 Winner: <strong className="text-brand-deep font-bold">+2 points</strong></li>
            <li>🥈 Runner-up: <strong className="text-brand-deep font-bold">+1 point</strong></li>
            <li>❌ Wrong Answer / Failed: <strong className="text-brand-deep font-bold">0 points</strong></li>
          </ul>
        </div>
        <div>
          <h5 className="font-extrabold text-brand-deep text-sm uppercase tracking-wide mb-1">Bonus Points:</h5>
          <ul className="list-disc pl-5 space-y-0.5">
            <li>🌟 Exceptional performance: <strong className="text-brand-deep font-bold">+1 point</strong></li>
            <li>⚡ Fastest correct answer: <strong className="text-brand-deep font-bold">+1 point</strong></li>
            <li>🤝 Team spirit / Sportsmanship: <strong className="text-brand-deep font-bold">+1 point</strong></li>
          </ul>
        </div>
      </div>
    )
  },
  {
    title: '🛑 Noise & Conduct Deductions',
    subtitle: 'Disruption limits, minor/moderate/major penalties',
    content: (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-brand-steel">To keep the game fun and fair, infractions carry point penalties deducted from the team's total score:</p>
        <div className="grid grid-cols-1 gap-2">
          <div className="p-3 border-2 border-brand-yellow/30 bg-brand-yellow/5 rounded-xl">
            <span className="font-extrabold text-brand-deep text-sm block">🤫 Minor Offences (-0.5 pts):</span>
            <span className="text-xs block mt-1 text-slate-600 font-medium">Talking during instructions, side comments during turns, distracting the scorer, shouting answers out of turn.</span>
          </div>
          <div className="p-3 border-2 border-brand-orange/20 bg-brand-orange/5 rounded-xl">
            <span className="font-extrabold text-brand-orange text-sm block">🗣️ Moderate Offences (-1.0 pts):</span>
            <span className="text-xs block mt-1 text-slate-600 font-medium">Talking over active players, giving unauthorized hints, arguing after a decision, repeated noise after warning, interrupting answers, aggressive challenging.</span>
          </div>
          <div className="p-3 border-2 border-red-200 bg-rose-50/20 rounded-xl">
            <span className="font-extrabold text-rose-600 text-sm block">⚠️ Major Offences (-2.0 pts):</span>
            <span className="text-xs block mt-1 text-slate-600 font-medium">Deliberate disruption, refusing instructions, insults/mocking, repeated aggressive behavior, cheating, ignoring warnings.</span>
          </div>
        </div>
      </div>
    )
  },
  {
    title: '⚠️ Warnings',
    subtitle: 'General warnings, score deductions, warnings bypass',
    content: (
      <ul className="list-disc pl-5 space-y-1 text-slate-600 font-medium">
        <li><strong>One General Warning:</strong> Each team gets exactly one general warning. Deductions begin immediately after this warning is used.</li>
        <li><strong>Team Deduction:</strong> Individual rule infractions still result in deductions from their team's overall score.</li>
        <li><strong>Warning Bypass:</strong> The Game Committee can skip warnings for serious offences. All committee decisions on warnings are final.</li>
      </ul>
    )
  },
  {
    title: '🗣️ Answering Rules',
    subtitle: 'Who can answer, edited answers, time limits',
    content: (
      <ul className="list-disc pl-5 space-y-1 text-slate-600 font-medium">
        <li><strong>Allowed Answers:</strong> Only the active player, spokesperson, or team can answer. Shouting answers out of turn may cancel answers.</li>
        <li><strong>No Edits:</strong> Edited/revised answers do not count.</li>
        <li><strong>Time Limits:</strong> Answers must be submitted within the official time limit.</li>
        <li><strong>Clarification:</strong> Unclear answers may get exactly one clarification at the committee's discretion.</li>
      </ul>
    )
  },
  {
    title: '🤝 Fair Play Rules',
    subtitle: 'Sportsmanship, no pressuring scorekeeper, loopholes',
    content: (
      <ul className="list-disc pl-5 space-y-1 text-slate-600 font-medium">
        <li><strong>Conduct:</strong> No shouting over other teams. No giving answers to rival teams.</li>
        <li><strong>No Changes:</strong> No changing players after a round has started.</li>
        <li><strong>Respect the Scorekeeper:</strong> No pressuring the scorekeeper or arguing for points after the next round begins.</li>
        <li><strong>Loopholes:</strong> Bending rules using loopholes is banned. The committee rules against anything violating the spirit of the game.</li>
      </ul>
    )
  },
  {
    title: '⚡ Tiebreaker',
    subtitle: 'Sudden death rounds, clear winners',
    content: (
      <ul className="list-disc pl-5 space-y-1 text-slate-600 font-medium">
        <li><strong>No Ties:</strong> There can only be one winner.</li>
        <li><strong>Sudden Death:</strong> In case of a tie, a final sudden-death question or game will be played.</li>
        <li><strong>Winning condition:</strong> First correct answer wins. If both fail, another question is played until there is a clear winner.</li>
      </ul>
    )
  },
  {
    title: '👑 Final Decision',
    subtitle: 'Game Committee control, score lock',
    content: (
      <ul className="list-disc pl-5 space-y-1 text-slate-600 font-medium">
        <li><strong>Authority:</strong> The Game Committee controls the game, and the scorekeeper controls the leaderboard.</li>
        <li><strong>Score Lock:</strong> Disputes must be raised calmly before the next round starts. Once the next round begins, the score is locked.</li>
        <li><strong>Decisions Final:</strong> The final decision of the Game Committee stands.</li>
      </ul>
    )
  }
];

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : '/api';

export default function App() {
  // --- State ---
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'teams' | 'players' | 'logs' | 'rules'>('teams');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [selectedLogTeamId, setSelectedLogTeamId] = useState<string>('all');
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
  
  // Score form state
  const [scoreTargetType, setScoreTargetType] = useState<'player' | 'team'>('player');
  const [scoreTargetId, setScoreTargetId] = useState('');
  const [scoreDay, setScoreDay] = useState(1);
  const [scoreActionType, setScoreActionType] = useState<'points' | 'punishment'>('points');
  
  // Selection helpers
  const [selectedAchievementId, setSelectedAchievementId] = useState(PREDEFINED_ACHIEVEMENTS[0].id);
  const [selectedPunishmentId, setSelectedPunishmentId] = useState('');
  
  const [customPoints, setCustomPoints] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  
  // Manage entities state
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerTeamId, setNewPlayerTeamId] = useState('');
  const [newPlayerIsCommittee, setNewPlayerIsCommittee] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [editingDay, setEditingDay] = useState(1);
  const [warningTeamId, setWarningTeamId] = useState('');
  const [expandedRule, setExpandedRule] = useState<number | null>(null);

  // UI notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // --- Show Notification Helper ---
  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- Fetch Leaderboard Data ---
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/leaderboard`);
      if (res.ok) {
        const json: LeaderboardData = await res.json();
        setData(json);
      } else {
        console.error('Failed to fetch leaderboard data');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, []);

  // Poll for data updates every 5 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Set default score target once data is fetched
  useEffect(() => {
    if (data) {
      setScoreDay(data.currentDay);
      setEditingDay(data.currentDay);
      if (!scoreTargetId) {
        if (scoreTargetType === 'player' && data.players.length > 0) {
          setScoreTargetId(data.players[0].id);
        } else if (scoreTargetType === 'team' && data.teams.length > 0) {
          setScoreTargetId(data.teams[0].id);
        }
      }
      if (!selectedPunishmentId && data.predefinedPunishments.length > 0) {
        setSelectedPunishmentId(data.predefinedPunishments[0].id);
      }
      if (!warningTeamId && data.teams.length > 0) {
        setWarningTeamId(data.teams[0].id);
      }
    }
  }, [data, scoreTargetType, scoreTargetId, selectedPunishmentId, warningTeamId]);

  // Update default target when target type changes
  const handleTargetTypeChange = (type: 'player' | 'team') => {
    setScoreTargetType(type);
    if (data) {
      if (type === 'player' && data.players.length > 0) {
        setScoreTargetId(data.players[0].id);
      } else if (type === 'team' && data.teams.length > 0) {
        setScoreTargetId(data.teams[0].id);
      }
    }
  };

  // Handle positive achievement preset selection
  useEffect(() => {
    if (scoreActionType === 'points') {
      const a = PREDEFINED_ACHIEVEMENTS.find(item => item.id === selectedAchievementId);
      if (a) {
        setCustomPoints(String(a.points));
        setCustomDescription(a.label === '⭐ Custom Points Award' ? '' : a.label);
      }
    }
  }, [scoreActionType, selectedAchievementId]);

  // Handle punishment preset selection
  useEffect(() => {
    if (scoreActionType === 'punishment' && data && selectedPunishmentId) {
      const p = data.predefinedPunishments.find(item => item.id === selectedPunishmentId);
      if (p) {
        setCustomPoints(String(Math.abs(p.points)));
        setCustomDescription(p.label === '🚫 Custom Penalty' ? '' : p.label);
      }
    }
  }, [scoreActionType, selectedPunishmentId, data]);

  // Reset preset selection on action type change
  const handleActionTypeChange = (type: 'points' | 'punishment') => {
    setScoreActionType(type);
    if (type === 'points') {
      setSelectedAchievementId(PREDEFINED_ACHIEVEMENTS[0].id);
      setCustomPoints(String(PREDEFINED_ACHIEVEMENTS[0].points));
      setCustomDescription(PREDEFINED_ACHIEVEMENTS[0].label);
    } else if (data && data.predefinedPunishments.length > 0) {
      setSelectedPunishmentId(data.predefinedPunishments[0].id);
      const p = data.predefinedPunishments[0];
      setCustomPoints(String(Math.abs(p.points)));
      setCustomDescription(p.label);
    }
  };

  // --- Admin Login ---
  const handleAdminVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setIsAdmin(true);
        setShowPinModal(false);
        setPinError('');
        notify('Unlocked Admin Powers! 🔓');
      } else {
        setPinError('Incorrect PIN, try again! 🤨');
      }
    } catch (err) {
      setPinError('Error verifying PIN');
    }
  };

  // --- Submit Score/Punishment ---
  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pts = Number(customPoints);
    if (isNaN(pts) || pts === 0) {
      notify('Please enter a valid non-zero score', 'error');
      return;
    }

    // Force negative sign for punishments if positive was typed
    const pointsToSend = scoreActionType === 'punishment' && pts > 0 ? -pts : pts;
    const descToSend = customDescription || (pointsToSend < 0 ? 'Applied Punishment 🛑' : 'Awarded Points ✨');

    try {
      const res = await fetch(`${API_BASE}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin,
          targetType: scoreTargetType,
          targetId: scoreTargetId,
          points: pointsToSend,
          description: descToSend,
          day: scoreDay
        })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData(resData.leaderboard);
        notify(pointsToSend > 0 ? `Yahoo! Awarded +${pointsToSend} points! 🎉` : `Oops! Deducted ${pointsToSend} points! 💥`);
        // Reset inputs to default presets
        handleActionTypeChange(scoreActionType);
      } else {
        notify(resData.error || 'Failed to submit score', 'error');
      }
    } catch (err) {
      notify('Network error', 'error');
    }
  };

  // --- Revert Log Entry ---
  const handleRevertLog = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this event and revert scores? 🤔')) return;
    try {
      const res = await fetch(`${API_BASE}/score/revert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, logId })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData(resData.leaderboard);
        notify('Event reverted! Scores updated! ↩️');
      } else {
        notify(resData.error || 'Failed to revert transaction', 'error');
      }
    } catch (err) {
      notify('Network error', 'error');
    }
  };

  // --- Add Player ---
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName || !newPlayerTeamId || !data) return;
    const playerId = 'p_' + Date.now();
    const updatedPlayers = [
      ...data.players,
      {
        id: playerId,
        name: newPlayerName,
        teamId: newPlayerTeamId,
        score: 0,
        isCommittee: newPlayerIsCommittee
      }
    ];
    const updatedTeams = data.teams.map(t => {
      if (t.id === newPlayerTeamId) {
        return { ...t, members: [...t.members, playerId] };
      }
      return t;
    });

    try {
      const res = await fetch(`${API_BASE}/setup/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, players: updatedPlayers, teams: updatedTeams })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData(resData.leaderboard);
        notify(`Welcome to the game, ${newPlayerName}! 👋`);
        setNewPlayerName('');
        setNewPlayerIsCommittee(false);
      } else {
        notify(resData.error || 'Failed to add player', 'error');
      }
    } catch (err) {
      notify('Network error', 'error');
    }
  };

  // --- Add Team ---
  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName || !data) return;
    const updatedTeams = [
      ...data.teams,
      {
        id: 't_' + Date.now(),
        name: newTeamName,
        score: 0,
        members: [],
        warnings: 0
      }
    ];

    try {
      const res = await fetch(`${API_BASE}/setup/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, teams: updatedTeams })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData(resData.leaderboard);
        notify(`Created Team: ${newTeamName} 🏁`);
        setNewTeamName('');
      } else {
        notify(resData.error || 'Failed to add team', 'error');
      }
    } catch (err) {
      notify('Network error', 'error');
    }
  };

  // --- Update Current Day ---
  const handleUpdateDay = async (day: number) => {
    if (!data) return;
    try {
      const res = await fetch(`${API_BASE}/setup/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, currentDay: day })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData(resData.leaderboard);
        notify(`Moved time forward to Day ${day}! 📅`);
      } else {
        notify(resData.error || 'Failed to update day', 'error');
      }
    } catch (err) {
      notify('Network error', 'error');
    }
  };

  // --- Issue Warning to Team ---
  const handleWarnTeam = async (teamId: string) => {
    if (!data) return;
    const team = data.teams.find(t => t.id === teamId);
    if (!team) return;
    if (!confirm(`Issue a General Warning to ${team.name}? ⚠️`)) return;

    try {
      const res = await fetch(`${API_BASE}/team/warn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, targetId: teamId, day: scoreDay })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData(resData.leaderboard);
        notify(`General Warning issued to ${team.name}! ⚠️`);
        setWarningTeamId(data.teams[0]?.id || '');
      } else {
        notify(resData.error || 'Failed to issue warning', 'error');
      }
    } catch (err) {
      notify('Network error', 'error');
    }
  };

  // --- Reset Database ---
  const handleResetData = async () => {
    if (!confirm('🚨 CRITICAL RESET: Reset everyone, all teams, and delete all logs? This cannot be undone!')) return;
    try {
      const res = await fetch(`${API_BASE}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData(resData.leaderboard);
        notify('Board game reset to starting positions! 🔄');
      } else {
        notify(resData.error || 'Reset failed', 'error');
      }
    } catch (err) {
      notify('Network error', 'error');
    }
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <span className="loading loading-ring loading-lg text-brand-deep"></span>
        <p className="mt-4 text-brand-steel font-bold tracking-wide animate-pulse">Syncing DK League... 🎲</p>
      </div>
    );
  }

  // Color constants for chart
  const TEAM_COLORS = [
    '#4F46E5', // Royal Indigo (Team 1)
    '#F43F5E', // Coral/Rose (Team 2)
    '#14B8A6', // Electric Teal (Team 3)
    '#475569', // Slate Blue
    '#F59E0B'  // Lemon Yellow
  ];

  // Helper to calculate total team score (direct + members)
  const getTeamTotalScore = (team: Team) => {
    return team.score + data.players
      .filter(p => p.teamId === team.id)
      .reduce((sum, p) => sum + p.score, 0);
  };

  // Helper to calculate gained, lost, net points
  const getTeamGainLoss = (team: Team) => {
    const currentTotal = getTeamTotalScore(team);
    
    // Sum of all logs for this team + its members
    const teamLogs = data.logs.filter(log => (
      (log.targetType === 'team' && log.targetId === team.id) ||
      (log.targetType === 'player' && data.players.find(p => p.id === log.targetId)?.teamId === team.id)
    ));

    const totalLogsScore = teamLogs.reduce((sum, log) => sum + log.points, 0);
    const startingScore = currentTotal - totalLogsScore;

    let gained = startingScore > 0 ? startingScore : 0;
    let lost = startingScore < 0 ? startingScore : 0;

    teamLogs.forEach(log => {
      if (log.points > 0) {
        gained += log.points;
      } else {
        lost += log.points; // negative
      }
    });

    return { gained, lost, net: currentTotal };
  };

  // Helper to get 7-day cumulative progression array [Day 0, Day 1, ..., Day 7]
  const getTeamScoreHistory = (team: Team) => {
    const currentTotal = getTeamTotalScore(team);
    const teamLogs = data.logs.filter(log => (
      (log.targetType === 'team' && log.targetId === team.id) ||
      (log.targetType === 'player' && data.players.find(p => p.id === log.targetId)?.teamId === team.id)
    ));
    const totalLogsScore = teamLogs.reduce((sum, log) => sum + log.points, 0);
    const startingScore = currentTotal - totalLogsScore;

    const history = [startingScore];
    let runningScore = startingScore;
    for (let day = 1; day <= 7; day++) {
      const dayPoints = teamLogs
        .filter(log => log.day === day)
        .reduce((sum, log) => sum + log.points, 0);
      runningScore += dayPoints;
      history.push(runningScore);
    }
    return history;
  };

  // Helper to render mini sparkline
  const renderSparkline = (team: Team, color: string) => {
     const history = getTeamScoreHistory(team);
     const min = Math.min(...history);
     const max = Math.max(...history);
     const range = max - min === 0 ? 10 : max - min;

     const points = history.map((val, d) => {
       const x = (d / 7) * 60 + 5; // width = 70, padding 5
       const y = 20 - ((val - min) / range) * 14 + 2; // height = 24, padding 2
       return `${x},${y}`;
     }).join(' ');

     return (
       <svg width={70} height={24} className="overflow-visible">
         <polyline
           fill="none"
           stroke={color}
           strokeWidth={2.5}
           strokeLinecap="round"
           strokeLinejoin="round"
           points={points}
         />
         <circle
           cx={(7 / 7) * 60 + 5}
           cy={20 - ((history[7] - min) / range) * 14 + 2}
           r={3.5}
           fill={color}
           stroke="#ffffff"
           strokeWidth={1.5}
         />
       </svg>
     );
  };

  // Sort teams & players by score descending
  const sortedTeams = [...data.teams].sort((a, b) => getTeamTotalScore(b) - getTeamTotalScore(a));
  const sortedPlayers = [...data.players].sort((a, b) => b.score - a.score);

  // Top performers podium targets
  const firstPlace = sortedPlayers[0] || null;
  const secondPlace = sortedPlayers[1] || null;
  const thirdPlace = sortedPlayers[2] || null;
  const remainingPlayers = sortedPlayers.slice(3);

  // MVP/Leaders calculation
  const leadTeam = sortedTeams[0] || null;
  const leadPlayer = sortedPlayers[0] || null;

  return (
    <div className="min-h-screen pb-24 px-4 sm:px-6 max-w-4xl mx-auto">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl border-3 border-brand-deep flex items-center gap-2 shadow-[4px_4px_0_#0f172a] ${
              notification.type === 'success' 
                ? 'bg-brand-cyan text-brand-deep' 
                : 'bg-brand-orange text-white'
            }`}
          >
            {notification.type === 'success' ? <Check className="w-5 h-5 stroke-[3]" /> : <AlertTriangle className="w-5 h-5 stroke-[3]" />}
            <span className="text-sm font-extrabold">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="py-8 flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-brand-yellow border-3 border-brand-deep text-brand-deep text-sm font-black uppercase tracking-wider shadow-[3px_3px_0_#0f172a]">
          <Sparkles className="w-4 h-4 text-brand-orange" />
          Who's Winning?! 🤔
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-brand-deep drop-shadow-md">
          DK League
        </h1>

        {/* Current Day Ribbon & Admin Status */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white border-3 border-brand-deep text-brand-deep text-sm font-black shadow-[3px_3px_0_#0f172a]">
            <Calendar className="w-4 h-4 text-brand-orange" />
            <span>Day {data.currentDay} / 7 📅</span>
          </div>

          <button
            onClick={() => isAdmin ? setIsAdmin(false) : setShowPinModal(true)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-black border-3 border-brand-deep transition-all playful-btn ${
              isAdmin 
                ? 'bg-brand-yellow text-brand-deep shadow-[3px_3px_0_#0f172a]' 
                : 'bg-white text-brand-steel shadow-[3px_3px_0_#0f172a]'
            }`}
          >
            {isAdmin ? (
              <>
                <Unlock className="w-4 h-4 text-brand-deep" />
                <span>Admin Active! 🔓</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Unlock Edit 🔐</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Hero Cards: Overview Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        {/* Leading Team */}
        <div className="playful-card bg-yellow-card p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <span className="text-brand-deep/80 text-xs font-black uppercase tracking-wider">Top Team 🏆</span>
            <Trophy className="w-6 h-6 text-brand-orange" />
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-black text-brand-deep truncate">{leadTeam ? leadTeam.name : 'N/A'}</h3>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-brand-deep">{leadTeam ? getTeamTotalScore(leadTeam) : 0}</span>
              <span className="text-xs text-brand-deep font-extrabold">pts</span>
            </div>
          </div>
        </div>

        {/* Leading Individual (MVP) */}
        <div className="playful-card bg-cyan-card p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <span className="text-brand-deep/80 text-xs font-black uppercase tracking-wider">MVP Leader 👑</span>
            <Crown className="w-6 h-6 text-brand-yellow" />
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-black text-brand-deep truncate">{leadPlayer ? leadPlayer.name : 'N/A'}</h3>
            <p className="text-xs text-brand-deep/70 font-black truncate">
              {leadPlayer ? data.teams.find(t => t.id === leadPlayer.teamId)?.name : 'No Team'}
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-brand-deep">{leadPlayer ? leadPlayer.score : 0}</span>
              <span className="text-xs text-brand-deep font-extrabold">pts</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tabs */}
      <div className="flex justify-center mb-6">
        <div className="flex p-1 rounded-2xl border-3 border-brand-deep bg-white max-w-lg w-full shadow-[3px_3px_0_#0f172a]">
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer border-2 ${
              activeTab === 'teams'
                ? 'bg-brand-deep text-white border-brand-deep'
                : 'bg-transparent text-brand-steel border-transparent hover:text-brand-deep'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Teams</span>
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer border-2 ${
              activeTab === 'players'
                ? 'bg-brand-deep text-white border-brand-deep'
                : 'bg-transparent text-brand-steel border-transparent hover:text-brand-deep'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Individuals</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer border-2 ${
              activeTab === 'logs'
                ? 'bg-brand-deep text-white border-brand-deep'
                : 'bg-transparent text-brand-steel border-transparent hover:text-brand-deep'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Log</span>
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer border-2 ${
              activeTab === 'rules'
                ? 'bg-brand-deep text-white border-brand-deep'
                : 'bg-transparent text-brand-steel border-transparent hover:text-brand-deep'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Rules</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <main className="mb-12">
        <AnimatePresence mode="wait">
          {/* 1. Team Leaderboard */}
          {activeTab === 'teams' && (
            <motion.div
              key="teams-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >


              {/* Standings Table */}
              <div className="overflow-hidden border-3 border-brand-deep rounded-2xl bg-white shadow-[4px_4px_0_#0f172a]">
                <div className="overflow-x-auto w-full">
                  <table className="table w-full text-left border-collapse m-0">
                    <thead>
                      <tr className="bg-brand-deep text-white border-b-3 border-brand-deep text-xs font-black uppercase tracking-wider">
                        <th className="py-3 px-3 text-center w-12">Pos</th>
                        <th className="py-3 px-4">Team</th>
                        <th className="py-3 px-3 text-center w-16 text-brand-cyan">G (+)</th>
                        <th className="py-3 px-3 text-center w-16 text-brand-orange">L (-)</th>
                        <th className="py-3 px-3 text-center w-20">PTS</th>
                        <th className="py-3 px-4 text-center w-24 hidden sm:table-cell">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-brand-deep/10 font-bold text-brand-deep text-sm sm:text-base">
                      {sortedTeams.map((team, idx) => {
                        const isExpanded = !!expandedTeams[team.id];
                        const { gained, lost, net } = getTeamGainLoss(team);
                        const teamIdx = data.teams.findIndex(x => x.id === team.id);
                        const teamColor = TEAM_COLORS[teamIdx % TEAM_COLORS.length];

                        const rankBg = 
                          idx === 0 ? 'bg-brand-yellow text-[#0f172a]' :
                          idx === 1 ? 'bg-[#e2e8f0] text-[#3c6997]' :
                          idx === 2 ? 'bg-[#ffd3b6] text-[#fe9000]' :
                          'bg-slate-100 text-slate-500';

                        return (
                          <React.Fragment key={team.id}>
                            <tr 
                              onClick={() => setExpandedTeams(prev => ({ ...prev, [team.id]: !prev[team.id] }))}
                              className="hover:bg-slate-50/70 transition-all cursor-pointer select-none"
                            >
                              <td className="py-3.5 px-3 text-center">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black border-2 border-brand-deep text-xs ${rankBg}`}>
                                  {idx + 1}
                                </div>
                              </td>

                              <td className="py-3.5 px-4 min-w-40 max-w-xs">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-extrabold text-brand-deep text-base truncate">{team.name}</span>
                                    <span className="text-[10px] text-brand-steel bg-slate-100 px-1.5 py-0.5 rounded border border-brand-steel/20 uppercase tracking-tight">
                                      {team.members.length}
                                    </span>
                                    {team.warnings && team.warnings > 0 ? (
                                      <span 
                                        className="text-[10px] text-brand-orange bg-brand-orange/10 px-1.5 py-0.5 rounded border border-brand-orange/20 font-black uppercase tracking-tight flex items-center gap-0.5 cursor-help"
                                        title="General warning used. Subsequent infractions will incur point deductions."
                                      >
                                        ⚠️ Warned
                                      </span>
                                    ) : (
                                      <span 
                                        className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300/30 font-black uppercase tracking-tight flex items-center gap-0.5 cursor-help"
                                        title="General warning available. First infraction will not deduct points."
                                      >
                                        ✅ Safe
                                      </span>
                                    )}
                                    {isAdmin && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation(); // Prevent row expansion
                                          handleWarnTeam(team.id);
                                        }}
                                        title={`Issue warning to ${team.name}`}
                                        className="px-2 py-0.5 rounded bg-brand-orange/10 hover:bg-brand-orange/20 text-brand-orange border border-brand-orange/30 text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5 cursor-pointer transition-all active:scale-95"
                                      >
                                        <AlertTriangle className="w-2.5 h-2.5" />
                                        <span>Warn</span>
                                      </button>
                                    )}
                                    <ChevronDown className={`w-3.5 h-3.5 text-brand-steel transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-3 text-center text-brand-steel font-black">
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-300/50 rounded-lg text-xs font-black">
                                  +{gained}
                                </span>
                              </td>

                              <td className="py-3.5 px-3 text-center font-black">
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                                  lost < 0 
                                    ? 'bg-rose-50 text-rose-500 border border-rose-300/50' 
                                    : 'bg-slate-50 text-slate-400 border border-slate-300/50'
                                }`}>
                                  {lost}
                                </span>
                              </td>

                              <td className="py-3.5 px-3 text-center">
                                <span className={`font-black text-base sm:text-lg ${net >= 0 ? 'text-brand-deep' : 'text-brand-orange'}`}>
                                  {net >= 0 ? `+${net}` : net}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-center hidden sm:table-cell">
                                <div className="flex items-center justify-center">
                                  {renderSparkline(team, teamColor)}
                                </div>
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-slate-50/30">
                                <td 
                                  colSpan={6} 
                                  className="p-4 border-t border-b border-brand-deep/10"
                                  style={{ borderLeft: `6px solid ${teamColor}` }}
                                >
                                  <div className="flex flex-col gap-4">
                                    <div>
                                      <span className="text-[10px] text-brand-steel uppercase tracking-wider font-black block mb-2">
                                        👤 Team Members:
                                      </span>
                                      <div className="flex flex-wrap gap-2">
                                        {team.members.map(mId => {
                                          const member = data.players.find(p => p.id === mId);
                                          if (!member) return null;
                                          return (
                                            <div 
                                              key={mId} 
                                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white border-2 border-brand-deep text-xs font-black shadow-[2px_2px_0_#0f172a]"
                                            >
                                              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: teamColor }} />
                                              <span className="text-brand-deep flex items-center gap-1">
                                                {member.name}
                                                {member.isCommittee && <span className="text-[10px]" title="Game Committee Member">👑</span>}
                                              </span>
                                              <span className={`px-1.5 py-0.5 rounded-lg text-[10px] ${member.score >= 0 ? 'bg-brand-cyan/20 text-brand-deep' : 'bg-brand-orange/10 text-brand-orange'}`}>
                                                {member.score >= 0 ? `+${member.score}` : member.score} pts
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    <div>
                                      <span className="text-[10px] text-brand-steel uppercase tracking-wider font-black block mb-2">
                                        📅 Day-by-Day Score Journey:
                                      </span>
                                      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                                        {[1, 2, 3, 4, 5, 6, 7].map(day => {
                                          const dayPoints = data.logs
                                            .filter(log => log.day === day && (
                                              (log.targetType === 'team' && log.targetId === team.id) ||
                                              (log.targetType === 'player' && team.members.includes(log.targetId))
                                            ))
                                            .reduce((sum, log) => sum + log.points, 0);

                                          const hasValue = dayPoints !== 0;
                                          const isPositive = dayPoints > 0;

                                          return (
                                            <div 
                                              key={day} 
                                              className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all shadow-[2px_2px_0_#0f172a] ${
                                                day === data.currentDay 
                                                  ? 'bg-brand-yellow/10 border-brand-yellow' 
                                                  : 'bg-white border-brand-deep/10'
                                              }`}
                                              title={`Day ${day}: ${dayPoints > 0 ? `+${dayPoints}` : dayPoints} points`}
                                            >
                                              <span className="text-[9px] font-black text-brand-steel">Day {day}</span>
                                              <span className={`text-xs font-black mt-0.5 ${
                                                !hasValue ? 'text-slate-300' :
                                                isPositive ? 'text-emerald-600' : 'text-rose-500'
                                              }`}>
                                                {dayPoints > 0 ? `+${dayPoints}` : dayPoints === 0 ? '0' : dayPoints}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. Individual Leaderboard */}
          {activeTab === 'players' && (
            <motion.div
              key="players-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Bubbly Game Podium Blocks */}
              <div className="flex items-end justify-center gap-2 sm:gap-4 mb-8 pt-8 px-1 max-w-lg mx-auto">
                {/* 2nd place Podium (Left - Steel Blue) */}
                {(() => {
                  if (!secondPlace) return null;
                  const team = data.teams.find(t => t.id === secondPlace.teamId);
                  const teamName = team?.name || 'No Team';
                  const teamIdx = data.teams.findIndex(t => t.id === secondPlace.teamId);
                  const teamColor = teamIdx !== -1 ? TEAM_COLORS[teamIdx % TEAM_COLORS.length] : '#ccc';
                  return (
                    <div className="flex-1 flex flex-col items-center">
                      <div className="relative mb-2">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white border-3 border-brand-deep flex items-center justify-center shadow-[3px_3px_0_#0f172a]">
                          <User className="w-6 h-6 text-brand-steel" />
                        </div>
                      </div>
                      <span className="font-black text-brand-deep text-xs sm:text-sm text-center truncate max-w-full flex items-center justify-center gap-1">
                        {secondPlace.name}
                        {secondPlace.isCommittee && <span className="text-[10px]" title="Game Committee Member">👑</span>}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5 max-w-full">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: teamColor }} />
                        <span className="text-[10px] text-brand-steel font-extrabold uppercase tracking-wider truncate">
                          {teamName}
                        </span>
                      </div>
                      
                      {/* Podium Column Stand */}
                      <div className="w-full h-16 sm:h-20 mt-2 bg-brand-steel/15 border-3 border-brand-deep border-b-8 rounded-t-2xl flex flex-col justify-center items-center shadow-[3px_3px_0_#0f172a]">
                        <span className="text-2xl font-black text-brand-steel">2</span>
                        <span className="text-xs font-bold text-brand-deep">{secondPlace.score} pts</span>
                      </div>
                    </div>
                  );
                })()}

                {/* 1st place Podium (Center - Gold) */}
                {(() => {
                  if (!firstPlace) return null;
                  const team = data.teams.find(t => t.id === firstPlace.teamId);
                  const teamName = team?.name || 'No Team';
                  const teamIdx = data.teams.findIndex(t => t.id === firstPlace.teamId);
                  const teamColor = teamIdx !== -1 ? TEAM_COLORS[teamIdx % TEAM_COLORS.length] : '#ccc';
                  return (
                    <div className="flex-1 flex flex-col items-center z-10">
                      <Crown className="w-7 h-7 text-brand-yellow mb-1" />
                      <div className="relative mb-2">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border-3 border-brand-deep flex items-center justify-center shadow-[4px_4px_0_#0f172a]">
                          <User className="w-8 h-8 text-brand-yellow" />
                        </div>
                      </div>
                      <span className="font-black text-brand-deep text-sm sm:text-base text-center truncate max-w-full flex items-center justify-center gap-1">
                        {firstPlace.name}
                        {firstPlace.isCommittee && <span className="text-[10px]" title="Game Committee Member">👑</span>}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5 max-w-full">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: teamColor }} />
                        <span className="text-xs text-brand-deep font-extrabold uppercase tracking-wider truncate">
                          {teamName}
                        </span>
                      </div>
                      
                      {/* Podium Column Stand */}
                      <div className="w-full h-24 sm:h-28 mt-2 bg-brand-yellow/20 border-3 border-brand-deep border-b-8 rounded-t-2xl flex flex-col justify-center items-center shadow-[4px_4px_0_#0f172a] gold-glow">
                        <span className="text-3xl font-black text-brand-yellow">1</span>
                        <span className="text-sm font-black text-brand-deep">{firstPlace.score} pts</span>
                      </div>
                    </div>
                  );
                })()}

                {/* 3rd place Podium (Right - Orange) */}
                {(() => {
                  if (!thirdPlace) return null;
                  const team = data.teams.find(t => t.id === thirdPlace.teamId);
                  const teamName = team?.name || 'No Team';
                  const teamIdx = data.teams.findIndex(t => t.id === thirdPlace.teamId);
                  const teamColor = teamIdx !== -1 ? TEAM_COLORS[teamIdx % TEAM_COLORS.length] : '#ccc';
                  return (
                    <div className="flex-1 flex flex-col items-center">
                      <div className="relative mb-2">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white border-3 border-brand-deep flex items-center justify-center shadow-[3px_3px_0_#0f172a]">
                          <User className="w-6 h-6 text-brand-orange" />
                        </div>
                      </div>
                      <span className="font-black text-brand-deep text-xs sm:text-sm text-center truncate max-w-full flex items-center justify-center gap-1">
                        {thirdPlace.name}
                        {thirdPlace.isCommittee && <span className="text-[10px]" title="Game Committee Member">👑</span>}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5 max-w-full">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: teamColor }} />
                        <span className="text-[10px] text-brand-steel font-extrabold uppercase tracking-wider truncate">
                          {teamName}
                        </span>
                      </div>
                      
                      {/* Podium Column Stand */}
                      <div className="w-full h-12 sm:h-14 mt-2 bg-brand-orange/10 border-3 border-brand-deep border-b-8 rounded-t-2xl flex flex-col justify-center items-center shadow-[3px_3px_0_#0f172a]">
                        <span className="text-xl font-black text-brand-orange">3</span>
                        <span className="text-xs font-bold text-brand-deep">{thirdPlace.score} pts</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Rest of the list */}
              <div className="space-y-3 mt-4">
                {remainingPlayers.map((player, idx) => {
                  const actualIdx = idx + 3;
                  const team = data.teams.find(t => t.id === player.teamId);
                  const teamName = team?.name || 'No Team';
                  const teamIdx = data.teams.findIndex(t => t.id === player.teamId);
                  const teamColor = teamIdx !== -1 ? TEAM_COLORS[teamIdx % TEAM_COLORS.length] : '#ccc';
                  return (
                    <div 
                      key={player.id}
                      className="playful-card p-3.5 flex items-center justify-between gap-4 border-brand-steel/30 hover:border-brand-steel/60"
                      style={{ borderLeft: `6px solid ${teamColor}` }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-brand-steel w-5 text-center">{actualIdx + 1}</span>
                        <div>
                          <h4 className="font-black text-brand-deep text-sm sm:text-base flex items-center gap-1.5">
                            {player.name}
                            {player.isCommittee && (
                              <span className="px-1.5 py-0.5 rounded-lg bg-brand-yellow/30 text-brand-deep border border-brand-yellow/50 text-[9px] font-black uppercase tracking-tight flex items-center gap-0.5">
                                👑 Committee
                              </span>
                            )}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: teamColor }} />
                            <span className="text-xs text-brand-steel font-extrabold uppercase tracking-wider">{teamName}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-xl font-black ${
                          player.score > 0 ? 'text-brand-deep' :
                          player.score < 0 ? 'text-brand-orange' :
                          'text-slate-400'
                        }`}>
                          {player.score > 0 ? `+${player.score}` : player.score}
                        </span>
                        <span className="text-[10px] text-brand-steel font-extrabold uppercase">pts</span>
                      </div>
                    </div>
                  );
                })}

                {sortedPlayers.length === 0 && (
                  <p className="text-center text-brand-steel font-bold py-4">No players on the board yet.</p>
                )}
              </div>
            </motion.div>
          )}

          {/* 3. Activity Log */}
          {activeTab === 'logs' && (
            <motion.div
              key="logs-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {/* Playful Team Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white border-3 border-brand-deep rounded-2xl shadow-[3px_3px_0_#0f172a]">
                <span className="text-sm font-black text-brand-deep flex items-center gap-1.5">
                  🔍 Filter Log by Team:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedLogTeamId('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-black border-2 border-brand-deep transition-all cursor-pointer ${
                      selectedLogTeamId === 'all'
                        ? 'bg-brand-deep text-white shadow-[2px_2px_0_#0f172a]'
                        : 'bg-slate-100 text-brand-steel hover:text-brand-deep'
                    }`}
                  >
                    All Teams 🌎
                  </button>
                  {data.teams.map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setSelectedLogTeamId(t.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-black border-2 border-brand-deep transition-all cursor-pointer ${
                        selectedLogTeamId === t.id
                          ? 'bg-brand-deep text-white shadow-[2px_2px_0_#0f172a]'
                          : 'bg-slate-100 text-brand-steel hover:text-brand-deep'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const filteredLogs = data.logs.filter(log => {
                  if (selectedLogTeamId === 'all') return true;
                  if (log.targetType === 'team') {
                    return log.targetId === selectedLogTeamId;
                  } else {
                    const player = data.players.find(p => p.id === log.targetId);
                    return player?.teamId === selectedLogTeamId;
                  }
                });

                if (filteredLogs.length === 0) {
                  return (
                    <div className="text-center py-12 text-brand-steel font-bold border-3 border-dashed border-brand-steel/30 rounded-3xl bg-white/40">
                      No activities logged for this team yet! 🔍
                    </div>
                  );
                }

                return filteredLogs.map((log) => {
                  const isNegative = log.points < 0;
                  
                  // Resolve team details for activity card borders and headers
                  let logTeamColor = '#ccc';
                  let logTeamName = 'No Team';
                  if (log.targetType === 'team') {
                    logTeamName = log.targetName;
                    const idx = data.teams.findIndex(t => t.id === log.targetId);
                    logTeamColor = idx !== -1 ? TEAM_COLORS[idx % TEAM_COLORS.length] : '#ccc';
                  } else {
                    const player = data.players.find(p => p.id === log.targetId);
                    if (player) {
                      const team = data.teams.find(t => t.id === player.teamId);
                      logTeamName = team?.name || 'No Team';
                      const idx = data.teams.findIndex(t => t.id === player.teamId);
                      logTeamColor = idx !== -1 ? TEAM_COLORS[idx % TEAM_COLORS.length] : '#ccc';
                    }
                  }

                  return (
                    <div 
                      key={log.id} 
                      className={`playful-card p-4 flex items-start justify-between gap-4 ${
                        isNegative ? 'border-brand-orange/30 shadow-[3px_3px_0_#0f172a]' : 'border-brand-steel/20 shadow-[3px_3px_0_#0f172a]'
                      }`}
                      style={{ borderLeft: `6px solid ${logTeamColor}` }}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Day circular badge */}
                        <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-brand-steel/5 border-3 border-brand-deep flex flex-col items-center justify-center text-[10px] text-brand-steel font-black shadow-[2px_2px_0_#0f172a]">
                          <span>Day</span>
                          <span className="text-base font-black text-brand-deep mt-[-4px]">{log.day}</span>
                        </div>
                        
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-brand-deep text-base">{log.targetName}</span>
                            <span className="text-xs text-brand-steel font-bold">
                              ({log.targetType === 'player' ? 'Player' : 'Team'})
                            </span>
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: logTeamColor }} />
                              <span className="text-[10px] text-brand-steel font-extrabold uppercase tracking-wider">{logTeamName}</span>
                            </div>
                          </div>
                          <p className="text-sm text-slate-700 mt-1 font-bold leading-tight">
                            {log.description}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block font-semibold">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-3 py-1 rounded-xl text-sm font-black border-3 border-brand-deep ${
                          isNegative 
                            ? 'bg-brand-orange/10 text-brand-orange' 
                            : 'bg-brand-cyan/20 text-brand-deep'
                        }`}>
                          {isNegative ? log.points : `+${log.points}`}
                        </span>

                        {/* Undo / Delete action (only visible for admins) */}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleRevertLog(log.id)}
                            title="Delete transaction and revert score"
                            className="p-2 rounded-xl bg-white border-3 border-brand-deep text-brand-steel hover:text-brand-orange hover:border-brand-orange transition-all cursor-pointer shadow-[2px_2px_0_#0f172a] active:translate-y-[2px] active:shadow-none"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </motion.div>
          )}

          {/* 4. Game Rules */}
          {activeTab === 'rules' && (
            <motion.div
              key="rules-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="text-center py-4 bg-brand-deep text-white border-3 border-brand-deep rounded-2xl shadow-[4px_4px_0_#0f172a] mb-6">
                <h2 className="text-xl font-black uppercase tracking-wider">🎮 Official Staycation Rules</h2>
                <p className="text-xs text-brand-cyan font-bold mt-1">Have fun, keep it fair, and keep the noise under control!</p>
              </div>

              <div className="space-y-3">
                {RULES_DATA.map((rule, idx) => {
                  const isRuleExpanded = expandedRule === idx;
                  return (
                    <div 
                      key={idx}
                      className="playful-card border-brand-deep bg-white overflow-hidden transition-all duration-200"
                    >
                      <button
                        onClick={() => setExpandedRule(isRuleExpanded ? null : idx)}
                        className="w-full flex items-center justify-between p-4 font-bold text-left cursor-pointer hover:bg-slate-50 transition-colors focus:outline-none"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-brand-yellow/20 border-2 border-brand-deep flex items-center justify-center font-black text-brand-deep text-sm">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-base font-black text-brand-deep flex items-center gap-2">
                              {rule.title}
                            </span>
                            <span className="text-xs text-brand-steel font-bold block mt-0.5">{rule.subtitle}</span>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-brand-deep transition-transform duration-200 ${isRuleExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence initial={false}>
                        {isRuleExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="p-4 border-t-2 border-brand-deep/10 bg-slate-50/50 text-sm font-semibold text-slate-700 leading-relaxed space-y-2">
                              {rule.content}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Admin Panel Dashboard (revealed only if logged in) */}
      {isAdmin && (
        <section className="playful-panel p-5 sm:p-6 mb-8 glow-cyan">
          <div className="flex items-center justify-between pb-4 border-b-3 border-brand-deep mb-5">
            <div className="flex items-center gap-2">
              <Unlock className="w-6 h-6 text-brand-deep" />
              <h3 className="text-xl font-black text-brand-deep">Host Controls 🎮</h3>
            </div>
            <button 
              onClick={() => setIsAdmin(false)}
              className="px-3.5 py-1.5 text-xs font-black playful-btn"
            >
              Lock Board 🔒
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Record Score Form */}
            <form onSubmit={handleScoreSubmit} className="space-y-4">
              <h4 className="text-base font-black text-brand-deep uppercase tracking-wide flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-brand-deep stroke-[3]" />
                Log Score Change
              </h4>

              {/* Target Type Selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleTargetTypeChange('player')}
                  className={`py-2 rounded-xl text-sm font-black border-3 border-brand-deep transition-all cursor-pointer ${
                    scoreTargetType === 'player'
                      ? 'bg-brand-deep text-white'
                      : 'bg-slate-100 text-slate-500 shadow-[2px_2px_0_#0f172a]'
                  }`}
                >
                  Player 👤
                </button>
                <button
                  type="button"
                  onClick={() => handleTargetTypeChange('team')}
                  className={`py-2 rounded-xl text-sm font-black border-3 border-brand-deep transition-all cursor-pointer ${
                    scoreTargetType === 'team'
                      ? 'bg-brand-deep text-white'
                      : 'bg-slate-100 text-slate-500 shadow-[2px_2px_0_#0f172a]'
                  }`}
                >
                  Team 👥
                </button>
              </div>

              {/* Target Dropdown */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-brand-deep text-xs font-black">Who gets the score?</span>
                </label>
                <select 
                  className="select select-bordered bg-white text-slate-800 border-3 border-brand-deep rounded-xl select-sm h-11 w-full font-bold focus:outline-none"
                  value={scoreTargetId}
                  onChange={(e) => setScoreTargetId(e.target.value)}
                >
                  {scoreTargetType === 'player' 
                    ? data.players.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({data.teams.find(t => t.id === p.teamId)?.name})
                        </option>
                      ))
                    : data.teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))
                  }
                </select>
              </div>

              {/* Action Type: Points vs Punishment */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleActionTypeChange('points')}
                  className={`py-2 rounded-xl text-xs font-black border-3 border-brand-deep transition-all cursor-pointer ${
                    scoreActionType === 'points'
                      ? 'bg-brand-cyan/30 text-brand-deep shadow-[2px_2px_0_#0f172a]'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  Award Points 🌟
                </button>
                <button
                  type="button"
                  onClick={() => handleActionTypeChange('punishment')}
                  className={`py-2 rounded-xl text-xs font-black border-3 border-brand-deep transition-all cursor-pointer ${
                    scoreActionType === 'punishment'
                      ? 'bg-brand-orange/20 text-brand-orange shadow-[2px_2px_0_#0f172a]'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  Apply Punishment 🛑
                </button>
              </div>

              {/* Predefined Achievements (Points) OR Punishments Selector */}
              {scoreActionType === 'points' ? (
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-brand-deep text-xs font-black">Predefined Achievement</span>
                  </label>
                  <select
                    className="select select-bordered bg-white text-slate-800 border-3 border-brand-deep rounded-xl select-sm h-11 w-full font-bold focus:outline-none"
                    value={selectedAchievementId}
                    onChange={(e) => setSelectedAchievementId(e.target.value)}
                  >
                    {PREDEFINED_ACHIEVEMENTS.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.label} {a.points !== 0 ? `(+${a.points} pts)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-brand-deep text-xs font-black">Predefined Punishment</span>
                  </label>
                  <select
                    className="select select-bordered bg-white text-slate-800 border-3 border-brand-deep rounded-xl select-sm h-11 w-full font-bold focus:outline-none"
                    value={selectedPunishmentId}
                    onChange={(e) => setSelectedPunishmentId(e.target.value)}
                  >
                    {data.predefinedPunishments.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.label} {p.points !== 0 ? `(${p.points} pts)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Day selection & Points Input */}
              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-brand-deep text-xs font-black">Game Day</span>
                  </label>
                  <select 
                    className="select select-bordered bg-white text-slate-800 border-3 border-brand-deep rounded-xl select-sm h-11 w-full font-bold focus:outline-none"
                    value={scoreDay}
                    onChange={(e) => setScoreDay(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(d => (
                      <option key={d} value={d}>Day {d}</option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-brand-deep text-xs font-black">
                      Points value
                    </span>
                  </label>
                  <input
                    type="number"
                    placeholder="Points"
                    className="input input-bordered bg-white text-slate-800 border-3 border-brand-deep rounded-xl input-sm h-11 w-full font-bold focus:outline-none"
                    value={customPoints}
                    onChange={(e) => setCustomPoints(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-brand-deep text-xs font-black">Log Entry Message</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cooked breakfast, Complained about dinner..."
                  className="input input-bordered bg-white text-slate-800 border-3 border-brand-deep rounded-xl input-sm h-11 w-full font-bold focus:outline-none"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit"
                className={`w-full py-3 text-base font-black uppercase text-brand-deep border-3 border-brand-deep rounded-2xl cursor-pointer shadow-[3px_3px_0px_#0f172a] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                  scoreActionType === 'punishment'
                    ? 'bg-brand-orange text-white hover:bg-brand-orange/85'
                    : 'bg-brand-cyan hover:bg-brand-cyan/85'
                }`}
              >
                {scoreActionType === 'punishment' ? '💥 Apply Punishment' : '✨ Award Points'}
              </button>
            </form>

            {/* Column 2: Manage Teams, Players, Reset */}
            <div className="space-y-6">
              {/* Change Staycation Day */}
              <div className="space-y-2">
                <h4 className="text-base font-black text-brand-deep uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-brand-deep" />
                  Update Current Day
                </h4>
                <div className="flex items-center gap-2">
                  <select 
                    className="select select-bordered bg-white text-slate-800 border-3 border-brand-deep rounded-xl select-sm h-11 flex-1 font-bold focus:outline-none"
                    value={editingDay}
                    onChange={(e) => setEditingDay(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(d => (
                      <option key={d} value={d}>Set Active Day to {d}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleUpdateDay(editingDay)}
                    className="px-4 py-2 rounded-xl bg-brand-deep hover:bg-brand-deep/90 text-white text-xs font-black border-3 border-brand-deep h-11 cursor-pointer shadow-[2px_2px_0px_#0f172a] active:translate-y-[2px] active:shadow-none"
                  >
                    Set Day
                  </button>
                </div>
              </div>

              {/* Add Player */}
              <form onSubmit={handleAddPlayer} className="space-y-2">
                <h4 className="text-base font-black text-brand-deep uppercase tracking-wide flex items-center gap-1.5">
                  <User className="w-4 h-4 text-brand-deep" />
                  Add Player
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Friend's Name"
                    className="input input-bordered bg-white text-slate-800 border-3 border-brand-deep rounded-xl input-sm h-11 w-full font-bold focus:outline-none"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    required
                  />
                  <select
                    className="select select-bordered bg-white text-slate-800 border-3 border-brand-deep rounded-xl select-sm h-11 w-full font-bold focus:outline-none"
                    value={newPlayerTeamId}
                    onChange={(e) => setNewPlayerTeamId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Team</option>
                    {data.teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 py-1 px-1">
                  <input
                    type="checkbox"
                    id="newPlayerIsCommittee"
                    className="checkbox checkbox-sm border-2 border-brand-deep rounded"
                    checked={newPlayerIsCommittee}
                    onChange={(e) => setNewPlayerIsCommittee(e.target.checked)}
                  />
                  <label htmlFor="newPlayerIsCommittee" className="text-xs font-black text-brand-deep cursor-pointer">
                    Game Committee Member 👑
                  </label>
                </div>
                <button 
                  type="submit"
                  disabled={!newPlayerName || !newPlayerTeamId}
                  className="w-full py-2 bg-brand-steel/10 hover:bg-brand-steel/20 text-brand-deep border-3 border-brand-deep disabled:opacity-50 text-xs font-black rounded-xl cursor-pointer shadow-[2px_2px_0px_#0f172a] active:translate-y-[2px] active:shadow-none"
                >
                  Add Friend to Game 👤
                </button>
              </form>

              {/* Issue Team Warning */}
              <div className="space-y-2">
                <h4 className="text-base font-black text-brand-deep uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-brand-deep" />
                  Issue Team Warning
                </h4>
                <div className="flex items-center gap-2">
                  <select 
                    className="select select-bordered bg-white text-slate-800 border-3 border-brand-deep rounded-xl select-sm h-11 flex-1 font-bold focus:outline-none"
                    value={warningTeamId}
                    onChange={(e) => setWarningTeamId(e.target.value)}
                  >
                    <option value="" disabled>Select Team to Warn</option>
                    {data.teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.warnings ? `${t.warnings} warnings` : '0 warnings'})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleWarnTeam(warningTeamId)}
                    disabled={!warningTeamId}
                    className="px-4 py-2 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white text-xs font-black border-3 border-brand-deep h-11 cursor-pointer shadow-[2px_2px_0px_#0f172a] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
                  >
                    Warn Team
                  </button>
                </div>
              </div>

              {/* Add Team */}
              <form onSubmit={handleAddTeam} className="space-y-2">
                <h4 className="text-base font-black text-brand-deep uppercase tracking-wide flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-brand-deep" />
                  Add Team
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New Team Name"
                    className="input input-bordered bg-white text-slate-800 border-3 border-brand-deep rounded-xl input-sm h-11 flex-1 font-bold focus:outline-none"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    required
                  />
                  <button 
                    type="submit"
                    disabled={!newTeamName}
                    className="px-4 py-2 bg-brand-steel/10 hover:bg-brand-steel/20 text-brand-deep border-3 border-brand-deep disabled:opacity-50 text-xs font-black rounded-xl h-11 cursor-pointer shadow-[2px_2px_0px_#0f172a] active:translate-y-[2px] active:shadow-none"
                  >
                    Create 👥
                  </button>
                </div>
              </form>

              {/* Reset Data */}
              <div className="pt-4 border-t-3 border-brand-deep flex justify-end">
                <button
                  type="button"
                  onClick={handleResetData}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-orange/10 text-brand-orange border-3 border-brand-deep hover:bg-brand-orange/20 text-xs font-black transition-all cursor-pointer shadow-[2px_2px_0px_#0f172a] active:translate-y-[2px] active:shadow-none"
                >
                  <RotateCcw className="w-3.5 h-3.5 stroke-[3]" />
                  Reset Game Board Data
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Enter Admin PIN Modal */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-3 border-brand-deep w-full max-w-sm rounded-3xl p-6 shadow-[6px_6px_0px_#0f172a] relative"
            >
              <button 
                onClick={() => { setShowPinModal(false); setPin(''); setPinError(''); }}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-brand-deep cursor-pointer"
              >
                <X className="w-6 h-6 stroke-[3]" />
              </button>

              <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-yellow/20 border-3 border-brand-deep flex items-center justify-center mb-3 shadow-[2px_2px_0px_#0f172a]">
                  <Lock className="w-6 h-6 text-brand-deep" />
                </div>
                <h3 className="text-lg font-black text-brand-deep">Secret Host PIN 🔐</h3>
                <p className="text-xs text-brand-steel font-bold mt-1">
                  Input the game passcode to unlock points logging!
                </p>
              </div>

              <form onSubmit={handleAdminVerify} className="space-y-4">
                <div className="form-control">
                  <input
                    type="password"
                    placeholder="PIN"
                    value={pin}
                    onChange={(e) => { setPin(e.target.value); setPinError(''); }}
                    className="input input-bordered bg-slate-50 border-3 border-brand-deep text-center text-2xl tracking-widest text-slate-800 h-12 w-full font-black focus:outline-none"
                    required
                    autoFocus
                  />
                  {pinError && (
                    <label className="label text-center flex justify-center mt-1">
                      <span className="label-text-alt text-brand-orange font-black">{pinError}</span>
                    </label>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-brand-yellow hover:bg-brand-yellow/85 text-brand-deep border-3 border-brand-deep font-black rounded-2xl shadow-[3px_3px_0px_#0f172a] transition-all cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  Unlock Game 🔓
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Sync indicator */}
      <div className="fixed bottom-4 right-4 flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border-3 border-brand-deep text-[10px] text-brand-deep font-black shadow-[3px_3px_0_#0f172a]">
        <div className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-cyan border border-brand-deep"></span>
        </div>
        <span>Syncing... 📡</span>
      </div>
    </div>
  );
}
