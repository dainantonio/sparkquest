// filename: backend/seed.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const QUESTIONS = [
    // --- MATH (Level 1) ---
    { subject: 'math', difficulty: 1, text: '5 + 5 = ?', options: ['10', '11', '12', '55'], correct: 0, explanation: 'Basic addition.' },
    { subject: 'math', difficulty: 1, text: '10 - 3 = ?', options: ['7', '6', '8', '5'], correct: 0, explanation: 'Basic subtraction.' },
    { subject: 'math', difficulty: 1, text: 'What shape has 3 sides?', options: ['Square', 'Circle', 'Triangle', 'Box'], correct: 2, explanation: 'Triangles have 3 sides.' },
    
    // --- MATH (Level 2) ---
    { subject: 'math', difficulty: 2, text: '12 x 12 = ?', options: ['120', '144', '100', '124'], correct: 1, explanation: '12 squared is 144.' },
    { subject: 'math', difficulty: 2, text: '25 / 5 = ?', options: ['4', '5', '6', '10'], correct: 1, explanation: '25 divided by 5 is 5.' },
    { subject: 'math', difficulty: 2, text: 'Perimeter of a 4x4 square?', options: ['8', '12', '16', '20'], correct: 2, explanation: '4+4+4+4 = 16.' },

    // --- MATH (Level 3) ---
    { subject: 'math', difficulty: 3, text: 'Solve 2x = 10', options: ['2', '5', '10', '20'], correct: 1, explanation: 'Divide by 2.' },
    { subject: 'math', difficulty: 3, text: 'Square root of 81?', options: ['7', '8', '9', '10'], correct: 2, explanation: '9x9=81.' },
    { subject: 'math', difficulty: 3, text: 'Next prime after 7?', options: ['9', '10', '11', '13'], correct: 2, explanation: '11 is the next prime.' },

    // --- SCIENCE (Level 1) ---
    { subject: 'science', difficulty: 1, text: 'What do we breathe?', options: ['Oxygen', 'Helium', 'Iron', 'Gold'], correct: 0, explanation: 'Humans need oxygen.' },
    { subject: 'science', difficulty: 1, text: 'The Red Planet?', options: ['Mars', 'Earth', 'Venus', 'Sun'], correct: 0, explanation: 'Mars is red due to iron oxide.' },
    
    // --- SCIENCE (Level 2) ---
    { subject: 'science', difficulty: 2, text: 'H2O is?', options: ['Salt', 'Water', 'Air', 'Fire'], correct: 1, explanation: 'Water molecule.' },
    { subject: 'science', difficulty: 2, text: 'Force that pulls down?', options: ['Gravity', 'Magnetism', 'Speed', 'Light'], correct: 0, explanation: 'Gravity attracts mass.' },

    // --- HISTORY (Level 1) ---
    { subject: 'history', difficulty: 1, text: 'First US President?', options: ['Lincoln', 'Washington', 'Adams', 'Bush'], correct: 1, explanation: 'George Washington.' },
    
    // --- HISTORY (Level 2) ---
    { subject: 'history', difficulty: 2, text: 'Year of US Independence?', options: ['1776', '1999', '1800', '1492'], correct: 0, explanation: 'July 4, 1776.' }
];

async function seed() {
    console.log(`🌱 Seeding ${QUESTIONS.length} questions...`);
    
    // 1. Delete old questions (Optional - keep if you want a fresh start)
    const { error: deleteError } = await supabase.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteError) console.error("Delete Error:", deleteError);

    // 2. Insert new questions
    const { data, error } = await supabase.from('questions').insert(QUESTIONS);
    
    if (error) {
        console.error("❌ Seeding Failed:", error.message);
    } else {
        console.log("✅ Database Populated Successfully!");
    }
}

seed();


### 🚀 How to Run the Auto-Seeder

1.  **Create the File:** Copy the code above into `backend/seed.js`.
2.  **Run it:** In your terminal (inside the `backend` folder), run:
    ```bash
    node seed.js
    ```
3.  **Check Supabase:** Go to your Table Editor. You will see all those questions instantly populated!

This is how you scale content. You can expand that `QUESTIONS` array to include hundreds of items, or even use ChatGPT to generate a JSON list of 50 questions, paste it into that file, and run `node seed.js` to import them all at once.