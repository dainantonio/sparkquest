const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const START_PORT = parseInt(process.env.PORT || 5001, 10);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// --- 1. AUTH (Fixed & Robust) ---
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: "Email required" });
        
        const username = email.split('@')[0];
        
        // Use maybeSingle() to avoid errors if user doesn't exist
        const { data: existing, error: findError } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', username)
            .maybeSingle();

        if (existing) {
            console.log(`✅ Returning user: ${username}`);
            return res.json({ success: true, user: existing });
        }

        // Create new profile
        const newId = crypto.randomUUID();
        const { data: newUser, error: insertError } = await supabase
            .from('profiles')
            .insert([{ id: newId, username: username, spark_energy: 100 }])
            .select()
            .single();

        if (insertError) throw insertError;

        console.log(`✨ New user created: ${username}`);
        res.json({ success: true, user: newUser });
    } catch (err) {
        console.error("❌ Login Error:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- 2. MISSIONS (New System) ---
const DAILY_MISSIONS = [
    { id: 'math_5', title: 'Math Master', goal: 5, subject: 'math', reward: 50 },
    { id: 'sci_3', title: 'Science Scout', goal: 3, subject: 'science', reward: 30 },
    { id: 'hist_3', title: 'History Hero', goal: 3, subject: 'history', reward: 30 }
];

app.get('/api/missions', (req, res) => {
    res.json({ success: true, missions: DAILY_MISSIONS });
});

// --- 3. CORE GAME LOGIC ---
app.get('/api/leaderboard', async (req, res) => {
    const { data } = await supabase.from('profiles').select('username, spark_energy, equipped').order('spark_energy', { ascending: false }).limit(10);
    res.json({ success: true, leaderboard: data || [] });
});

app.post('/api/quiz/next-question', async (req, res) => {
    const { subject = 'math', difficulty = 1 } = req.body;
    const { data } = await supabase.from('questions').select('*').eq('subject', subject).eq('difficulty', difficulty);
    let pool = data && data.length > 0 ? data : (await supabase.from('questions').select('*').eq('subject', subject)).data;
    res.json({ success: true, question: pool ? pool[Math.floor(Math.random() * pool.length)] : null });
});

app.post('/api/score/update', async (req, res) => {
    const { userId, scoreToAdd } = req.body;
    const { data: user } = await supabase.from('profiles').select('spark_energy').eq('id', userId).maybeSingle();
    const { error } = await supabase.from('profiles').update({ spark_energy: (user?.spark_energy || 0) + scoreToAdd }).eq('id', userId);
    res.json({ success: !error });
});

// --- 4. ADMIN & SHOP ---
app.get('/api/admin/stats', async (req, res) => {
    const { count: q } = await supabase.from('questions').select('*', { count: 'exact', head: true });
    const { count: s } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    res.json({ success: true, totalQuestions: q || 0, totalStudents: s || 0 });
});

app.post('/api/questions/add', async (req, res) => {
    const { error } = await supabase.from('questions').insert([req.body]);
    res.json({ success: !error });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));

const startServer = (port) => {
    app.listen(port, () => console.log(`🚀 SPARKQUEST RUNNING | PORT ${port}`))
       .on('error', (e) => e.code === 'EADDRINUSE' ? startServer(port + 1) : null);
};
startServer(START_PORT);