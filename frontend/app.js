// SparkQuest Frontend Logic
// This makes everything interactive!

// ===== GAME STATE =====
let gameState = {
    currentQuestion: 1,
    totalQuestions: 5,
    score: 0,
    energy: 150,
    mastery: 4,
    streak: 2,
    selectedAnswer: null,
    isAnswered: false
};

// ===== DOM ELEMENTS =====
const elements = {
    questionText: document.getElementById('questionText'),
    optionsContainer: document.getElementById('optionsContainer'),
    feedbackText: document.getElementById('feedbackText'),
    feedbackArea: document.getElementById('feedbackArea'),
    submitBtn: document.getElementById('submitBtn'),
    nextBtn: document.getElementById('nextBtn'),
    hintBtn: document.getElementById('hintBtn'),
    questionNum: document.getElementById('questionNum'),
    difficultyBadge: document.getElementById('difficultyBadge'),
    energyCount: document.getElementById('energyCount'),
    masteryLevel: document.getElementById('masteryLevel'),
    correctStreak: document.getElementById('correctStreak'),
    streakDots: document.getElementById('streakDots'),
    classProgress: document.getElementById('classProgress'),
    aiMessage: document.getElementById('aiMessage'),
    resetBtn: document.getElementById('resetBtn'),
    mockApiBtn: document.getElementById('mockApiBtn')
};

// ===== INITIALIZE GAME =====
function initGame() {
    console.log('🚀 SparkQuest initializing...');
    updateUI();
    generateStreakDots();
    loadQuestion();
    setupEventListeners();
}

// ===== QUESTION LOGIC =====
function loadQuestion() {
    // For now, use mock questions. Later we'll connect to backend
    const mockQuestions = [
        {
            question: "What is 15 + 27?",
            options: ["42", "32", "52", "37"],
            correct: 0,
            explanation: "15 + 27 = 42",
            difficulty: "medium"
        },
        {
            question: "How many sides does a hexagon have?",
            options: ["5", "6", "7", "8"],
            correct: 1,
            explanation: "Hexa means six!",
            difficulty: "easy"
        },
        {
            question: "What is ¾ of 100?",
            options: ["25", "50", "75", "100"],
            correct: 2,
            explanation: "100 ÷ 4 = 25, 25 × 3 = 75",
            difficulty: "hard"
        }
    ];
    
    const questionIndex = (gameState.currentQuestion - 1) % mockQuestions.length;
    const question = mockQuestions[questionIndex];
    
    // Update UI
    elements.questionText.textContent = question.question;
    elements.questionNum.textContent = gameState.currentQuestion;
    elements.difficultyBadge.textContent = question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1);
    elements.difficultyBadge.style.background = question.difficulty === 'easy' ? '#4CAF50' : 
                                               question.difficulty === 'medium' ? '#FF9800' : '#F44336';
    
    // Clear previous options
    elements.optionsContainer.innerHTML = '';
    
    // Create new option buttons
    question.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.textContent = option;
        optionElement.dataset.index = index;
        
        optionElement.addEventListener('click', () => selectAnswer(index, optionElement));
        
        elements.optionsContainer.appendChild(optionElement);
    });
    
    // Reset state
    gameState.selectedAnswer = null;
    gameState.isAnswered = false;
    elements.submitBtn.disabled = true;
    elements.nextBtn.style.display = 'none';
    elements.feedbackArea.style.display = 'block';
    elements.feedbackText.textContent = 'Choose an answer to continue!';
    elements.feedbackArea.style.borderLeftColor = '#6A67CE';
    
    // Update AI message
    updateAIMessage();
}

function selectAnswer(index, element) {
    if (gameState.isAnswered) return;
    
    // Deselect previous selection
    document.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Select new one
    element.classList.add('selected');
    gameState.selectedAnswer = index;
    elements.submitBtn.disabled = false;
}

function checkAnswer() {
    if (gameState.selectedAnswer === null || gameState.isAnswered) return;
    
    const question = getCurrentQuestion();
    const isCorrect = gameState.selectedAnswer === question.correct;
    
    // Show correct/incorrect styling
    document.querySelectorAll('.option').forEach((opt, index) => {
        if (index === question.correct) {
            opt.classList.add('correct');
        } else if (index === gameState.selectedAnswer && !isCorrect) {
            opt.classList.add('incorrect');
        }
        opt.style.pointerEvents = 'none';
    });
    
    // Update game state
    if (isCorrect) {
        gameState.score += 10;
        gameState.energy += 15;
        gameState.streak += 1;
        
        // Adaptive mastery adjustment
        if (gameState.streak >= 3) {
            gameState.mastery = Math.min(10, gameState.mastery + 1);
            elements.aiMessage.textContent = "Great streak! Increasing difficulty...";
        }
        
        elements.feedbackText.innerHTML = `✅ Correct! ${question.explanation}`;
        elements.feedbackArea.style.borderLeftColor = '#4ECDC4';
        
        // Play success sound (commented out for now)
        // new Audio('assets/success.mp3').play().catch(e => console.log("Audio error:", e));
    } else {
        gameState.streak = 0;
        gameState.mastery = Math.max(1, gameState.mastery - 1);
        
        elements.feedbackText.innerHTML = `❌ Not quite. ${question.explanation}`;
        elements.feedbackArea.style.borderLeftColor = '#FF6B6B';
        elements.aiMessage.textContent = "Let's try something a bit easier...";
        
        // Play error sound
        // new Audio('assets/error.mp3').play().catch(e => console.log("Audio error:", e));
    }
    
    gameState.isAnswered = true;
    elements.submitBtn.style.display = 'none';
    elements.nextBtn.style.display = 'flex';
    
    updateUI();
}

