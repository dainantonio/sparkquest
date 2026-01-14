// SparkQuest Backend Server
// This is the brain that connects everything

// 1. Import our tools
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 2. Create the app
const app = express();
const PORT = process.env.PORT || 5000;

// 3. Enable security features
app.use(cors()); // Allows frontend to talk to backend
app.use(express.json()); // Lets us read JSON data

// 4. Our first API route - a health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'SparkQuest server is running! 🚀',
    timestamp: new Date().toISOString()
  });
});

// 5. A simple adaptive quiz endpoint
app.post('/api/quiz/next-question', (req, res) => {
  const { userId, subject, currentMastery } = req.body;
  
  // Mock AI: Adjust difficulty based on mastery
  let difficulty = 'medium';
  if (currentMastery < 3) difficulty = 'easy';
  if (currentMastery > 7) difficulty = 'hard';
  
  // Mock question database
  const questions = {
    easy: {
      question: "What is 5 + 3?",
      options: ["7", "8", "9", "6"],
      correct: 1, // Index of correct answer (0-based)
      explanation: "5 + 3 equals 8!"
    },
    medium: {
      question: "If a pizza has 8 slices and you eat 3, how many are left?",
      options: ["3", "4", "5", "6"],
      correct: 2,
      explanation: "8 - 3 = 5 slices left!"
    },
    hard: {
      question: "What is ¼ of 20?",
      options: ["4", "5", "6", "7"],
      correct: 1,
      explanation: "¼ means divide by 4. 20 ÷ 4 = 5!"
    }
  };
  
  res.json({
    success: true,
    question: questions[difficulty],
    difficulty: difficulty,
    hint: "Think carefully about the operation needed!"
  });
});

// 6. Start the server
app.listen(PORT, () => {
  console.log(`✨ SparkQuest backend running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});