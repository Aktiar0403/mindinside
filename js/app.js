// js/app.js - Complete Psychometric Test Application with Sentiment Slider
// ===== VARIABLE PACING & MICRO-INTERACTIONS =====
class EngagementManager {
    constructor() {
        this.lastAnswerTime = Date.now();
        this.answerSpeeds = [];
        this.questionModes = ['default', 'quick', 'reflection'];
        this.encouragementMessages = [
            "Great insight! 🎯",
            "Building self-awareness! 🌱",
            "This reveals your unique strengths! 💫",
            "Each answer shapes your profile! 📊",
            "You're discovering patterns! 🔍",
            "Building emotional intelligence! 🧠",
            "This data is gold! 💎",
            "Uncovering your superpowers! 🦸",
            "Growth in progress! 📈",
            "Mindfulness in action! 🪷"
        ];
    }

    // Call this when user selects an answer
    onAnswerSelected() {
        const now = Date.now();
        const speed = now - this.lastAnswerTime;
        this.answerSpeeds.push(speed);
        this.lastAnswerTime = now;

        // Visual feedback
        this.triggerMicroCelebration();
        
        // Occasionally show encouragement
        if (Math.random() > 0.7) { // 30% chance
            this.showEncouragement();
        }

        // Check for pacing variation
        this.adjustQuestionPacing();
    }

    triggerMicroCelebration() {
        // Add celebration class to question card
        const questionCard = document.querySelector('.question-card');
        if (questionCard) {
            questionCard.classList.add('answer-selected');
            setTimeout(() => {
                questionCard.classList.remove('answer-selected');
            }, 600);
        }

        // Pulse progress bar on milestones
        const answered = psychometricApp.getAnsweredQuestionsCount();
        if (answered % 5 === 0) {
            const progressFill = document.getElementById('progressFill');
            if (progressFill) {
                progressFill.classList.add('progress-milestone');
                setTimeout(() => {
                    progressFill.classList.remove('progress-milestone');
                }, 1500);
            }
        }
    }

    showEncouragement() {
        const message = this.encouragementMessages[
            Math.floor(Math.random() * this.encouragementMessages.length)
        ];
        
        // Remove existing toast
        const existingToast = document.querySelector('.encouragement-toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create new toast
        const toast = document.createElement('div');
        toast.className = 'encouragement-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    adjustQuestionPacing() {
        const answered = psychometricApp.getAnsweredQuestionsCount();
        const questionCard = document.querySelector('.question-card');
        if (!questionCard) return;

        // Remove previous modes
        questionCard.classList.remove('quick-mode', 'reflection-mode');

        // Apply pacing variations based on question number
        if (answered % 8 === 0) {
            // Reflection question (every 8 questions)
            questionCard.classList.add('reflection-mode');
            this.updateQuestionContext("💭 Deep Reflection");
        } else if (answered % 5 === 0) {
            // Quick question (every 5 questions)
            questionCard.classList.add('quick-mode');
            this.updateQuestionContext("⚡ Quick Insight");
        } else {
            this.updateQuestionContext("🎯 Core Assessment");
        }
    }

    updateQuestionContext(context) {
        let contextElement = document.getElementById('questionContext');
        if (!contextElement) {
            contextElement = document.createElement('div');
            contextElement.id = 'questionContext';
            contextElement.style.cssText = `
                text-align: center;
                font-size: 0.9rem;
                color: var(--text-muted);
                margin-bottom: 10px;
                font-weight: 600;
            `;
            const questionHeader = document.querySelector('.question-header');
            if (questionHeader) {
                questionHeader.appendChild(contextElement);
            }
        }
        contextElement.textContent = context;
    }

    getAverageSpeed() {
        if (this.answerSpeeds.length === 0) return 0;
        return this.answerSpeeds.reduce((a, b) => a + b, 0) / this.answerSpeeds.length;
    }
}

// Initialize engagement manager
let engagementManager;

// ===== QUICK PACING VARIATIONS =====
function varyQuestionDisplay() {
    const answered = psychometricApp.getAnsweredQuestionsCount();
    const questionText = document.getElementById('questionText');
    
    if (!questionText) return;

    // Occasionally emphasize key words
    if (answered % 7 === 0) {
        const text = questionText.textContent;
        // Simple emphasis on key emotional words
        const emphasized = text.replace(/(feelings?|emotions?|understand|aware)/gi, 
            '<span style="color: var(--primary-color); font-weight: 600;">$1</span>');
        questionText.innerHTML = emphasized;
    }

    // Quick questions get a different visual treatment
    if (answered % 4 === 0) {
        questionText.style.fontSize = '1.3rem';
        questionText.style.fontWeight = '500';
    } else {
        questionText.style.fontSize = '';
        questionText.style.fontWeight = '';
    }
}
class PsychometricApp {
    constructor() {
        this.state = {
            userId: null,
            userName: "",
            demographics: {},
            currentCategoryIndex: 0,
            currentSubcategoryIndex: 0,
            currentQuestionIndex: 0,
            answers: {},
            responseTimestamps: [],
            results: {},
            analytics: {}
        };
        
        this.isDragging = false; // Add this for slider
        engagementManager = new EngagementManager();
        this.initializeApp();
    }
    
