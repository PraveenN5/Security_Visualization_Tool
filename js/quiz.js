// Store previous questions for each algorithm
const previousQuestions = {};

async function startQuiz(algorithmName) {
    document.querySelector('.quiz-modal').dataset.algorithm = algorithmName;
    
    // Initialize storage for this algorithm if it doesn't exist
    if (!previousQuestions[algorithmName]) {
        previousQuestions[algorithmName] = new Set();
    }
    
    // Add specific topics for each algorithm
    let topics = '';
    switch(algorithmName) {
        case 'AES':
            topics = `
                - Key expansion and round keys
                - SubBytes, ShiftRows, MixColumns operations
                - Block sizes and key lengths
                - Security features and implementation
                - Encryption and decryption process`;
            break;
        case 'DES':
            topics = `
                - Feistel network structure
                - S-boxes and P-boxes
                - Key schedule and round operations
                - Security considerations
                - Block and key sizes`;
            break;
        // Add cases for other algorithms...
    }
    
    const prompt = `Generate 5 multiple choice questions about the ${algorithmName} algorithm. 
                   Each question should test understanding of key concepts.
                   Format exactly as follows:
                   Q1: [Question]
                   A) [Option A]
                   B) [Option B]
                   C) [Option C]
                   D) [Option D]
                   Correct: [A/B/C/D]

                  Cover these topics:
                  ${topics}

                  IMPORTANT: Generate completely different questions from these previous ones:
                  ${Array.from(previousQuestions[algorithmName]).join('\n')}

                  Make sure each question is unique and tests different aspects of the algorithm.`;

    document.getElementById('quizOverlay').style.display = 'block';
    document.getElementById('quizModal').style.display = 'block';
    document.getElementById('quizContent').innerHTML = `
        <div class="loading-text">
            <div class="loading-spinner"></div>
            Loading questions...
        </div>
    `;

    try {
        console.log('Sending quiz request...');
        const response = await sendMessage(prompt);
        console.log('Received response:', response);
        
        if (!response) {
            throw new Error('Empty response received');
        }

        const questions = parseQuestions(response);
        console.log('Parsed questions:', questions);
        
        if (questions.length === 0) {
            throw new Error('No questions could be parsed from response');
        }

        // Check for duplicate questions
        const newQuestions = questions.filter(q => !previousQuestions[algorithmName].has(q.question));
        
        if (newQuestions.length === 0) {
            throw new Error('All generated questions were duplicates. Trying again...');
        }

        // Store new questions in the set
        newQuestions.forEach(q => {
            previousQuestions[algorithmName].add(q.question);
        });

        // Keep only the last 20 questions to prevent the set from growing too large
        if (previousQuestions[algorithmName].size > 20) {
            const questionsArray = Array.from(previousQuestions[algorithmName]);
            previousQuestions[algorithmName] = new Set(questionsArray.slice(-20));
        }

        displayQuiz(newQuestions);
    } catch (error) {
        console.error('Error generating quiz:', error);
        // If error is due to duplicates, try again
        if (error.message.includes('duplicates')) {
            startQuiz(algorithmName);
            return;
        }
        document.getElementById('quizContent').innerHTML = `
            <div class="text-white">
                <p>Error generating quiz. Please try again.</p>
                <p class="text-sm mt-2">${error.message}</p>
                <button onclick="startQuiz('${algorithmName}')" class="mt-4 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600">
                    Retry
                </button>
            </div>
        `;
    }
}

function parseQuestions(response) {
    console.log('Parsing response:', response);
    const questions = [];
    const questionBlocks = response.split(/Q\d+:/).filter(block => block.trim().length > 0);
    
    questionBlocks.forEach((block, index) => {
        try {
            const lines = block.trim().split('\n');
            const question = lines[0].trim();
            const options = lines.slice(1, 5).map(opt => opt.trim());
            const correctLine = lines.find(line => line.toLowerCase().includes('correct:'));
            const correct = correctLine ? correctLine.split(':')[1].trim() : '';
            
            if (question && options.length === 4 && correct) {
                questions.push({
                    id: index + 1,
                    question,
                    options,
                    correct
                });
            }
        } catch (e) {
            console.error('Error parsing question block:', e);
        }
    });
    
    return questions;
}

