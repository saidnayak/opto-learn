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

    // --- 4. Max Level Hardware Simulation Logic ---
    const lightSlider = document.getElementById('light-slider');
    const lightValDisplay = document.getElementById('light-val');
    const primaryOutLabel = document.getElementById('primary-out-label');
    const primaryOutVal = document.getElementById('primary-out-val');
    const currentValDisplay = document.getElementById('current-val');
    const powerValDisplay = document.getElementById('power-val');

    const compName = document.getElementById('comp-name');
    const compGlare = document.getElementById('comp-glare');
    const laserBeam = document.getElementById('laser-beam');
    const simLed = document.getElementById('sim-led');
    const circuitPath = document.getElementById('circuit-path');
    const activeTraceContainer = document.querySelector('.traces');

    const ambientToggle = document.getElementById('ambient-toggle');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // Canvas setup
    const canvas = document.getElementById('oscilloscope');
    const ctx = canvas.getContext('2d');
    const traceData = Array(120).fill(0); // Holds the last 120 data points

    let currentComponent = 'ldr';

    // Components specs
    const specs = {
        ldr: { name: 'GL5528 LDR', outLabel: 'Internal Resistance', unit: 'Ω' },
        pd: { name: 'BPW34 Photodiode', outLabel: 'Reverse Current', unit: 'µA' },
        pt: { name: 'BPX43 Phototransistor', outLabel: 'Amplified Current', unit: 'mA' }
    };

    // Tab Switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentComponent = e.target.getAttribute('data-target');

            compName.textContent = specs[currentComponent].name;
            primaryOutLabel.textContent = specs[currentComponent].outLabel;

            // Trigger recalculation
            triggerSimUpdate(lightSlider.value);
        });
    });

    ambientToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.documentElement.style.setProperty('--ambient-glow', '0.7');
            document.querySelector('.holographic').style.boxShadow = 'inset 0 0 100px rgba(0,242,254,0.1)';
        } else {
            document.documentElement.style.setProperty('--ambient-glow', '0');
            document.querySelector('.holographic').style.boxShadow = 'inset 0 0 30px rgba(0, 242, 254, 0.05)';
        }
    });

    function triggerSimUpdate(luxValue) {
        const lux = parseInt(luxValue);
        lightValDisplay.textContent = lux;

        let intensity = lux / 1000;
        let pOutString = "";
        let currentDraw_mA = 0;
        let power_mW = 0;

        // Physics math models
        if (currentComponent === 'ldr') {
            if (lux === 0) {
                pOutString = "∞ Ω";
            } else {
                const resValue = Math.max(150, 1000000 / (lux * 10));
                pOutString = resValue > 1000 ? (resValue / 1000).toFixed(1) + " kΩ" : Math.floor(resValue) + " Ω";
                currentDraw_mA = (9 / (resValue + 100)) * 1000; // Assume 100 ohm series led
            }
        } else if (currentComponent === 'pd') {
            // Photodiode yields microamps
            let uA = lux * 0.05; // Max 50uA
            pOutString = uA.toFixed(1) + " " + specs.pd.unit;
            currentDraw_mA = uA / 1000;
        } else if (currentComponent === 'pt') {
            // Phototransistor amplifies
            let mA = lux * 0.02; // Max 20mA
            pOutString = mA.toFixed(2) + " " + specs.pt.unit;
            currentDraw_mA = mA;
        }

        power_mW = 9 * currentDraw_mA;

        // Update DOM
        primaryOutVal.textContent = lux === 0 && currentComponent === 'ldr' ? "∞ Ω" : pOutString;
        currentValDisplay.textContent = currentDraw_mA.toFixed(2) + " mA";
        powerValDisplay.textContent = power_mW.toFixed(2) + " mW";

        // Laser & visual intensity updates
        if (laserBeam) laserBeam.style.opacity = intensity;
        if (compGlare) compGlare.style.opacity = intensity;

        // LED Brightness
        const ledBulb = simLed.querySelector('.led-bulb');
        if (currentDraw_mA > 0.1) {
            ledBulb.style.background = `radial-gradient(circle, #ffea00, #ff8c00)`;
            ledBulb.style.borderColor = `#ffea00`;
            simLed.style.boxShadow = `0 0 ${40 + (intensity * 60)}px rgba(255, 234, 0, ${Math.min(intensity * 2, 1)})`;
            activeTraceContainer.classList.add('flowing');
        } else {
            ledBulb.style.background = '#111';
            ledBulb.style.borderColor = '#333';
            simLed.style.boxShadow = `none`;
            activeTraceContainer.classList.remove('flowing');
        }

        // Feed oscilloscope map [0,1]
        let norm = 0;
        if (currentComponent === 'ldr') norm = Math.min(currentDraw_mA / 30, 1);
        else if (currentComponent === 'pd') norm = Math.min(currentDraw_mA / 0.05, 1);
        else if (currentComponent === 'pt') norm = Math.min(currentDraw_mA / 20, 1);

        currentTraceValue = norm;
    }

    let currentTraceValue = 0;
    lightSlider.addEventListener('input', (e) => triggerSimUpdate(e.target.value));

    // Initialize
    triggerSimUpdate(0);

    // Oscilloscope Animation Loop
    function drawOscilloscope() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 40) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
        }
        for (let j = 0; j < canvas.height; j += 30) {
            ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke();
        }

        // Add some noise simulation
        let noisyVal = currentTraceValue + (Math.random() * 0.02 - 0.01);
        if (noisyVal < 0) noisyVal = 0;

        traceData.push(noisyVal);
        traceData.shift();

        // Draw trace line
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const sliceWidth = canvas.width / traceData.length;
        let x = 0;

        for (let i = 0; i < traceData.length; i++) {
            const v = traceData[i];
            const y = canvas.height - (v * canvas.height * 0.9 + 5);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            x += sliceWidth;
        }

        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ff00';
        ctx.stroke();
        ctx.shadowBlur = 0;

        requestAnimationFrame(drawOscilloscope);
    }

    drawOscilloscope();

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
        },
        {
            question: "What physical mechanism governs a Photodiode's ability to convert light into current?",
            options: ["Thermionic Emission", "Photoelectric Effect", "Inner Photoelectric Effect (Electron-Hole Pair Generation)", "Compton Scattering"],
            correct: 2
        },
        {
            question: "Why is a Phototransistor significantly more sensitive than a standard Photodiode?",
            options: ["It has a larger surface area", "The base current generated by light is multiplied by the transistor's DC current gain (hFE)", "It uses higher frequency photons", "It operates at a higher voltage"],
            correct: 1
        },
        {
            question: "When exposed to total darkness, the resistance of an LDR is referred to as:",
            options: ["Null Resistance", "Dark Resistance", "Infinite Ohms", "Base Resistance"],
            correct: 1
        },
        {
            question: "In which operational mode is a Photodiode typically used for the fastest possible response time?",
            options: ["Photovoltaic Mode (Zero Bias)", "Photoconductive Mode (Reverse Bias)", "Forward Bias Mode", "Avalanche Breakdown Mode"],
            correct: 1
        },
        {
            question: "Which component is best suited for an automatic street light controller?",
            options: ["LDR (Photoresistor)", "High-Speed PIN Photodiode", "Laser Diode", "Optical Isolator"],
            correct: 0
        },
        {
            question: "The responsiveness of an optoelectronic device to different wavelengths of light is known as its:",
            options: ["Quantum Efficiency", "Spectral Response", "Photometric Sensitivity", "Luminous Flux"],
            correct: 1
        },
        {
            question: "An opto-isolator (optocoupler) typically consists of an LED paired directly with a:",
            options: ["Photoresistor", "Phototransistor or Photodiode", "Thermistor", "Zener Diode"],
            correct: 1
        }
    ];

    let currentQuestion = 0;
    let score = 0;
    let streak = 0;
    let timeLeft = 15;
    let timerInterval = null;

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

    // Gamification Elements
    const timerBar = document.getElementById('timer-bar');
    const timerText = document.getElementById('timer-text');
    const streakCounter = document.getElementById('streak-counter');
    const rankBadge = document.getElementById('rank-badge');

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
        streak = 0;
        streakCounter.classList.add('hidden');
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
            btn.addEventListener('click', () => handleAnswer(index, btn));
            optionsContainer.appendChild(btn);
        });

        startTimer();
    }

    function startTimer() {
        clearInterval(timerInterval);
        timeLeft = 15;
        updateTimerUI();
        timerBar.classList.remove('urgent');

        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerUI();

            if (timeLeft <= 5 && !timerBar.classList.contains('urgent')) {
                timerBar.classList.add('urgent');
            }

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                handleTimeOut();
            }
        }, 1000);
    }

    function updateTimerUI() {
        timerText.textContent = `${timeLeft}s`;
        const widthPercent = (timeLeft / 15) * 100;
        timerBar.style.width = `${widthPercent}%`;
    }

    function handleTimeOut() {
        const allButtons = optionsContainer.querySelectorAll('.option-btn');
        allButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.cursor = 'default';
        });

        const correctIndex = quizData[currentQuestion].correct;
        allButtons[correctIndex].classList.add('correct');

        streak = 0;
        updateStreakUI();

        proceedToNext();
    }

    function handleAnswer(selectedIndex, btnElement) {
        clearInterval(timerInterval);

        const allButtons = optionsContainer.querySelectorAll('.option-btn');
        allButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.cursor = 'default';
        });

        const correctIndex = quizData[currentQuestion].correct;

        if (selectedIndex === correctIndex) {
            btnElement.classList.add('correct');
            score++;
            streak++;
        } else {
            btnElement.classList.add('wrong');
            allButtons[correctIndex].classList.add('correct');
            streak = 0;
        }

        updateStreakUI();
        proceedToNext();
    }

    function updateStreakUI() {
        if (streak > 1) {
            streakCounter.textContent = `🔥 ${streak}x Combo!`;
            streakCounter.classList.remove('hidden');

            streakCounter.classList.remove('pop');
            void streakCounter.offsetWidth;
            streakCounter.classList.add('pop');
        } else {
            streakCounter.classList.add('hidden');
        }
    }

    function proceedToNext() {
        setTimeout(() => {
            currentQuestion++;
            if (currentQuestion < quizData.length) {
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

        let rankObj = determineRank(score);

        rankBadge.textContent = rankObj.title;
        rankBadge.className = `rank-badge ${rankObj.cssClass}`;

        if (score === quizData.length) {
            resultMessage.innerHTML = "Flawless Execution. <br/>You have achieved absolute mastery of the physics matrix.";
            document.getElementById('success-ring').style.borderColor = "var(--acc-success, #2ed573)";
            scoreDisplay.style.color = "var(--acc-success, #2ed573)";
        } else if (score >= 7) {
            resultMessage.innerHTML = "Optimal calibration achieved. <br/>Solid understanding of core principles.";
            document.getElementById('success-ring').style.borderColor = "var(--acc-cyan)";
            scoreDisplay.style.color = "#fff";
        } else {
            resultMessage.innerHTML = "Sub-optimal parameters detected. <br/>Review component documentation and recalibrate.";
            document.getElementById('success-ring').style.borderColor = "#ff4757";
            scoreDisplay.style.color = "#ff4757";
        }
    }

    function determineRank(finalScore) {
        if (finalScore === 10) return { title: 'Opto-Master', cssClass: 'rank-god' };
        if (finalScore >= 8) return { title: 'Senior Engineer', cssClass: 'rank-senior' };
        if (finalScore >= 5) return { title: 'Junior Technician', cssClass: 'rank-junior' };
        return { title: 'Intern', cssClass: 'rank-intern' };
    }
});