    initializeApp() {
        this.bindEvents();
        
        // Clean up any corrupted data on startup
        const cleanedCount = DataManager.cleanupCorruptedData();
        if (cleanedCount > 0) {
            console.log(`Cleaned up ${cleanedCount} corrupted data entries`);
        }
        
        this.loadExistingSession();
    }
    
    bindEvents() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }
    
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // === INTRO SCREEN LANGUAGE SELECTOR ===
        const introLanguageOptions = document.querySelectorAll('.language-option-prominent');
        if (introLanguageOptions.length > 0) {
            introLanguageOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    const lang = e.currentTarget.dataset.lang;
                    console.log('Intro screen language selected:', lang);
                    
                    // Update BOTH intro screen and question screen selectors
                    this.updateAllLanguageSelectors(lang);
                    this.changeLanguage(lang);
                });
            });
            console.log('Intro screen language event listeners added');
        }
        
        // === QUESTION SCREEN LANGUAGE SELECTOR ===
        const questionLanguageOptions = document.querySelectorAll('.language-option-question');
        if (questionLanguageOptions.length > 0) {
            questionLanguageOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    const lang = e.currentTarget.dataset.lang;
                    console.log('Question screen language selected:', lang);
                    
                    // Update BOTH intro screen and question screen selectors
                    this.updateAllLanguageSelectors(lang);
                    this.changeLanguage(lang);
                });
            });
            console.log('Question screen language event listeners added');
        }
        
        // === SENTIMENT SLIDER EVENTS ===
        this.setupSliderEvents();
        
        // Start button
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startTest());
        }
        
        // User name enter key
        const userNameInput = document.getElementById('userName');
        if (userNameInput) {
            userNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.startTest();
            });
        }
        
        // Question screen buttons
        const backBtn = document.getElementById('backBtn');
        if (backBtn) backBtn.addEventListener('click', () => this.previousQuestion());
        
        const skipBtn = document.getElementById('skipBtn');
        if (skipBtn) skipBtn.addEventListener('click', () => this.skipQuestion());
        
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) nextBtn.addEventListener('click', () => this.handleAnswer());

        // Example toggle event
        const exampleToggle = document.getElementById('exampleToggle');
        if (exampleToggle) {
            exampleToggle.addEventListener('click', () => this.toggleExample());
        } 
        
        // Analytics and Results events
        const viewReportsBtn = document.getElementById('viewReportsBtn');
        if (viewReportsBtn) viewReportsBtn.addEventListener('click', () => this.showReports());
        
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) restartBtn.addEventListener('click', () => this.restartTest());
        
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) downloadBtn.addEventListener('click', () => this.downloadPDFReport());
        
        const viewAnalyticsBtn = document.getElementById('viewAnalyticsBtn');
        if (viewAnalyticsBtn) viewAnalyticsBtn.addEventListener('click', () => this.showAnalytics());
        
        console.log('All event listeners setup complete');
    }
    
    // ===== SENTIMENT SLIDER METHODS =====
   setupSliderEvents() {
    const slider = document.getElementById('sentimentSlider');
    const sliderTrack = document.querySelector('.slider-track');
    
    if (!slider || !sliderTrack) return;
    
    let isDragging = false;
    
    // Mouse events
    slider.addEventListener('mousedown', (e) => this.startDrag(e));
    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('mouseup', () => this.stopDrag());
    
    // Touch events for mobile (FIXED VERSION)
    slider.addEventListener('touchstart', (e) => this.startDrag(e), { passive: false });
    document.addEventListener('touchmove', (e) => this.drag(e), { passive: false });
    document.addEventListener('touchend', () => this.stopDrag(), { passive: false });
    
    // Click on track to move thumb
    sliderTrack.addEventListener('click', (e) => {
        this.moveToPosition(e.clientX || e.touches[0].clientX);
    });
}
    startDrag(e) {
        this.isDragging = true;
        this.moveToPosition(e.clientX || e.touches[0].clientX);
        e.preventDefault();
    }
    
    drag(e) {
        if (!this.isDragging) return;
        this.moveToPosition(e.clientX || e.touches[0].clientX);
        e.preventDefault();
    }
    
    stopDrag() {
        this.isDragging = false;
    }
    
    moveToPosition(clientX) {
        const slider = document.getElementById('sentimentSlider');
        const thumb = document.getElementById('sliderThumb');
        const sliderFill = document.getElementById('sliderFill');
        const thumbValue = document.getElementById('thumbValue');
        const sliderEmotion = document.getElementById('sliderEmotion');
        const sliderText = document.getElementById('sliderText');
        const sentimentValue = document.getElementById('sentimentValue');
        const nextBtn = document.getElementById('nextBtn');
        
        if (!slider || !thumb) return;
        
        const sliderRect = slider.getBoundingClientRect();
        const sliderWidth = sliderRect.width;
        const sliderLeft = sliderRect.left;
        
        // Calculate position (0 to 1)
        let position = (clientX - sliderLeft) / sliderWidth;
        position = Math.max(0, Math.min(1, position)); // Clamp between 0-1
        
        // Convert to value 1-5
        const value = Math.round(position * 4) + 1;
        
        // Calculate percentage for thumb position (10% padding on sides)
        const thumbPosition = (position * 80) + 10;
        
        // Update UI
        thumb.style.left = `${thumbPosition}%`;
        sliderFill.style.width = `${thumbPosition}%`;
        thumbValue.textContent = value;
        sentimentValue.value = value;
        
        // Update emotion and text based on value
        this.updateSliderDisplay(value);
        
        // Enable next button
        if (nextBtn) nextBtn.disabled = false;
    }
    
    updateSliderDisplay(value) {
        const sliderEmotion = document.getElementById('sliderEmotion');
        const sliderText = document.getElementById('sliderText');
        
        if (!sliderEmotion || !sliderText) return;
        
        const emotions = {
            1: { emoji: '😠', text: 'Strongly Disagree', color: '#e53e3e' },
            2: { emoji: '😕', text: 'Disagree', color: '#ed8936' },
            3: { emoji: '😐', text: 'Neutral', color: '#f6e05e' },
            4: { emoji: '😊', text: 'Agree', color: '#68d391' },
            5: { emoji: '😄', text: 'Strongly Agree', color: '#38a169' }
        };
        
        const current = emotions[value] || emotions[3];
        
        sliderEmotion.textContent = current.emoji;
        sliderEmotion.style.color = current.color;
        sliderEmotion.setAttribute('data-value', value);
        
        sliderText.textContent = current.text;
        sliderText.style.color = current.color;
    }
    
    resetSlider() {
        const thumb = document.getElementById('sliderThumb');
        const sliderFill = document.getElementById('sliderFill');
        const thumbValue = document.getElementById('thumbValue');
        const sentimentValue = document.getElementById('sentimentValue');
        const nextBtn = document.getElementById('nextBtn');
        
        if (thumb && sliderFill) {
            // Reset to neutral position (value 3)
            thumb.style.left = '50%';
            sliderFill.style.width = '50%';
            thumbValue.textContent = '3';
            sentimentValue.value = '3';
            
            // Update display
            this.updateSliderDisplay(3);
            
            // Disable next button until user interacts
            if (nextBtn) nextBtn.disabled = true;
        }
    }
    
    // ===== LANGUAGE METHODS =====
    changeLanguage(lang) {
        console.log('Changing language to:', lang);
        if (LanguageManager.setLanguage(lang)) {
            this.updateLanguageUI(lang);
            this.refreshCurrentQuestion();
        }
    }
    
    updateLanguageUI(lang) {
        console.log('Updating UI for language:', lang);
        
        // Update ALL language selectors
        this.updateAllLanguageSelectors(lang);
        
        // Update any language-specific text
        this.updateStaticText(lang);
        
        // Force question refresh if on question screen
        this.refreshCurrentQuestion();
    }
    
    updateAllLanguageSelectors(lang) {
        console.log('Updating all language selectors to:', lang);
        
        // Update prominent language selector (intro screen)
        const prominentOptions = document.querySelectorAll('.language-option-prominent');
        if (prominentOptions.length > 0) {
            prominentOptions.forEach(option => {
                option.classList.toggle('active', option.dataset.lang === lang);
            });
        }
        
        // Update question screen language selector
        const questionOptions = document.querySelectorAll('.language-option-question');
        if (questionOptions.length > 0) {
            questionOptions.forEach(option => {
                option.classList.toggle('active', option.dataset.lang === lang);
            });
        }
    }
    
    updateStaticText(lang) {
        console.log('Updating static text for:', lang);
        const placeholders = {
            en: {
                name: 'Enter your name',
                age: 'Your age',
                start: 'Start Assessment'
            },
            hi: {
                name: 'अपना नाम दर्ज करें',
                age: 'आपकी उम्र',
                start: 'मूल्यांकन शुरू करें'
            },
            bn: {
                name: 'আপনার নাম লিখুন',
                age: 'আপনার বয়স',
                start: 'মূল্যায়ন শুরু করুন'
            }
        };
        
        const texts = placeholders[lang] || placeholders.en;
        
        // Update form placeholders
        const userNameInput = document.getElementById('userName');
        if (userNameInput) userNameInput.placeholder = texts.name;
        
        const userAgeInput = document.getElementById('userAge');
        if (userAgeInput) userAgeInput.placeholder = texts.age;
        
        // Update button text
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            const firstSpan = startBtn.querySelector('span:first-child');
            if (firstSpan) firstSpan.textContent = texts.start;
        }
    }
    
    // ===== EXAMPLE TOGGLE METHOD =====
    toggleExample() {
        const exampleElement = document.getElementById('questionExample');
        const toggleIcon = document.querySelector('.toggle-icon');
        const toggleText = document.querySelector('.toggle-text');
        
        if (exampleElement.style.display === 'none') {
            exampleElement.style.display = 'block';
            toggleIcon.textContent = '➖';
            toggleText.textContent = 'Hide Example';
        } else {
            exampleElement.style.display = 'none';
            toggleIcon.textContent = '➕';
            toggleText.textContent = 'Show Example';
        }
    }
    
    // ===== MAIN APP METHODS =====
    startTest() {
        const name = document.getElementById('userName').value.trim();
        const age = parseInt(document.getElementById('userAge').value);
        const gender = document.getElementById('userGender').value;
        const occupation = document.getElementById('userOccupation').value;
        
        if (!this.validateInputs(name, age, gender, occupation)) {
            return;
        }
        
        this.state.userId = DataManager.generateUserId();
        this.state.userName = name;
        this.state.demographics = { name, age, gender, occupation };
        this.state.responseTimestamps = [Date.now()];
        
        // Save demographics
        DataManager.saveDemographics(this.state.userId, this.state.demographics);
        
        this.showScreen('questionScreen');
        this.loadCurrentQuestion();
    }
    
    validateInputs(name, age, gender, occupation) {
        if (!name) {
            alert("Please enter your name to continue.");
            return false;
        }
        
        if (!age || age < 16 || age > 100) {
            alert("Please enter a valid age between 16 and 100.");
            return false;
        }
        
        if (!gender) {
            alert("Please select your gender.");
            return false;
        }
        
        if (!occupation) {
            alert("Please select your occupation.");
            return false;
        }
        
        return true;
    }
    
   loadCurrentQuestion() {
    const category = QuestionManager.getCategories()[this.state.currentCategoryIndex];
    const subcategories = QuestionManager.getSubcategories(category);
    
    if (subcategories.length === 0) {
        this.moveToNextQuestion();
        return;
    }
    
    const subcategory = subcategories[this.state.currentSubcategoryIndex];
    const questions = QuestionManager.getQuestions(category, subcategory);
    
    if (questions.length === 0) {
        this.moveToNextQuestion();
        return;
    }
    
    const question = questions[this.state.currentQuestionIndex];
    const questionText = QuestionManager.getQuestionText(question);

    // === UPDATED: Category badge (large) + Subcategory only in title ===
    const currentCategoryElement = document.getElementById('currentCategory');
    if (currentCategoryElement) {
        currentCategoryElement.textContent = subcategory; // Only subcategory name
    }
    
    // Update the category badge with just the main category
    const categoryBadge = document.getElementById('currentCategoryBadge');
    if (categoryBadge) {
        categoryBadge.textContent = category; // Just "Resilience", "Emotional", etc.
    }

    // Rest of your existing code remains the same...
    const currentQuestionNumberElement = document.getElementById('currentQuestionNumber');
    if (currentQuestionNumberElement) currentQuestionNumberElement.textContent = this.state.currentQuestionIndex + 1;
    
    const totalQuestionsElement = document.getElementById('totalQuestions');
    if (totalQuestionsElement) totalQuestionsElement.textContent = questions.length;
    
    const questionTextElement = document.getElementById('questionText');
    if (questionTextElement) questionTextElement.textContent = questionText;

    

        // Handle question examples
        const exampleText = QuestionManager.getQuestionExample(question);
        const exampleElement = document.getElementById('questionExample');
        const toggleElement = document.getElementById('exampleToggle');
        
        if (exampleText && exampleElement && toggleElement) {
            const toggleIcon = toggleElement.querySelector('.toggle-icon');
            const toggleText = toggleElement.querySelector('.toggle-text');
            
            exampleElement.innerHTML = exampleText;
            toggleElement.style.display = 'flex';
            // Reset to collapsed state for new question
            exampleElement.style.display = 'none';
            toggleIcon.textContent = '➕';
            toggleText.textContent = 'Show Example';
        } else if (exampleElement && toggleElement) {
            exampleElement.innerHTML = '';
            toggleElement.style.display = 'none';
        }
        
        // Reset sentiment slider to neutral position
        this.resetSlider();
        
        // Update progress
        this.updateProgress();
        
        // Enable/disable navigation
        const backBtn = document.getElementById('backBtn');
        if (backBtn) backBtn.disabled = this.isFirstQuestion();
        engagementManager.adjustQuestionPacing();
         varyQuestionDisplay();
        // Record timestamp
        this.state.responseTimestamps.push(Date.now());
    }
    
    handleAnswer() {
        engagementManager.onAnswerSelected();
    
    const sentimentValue = document.getElementById('sentimentValue');
        
        
        if (!sentimentValue || !sentimentValue.value) {
            alert("Please select an answer before continuing.");
            return;
        }
        
        const answerValue = parseInt(sentimentValue.value);
        const category = QuestionManager.getCategories()[this.state.currentCategoryIndex];
        const subcategory = QuestionManager.getSubcategories(category)[this.state.currentSubcategoryIndex];
        
        // Store answer in state first
        if (!this.state.answers[category]) {
            this.state.answers[category] = {};
        }
        if (!this.state.answers[category][subcategory]) {
            this.state.answers[category][subcategory] = [];
        }
        this.state.answers[category][subcategory][this.state.currentQuestionIndex] = answerValue;
        
        // Then save to storage (automatically saves to Firebase)
        const saved = DataManager.saveResponse(
            this.state.userId,
            category,
            subcategory,
            this.state.currentQuestionIndex,
            answerValue,
            Date.now()
        );
        
        if (!saved) {
            console.warn('Failed to save response to storage');
            // Continue anyway, data is in memory
        }
        
        this.moveToNextQuestion();
    }
    
    previousQuestion() {
        if (this.state.currentQuestionIndex > 0) {
            this.state.currentQuestionIndex--;
        } else {
            if (this.state.currentSubcategoryIndex > 0) {
                this.state.currentSubcategoryIndex--;
                const category = QuestionManager.getCategories()[this.state.currentCategoryIndex];
                const subcategory = QuestionManager.getSubcategories(category)[this.state.currentSubcategoryIndex];
                this.state.currentQuestionIndex = QuestionManager.getQuestions(category, subcategory).length - 1;
            } else {
                if (this.state.currentCategoryIndex > 0) {
                    this.state.currentCategoryIndex--;
                    const category = QuestionManager.getCategories()[this.state.currentCategoryIndex];
                    const subcategories = QuestionManager.getSubcategories(category);
                    this.state.currentSubcategoryIndex = subcategories.length - 1;
                    const subcategory = subcategories[this.state.currentSubcategoryIndex];
                    this.state.currentQuestionIndex = QuestionManager.getQuestions(category, subcategory).length - 1;
                }
            }
        }
        
        this.loadCurrentQuestion();
    }
    
    skipQuestion() {
        this.moveToNextQuestion();
    }
    
    moveToNextQuestion() {
        this.state.currentQuestionIndex++;
        
        const category = QuestionManager.getCategories()[this.state.currentCategoryIndex];
        const subcategories = QuestionManager.getSubcategories(category);
        const subcategory = subcategories[this.state.currentSubcategoryIndex];
        const questions = QuestionManager.getQuestions(category, subcategory);
        
        if (this.state.currentQuestionIndex < questions.length) {
            this.loadCurrentQuestion();
        } else {
            this.state.currentSubcategoryIndex++;
            this.state.currentQuestionIndex = 0;
            
            if (this.state.currentSubcategoryIndex < subcategories.length) {
                this.loadCurrentQuestion();
            } else {
                this.state.currentCategoryIndex++;
                this.state.currentSubcategoryIndex = 0;
                this.state.currentQuestionIndex = 0;
                
                if (this.state.currentCategoryIndex < QuestionManager.getCategories().length) {
                    this.loadCurrentQuestion();
                } else {
                    this.calculateResults();
                }
            }
        }
    }
    
    isFirstQuestion() {
        return this.state.currentCategoryIndex === 0 && 
               this.state.currentSubcategoryIndex === 0 && 
               this.state.currentQuestionIndex === 0;
    }
    
    updateProgress() {
        const totalQuestions = QuestionManager.getTotalQuestionsCount();
        const answeredQuestions = this.getAnsweredQuestionsCount();
        const progress = (answeredQuestions / totalQuestions) * 100;
        
        const progressPercentageElement = document.getElementById('progressPercentage');
        if (progressPercentageElement) progressPercentageElement.textContent = `${Math.round(progress)}%`;
        
        const progressFillElement = document.getElementById('progressFill');
        if (progressFillElement) progressFillElement.style.width = `${progress}%`;
        
        // Also update browser tab title with progress
        document.title = `Psychometric Test (${Math.round(progress)}%)`;
    }
    
    getAnsweredQuestionsCount() {
        let answered = 0;
        for (const category in this.state.answers) {
            for (const subcategory in this.state.answers[category]) {
                const answers = this.state.answers[category][subcategory];
                answered += answers.filter(a => a !== null && a !== undefined).length;
            }
        }
        return answered;
    }
    
    calculateResults() {
        this.state.results = {};
        
        // Calculate scores for each category
        for (const category of QuestionManager.getCategories()) {
            const categoryData = questions[category];
            const categoryAnswers = this.state.answers[category] || {};
            
            const categoryResult = ScoringAlgorithm.calculateCategoryScore(categoryData, categoryAnswers);
            categoryResult.level = ScoringAlgorithm.determineLevel(categoryResult.overall);
            
            this.state.results[category] = categoryResult;
        }
        
        // Calculate additional analytics
        this.state.analytics.consistency = ScoringAlgorithm.calculateConsistency(this.state.answers);
        this.state.analytics.responseTime = ScoringAlgorithm.calculateResponseTimeAnalysis(this.state.responseTimestamps);
        
        // Mark as complete (automatically saves to Firebase)
        DataManager.markComplete(this.state.userId, this.state.results);
        
        this.showAnalytics();
    }
    
    showAnalytics() {
        this.showScreen('analyticsScreen');
        this.renderAnalytics();
    }
    
    renderAnalytics() {
        const analyticsGrid = document.getElementById('analyticsGrid');
        if (!analyticsGrid) return;
        
        analyticsGrid.innerHTML = '';
        
        // Overall Score Card
        const overallScore = Object.values(this.state.results).reduce((sum, result) => sum + result.overall, 0) / Object.keys(this.state.results).length;
        const overallLevel = ScoringAlgorithm.determineLevel(overallScore);
        
        analyticsGrid.appendChild(this.createAnalyticsCard('Overall Psychological Profile', `
            <div style="text-align: center; margin: 20px 0;">
                <div style="font-size: 3rem; font-weight: bold; color: ${ScoringAlgorithm.getLevelColor(overallLevel)}">${overallScore.toFixed(1)}</div>
                <div style="font-size: 1.2rem; color: #666;">Level ${overallLevel} - ${ScoringAlgorithm.getLevelLabel(overallLevel)}</div>
            </div>
            <div class="stat-item">
                <span>Response Consistency:</span>
                <span class="stat-value">${this.state.analytics.consistency.toFixed(1)}%</span>
            </div>
            <div class="stat-item">
                <span>Average Response Time:</span>
                <span class="stat-value">${this.state.analytics.responseTime.avgTime.toFixed(1)}s</span>
            </div>
            <div class="stat-item">
                <span>Response Pattern:</span>
                <span class="stat-value">${this.state.analytics.responseTime.pattern}</span>
            </div>
        `));
        
        // Category Breakdown
        let categoryContent = '';
        for (const [category, result] of Object.entries(this.state.results)) {
            categoryContent += `
                <div class="stat-item">
                    <span>${category}:</span>
                    <span class="stat-value">${result.overall.toFixed(1)} (Level ${result.level})</span>
                </div>
            `;
            
            for (const [subcategory, subResult] of Object.entries(result.subcategories)) {
                categoryContent += `
                    <div style="padding-left: 20px; font-size: 0.9rem; color: #666;">
                        <span>${subcategory}:</span>
                        <span>${subResult.score.toFixed(1)}</span>
                    </div>
                `;
            }
        }
        
        analyticsGrid.appendChild(this.createAnalyticsCard('Category Breakdown', categoryContent));
        
        // Comparative Analytics
        const aggregateData = DataManager.getAggregateData();
        if (aggregateData && aggregateData.totalUsers > 1) {
            let comparisonContent = `<div style="margin-bottom: 15px;">Based on ${aggregateData.totalUsers} completed assessments</div>`;
            
            for (const [category, avgScore] of Object.entries(aggregateData.categoryAverages)) {
                const userScore = this.state.results[category] ? this.state.results[category].overall : 0;
                const difference = userScore - avgScore;
                const differenceText = difference >= 0 ? `+${difference.toFixed(1)} above average` : `${difference.toFixed(1)} below average`;
                
                comparisonContent += `
                    <div class="stat-item">
                        <span>${category}:</span>
                        <span class="stat-value">${differenceText}</span>
                    </div>
                `;
            }
            
            analyticsGrid.appendChild(this.createAnalyticsCard('Comparison with Other Users', comparisonContent));
        }
        
        // Insights
        const comparison = AnalyticsEngine.generateComparativeAnalysis(this.state.results, aggregateData);
        const insights = AnalyticsEngine.generateInsights(this.state.results, comparison);
        
        let insightsContent = '';
        if (insights.keyStrengths.length > 0) {
            insightsContent += `<div style="margin-bottom: 15px;"><strong>Key Strengths:</strong> ${insights.keyStrengths.map(s => s.category).join(', ')}</div>`;
        }
        if (insights.developmentAreas.length > 0) {
            insightsContent += `<div style="margin-bottom: 15px;"><strong>Areas for Development:</strong> ${insights.developmentAreas.map(a => a.category).join(', ')}</div>`;
        }
        if (insights.recommendations.length > 0) {
            insightsContent += `<div><strong>Recommendations:</strong><ul style="margin-top: 10px;">${insights.recommendations.map(r => `<li>${r}</li>`).join('')}</ul></div>`;
        }
        
        analyticsGrid.appendChild(this.createAnalyticsCard('Key Insights', insightsContent));
    }
    
    createAnalyticsCard(title, content) {
        const card = document.createElement('div');
        card.className = 'analytics-card';
        card.innerHTML = `<h3>${title}</h3>${content}`;
        return card;
    }
    