function displayQuiz(questions) {
    let html = `
        <div class="quiz-score">
            <div class="score-display">
                Score: <span id="currentScore">0</span>/<span id="totalQuestions">${questions.length}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" id="progressBar"></div>
            </div>
        </div>
        <div class="quiz-questions">
    `;
    
    questions.forEach((q, index) => {
        html += `
            <div class="quiz-question">
                <h3 class="text-xl font-semibold mb-4">Question ${q.id}</h3>
                <p class="mb-4">${q.question}</p>
                <div class="quiz-options">
                    ${q.options.map((opt, i) => `
                        <div class="quiz-option" 
                             onclick="checkAnswer(this, '${['A', 'B', 'C', 'D'][i]}', '${q.correct}')"
                             data-option="${['A', 'B', 'C', 'D'][i]}"
                             data-answered="false">
                            ${opt}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    document.getElementById('quizContent').innerHTML = html;
    updateScore(0, questions.length);
}

function checkAnswer(element, selected, correct) {
    if (element.parentElement.querySelector('[data-answered="true"]')) {
        return;
    }

    const siblings = element.parentElement.children;
    Array.from(siblings).forEach(sib => {
        sib.classList.remove('correct', 'incorrect');
        sib.setAttribute('data-answered', 'true');
    });
    
    if (selected === correct) {
        element.classList.add('correct');
        updateScore(1);
    } else {
        element.classList.add('incorrect');
        Array.from(siblings).forEach(sib => {
            if (sib.dataset.option === correct) {
                sib.classList.add('correct');
            }
        });
    }
}

function updateScore(increment, total = null) {
    const currentScoreElement = document.getElementById('currentScore');
    const totalQuestionsElement = document.getElementById('totalQuestions');
    const progressBar = document.getElementById('progressBar');
    
    if (total !== null) {
        currentScoreElement.textContent = '0';
        totalQuestionsElement.textContent = total;
        progressBar.style.width = '0%';
    } else {
        const currentScore = parseInt(currentScoreElement.textContent) + increment;
        const totalQuestions = parseInt(totalQuestionsElement.textContent);
        currentScoreElement.textContent = currentScore;
        
        const percentage = (currentScore / totalQuestions) * 100;
        progressBar.style.width = `${percentage}%`;
        
        const answeredQuestions = document.querySelectorAll('[data-answered="true"]').length / 4;
        if (answeredQuestions === totalQuestions) {
            setTimeout(() => {
                showFinalScore(currentScore, totalQuestions);
            }, 1000);
        }
    }
}

function showFinalScore(score, total) {
    const percentage = (score / total) * 100;
    let message = '';
    
    if (percentage === 100) message = 'Perfect! You\'re an expert! 🏆';
    else if (percentage >= 80) message = 'Great job! Almost perfect! 🌟';
    else if (percentage >= 60) message = 'Good effort! Keep learning! 👍';
    else message = 'Keep practicing! You\'ll get better! 💪';

    // Store the algorithm name in a data attribute when starting the quiz
    const currentAlgorithm = document.querySelector('.quiz-modal').dataset.algorithm;

    const finalScoreHtml = `
        <div class="final-score">
            <h2 class="text-2xl font-bold text-white mb-4">Quiz Complete!</h2>
            <p class="text-xl text-white mb-2">Your Score: ${score}/${total}</p>
            <p class="text-lg text-cyan-400 mb-4">${message}</p>
            <button onclick="startQuiz('${currentAlgorithm}')" 
                    class="try-again-btn">
                Try Again
            </button>
        </div>
    `;

    document.getElementById('quizContent').innerHTML = finalScoreHtml;
}

function closeQuiz() {
    document.getElementById('quizOverlay').style.display = 'none';
    document.getElementById('quizModal').style.display = 'none';
}

// Close quiz when clicking overlay
document.getElementById('quizOverlay')?.addEventListener('click', closeQuiz);

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
} 