const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// --- DEBUG LOGGER ---
app.use((req, res, next) => {
    console.log(`📥 [${req.method}] ${req.url}`, req.body);
    next();
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// --- CONSTANTS ---
const ACHIEVEMENTS = [
    { id: 'first_blood', name: 'First Steps', icon: '👶', desc: 'Answer your first question', condition: (u) => u.spark_energy >= 10 },
    { id: 'rich_kid', name: 'Energy Hoarder', icon: '💎', desc: 'Reach 500 Energy', condition: (u) => u.spark_energy >= 500 },
    { id: 'big_brain', name: 'Math Whiz', icon: '🧠', desc: 'High Mastery Level', condition: (u) => u.mastery_level >= 3 }
];

// --- AUTH ---
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, role = 'student' } = req.body;
        const username = email.split('@')[0];
        
        const { data: existing } = await supabase.from('profiles').select('*').eq('username', username).maybeSingle();
        if (existing) return res.json({ success: true, user: existing });

        const newUser = {
            id: crypto.randomUUID(),
            username: username,
            role: role,
            spark_energy: role === 'teacher' ? 0 : 100,
            achievements: []
        };

        const { data: created, error } = await supabase.from('profiles').insert([newUser]).select().single();
        if (error) throw error;
        res.json({ success: true, user: created });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- STUDENT PROFILE & STATS ---
app.get('/api/student/me', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false });

    // 1. Get Profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    
    // 2. Get Logs for Stats
    const { data: logs } = await supabase.from('activity_logs').select('*').eq('user_id', userId);
    
    // Calculate Stats
    const total = logs ? logs.length : 0;
    const correct = logs ? logs.filter(l => l.is_correct).length : 0;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    res.json({ success: true, profile, stats: { total, correct, accuracy } });
});

// --- SCORE & ACHIEVEMENTS ---
app.post('/api/score/update', async (req, res) => {
    const { userId, scoreToAdd } = req.body;
    
    // 1. Get current user
    const { data: user } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!user) return res.status(404).json({ success: false });

    // 2. Calculate new score
    const newScore = (user.spark_energy || 0) + scoreToAdd;
    let newAchievements = user.achievements || [];
    let earnedNew = false;

    // 3. Check Achievements
    const updatedUserObj = { ...user, spark_energy: newScore }; // Sim state for checking
    ACHIEVEMENTS.forEach(ach => {
        if (!newAchievements.includes(ach.id) && ach.condition(updatedUserObj)) {
            newAchievements.push(ach.id);
            earnedNew = ach; // Store the one just earned
        }
    });

    // 4. Save
    await supabase.from('profiles').update({ 
        spark_energy: newScore,
        achievements: newAchievements
    }).eq('id', userId);

    res.json({ success: true, newAchievement: earnedNew });
});

// --- STANDARD ENDPOINTS ---
app.post('/api/quiz/next-question', async (req, res) => {
    const { subject = 'math', difficulty = 1 } = req.body;
    const { data } = await supabase.from('questions').select('*').eq('subject', subject).eq('difficulty', difficulty);
    const pool = (data && data.length > 0) ? data : (await supabase.from('questions').select('*').eq('subject', subject)).data;
    res.json({ success: true, question: pool ? pool[Math.floor(Math.random() * pool.length)] : null });
});

app.post('/api/progress/log', async (req, res) => {
    // Save to activity log for stats
    await supabase.from('activity_logs').insert([req.body]);
    res.json({ success: true });
});

app.get('/api/boss/:subject', async (req, res) => {
    const { data } = await supabase.from('bosses').select('*').eq('subject', req.params.subject);
    const boss = (data && data.length > 0) ? data[0] : { name: "Glitch", hp: 3, icon: "👾", reward: 100 };
    res.json({ success: true, boss });
});

app.get('/api/shop/items', (req, res) => {
    res.json({ success: true, items: [
        { id: "hat_wizard", name: "Wizard Hat", icon: "🧙‍♂️", price: 50, type: "hat" },
        { id: "glasses_cool", name: "Cool Shades", icon: "😎", price: 30, type: "glasses" }
    ]});
});

app.post('/api/shop/buy', async (req, res) => {
    const { userId, itemId } = req.body;
    const { data: user } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (user && user.spark_energy >= 50) {
        const newInv = [...(user.inventory || []), itemId];
        await supabase.from('profiles').update({ inventory: newInv, spark_energy: user.spark_energy - 50 }).eq('id', userId);
        res.json({ success: true, newInventory: newInv, newEnergy: user.spark_energy - 50 });
    } else { res.status(400).json({ success: false }); }
});

app.post('/api/shop/equip', async (req, res) => {
    const { userId, itemId } = req.body;
    const icon = itemId.includes('wizard') ? "🧙‍♂️" : "😎";
    const type = itemId.includes('hat') ? 'hat' : 'glasses';
    const { data: user } = await supabase.from('profiles').select('equipped').eq('id', userId).single();
    const newEquip = { ...(user.equipped), [type]: icon };
    await supabase.from('profiles').update({ equipped: newEquip }).eq('id', userId);
    res.json({ success: true, equipped: newEquip });
});

app.get('/api/leaderboard', async (req, res) => {
    const { data } = await supabase.from('profiles').select('username, spark_energy, equipped').order('spark_energy', { ascending: false }).limit(10);
    res.json({ success: true, leaderboard: data || [] });
});

app.get('/api/missions', (req, res) => res.json({ success: true, missions: [{ id: 'm1', title: 'Math Master', goal: 5, subject: 'math', reward: 50 }] }));

// Catch-All
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));

app.listen(PORT, () => console.log(`🚀 HERO ENGINE READY | PORT ${PORT}`));