async showReports() {
    this.showScreen('resultScreen');
    await this.renderSuperpowerDashboard();
}
    
async renderSuperpowerDashboard() {
    try {
        // Update user greeting
        const userGreetingElement = document.getElementById('userGreeting');
        if (userGreetingElement) {
            userGreetingElement.textContent = `Here's your unique psychological profile, ${this.state.userName}!`;
        }

        // Step 1: Render Quick Stats
        this.renderQuickStats();

        // Step 2: Render Growth Plan
        this.renderGrowthPlan();

        // Step 3: Render MD Reports
        await this.renderMDReports();

    } catch (error) {
        console.error('Error rendering superpower dashboard:', error);
    }
}
    
async downloadPDFReport() {
    try {
        // Show loading state
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            const originalText = downloadBtn.textContent;
            downloadBtn.textContent = 'Generating PDF...';
            downloadBtn.disabled = true;
            
            // Collect all report content
            const reportsContent = {};
            for (const [category, result] of Object.entries(this.state.results)) {
                try {
                    const report = await ReportLoader.loadReport(category, result.level);
                    reportsContent[category] = this.stripHTML(report);
                } catch (error) {
                    console.error(`Error loading report for ${category}:`, error);
                    reportsContent[category] = `Report for ${category} - Level ${result.level} not available.`;
                }
            }
            
            // Get user data
            const userData = DataManager.getUserData(this.state.userId) || {
                demographics: this.state.demographics,
                responses: this.state.answers
            };
            
            // Generate PDF
            const success = await PDFGenerator.generateReport(
                userData, 
                this.state.results, 
                reportsContent
            );
            
            if (success) {
                console.log('PDF report generated successfully');
            }
            
            // Restore button state
            downloadBtn.textContent = originalText;
            downloadBtn.disabled = false;
        }
    } catch (error) {
        console.error('Error generating PDF report:', error);
        alert('Error generating PDF report. Please try again.');
        
        // Restore button state on error
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.textContent = 'Download Full Report';
            downloadBtn.disabled = false;
        }
    }
}

