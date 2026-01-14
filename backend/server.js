// SparkQuest Backend - With Leaderboard
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
// Force Port to be a Number to avoid "500111" errors
const START_PORT = parseInt(process.env.PORT || 5001, 10);

app.use(cors());
app.use(express.json());
// Connects the backend to the frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// --- DATA BANKS ---

// 1. Question Bank (Mutable)
const QUESTIONS_DB = {
    math: [
        { text: "What is 5 + 5?", options: ["10", "11", "12", "55"], correct: 0, explanation: "5 plus 5 equals 10!", difficulty: 1 },
        { text: "What is 10 - 4?", options: ["5", "6", "7", "4"], correct: 1, explanation: "10 minus 4 is 6.", difficulty: 1 },
        { text: "Which number is even?", options: ["3", "7", "8", "11"], correct: 2, explanation: "8 is divisible by 2.", difficulty: 1 },
        { text: "What is 3 x 3?", options: ["6", "9", "12", "33"], correct: 1, explanation: "3 times 3 is 9.", difficulty: 1 }
    ],
    science: [
        { text: "Which planet is known as the Red Planet?", options: ["Earth", "Mars", "Venus", "Jupiter"], correct: 1, explanation: "Mars appears red due to iron oxide.", difficulty: 1 },
        { text: "H2O is the chemical formula for?", options: ["Air", "Water", "Fire", "Earth"], correct: 1, explanation: "Two Hydrogen, one Oxygen = Water.", difficulty: 1 },
        { text: "What gas do humans breathe in?", options: ["Oxygen", "Carbon Dioxide", "Helium", "Nitrogen"], correct: 0, explanation: "We need Oxygen to survive.", difficulty: 1 }
    ],
    history: [
        { text: "Who was the first US President?", options: ["Lincoln", "Washington", "Jefferson", "Adams"], correct: 1, explanation: "George Washington was the first.", difficulty: 1 },
        { text: "In which country are the Pyramids?", options: ["China", "India", "Egypt", "Mexico"], correct: 2, explanation: "The Great Pyramids are in Giza, Egypt.", difficulty: 1 }
    ]
};

// 2. Leaderboard Bank (Mock Data to start)
let LEADERBOARD = [
    { username: "Destyn_Pro", score: 450, avatar: "🐉" },
    { username: "Speedy_Sam", score: 320, avatar: "🦖" },
    { username: "Math_Wizard", score: 210, avatar: "🦉" },
    { username: "Darryn", score: 100, avatar: "🥚" }
];

// --- API ENDPOINTS ---

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', mode: 'Leaderboard Ready' });
});

// GET QUESTION
app.post('/api/quiz/next-question', (req, res) => {
    const { subject = 'math' } = req.body;
    // Default to math if subject not found
    const subjectQuestions = QUESTIONS_DB[subject] || QUESTIONS_DB['math'];
    
    // Pick random
    const randomQ = subjectQuestions[Math.floor(Math.random() * subjectQuestions.length)];
    
    res.json({ success: true, question: randomQ });
});

// ADD QUESTION (Teacher Dashboard)
app.post('/api/questions/add', (req, res) => {
    try {
        const { subject, text, options, correct, explanation, difficulty } = req.body;
        
        if (!subject || !text || !options) {
            return res.status(400).json({ success: false, message: "Missing fields" });
        }

        if (!QUESTIONS_DB[subject]) QUESTIONS_DB[subject] = [];
        
        QUESTIONS_DB[subject].push({ text, options, correct, explanation, difficulty });
        
        console.log(`✅ New Question Added to ${subject}`);
        res.json({ success: true, message: "Question saved!" });

    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// --- LEADERBOARD ENDPOINTS ---

// Get Top Scores
app.get('/api/leaderboard', (req, res) => {
    // Sort by score (Highest first)
    const sorted = LEADERBOARD.sort((a, b) => b.score - a.score);
    // Return top 10
    res.json({ success: true, leaderboard: sorted.slice(0, 10) });
});

// Update Score
app.post('/api/score/update', (req, res) => {
    const { username, score, avatar } = req.body;
    
    // Check if user exists in leaderboard
    const existingUser = LEADERBOARD.find(u => u.username === username);
    
    if (existingUser) {
        // Only update if score is higher
        if (score > existingUser.score) {
            existingUser.score = score;
            existingUser.avatar = avatar; // Update pet if it evolved
        }
    } else {
        // Add new user
        LEADERBOARD.push({ username, score, avatar });
    }
    
    res.json({ success: true });
});

// AUTH LOGIN
app.post('/api/auth/login', (req, res) => {
    res.json({
        success: true,
        user: {
            id: 'mock_user_1',
            username: req.body.email.split('@')[0], // Use email prefix as username
            spark_energy: 100,
            mastery_level: 1
        }
    });
});

// CATCH-ALL ROUTE (For frontend navigation)
app.get('*', (req, res) => {
    if (req.path.endsWith('.html')) {
        res.sendFile(path.join(__dirname, '../frontend' + req.path));
    } else {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    }
});

// START SERVER (Robust Start)
const startServer = (port) => {
    app.listen(port, () => {
        console.log(`\n🚀 SERVER RUNNING ON PORT ${port}`);
        console.log(`👉 Open Browser: http://localhost:${port}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`⚠️ Port ${port} is busy. Trying ${port + 1}...`);
            startServer(parseInt(port, 10) + 1);
        }
    });
};

startServer(START_PORT);