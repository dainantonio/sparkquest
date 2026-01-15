// filename: backend/server.js
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

// --- EXPANDED SHOP DATA ---
const SHOP_ITEMS = [
    { id: "hat_wizard", name: "Wizard Hat", icon: "🧙‍♂️", price: 50, type: "hat" },
    { id: "hat_cowboy", name: "Cowboy Hat", icon: "🤠", price: 75, type: "hat" },
    { id: "hat_crown", name: "Royal Crown", icon: "👑", price: 200, type: "hat" },
    { id: "glasses_cool", name: "Cool Shades", icon: "😎", price: 30, type: "glasses" },
    { id: "glasses_nerd", name: "Smart Specs", icon: "🤓", price: 40, type: "glasses" },
    { id: "acc_wand", name: "Magic Wand", icon: "🪄", price: 100, type: "accessory" },
    { id: "acc_balloon", name: "Red Balloon", icon: "🎈", price: 20, type: "accessory" }
];

const DAILY_MISSIONS = [
    { id: 'math_5', title: 'Math Master', goal: 5, subject: 'math', reward: 50 },
    { id: 'sci_3', title: 'Science Scout', goal: 3, subject: 'science', reward: 30 },
    { id: 'hist_3', title: 'History Hero', goal: 3, subject: 'history', reward: 30 }
];

// --- AUTH ---
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email } = req.body;
        const username = email.split('@')[0];
        const { data: existing } = await supabase.from('profiles').select('*').eq('username', username).maybeSingle();
        if (existing) return res.json({ success: true, user: existing });
        
        const { data: newUser } = await supabase.from('profiles').insert([
            { id: crypto.randomUUID(), username: username, spark_energy: 100, inventory: [], equipped: {} }
        ]).select().single();
        res.json({ success: true, user: newUser });
    } catch (err) { res.status(500).json({ success: false }); }
});

// --- BOSS API ---
app.get('/api/boss/:subject', async (req, res) => {
    const { data } = await supabase.from('bosses').select('*').eq('subject', req.params.subject);
    const boss = (data && data.length > 0) ? data[Math.floor(Math.random() * data.length)] 
        : { name: "System Glitch", hp: 3, icon: "👾", reward: 100 };
    res.json({ success: true, boss });
});

// --- GAMEPLAY API ---
app.post('/api/quiz/next-question', async (req, res) => {
    const { subject = 'math', difficulty = 1 } = req.body;
    const { data } = await supabase.from('questions').select('*').eq('subject', subject).eq('difficulty', difficulty);
    let pool = data && data.length > 0 ? data : (await supabase.from('questions').select('*').eq('subject', subject)).data;
    res.json({ success: true, question: pool ? pool[Math.floor(Math.random() * pool.length)] : null });
});

app.post('/api/score/update', async (req, res) => {
    const { userId, scoreToAdd } = req.body;
    const { data: user } = await supabase.from('profiles').select('spark_energy').eq('id', userId).maybeSingle();
    await supabase.from('profiles').update({ spark_energy: (user?.spark_energy || 0) + scoreToAdd }).eq('id', userId);
    res.json({ success: true });
});

// --- SHOP API ---
app.get('/api/shop/items', (req, res) => res.json({ success: true, items: SHOP_ITEMS }));

app.post('/api/shop/buy', async (req, res) => {
    const { userId, itemId } = req.body;
    const { data: user } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    
    if (user && item && user.spark_energy >= item.price) {
        const newInv = [...(user.inventory || []), itemId];
        await supabase.from('profiles').update({ inventory: newInv, spark_energy: user.spark_energy - item.price }).eq('id', userId);
        res.json({ success: true, newInventory: newInv, newEnergy: user.spark_energy - item.price });
    } else { res.status(400).json({ success: false }); }
});

app.post('/api/shop/equip', async (req, res) => {
    const { userId, itemId } = req.body;
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    const { data: user } = await supabase.from('profiles').select('equipped').eq('id', userId).single();
    const newEquip = { ...(user.equipped), [item.type]: item.icon };
    await supabase.from('profiles').update({ equipped: newEquip }).eq('id', userId);
    res.json({ success: true, equipped: newEquip });
});

// --- DATA ENDPOINTS ---
app.get('/api/leaderboard', async (req, res) => {
    const { data } = await supabase.from('profiles').select('username, spark_energy, equipped').order('spark_energy', { ascending: false }).limit(10);
    res.json({ success: true, leaderboard: data || [] });
});

app.get('/api/missions', (req, res) => res.json({ success: true, missions: DAILY_MISSIONS }));

app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));

const startServer = (port) => {
    app.listen(port, () => console.log(`🚀 SPARKQUEST V3 READY | PORT ${port}`))
       .on('error', (e) => e.code === 'EADDRINUSE' ? startServer(port + 1) : null);
};
startServer(START_PORT);