// ADD SUPERHERO METHODS HERE (outside downloadPDFReport)
renderQuickStats() {
    const quickStatsElement = document.getElementById('quickStats');
    if (!quickStatsElement) return;

    let statsHTML = '';

    // Calculate overall score
    const overallScore = Object.values(this.state.results).reduce((sum, result) => sum + result.overall, 0) / Object.keys(this.state.results).length;
    
    // Create stat cards for each category
    for (const [category, result] of Object.entries(this.state.results)) {
        const levelLabel = ScoringAlgorithm.getLevelLabel(result.level);
        const levelColor = ScoringAlgorithm.getLevelColor(result.level);
        
        statsHTML += `
            <div class="stat-card">
                <div class="stat-value" style="color: ${levelColor}">${result.overall.toFixed(1)}</div>
                <div class="stat-label">${category}</div>
                <div class="stat-level">${levelLabel}</div>
            </div>
        `;
    }

    // Add overall score card
    const overallLevel = ScoringAlgorithm.determineLevel(overallScore);
    const overallColor = ScoringAlgorithm.getLevelColor(overallLevel);
    
    statsHTML = `
        <div class="stat-card">
            <div class="stat-value" style="color: ${overallColor}">${overallScore.toFixed(1)}</div>
            <div class="stat-label">Overall Score</div>
            <div class="stat-level">${ScoringAlgorithm.getLevelLabel(overallLevel)}</div>
        </div>
    ` + statsHTML;

    quickStatsElement.innerHTML = statsHTML;
}

