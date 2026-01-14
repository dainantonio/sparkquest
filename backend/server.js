// SparkQuest Backend - Expanded Content & Subjects
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
// Force Port to be a Number
const START_PORT = parseInt(process.env.PORT || 5001, 10);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// --- EXPANDED MOCK DATA BANK ---
const MOCK_QUESTIONS = {
    math: [
        { text: "What is 5 + 5?", options: ["10", "11", "12", "55"], correct: 0, explanation: "5 plus 5 equals 10!", difficulty: 1 },
        { text: "What is 10 - 4?", options: ["5", "6", "7", "4"], correct: 1, explanation: "10 minus 4 is 6.", difficulty: 1 },
        { text: "Which number is even?", options: ["3", "7", "8", "11"], correct: 2, explanation: "8 is divisible by 2.", difficulty: 1 },
        { text: "What is 3 x 3?", options: ["6", "9", "12", "33"], correct: 1, explanation: "3 times 3 is 9.", difficulty: 1 },
        { text: "What is half of 20?", options: ["5", "10", "15", "2"], correct: 1, explanation: "20 divided by 2 is 10.", difficulty: 1 },
        { text: "Solve for x: 2x = 10", options: ["2", "5", "10", "20"], correct: 1, explanation: "Divide both sides by 2.", difficulty: 2 },
        { text: "What is 100 + 250?", options: ["300", "350", "400", "250"], correct: 1, explanation: "100 plus 250 is 350.", difficulty: 2 }
    ],
    science: [
        { text: "Which planet is known as the Red Planet?", options: ["Earth", "Mars", "Venus", "Jupiter"], correct: 1, explanation: "Mars appears red due to iron oxide.", difficulty: 1 },
        { text: "What do bees make?", options: ["Milk", "Honey", "Jam", "Silk"], correct: 1, explanation: "Bees produce honey from nectar.", difficulty: 1 },
        { text: "H2O is the chemical formula for?", options: ["Air", "Water", "Fire", "Earth"], correct: 1, explanation: "Two Hydrogen, one Oxygen = Water.", difficulty: 1 },
        { text: "Which animal lays eggs?", options: ["Dog", "Cat", "Chicken", "Cow"], correct: 2, explanation: "Chickens lay eggs.", difficulty: 1 },
        { text: "What gas do humans breathe in?", options: ["Oxygen", "Carbon Dioxide", "Helium", "Nitrogen"], correct: 0, explanation: "We need Oxygen to survive.", difficulty: 1 },
        { text: "What is the center of our solar system?", options: ["Earth", "Moon", "Sun", "Mars"], correct: 2, explanation: "The Sun is the star at the center.", difficulty: 1 }
    ],
    history: [
        { text: "Who was the first US President?", options: ["Lincoln", "Washington", "Jefferson", "Adams"], correct: 1, explanation: "George Washington was the first.", difficulty: 1 },
        { text: "In which country are the Pyramids?", options: ["China", "India", "Egypt", "Mexico"], correct: 2, explanation: "The Great Pyramids are in Giza, Egypt.", difficulty: 1 },
        { text: "What ancient civilization built the Colosseum?", options: ["Greeks", "Romans", "Mayans", "Vikings"], correct: 1, explanation: "The Romans built it in Rome.", difficulty: 1 },
        { text: "Who discovered America in 1492?", options: ["Columbus", "Magellan", "Cook", "Drake"], correct: 0, explanation: "Christopher Columbus led the voyage.", difficulty: 1 }
    ]
};

// --- API ENDPOINTS ---

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', mode: 'Expanded Mock Bank' });
});

app.post('/api/quiz/next-question', (req, res) => {
    const { subject = 'math' } = req.body; // Default to math if not provided
    
    // Get questions for the requested subject (or fallback to math)
    const subjectQuestions = MOCK_QUESTIONS[subject] || MOCK_QUESTIONS['math'];
    
    // Pick a random one
    const randomIndex = Math.floor(Math.random() * subjectQuestions.length);
    const randomQ = subjectQuestions[randomIndex];

    res.json({
        success: true,
        question: randomQ
    });
});

app.post('/api/auth/login', (req, res) => {
    res.json({
        success: true,
        user: {
            id: 'mock_user_1',
            username: req.body.email.split('@')[0],
            spark_energy: 100,
            mastery_level: 1
        }
    });
});

app.get('*', (req, res) => {
    if (req.path === '/auth.html') {
        res.sendFile(path.join(__dirname, '../frontend/auth.html'));
    } else {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    }
});

// Start Server with Auto-Port selection
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