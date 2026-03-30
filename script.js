document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. Global Interactivity: Smooth Scroll & Magnetic Buttons ---
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    const magneticButtons = document.querySelectorAll('.btn-magnetic');
    magneticButtons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const position = btn.getBoundingClientRect();
            const x = e.clientX - position.left - position.width / 2;
            const y = e.clientY - position.top - position.height / 2;
            
            // Subtle pull
            btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        });
        
        btn.addEventListener('mouseout', (e) => {
            btn.style.transform = 'translate(0px, 0px)';
        });
    });

    // --- 2. 3D Tilt Cards (Vanilla JS equivalent of vanilla-tilt) ---
    const tiltCards = document.querySelectorAll('.tilt-card');
    
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Calculate rotation. Note the negative sign to tilt *towards* the mouse
            const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg
            const rotateY = ((x - centerX) / centerX) * 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
    });

    // --- 3. Scroll Reveal Stagger Animations ---
    const revealElements = document.querySelectorAll('[data-scroll-reveal]');
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add a slight stagger based on DOM order if multiple appear at once
                setTimeout(() => {
                    entry.target.style.opacity = 1;
                    entry.target.style.transform = 'translateY(0) scale(1)';
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -100px 0px', threshold: 0.1 });

    revealElements.forEach(el => {
        el.style.opacity = 0;
        el.style.transform = 'translateY(40px) scale(0.96)';
        el.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        revealObserver.observe(el);
    });

    // --- 4. Hardware Dashboard Simulation Logic ---
    const lightSlider = document.getElementById('light-slider');
    const lightValDisplay = document.getElementById('light-val');
    const resValDisplay = document.getElementById('res-val');
    const simLed = document.getElementById('sim-led');
    const ldrGlare = document.getElementById('ldr-glare');
    const ambientToggle = document.getElementById('ambient-toggle');
    const ambientOverlay = document.getElementById('ambient-overlay');

    // Toggle Ambient Night Mode
    ambientToggle.addEventListener('change', (e) => {
        if(e.target.checked) {
            document.documentElement.style.setProperty('--ambient-glow', '0.7');
            document.querySelector('.dashboard-panel').style.boxShadow = 'inset 0 0 100px rgba(0,0,0,0.8)';
        } else {
            document.documentElement.style.setProperty('--ambient-glow', '0');
            document.querySelector('.dashboard-panel').style.boxShadow = 'none';
        }
    });

    lightSlider.addEventListener('input', (e) => {
        const lux = parseInt(e.target.value);
        lightValDisplay.textContent = lux;
        
        let resistance;
        if (lux === 0) {
            resistance = "∞ Ω"; // Dark resistance
            simLed.style.boxShadow = `0 0 0px rgba(255, 234, 0, 0)`;
            simLed.querySelector('.led-bulb').style.background = '#1a1a1a';
            simLed.querySelector('.led-bulb').style.borderColor = '#333';
            ldrGlare.style.opacity = 0;
            
        } else {
            const resValue = Math.max(150, 1000000 / (lux * 10)); 
            resistance = resValue > 1000 ? (resValue / 1000).toFixed(1) + " kΩ" : Math.floor(resValue) + " Ω";
            
            // Visual feedback mapping
            const intensity = lux / 1000;
            ldrGlare.style.opacity = intensity;
            
            const ledBulb = simLed.querySelector('.led-bulb');
            ledBulb.style.background = `radial-gradient(circle, #ffea00, #ff8c00)`;
            ledBulb.style.borderColor = `#ffea00`;
            
            // Cast glow onto the circuit board
            simLed.style.boxShadow = `0 0 ${40 + (intensity * 60)}px ` + `rgba(255, 234, 0, ${intensity})`;
            
            // If in night mode, bleed light onto the overlay
            if(ambientToggle.checked) {
                document.documentElement.style.setProperty('--ambient-glow', `${0.7 - (intensity * 0.4)}`);
            }
        }
        resValDisplay.textContent = resistance;
    });

    // --- 5. Gamified Quiz System ---
    const quizData = [
        {
            question: "Which optoelectronic component intrinsically lacks internal current amplification?",
            options: ["Phototransistor", "Photodiode", "Photodarlington", "Avalanche Photodiode"],
            correct: 1
        },
        {
            question: "What is the primary relationship vector in an LDR (Photoresistor)?",
            options: ["Resistance increases as Lux increases", "Voltage generates directly from Lux", "Resistance decreases as Lux increases", "Current reverses when light hits"],
            correct: 2
        },
        {
            question: "For an ultra-high speed optical fiber data link (pico/nanosecond response), which receiver is structurally required?",
            options: ["GL5528 Photoresistor", "Silicon Phototransistor", "PIN Photodiode", "Standard Solar Cell"],
            correct: 2
        }
    ];

    let currentQuestion = 0;
    let score = 0;

    const quizIntro = document.getElementById('quiz-intro');
    const quizArea = document.getElementById('quiz-area');
    const quizResult = document.getElementById('quiz-result');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const scoreDisplay = document.getElementById('score-display');
    const resultMessage = document.getElementById('result-message');
    
    // UI Progress Trackers
    const qCurrentDisplay = document.getElementById('q-current');
    const qTotalDisplay = document.getElementById('q-total');
    const quizProgress = document.getElementById('quiz-progress');

    qTotalDisplay.textContent = quizData.length;

    function transitionStep(hideEl, showEl) {
        hideEl.classList.remove('active');
        hideEl.classList.add('exit');
        setTimeout(() => {
            hideEl.classList.add('hidden');
            hideEl.classList.remove('exit');
            showEl.classList.remove('hidden');
            // Force reflow
            void showEl.offsetWidth;
            showEl.classList.add('active');
        }, 500); // match css transition time
    }

    startBtn.addEventListener('click', () => {
        transitionStep(quizIntro, quizArea);
        loadQuestion();
    });

    restartBtn.addEventListener('click', () => {
        currentQuestion = 0;
        score = 0;
        transitionStep(quizResult, quizArea);
        loadQuestion();
    });

    function loadQuestion() {
        optionsContainer.innerHTML = '';
        
        qCurrentDisplay.textContent = currentQuestion + 1;
        const progressPercentage = (currentQuestion / quizData.length) * 100;
        quizProgress.style.width = `${progressPercentage}%`;

        const currentQ = quizData[currentQuestion];
        questionText.textContent = currentQ.question;

        currentQ.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.classList.add('option-btn');
            btn.textContent = opt;
            btn.addEventListener('click', () => checkAnswer(index, btn));
            optionsContainer.appendChild(btn);
        });
    }

    function checkAnswer(selectedIndex, btnElement) {
        const allButtons = optionsContainer.querySelectorAll('.option-btn');
        allButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.cursor = 'default';
        });

        const correctIndex = quizData[currentQuestion].correct;
        
        if (selectedIndex === correctIndex) {
            btnElement.classList.add('correct');
            score++;
        } else {
            btnElement.classList.add('wrong');
            allButtons[correctIndex].classList.add('correct');
        }

        setTimeout(() => {
            currentQuestion++;
            if (currentQuestion < quizData.length) {
                // Fade out question content
                const qWrapper = document.querySelector('.quiz-body-wrapper');
                qWrapper.style.opacity = 0;
                qWrapper.style.transform = 'translateY(10px)';
                
                setTimeout(() => {
                    loadQuestion();
                    qWrapper.style.opacity = 1;
                    qWrapper.style.transform = 'translateY(0)';
                }, 300);

            } else {
                quizProgress.style.width = `100%`;
                setTimeout(() => showResults(), 500);
            }
        }, 1200);
    }

    function showResults() {
        transitionStep(quizArea, quizResult);
        scoreDisplay.textContent = score;
        
        if(score === quizData.length) {
            resultMessage.innerHTML = "Perfect Calibration. <br/>You have mastered the physics matrix.";
            document.getElementById('success-ring').style.borderColor = "var(--acc-success)";
            scoreDisplay.style.color = "var(--acc-success)";
        } else {
            resultMessage.innerHTML = "Optimal parameters not met. <br/>Review component documentation and recalibrate.";
            document.getElementById('success-ring').style.borderColor = "var(--acc-cyan)";
            scoreDisplay.style.color = "#fff";
        }
    }
});