renderGrowthPlan() {
    const planStepsElement = document.getElementById('planSteps');
    if (!planStepsElement) return;

    // Find the category with lowest score for focus
    let lowestCategory = '';
    let lowestScore = 5; // Start with highest possible
    
    for (const [category, result] of Object.entries(this.state.results)) {
        if (result.overall < lowestScore) {
            lowestScore = result.overall;
            lowestCategory = category;
        }
    }

    const growthPlan = [
        { emoji: '📝', text: 'Daily: Practice 5 minutes of mindfulness meditation' },
        { emoji: '🎯', text: 'Weekly: Set one learning goal and track progress' },
        { emoji: '🔄', text: 'Bi-weekly: Review and reflect on your growth' },
        { emoji: '🌟', text: `Monthly: Focus on improving your ${lowestCategory} skills` }
    ];

    let planHTML = '';
    growthPlan.forEach((step, index) => {
        planHTML += `
            <div class="plan-step">
                <span class="step-emoji">${step.emoji}</span>
                <span class="step-text">${step.text}</span>
            </div>
        `;
    });

    planStepsElement.innerHTML = planHTML;
}

async renderMDReports() {
    const reportsContainer = document.getElementById('reportsContainer');
    if (!reportsContainer) return;

    let reportsHTML = '';

    for (const [category, result] of Object.entries(this.state.results)) {
        try {
            const rawReport = await ReportLoader.loadReport(category, result.level);
            const parsedReport = ReportParser.parseMarkdownReport(rawReport);
            const levelLabel = ScoringAlgorithm.getLevelLabel(result.level);
            
            reportsHTML += `
                <div class="report-card">
                    <div class="report-header" onclick="psychometricApp.toggleReport(this)">
                        <div class="report-title">
                            <span class="category-emoji">${this.getCategoryEmoji(category)}</span>
                            <span>${category} - ${levelLabel}</span>
                        </div>
                        <div class="report-expand">➕</div>
                    </div>
                    <div class="report-content">
                        ${this.renderParsedReport(parsedReport)}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error(`Error loading report for ${category}:`, error);
            // Fallback to raw content
            reportsHTML += this.createFallbackReport(category, result.level, rawReport);
        }
    }

    reportsContainer.innerHTML = reportsHTML;
}
renderParsedReport(parsedReport) {
    let html = '';
    
    // Hero Section
    if (parsedReport.title || parsedReport.description) {
        html += `
            <div class="report-hero">
                <h3>${parsedReport.title || ''}</h3>
                <p class="hero-description">${parsedReport.description || ''}</p>
            </div>
        `;
    }
    
    // Key Characteristics
    if (parsedReport.keyCharacteristics.length > 0) {
        html += this.renderSection('keyCharacteristics', parsedReport.keyCharacteristics);
    }
    
    // Daily Impact
    if (parsedReport.dailyImpact.length > 0) {
        html += this.renderSection('dailyImpact', parsedReport.dailyImpact);
    }
    
    // Development Strategy
    if (parsedReport.developmentStrategy.length > 0) {
        html += this.renderSection('developmentStrategy', parsedReport.developmentStrategy);
    }
    
    // Recommended Exercises
    if (parsedReport.recommendedExercises.length > 0) {
        html += this.renderSection('recommendedExercises', parsedReport.recommendedExercises);
    }
    
    return html;
}
renderSection(sectionName, items) {
    const icon = ReportParser.getSectionIcon(sectionName);
    const title = ReportParser.getSectionTitle(sectionName);
    
    let itemsHTML = '';
    
    if (sectionName === 'keyCharacteristics') {
        // Grid layout for characteristics
        itemsHTML = `
            <div class="trait-grid">
                ${items.map(item => `
                    <div class="trait-card">
                        <div class="trait-icon">${icon}</div>
                        <p>${item}</p>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        // List layout for other sections
        itemsHTML = `
            <div class="section-list">
                ${items.map(item => `
                    <div class="list-item">
                        <span class="list-bullet">•</span>
                        <span class="list-text">${item}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    return `
        <div class="report-section ${sectionName}">
            <div class="section-header">
                <span class="section-icon">${icon}</span>
                <h4>${title}</h4>
            </div>
            ${itemsHTML}
        </div>
    `;
}
createFallbackReport(category, level, rawContent) {
    const levelLabel = ScoringAlgorithm.getLevelLabel(level);
    
    return `
        <div class="report-card">
            <div class="report-header" onclick="psychometricApp.toggleReport(this)">
                <div class="report-title">
                    <span class="category-emoji">${this.getCategoryEmoji(category)}</span>
                    <span>${category} - ${levelLabel}</span>
                </div>
                <div class="report-expand">➕</div>
            </div>
            <div class="report-content">
                <div class="md-content">${rawContent || 'Report not available.'}</div>
            </div>
        </div>
    `;
}
getCategoryEmoji(category) {
    const emojis = {
        'Emotional': '🎭',
        'Resilience': '💪', 
        'Growth': '🌱',
        'Overthinking': '🤔'
    };
    return emojis[category] || '📊';
}
toggleReport(headerElement) {
    const reportCard = headerElement.parentElement;
    const reportContent = reportCard.querySelector('.report-content');
    const expandIcon = reportCard.querySelector('.report-expand');
    
    // Toggle expanded class
    reportCard.classList.toggle('expanded');
    
    // Toggle content visibility
    if (reportCard.classList.contains('expanded')) {
        reportContent.style.maxHeight = reportContent.scrollHeight + 'px';
        reportContent.classList.add('expanded');
        expandIcon.textContent = '➖';
    } else {
        reportContent.style.maxHeight = '0';
        reportContent.classList.remove('expanded');
        expandIcon.textContent = '➕';
    }
}
    
    // Helper method to strip HTML from reports
    stripHTML(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }
    
    refreshCurrentQuestion() {
        // Only refresh if we're on the question screen
        const questionScreen = document.getElementById('questionScreen');
        if (questionScreen && questionScreen.classList.contains('active')) {
            this.loadCurrentQuestion();
        }
    }
    
    restartTest() {
        if (confirm('Are you sure you want to start over? Your current progress will be lost.')) {
            // Clear current session
            if (this.state.userId) {
                DataManager.clearUserData(this.state.userId);
            }
            
            // Reset state
            this.state = {
                userId: null,
                userName: "",
                demographics: {},
                currentCategoryIndex: 0,
                currentSubcategoryIndex: 0,
                currentQuestionIndex: 0,
                answers: {},
                responseTimestamps: [],
                results: {},
                analytics: {}
            };
            
            // Reset form
            const userNameInput = document.getElementById('userName');
            if (userNameInput) userNameInput.value = "";
            
            const userAgeInput = document.getElementById('userAge');
            if (userAgeInput) userAgeInput.value = "";
            
            const userGenderSelect = document.getElementById('userGender');
            if (userGenderSelect) userGenderSelect.value = "";
            
            const userOccupationSelect = document.getElementById('userOccupation');
            if (userOccupationSelect) userOccupationSelect.value = "";
            
            this.showScreen('introScreen');
        }
    }
    
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }
    
    loadExistingSession() {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('psychometric_')) {
                    const userData = JSON.parse(localStorage.getItem(key));
                    if (userData && !userData.completed) {
                        const continueTest = confirm(
                            `We found an incomplete assessment for ${userData.demographics.name || 'a user'}. ` +
                            `Would you like to continue where you left off?`
                        );
                        
                        if (continueTest) {
                            this.state.userId = userData.userId;
                            this.state.demographics = userData.demographics;
                            this.state.answers = userData.responses || {};
                            this.state.responseTimestamps = userData.timestamps || [];
                            
                            // Find current position
                            this.findCurrentPosition();
                            this.showScreen('questionScreen');
                            this.loadCurrentQuestion();
                            return;
                        } else {
                            // Clear the incomplete session
                            DataManager.clearUserData(userData.userId);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading existing session:', error);
        }
    }
    
    findCurrentPosition() {
        const categories = QuestionManager.getCategories();
        
        for (let catIdx = 0; catIdx < categories.length; catIdx++) {
            const category = categories[catIdx];
            const subcategories = QuestionManager.getSubcategories(category);
            
            for (let subIdx = 0; subIdx < subcategories.length; subIdx++) {
                const subcategory = subcategories[subIdx];
                const questions = QuestionManager.getQuestions(category, subcategory);
                
                for (let qIdx = 0; qIdx < questions.length; qIdx++) {
                    const hasAnswer = this.state.answers[category] && 
                                     this.state.answers[category][subcategory] && 
                                     this.state.answers[category][subcategory][qIdx] !== undefined;
                    
                    if (!hasAnswer) {
                        this.state.currentCategoryIndex = catIdx;
                        this.state.currentSubcategoryIndex = subIdx;
                        this.state.currentQuestionIndex = qIdx;
                        return;
                    }
                }
            }
        }
        
        // If all questions are answered, go to results
        this.calculateResults();
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    window.psychometricApp = new PsychometricApp();
});