function nextQuestion() {
    gameState.currentQuestion++;
    
    if (gameState.currentQuestion > gameState.totalQuestions) {
        endQuiz();
    } else {
        loadQuestion();
    }
}

function endQuiz() {
    elements.questionText.textContent = "🎉 Quest Complete!";
    elements.optionsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <h2 style="color: var(--primary); margin-bottom: 20px;">You earned ${gameState.energy} Spark Energy!</h2>
            <p style="font-size: 1.2rem; margin-bottom: 30px;">The class is now closer to unlocking the Ancient Temple!</p>
            <button onclick="resetQuiz()" class="btn btn-primary" style="font-size: 1.3rem; padding: 20px 40px;">
                Play Again
            </button>
        </div>
    `;
    elements.feedbackArea.style.display = 'none';
    elements.controls.style.display = 'none';
    
    // Update class progress
    const currentWidth = parseInt(elements.classProgress.style.width);
    elements.classProgress.style.width = `${Math.min(100, currentWidth + 15)}%`;
}

// ===== UI UPDATES =====
function updateUI() {
    elements.energyCount.textContent = `⚡ ${gameState.energy}`;
    elements.masteryLevel.textContent = gameState.mastery;
    elements.correctStreak.textContent = gameState.streak;
    updateStreakDots();
}

function generateStreakDots() {
    elements.streakDots.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const dot = document.createElement('div');
        dot.className = 'streak-dot';
        elements.streakDots.appendChild(dot);
    }
    updateStreakDots();
}

function updateStreakDots() {
    const dots = elements.streakDots.querySelectorAll('.streak-dot');
    dots.forEach((dot, index) => {
        if (index < gameState.streak) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function updateAIMessage() {
    const messages = [
        "Adapting to your learning style...",
        "Great progress! Keep it up!",
        "I notice you're good at math patterns!",
        "Let's try something challenging...",
        "Remember: every mistake is a learning step!"
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    elements.aiMessage.textContent = randomMessage;
}

// ===== HELPER FUNCTIONS =====
function getCurrentQuestion() {
    // Mock function - in real app, this would come from backend
    return {
        correct: gameState.currentQuestion === 1 ? 0 : 
                gameState.currentQuestion === 2 ? 1 : 2
    };
}

function resetQuiz() {
    gameState = {
        currentQuestion: 1,
        totalQuestions: 5,
        score: 0,
        energy: 150,
        mastery: 4,
        streak: 2,
        selectedAnswer: null,
        isAnswered: false
    };
    
    elements.controls.style.display = 'flex';
    elements.feedbackArea.style.display = 'block';
    elements.nextBtn.style.display = 'none';
    elements.submitBtn.style.display = 'flex';
    
    initGame();
}

function showHint() {
    const hints = [
        "Try breaking the problem into smaller parts",
        "Draw a picture to visualize it",
        "Think about what operation makes sense",
        "Eliminate obviously wrong answers first"
    ];
    const randomHint = hints[Math.floor(Math.random() * hints.length)];
    elements.feedbackText.textContent = `💡 Hint: ${randomHint}`;
    elements.feedbackArea.style.borderLeftColor = '#FFD166';
}

async function testBackendConnection() {
    try {
        // Try to connect to our backend
        const response = await fetch('http://localhost:5000/api/health');
        const data = await response.json();
        
        elements.feedbackText.innerHTML = `✅ Backend connected!<br><small>${data.message}</small>`;
        elements.feedbackArea.style.borderLeftColor = '#4CAF50';
        
        // Also test the quiz endpoint
        const quizResponse = await fetch('http://localhost:5000/api/quiz/next-question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'test_user',
                subject: 'math',
                currentMastery: gameState.mastery
            })
        });
        
        const quizData = await quizResponse.json();
        console.log('Backend quiz response:', quizData);
        
    } catch (error) {
        elements.feedbackText.innerHTML = `❌ Backend not running<br><small>Start the server in the terminal: "npm run dev"</small>`;
        elements.feedbackArea.style.borderLeftColor = '#F44336';
        console.log('Backend connection error:', error);
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    elements.submitBtn.addEventListener('click', checkAnswer);
    elements.nextBtn.addEventListener('click', nextQuestion);
    elements.hintBtn.addEventListener('click', showHint);
    elements.resetBtn.addEventListener('click', resetQuiz);
    elements.mockApiBtn.addEventListener('click', testBackendConnection);
    
    // Zone selection
    document.querySelectorAll('.zone').forEach(zone => {
        zone.addEventListener('click', function() {
            document.querySelectorAll('.zone').forEach(z => z.classList.remove('active'));
            this.classList.add('active');
            elements.feedbackText.textContent = `Entering ${this.dataset.zone} zone...`;
        });
    });
}

// ===== START THE GAME =====
// Wait for page to load, then initialize
document.addEventListener('DOMContentLoaded', initGame);

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { gameState, initGame, checkAnswer };
}