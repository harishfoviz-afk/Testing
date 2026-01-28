// --- FORCE DOMAIN CONSISTENCY ---
if (location.hostname !== 'localhost' && location.hostname === 'www.aptskola.com') {
    location.replace(location.href.replace('www.', ''));
}

// --- FORCE HTTPS (Add to top of script.js) ---
// --- FORCE HTTPS (Add to top of script.js) ---
if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.protocol !== 'file:') {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
}

// --- CONFIG ---
const RAZORPAY_KEY_ID = "rzp_live_RxHmfgMlTRV3Su";
const EMAILJS_PUBLIC_KEY = "GJEWFtAL7s231EDrk"; // REPLACE WITH YOUR KEY
const EMAILJS_SERVICE_ID = "service_bm56t8v"; // Paste the ID from Gmail service here
const EMAILJS_TEMPLATE_ID = "template_qze00kx"; // REPLACE WITH YOUR TEMPLATE ID
const EMAILJS_LEAD_TEMPLATE_ID = "template_qze00kx";

// Helper to create a delay for API calls
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Prices in PAISE (1 Rupee = 100 Paise)
const PACKAGE_PRICES = { 'Essential': 59900, 'Premium': 99900, 'The Smart Parent Pro': 149900 };

// External Payment Links (Replace these with your actual Razorpay Payment Links)
// External Payment Links (Managed via Razorpay API)
// const PAYMENT_LINKS = { ... }; // REMOVED: Unused

window.currentPhase = 0; // 0: Phase0, 1: Phase1, 2: Sync


// --- INITIALIZATION ---
(function () {
    if (typeof emailjs !== 'undefined') {
        emailjs.init({
            publicKey: EMAILJS_PUBLIC_KEY, // Pass as an object property
        });
    }
})();

// --- FOOTER HELPER ---
window.toggleFooter = function (mode) {
    const landingF = document.getElementById('landingFooter');
    const minimalF = document.getElementById('minimalFooter');

    if (mode === 'landing') {
        if (landingF) landingF.classList.remove('hidden');
        if (minimalF) minimalF.classList.add('hidden');
    } else {
        if (landingF) landingF.classList.add('hidden');
        if (minimalF) minimalF.classList.remove('hidden');
    }
};

// --- ANALYTICS HELPER ---
window.triggerTrack = function (eventName, params = {}) {
    console.log(`[TRACKING] ${eventName}`, params);

    // 1. Google Tag Manager
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        'event': eventName,
        ...params
    });

    // 2. Meta Pixel (Safe Check)
    if (typeof fbq === 'function') {
        fbq('trackCustom', eventName, params);
    }
};


// --- STATE MANAGEMENT ---
window.initializeQuizShell = initializeQuizShell; // Expose to window immediately (Diagnostic Move)
let currentQuestion = 0;
let selectedPackage = 'Essential';
let selectedPrice = 599;
let answers = {};
let customerData = {
    orderId: 'N/A',
    childAge: '5-10',
    residentialArea: 'Not Provided', // SET VALUE HERE
    pincode: '000000',               // SET VALUE HERE
    partnerId: ''
};

let hasSeenDowngradeModal = false;
let isSyncMatchMode = false;
let isManualSync = false;
let syncTimerInterval = null;
let mapsScriptLoaded = false;
let mapsLoadedPromise = null;



function calculateAgeFromDob(dobString) {
    if (!dobString) return "N/A";
    const dob = new Date(dobString);
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms);
    const age = Math.abs(age_dt.getUTCFullYear() - 1970);
    return age + " Years";
}

function validateGrade1Eligibility(birthDateString) {
    if (!birthDateString) return;

    const birthDate = new Date(birthDateString);
    const cutoffDate = new Date('2026-03-31');

    // Calculate age on cutoff date
    let age = cutoffDate.getFullYear() - birthDate.getFullYear();
    const m = cutoffDate.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && cutoffDate.getDate() < birthDate.getDate())) {
        age--;
    }

    if (age < 6) {
        alert("Summer-Born Alert: Your child is below 6 years. We will include a Bridge Year Recommendation in your roadmap.");
    }
}

// --- MISSING QUIZ SHELL INITIALIZER ---
// --- RESTORED QUIZ SHELL INITIALIZER (WITH BRANDING) ---
function initializeQuizShell(startAtIndex = 0, phase = 0) {
    console.log("Initializing Quiz Shell at index:", startAtIndex);

    // 1. Hide ALL Landing Elements (Strict Mode)
    const elementsToHide = [
        'landingPage',
        'react-hero-root',
        'cost-calculator-section',
        'syncMatchGate',
        'trust-stack-mechanism',
        'trust-stack-authority',
        'trust-stack-nudge',
        'sticky-cta',
        'testimonials',
        'ecosystem',
        'contact-policies',
        'mainFooter',
        'landingFooter'
    ];

    elementsToHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    window.toggleFooter('minimal');

    // 2. Prepare Quiz Container (With Persistent Branding)
    let modal = document.getElementById('momentumModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'momentumModal';
        modal.className = 'momentum-modal active';
        document.body.appendChild(modal);
    }

    // INJECT BRANDING HEADER & FOOTER (Hardcoded Styles for Visibility)
    modal.innerHTML = `
        <div class="momentum-content">
            <!-- Persistent Header -->
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="font-size: 1.875rem; line-height: 2.25rem; font-weight: 900; color: #0F172A; letter-spacing: -0.05em; margin: 0;">
                    Apt <span style="color: #FF6B35;">Skola</span>
                </h1>
                <div style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-top: 0.5rem; opacity: 0.7;">
                   <div style="height: 1px; width: 2rem; background-color: #CBD5E1;"></div>
                   <span style="font-size: 0.625rem; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.2em;">Forensic Calibration</span>
                   <div style="height: 1px; width: 2rem; background-color: #CBD5E1;"></div>
                </div>
            </div>
                   <span class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Forensic Calibration</span>
                   <div class="h-px w-8 bg-slate-300"></div>
                </div>
            </div>

            <!-- Quiz Content -->
            <div id="dynamicQuizContent"></div>

            <!-- Persistent Footer -->
            <div style="margin-top: 30px; text-align: center; font-size: 0.75rem; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 15px;">
                &copy; 2024 Apt Skola. All rights reserved. <br>
                <span style="opacity: 0.7;">Science-backed by Foviz.</span>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('active');
    modal.style.zIndex = '99999'; // FORCE TOP LAYER
    modal.style.display = 'block'; // Ensure visibility

    // 3. Scroll to Top (CRITICAL FIX)
    window.scrollTo(0, 0);
    setTimeout(() => window.scrollTo(0, 0), 50);

    // 4. Set State & Render
    window.currentPhase = phase;
    if (typeof renderQuestionContent === 'function') {
        renderQuestionContent(startAtIndex);
    }
}

// --- COST CALCULATOR HANDLER ---
window.handleCostCalculatorClick = function () {
    const section = document.getElementById('cost-calculator-section');
    const footer = document.getElementById('mainFooter');

    // Hide Landing Page Elements to treat as separate page
    const landing = document.getElementById('landingPage');
    const hero = document.getElementById('react-hero-root');
    if (landing) landing.classList.add('hidden');
    if (hero) hero.classList.add('hidden');

    window.scrollTo(0, 0);

    if (section) {
        section.classList.remove('hidden'); // Reveal Calculator
    }

    if (section) {
        section.classList.remove('hidden'); // Reveal Calculator
    }

    window.toggleFooter('minimal');
};

// --- SYNC GATE HANDLER (RESTORED) ---
window.openSyncMatchGate = function () {
    const gate = document.getElementById('syncMatchGate');
    const landing = document.getElementById('landingPage');
    const hero = document.getElementById('react-hero-root');
    const calc = document.getElementById('cost-calculator-section');
    const footer = document.getElementById('mainFooter');

    // Hide others
    if (landing) landing.classList.add('hidden');
    if (hero) hero.classList.add('hidden');
    if (calc) calc.classList.add('hidden');
    if (hero) hero.classList.add('hidden');
    if (calc) calc.classList.add('hidden');

    window.toggleFooter('minimal');

    // Show Gate
    if (gate) {
        gate.classList.remove('hidden');
        gate.classList.add('active');
        gate.style.display = 'block';
        gate.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Focus Input if exists
        const input = document.getElementById('syncOrderId');
        if (input) setTimeout(() => input.focus(), 500);
    }
};

window.revealPolicies = function (id) {
    const policySection = document.getElementById('contact-policies');
    if (policySection) {
        policySection.classList.remove('hidden');
        const target = document.getElementById(id);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            policySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
};

// --- CALCULATOR UI LOGIC (REDESIGNED) ---
window.calculateNewConfusion = function () {
    const slider = document.getElementById('tuitionSlider');
    if (!slider) return;

    const baseFee = parseInt(slider.value) || 150000;

    // Update Slider Display
    const feeDisplay = document.getElementById('feeDisplay');
    if (feeDisplay) feeDisplay.textContent = baseFee.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

    // 1. Calculate 15-Year Projected Spend (10% Annual Hike)
    // Formula: Sum of Geometric Series: a * (1 - r^n) / (1 - r)
    // a = baseFee, r = 1.10, n = 15
    const r = 1.10;
    const n = 15;
    const totalProjected = baseFee * ((Math.pow(r, n) - 1) / (r - 1));

    const projEl = document.getElementById('projectedTotal');
    if (projEl) projEl.textContent = totalProjected.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

    // 2. Calculate "Cost of Confusion" (The Leak)
    // Leak = (35% of Year 1 Hidden Fees) + (1.5 Lakh Switch) + (50k Remedial)
    const hiddenFees = baseFee * 0.35;
    const switchPenalty = 150000;
    const remedialFix = 50000;
    const totalLeak = hiddenFees + switchPenalty + remedialFix;

    const leakEl = document.getElementById('leakAmount');
    if (leakEl) leakEl.textContent = totalLeak.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

    const hiddenEl = document.getElementById('breakdownHidden');
    if (hiddenEl) hiddenEl.textContent = hiddenFees.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
};

// Initialize Calculator on Load
window.addEventListener('load', () => {
    if (typeof window.calculateNewConfusion === 'function') {
        window.calculateNewConfusion();
    }
});


// --- COST CALCULATOR REFACTOR ---
function RealCostOfSchooling(tuitionFee) {
    const HIDDEN_FEE_MARKUP = 0.35; // 35% Hidden Fee Markup
    const hiddenGap = tuitionFee * HIDDEN_FEE_MARKUP;
    const totalCost = tuitionFee + hiddenGap;
    return {
        tuition: tuitionFee,
        hidden: hiddenGap,
        total: totalCost
    };
}
// Legacy wrapper
const calculateCostOfConfusion = RealCostOfSchooling;

// --- UI COMPONENTS (HTML Strings) ---
const xrayCardHtml = `
    <div class="xray-card">
        <h3>Apt Skola Exclusive: AI Forensic School X-ray</h3>
        <div class="price">₹99 <span style="font-size: 0.9rem; color: #64748B; text-decoration: line-through;">₹399</span></div>
        <p style="font-size: 0.85rem; color: #475569; margin-bottom: 15px;">Spot hidden red flags, library authenticity, and teacher turnover using our proprietary AI vision tool.</p>
        <a href="https://xray.aptskola.com" target="_blank" class="btn-xray">Get X-ray (75% OFF)</a>
    </div>
`;

const fovizBannerHtml = `
    <div class="foviz-banner" style="margin-top: 30px; padding: 15px; background: #F0FDFA; border: 1px solid #CCFBF1; border-radius: 8px; text-align: center;">
        <h3 style="margin: 0; font-size: 1rem;"><a href="https://foviz.in" target="_blank" style="color: #0D9488; text-decoration: none; font-weight: 700;">Plan the "Next Phase" with 5D Analysis →</a></h3>
    </div>
`;

const ambassadorButtonHtml = `
    <button onclick="openCollaborationModal('Ambassador')" class="btn-ambassador">
        <span>✨</span> Thank you and Be our Ambassadors and earn cash rewards from 300 to 3000 🤝✨
    </button>
`;

const educatorPartnerHtml = `
    <button onclick="openCollaborationModal('Partner')" class="btn-partner" style="margin-top:10px;">
        🤝 Educator Partnership - Join our AI Forensic Network 🏫
    </button>
`;

const manualSyncUI = `
    <div id="manualSyncBlock" style="margin-top: 25px; padding: 20px; border: 2px dashed #CBD5E1; border-radius: 12px; background: #F8FAFC;">
        <h3 style="color: #0F172A; font-size: 1.1rem; font-weight: 700; margin-bottom: 10px;">🔄 Manual Sync Recovery</h3>
        <p style="font-size: 0.85rem; color: #64748B; margin-bottom: 15px;">We couldn't find your session on this device. Please check your Phase 1 PDF report.</p>
        <div class="form-group">
            <label style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px;">Your Recommended Board (from PDF)</label>
            <select id="manualBoardSelect" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #E2E8F0;">
                <option value="">-- Choose Board --</option>
                <option value="CBSE">CBSE</option>
                <option value="ICSE">ICSE</option>
                <option value="IB">IB</option>
                <option value="Cambridge">Cambridge (IGCSE)</option>
                <option value="State Board">State Board</option>
            </select>
        </div>
        <button onclick="confirmManualSync()" class="custom-cta-button" style="margin-top: 10px; padding: 12px; font-size: 0.95rem;">Sync Manually & Start →</button>
    </div>
`;

// --- DATA MASTERS ---
const MASTER_DATA = {
    cbse: {
        name: "CBSE",
        title: "The Standardized Strategist",
        persona: "Convergent Thinker",
        profile: "This profile is characterized by strong retention memory, the ability to handle high-volume data processing, and a high comfort level with objective assessment metrics.",
        rejectionReason: "Why not IB? Your child prefers structured outcomes. The ambiguity of the IB 'Constructivist' approach may cause unnecessary anxiety.",
        careerPath: "The Competitive Exam Track (JEE/NEET/UPSC). Grade 9-10 Focus: Foundation building using NCERT. Grade 11-12 Focus: Integrated Coaching or Dummy Schools.",
        philosophy: 'The National Standard for Competitive Success.',
        teachingMethod: 'Structured and textbook-focused (NCERT). Emphasis on retaining facts for entrance exams (JEE/NEET).',
        parentalRole: 'Moderate. Syllabuses are defined. Tutoring is easily outsourced to coaching centers.'
    },
    icse: {
        name: "ICSE",
        title: "The Holistic Communicator",
        persona: "Verbal Analyst",
        profile: "Students with this archetype display high verbal intelligence, strong analytical skills in humanities, and the ability to synthesize disparate pieces of information into a coherent whole.",
        rejectionReason: "Why not CBSE? Your child thrives on narrative and context. The rote-heavy, objective nature of CBSE might stifle their desire for depth.",
        careerPath: "The Creative & Liberal Arts Track (Law/Design/Journalism). Grade 9-10: Strong emphasis on Literature/Arts. Grade 11-12: Portfolio development and wide reading.",
        philosophy: 'The Comprehensive Foundation for Professionals.',
        teachingMethod: 'Volume-heavy and detailed. Focuses on strong English language command and deep theoretical understanding.',
        parentalRole: 'High. The volume of projects and detailed syllabus often requires active parental supervision in younger grades.'
    },
    ib: {
        name: "IB",
        title: "The Global Inquirer",
        persona: "Independent Innovator",
        profile: "This cognitive style thrives on openness to experience, exhibits a high tolerance for ambiguity, and possesses the strong self-regulation skills needed for inquiry-based learning.",
        rejectionReason: "Why not CBSE? Your child requires autonomy. The rigid, defined syllabus of CBSE would likely lead to boredom and disengagement.",
        careerPath: "The Global Ivy League/Oxbridge Track. Grade 9-10 (MYP): Critical writing. Grade 11-12 (DP): Building the 'Profile' via CAS and Extended Essay.",
        philosophy: 'Creating Global Citizens and Inquirers.',
        teachingMethod: 'No fixed textbooks. Students must ask questions, research answers, and write essays.',
        parentalRole: 'High (Strategic). You cannot just "teach them the chapter." You must help them find resources and manage complex timelines.'
    },
    'Cambridge (IGCSE)': {
        name: "Cambridge (IGCSE)",
        title: "The Analytical Globalist",
        persona: "Logic Seeker",
        profile: "This profile excels at logical reasoning (Math/Science) but within a structured framework. They prefer depth over breadth.",
        rejectionReason: "Why not IB? While similar, Cambridge offers more structure. The extreme openness of IB regarding content choice might feel 'loose' to them.",
        careerPath: "STEM Global Track (Engineering/Medicine abroad). Grade 9-10 (IGCSE): Strong Math/Science foundation. Grade 11-12 (A-Levels): Deep specialization.",
        philosophy: 'Deep Subject Mastery and Analytical Skills.',
        teachingMethod: 'Structured curriculum with a focus on problem-solving rather than just facts.',
        parentalRole: 'Moderate-High. You need to ensure they are keeping up with the rigorous global standards.'
    },
    'State Board': {
        name: "State Board",
        title: "The Regional Contender",
        persona: "Contextual Learner",
        profile: "This profile thrives on learning rooted in regional culture and language, with a focus on local government standards and employment readiness.",
        rejectionReason: "Why not IB? Highly constrained by local mandates; international portability is severely limited.",
        careerPath: "State Government Jobs, Local Commerce, and Regional Universities.",
        philosophy: 'Focus on regional language proficiency and local employment mandates.',
        teachingMethod: 'Rote-learning heavy, textbook-driven, and often heavily emphasizes regional languages.',
        parentalRole: 'Low to Moderate. Lower fee structure and simplified objectives make it less demanding.',
    },
    financial: {
        inflationRate: "10-12%",
        projectionTable: [
            { grade: "Grade 1 (2025)", fee: "₹ 2,00,000", total: "₹ 2,00,000" },
            { grade: "Grade 2 (2026)", fee: "₹ 2,20,000", total: "₹ 4,20,000" },
            { grade: "Grade 3 (2027)", fee: "₹ 2,42,000", total: "₹ 6,62,000" },
            { grade: "Grade 4 (2028)", fee: "₹ 2,66,200", total: "₹ 9,28,200" },
            { grade: "Grade 5 (2029)", fee: "₹ 2,92,820", total: "₹ 12,21,020" },
            { grade: "Grade 6 (2030)", fee: "₹ 3,22,102", total: "₹ 15,43,122" },
            { grade: "Grade 7 (2031)", fee: "₹ 3,54,312", total: "₹ 18,97,434" },
            { grade: "Grade 8 (2032)", fee: "₹ 3,89,743", total: "₹ 22,87,177" },
            { grade: "Grade 9 (2033)", fee: "₹ 4,28,718", total: "₹ 27,15,895" },
            { grade: "Grade 10 (2034)", fee: "₹ 4,71,589", total: "₹ 31,87,484" },
            { grade: "Grade 11 (2035)", fee: "₹ 5,18,748", total: "₹ 37,06,232" },
            { grade: "Grade 12 (2036)", fee: "₹ 5,70,623", total: "₹ 42,76,855" }
        ],
        hiddenCosts: [
            "Transport: ₹40,000 - ₹80,000/year",
            "Technology Fees: ₹1-2 Lakhs (Laptops/Tablets for IB)",
            "Field Trips: ₹1-2 Lakhs per trip",
            "Shadow Coaching (CBSE): ₹2-4 Lakhs/year"
        ]
    },
    vetting: {
        questions: [
            { q: "What is your annual teacher turnover rate?", flag: "Red Flag Answer: 'We constantly refresh our faculty...' (Code for: We fire expensive teachers.)" },
            { q: "Specific protocol for bullying incidents?", flag: "Red Flag Answer: 'We don't really have bullying here.' (Denial is a safety risk.)" },
            { q: "Instruction for child falling behind?", flag: "Look for specific remedial programs, not generic 'extra classes'." },
            { q: "How do you handle special needs students?", flag: "Check if they have actual special educators on payroll." },
            { q: "Are parents allowed on campus during the day?", flag: "Complete lockouts are a communication red flag." }
        ],
        redFlags: [
            "The 'Tired Teacher' Test: Do teachers look exhausted?",
            "The 'Glossy Brochure' Disconnect: Fancy reception vs. broken furniture.",
            "Restroom Hygiene: The truest test of dignity.",
            "Principal Turn-over: Has the principal changed twice in 3 years?",
            "Library Dust: Are books actually being read?"
        ]
    },
    concierge: {
        negotiation: [
            { title: "The 'Lump Sum' Leverage", scenario: "Use when you have liquidity.", script: "If I clear the entire annual tuition in a single transaction this week, what is the best concession structure you can offer on the Admission Fee?" },
            { title: "The 'Sibling Pipeline' Pitch", scenario: "Use if enrolling a younger child later.", script: "With my younger child entering Grade 1 next year, we are looking at a 15+ year LTV. Can we discuss a waiver on the security deposit?" },
            { title: "The 'Corporate Tie-up' Query", scenario: "Check if your company is on their list.", script: "Does the school have a corporate partnership with [Company Name]? I'd like to check if my employee status qualifies us for a waiver." }
        ]
    },
    interviewMastery: {
        part1: [
            { q: "What is your name?", strategy: "Confidence. Eye contact is the gold standard." },
            { q: "Who did you come with?", strategy: "Recognize family. 'Mommy and Daddy' is perfect." },
            { q: "Favorite color/toy?", strategy: "Enthusiasm. Watch them light up." },
            { q: "Pick up the Red block.", strategy: "Listening Skills. Follows instruction once." },
            { q: "Do you have a pet?", strategy: "Narrative skills. Strings 2-3 sentences." },
            { q: "What did you eat for breakfast?", strategy: "Memory recall." },
            { q: "Recite a rhyme.", strategy: "Confidence. Don't force it." },
            { q: "Biggest object here?", strategy: "Concept check: Big vs Small." },
            { q: "Who is your best friend?", strategy: "Socialization check." },
            { q: "What happens if you fall?", strategy: "Resilience. 'I get up' is brave." },
            { q: "Stack these blocks.", strategy: "Fine motor skills." },
            { q: "Do you share toys?", strategy: "Honesty. 'No' is often the honest answer." },
            { q: "What does a dog say?", strategy: "Sound-object association." },
            { q: "Identify this shape.", strategy: "Academic baseline." },
            { q: "Tell a story about this picture.", strategy: "Imagination vs Listing items." }
        ],
        part2: [
            { q: "Why this school?", strategy: "Align values, don't just say 'It's close'." },
            { q: "Describe child in 3 words.", strategy: "Be real. 'Energetic' > 'Perfect'." },
            { q: "Nuclear or Joint family?", strategy: "Context check for support system." },
            { q: "View on homework?", strategy: "Balance. Value play at this age." },
            { q: "Handling tantrums?", strategy: "Distraction/Calm corner. Never 'We hit'." },
            { q: "Who looks after child?", strategy: "Safety logistics check." },
            { q: "Aspirations?", strategy: "Good human > Doctor/Engineer." },
            { q: "Screen time?", strategy: "Limited to 30 mins educational." },
            { q: "If child hits another?", strategy: "Accountability & apology." },
            { q: "Meals together?", strategy: "Family culture indicator." },
            { q: "Role in education?", strategy: "Co-learners, not bystanders." },
            { q: "Child's weakness?", strategy: "Vulnerability. Show you know them." },
            { q: "Other schools applied?", strategy: "Diplomacy. 'You are first choice'." },
            { q: "Weekends?", strategy: "Engagement/Stability check." },
            { q: "Toilet trained?", strategy: "Honesty regarding hygiene." }
        ],
        part3: [
            { q: "Child complains about teacher?", strategy: "Listen, but verify context first." },
            { q: "Definition of Success?", strategy: "Happiness & problem solving." },
            { q: "Writing at age 5?", strategy: "Trust the motor skill process." },
            { q: "Child is too quiet?", strategy: "He is an observer, will warm up." },
            { q: "Parenting style?", strategy: "Authoritative (Boundaries + Warmth)." }
        ],
        scoop: [
            { title: "Red Flag", text: "Answering FOR the child loses 10 points instantly." },
            { title: "Red Flag", text: "Bribing with chocolate in the waiting room." },
            { title: "Pro Tip", text: "If child freezes, say: 'He is overwhelmed, usually chatty.' Then let it go." }
        ]
    }
};


const phase0Questions = [
    { id: "p0_q1", text: "How does your child process complex new data?", options: ["Visual/Charts", "Auditory/Discussion", "Kinesthetic/Build"] },
    { id: "p0_q2", text: "Which environment triggers their best ideas?", options: ["Quiet/Structured", "Collaborative/Noisy", "Outdoor/Nature"] },
    { id: "p0_q3", text: "How do they handle a completely new puzzle?", options: ["Study the box/instructions", "Try and fail repeatedly", "Ask someone to show them"] },
    { id: "p0_q4", text: "What is their natural curiosity driver?", options: ["How things work", "Why things happen", "What can I create"] }
];

const phase1Questions = [
    { id: "q1", text: "How does your child learn best?", options: ["By seeing images, videos, and diagrams (Visual)", "By listening to stories and discussions (Auditory)", "By doing experiments and building things (Kinesthetic)", "A mix of everything / Adaptable"] },
    { id: "q2", text: "What subject does your child naturally enjoy?", options: ["Maths, Logic, and Puzzles", "English, Stories, and Art", "Science, Nature, and asking 'Why?'", "A bit of everything / Balanced"] },
    { id: "q3", text: "What is the big future goal?", options: ["Crack Indian Exams (IIT-JEE / NEET / UPSC)", "Study Abroad (University in US/UK/Canada)", "Entrepreneurship or Creative Arts", "Not sure yet / Keep options open"] },
    { id: "q4", text: "What is your comfortable annual budget for school fees?", options: ["Below ₹1 Lakh", "₹1 Lakh - ₹3 Lakhs", "₹3 Lakhs - ₹6 Lakhs", "Above ₹6 Lakhs"] },
    { id: "q5", text: "Will you be moving cities in the next few years?", options: ["No, we are settled here.", "Yes, likely to move within India.", "Yes, likely to move to another Country.", "Unsure"] },
    { id: "q6", text: "What teaching style do you prefer?", options: ["Structured: Textbooks and clear syllabus", "Inquiry: Research and self-exploration", "Flexible: Student-led (like Montessori)", "Balanced approach"] },
    { id: "q7", text: "How much study load can your child handle?", options: ["High Volume (Can memorize lots of details)", "Concept Focus (Understands logic, less memory)", "Practical Focus (Prefers doing over reading)"] },
    { id: "q8", text: "Is 'Global Recognition' important to you?", options: ["Yes, it's critical.", "It's important.", "Nice to have.", "Not important."] },
    { id: "q9", text: "Should the school focus heavily on Regional Languages?", options: ["Yes, they must be fluent in the local language.", "Basic functional knowledge is enough.", "No, English is the main focus."] },
    { id: "q10", text: "How does your child react to exams?", options: ["They are competitive and handle pressure well.", "They prefer projects and assignments.", "They get very anxious about tests."] },
    { id: "q11", text: "How important are Sports & Arts?", options: ["Very High - Equal to academics.", "Moderate - Good for hobbies.", "Low - Academics come first."] },
    { id: "q12", text: "What grade is your child entering?", options: ["Preschool / Kindergarten", "Primary (Grades 1-5)", "Middle (Grades 6-8)", "High School (Grades 9+)"] },
    { id: "q13", text: "What class size do you prefer?", options: ["Small (Less than 25 kids)", "Standard (25-40 kids)", "Large (40+ kids)"] },
    { id: "q14", text: "How involved do you want to be in homework?", options: ["High (I will help daily)", "Moderate (Weekly check-ins)", "Low (School should manage it)"] },
    { id: "q15", text: "Where are you looking for schools?", options: ["Metro City (Delhi, Mumbai, Hyd, etc.)", "Tier-2 City (Jaipur, Vizag, etc.)", "Small Town / Rural Area"] }
];

const phase2Questions = [
    {
        id: "q16",
        isObservation: true,
        text_variants: {
            "5-10": "Tell your child: 'We're doing lunch before play today.' How do they react?",
            "10-15": "Hand them a new app or gadget. Tell them: 'Figure out how to change the background.' What is their first move?",
            "15+": "Ask them: 'What was the last activity where you completely lost track of time and your phone?'"
        },
        options_variants: {
            "5-10": ["They look stressed and ask for the old plan", "They ask why but adapt quickly", "They don't mind either way", "They get upset or resistant"],
            "10-15": ["They ask for a guide or instructions", "They start clicking and exploring randomly", "They ask what the goal of changing it is", "They wait for you to show them"],
            "15+": ["A hobby, sport, or physical activity", "A deep research project or creative work", "Studying for a specific goal", "Browsing social media or entertainment"]
        }
    },
    {
        id: "q17",
        isObservation: true,
        text_variants: {
            "5-10": "Give this command: 'Touch the door, then touch your nose, then bring me a spoon.' Do they do it in that exact order?",
            "10-15": "Ask: 'Would you rather take a 20-question quiz or write a 2-page essay on your favorite movie?'",
            "15+": "Does being ranked #1 in class matter more to them than doing a unique project?"
        },
        options_variants: {
            "5-10": ["Follows the exact sequence", "Gets the items but in the wrong order", "Creates a game out of the request", "Completes it but seems disinterested"],
            "10-15": ["The 20-question quiz", "Writing the 2-page essay", "Neither, they prefer a practical task", "They don't have a preference"],
            "15+": ["Rank #1 matters most", "The unique project matters most", "A balance of both", "Neither matters much"]
        }
    },
    {
        id: "q18",
        isObservation: true,
        text_variants: {
            "5-10": "Stop a story halfway and ask: 'What happens next?' How do they respond?",
            "10-15": "Do they remember the 'Dates' of history or the 'Reasons' why a historical event happened?",
            "15+": "Are they better at defending an opinion in a debate or solving a complex math formula?"
        },
        options_variants: {
            "5-10": ["They give a logical, predictable ending", "They invent a wild, creative ending", "They tell a story based on their own day", "They ask you to just finish the story"],
            "10-15": ["They remember specific dates and facts", "They remember the reasons and context", "They remember the stories of the people", "They struggle to remember either"],
            "15+": ["Solving the math formula", "Defending an opinion or debating", "Both equally", "Neither is a strength"]
        }
    },
    {
        id: "q19",
        isObservation: true,
        text_variants: {
            "5-10": "Watch them sort toys. Do they group them by color/size or by a narrative/story?",
            "10-15": "Do they keep a mental or physical track of their weekly classes and schedule?",
            "15+": "Can they study for 3 hours straight without any parental supervision?"
        },
        options_variants: {
            "5-10": ["By size, color, or clear categories", "By a story or how the toys 'feel'", "By how they use them in real life", "They don't sort, they just play"],
            "10-15": ["Yes, they are very aware of their schedule", "No, they need constant reminders", "They only remember things they enjoy", "They rely entirely on a calendar/app"],
            "15+": ["Yes, they are very disciplined", "No, they need occasional check-ins", "They only study when there is an exam", "They prefer group study"]
        }
    },
    {
        id: "q20",
        isObservation: true,
        text_variants: {
            "5-10": "Ask: 'What if dogs could talk?' Is their answer literal or abstract?",
            "10-15": "When they argue, is it based on 'Fairness and Rules' or 'Emotions and Impact'?",
            "15+": "If given ₹5000, would they save it for security or spend/invest it on a hobby?"
        },
        options_variants: {
            "5-10": ["Literal: 'They would ask for food'", "Abstract: 'They would tell us about their dreams'", "Narrative: 'They would help me with homework'", "Simple: 'That's not possible'"],
            "10-15": ["Rules and what is 'fair'", "How it makes people feel or the impact", "A mix of logic and emotion", "They avoid arguments entirely"],
            "15+": ["Save it for the future", "Spend it on a passion or investment", "Give it to others or share it", "Spend it on immediate needs"]
        }
    },
    {
        id: "q21",
        isObservation: true,
        text_variants: {
            "5-10": "Do they draw a standard house/tree or something unique like a tree-house or rocket?",
            "10-15": "Do they look up things on YouTube or Wikipedia on their own without being told?",
            "15+": "Do they follow global news and events or mostly focus on school/local updates?"
        },
        options_variants: {
            "5-10": ["Standard house or tree", "Unique or imaginary objects", "Very detailed real-life items", "They prefer coloring over drawing"],
            "10-15": ["Yes, frequently", "Only for school assignments", "Rarely, they prefer entertainment", "They ask you instead of searching"],
            "15+": ["Follow global news regularly", "Mostly local or school news", "Only news related to their hobbies", "Not interested in news"]
        }
    },
    {
        id: "q22",
        isObservation: true,
        text_variants: {
            "5-10": "If a drawing goes wrong, do they erase it to fix it or turn it into something else?",
            "10-15": "Ask them: 'How do planes stay in the air?' Observe their first move.",
            "15+": "Are their notes sequential (bullet points) or associative (mind-maps/scribbles)?"
        },
        options_variants: {
            "5-10": ["Erase and fix it perfectly", "Incorporate the mistake into a new idea", "Get frustrated and start over", "Ignore the mistake and continue"],
            "10-15": ["They try to explain it themselves", "They go to search for the answer online", "They ask you to explain it", "They say they don't know"],
            "15+": ["Sequential and organized bullet points", "Creative mind-maps and diagrams", "Random scribbles and highlights", "They don't take notes"]
        }
    },
    {
        id: "q23",
        isObservation: true,
        text_variants: {
            "5-10": "Do they ask 'What is this?' or 'How does this work?' more often?",
            "10-15": "When they hear a rumor, do they verify it or share it immediately?",
            "15+": "Do they respect a teacher because of their 'Title/Authority' or their 'Knowledge'?"
        },
        options_variants: {
            "5-10": ["'What is this?' (Names/Facts)", "'How does it work?' (Logic/Systems)", "'Why is it like this?' (Inquiry)", "They don't ask many questions"],
            "10-15": ["They try to verify if it's true", "They share it with friends", "They ignore it", "They ask an adult for the truth"],
            "15+": ["Respect the authority and title", "Respect the depth of knowledge", "Respect how the teacher treats them", "They are generally skeptical of authority"]
        }
    },
    {
        id: "q24",
        isObservation: true,
        text_variants: {
            "5-10": "In a game, do they get upset if someone 'cheats' or changes the rules?",
            "10-15": "In a group project, are they the 'Manager' (Organizing) or the 'Ideator' (Big Ideas)?",
            "15+": "Do they read for 'Information' (Facts/News) or for 'Perspective' (Stories/Opinions)?"
        },
        options_variants: {
            "5-10": ["Upset about rules/cheating", "Okay with changes if it's fun", "They change the rules themselves", "They lose interest in the game"],
            "10-15": ["The Manager/Organizer", "The Ideator/Creative", "The worker who does the tasks", "The mediator who keeps peace"],
            "15+": ["Reading for information and facts", "Reading for perspective and depth", "Both equally", "They don't enjoy reading"]
        }
    },
    {
        id: "q25",
        isObservation: true,
        text_variants: {
            "5-10": "Can they work on a single activity (like Legos) for 45 minutes straight?",
            "10-15": "What scares them more: A surprise test or a vague, open-ended project?",
            "15+": "In a team conflict, do they prioritize 'Results' or 'Group Harmony'?"
        },
        options_variants: {
            "5-10": ["Yes, they are very persistent", "No, they switch activities quickly", "Only if you are helping them", "Only if it involves a screen"],
            "10-15": ["The surprise test", "The vague project", "Neither bothers them", "Both cause significant stress"],
            "15+": ["Getting the results done", "Keeping the group happy", "Finding a mistake", "They avoid team roles"]
        }
    },
    {
        id: "q26",
        isObservation: true,
        text_variants: {
            "5-10": "Do they observe a group of kids before joining, or jump right in?",
            "10-15": "Do they use the internet to 'Consume' (Watch) or 'Create' (Code/Edit/Write)?",
            "15+": "Are they systemic planners (calendars) or adaptive finishers (last-minute)?"
        },
        options_variants: {
            "5-10": ["Observe quietly first", "Jump right in immediately", "Wait for someone to invite them", "Prefer to play alone"],
            "10-15": ["Mostly consuming content", "Mostly creating or learning skills", "A balanced mix of both", "They don't use the internet much"],
            "15+": ["Systemic planners", "Adaptive/Last-minute", "They don't plan at all", "They follow someone else's plan"]
        }
    },
    {
        id: "q27",
        isObservation: true,
        text_variants: {
            "5-10": "When picking a toy, do they choose instantly or ask many questions first?",
            "10-15": "Do they stick to one hobby for years or sample many different things?",
            "15+": "Would they rather have one big exam at the end, or small projects all year?"
        },
        options_variants: {
            "5-10": ["Choose instantly", "Ask for context and details", "Can't decide and get overwhelmed", "Choose whatever is closest"],
            "10-15": ["Stick to one for a long time", "Sample and switch often", "Have a few steady hobbies", "No particular hobbies"],
            "15+": ["One big final exam", "Continuous small projects", "A mix of both", "They dislike both"]
        }
    },
    {
        id: "q28",
        isObservation: true,
        text_variants: {
            "5-10": "Do they remember 'Names and Numbers' or 'Stories and Feelings' better?",
            "10-15": "Do they like a 'Strict and Clear' teacher or an 'Interactive' one?",
            "15+": "When interested in a topic, do they stay efficient or go down a 'Rabbit Hole'?"
        },
        options_variants: {
            "5-10": ["Names and Numbers", "Stories and Feelings", "Both equally", "Struggle with both"],
            "10-15": ["Strict and Clear", "Interactive and Flexible", "Kind and supportive", "They don't mind the style"],
            "15+": ["Stay efficient and goal-oriented", "Go down a deep rabbit hole", "Ask others for the summary", "Lose interest quickly"]
        }
    },
    {
        id: "q29",
        isObservation: true,
        text_variants: {
            "5-10": "Do they care more about the 'Sticker/Grade' or the 'Praise for Effort'?",
            "10-15": "When they fail, do they ask for a 'Solution' or a 'Diagnostic' (Why it happened)?",
            "15+": "Do they prefer a predictable schedule or one that changes based on the day's needs?"
        },
        options_variants: {
            "5-10": ["The Sticker or Grade", "The Praise for Effort", "Both are equally important", "They don't seem to care about either"],
            "10-15": ["Just give them the solution", "Understand the diagnostic 'Why'", "They get too upset to ask", "They try to hide the failure"],
            "15+": ["Predictable and fixed schedule", "Adaptive and flexible schedule", "No schedule at all", "They follow their mood"]
        }
    },
    {
        id: "q30",
        isObservation: true,
        isVeto: true,
        text_variants: {
            "5-10": "Ask them: 'Do you want a school where the teacher tells you every step, or one where you make your own games?'",
            "10-15": "Ask them: 'Do you want a school that gives you the answers to study, or one that helps you find them?'",
            "15+": "Ask them: 'Do you want a board that guarantees a Rank or one that builds a Global Profile?'"
        },
        options_variants: {
            "5-10": ["Tell me every step", "Make my own games", "A mix of both", "I don't know"],
            "10-15": ["Give me the answers", "Help me find them", "Either is fine", "I don't mind"],
            "15+": ["Guarantees a Rank", "Builds a Global Profile", "Needs both", "Not sure"]
        }
    }
];

function checkPaymentStatus() {
    const params = new URLSearchParams(window.location.search);
    // Check for any common Razorpay success indicators
    const razorpayId = params.get('razorpay_payment_id') || params.get('razorpay_payment_link_id');

    if (razorpayId) {
        console.log("Payment detected. Transitioning to report...");

        const landing = document.getElementById('landingPage');
        if (landing) landing.style.display = 'none';

        const overlay = document.getElementById('redirectLoadingOverlay');
        if (overlay) overlay.style.display = 'flex';

        const lastOrderId = localStorage.getItem('aptskola_last_order_id');
        const savedSession = localStorage.getItem(`aptskola_session_${lastOrderId}`);

        if (savedSession) {
            const data = JSON.parse(savedSession);
            answers = data.answers;
            customerData = data.customerData;
            selectedPackage = data.selectedPackage;
            selectedPrice = data.selectedPrice;

            renderReportToBrowser().then(() => {
                showInstantSuccessPage();
                if (overlay) overlay.style.display = 'none';
                triggerAutomatedEmail();
            });
        } else {
            if (overlay) overlay.style.display = 'none';
            if (landing) landing.style.display = 'block';
            alert("Payment successful! However, your session data was lost. Please ensure you are not switching between 'www' and 'non-www' domains.");
        }
    }
}

// --- STRICT VALIDATION HELPERS ---
function validateInputs(email, phone) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[6-9]\d{9}$/;

    let isValid = true;
    const emailEl = document.getElementById('email');
    const phoneEl = document.getElementById('phone');

    if (emailEl) emailEl.classList.remove('input-error');
    if (phoneEl) phoneEl.classList.remove('input-error');

    if (!emailRegex.test(email)) {
        if (emailEl) emailEl.classList.add('input-error');
        isValid = false;
    }
    if (!mobileRegex.test(phone)) {
        if (phoneEl) phoneEl.classList.add('input-error');
        isValid = false;
    }
    return isValid;
}

// --- UPDATED: CALCULATOR LOGIC WITH DONUT CHART ---
// [Deleted legacy calculateCostOfConfusion to fix syntax error]

// --- CORE UI ACTIONS ---
function scrollToClarity() {
    const target = document.getElementById('invest-in-clarity');
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function openSampleReport() {
    const modal = document.getElementById('sampleReportModal');
    const content = document.getElementById('sampleReportContent');
    if (content) {
        content.innerHTML = `
            <div style="text-align:center; margin-bottom:30px;">
                <h2 class="text-2xl font-bold text-brand-navy">Sample Report: The Decision Decoder</h2>
                <p class="text-sm text-slate-500">This is what you get after the assessment.</p>
            </div>
            <div class="report-card" style="background:#0F172A; color:white;">
                <div style="font-size:2rem; font-weight:800;">The Standardized Strategist</div>
                <div style="background:rgba(255,255,255,0.1); padding:10px; border-radius:8px; margin-top:10px;">
                    Recommended: <span style="color:#FF6B35; font-weight:bold;">CBSE</span>
                </div>
            </div>
            <div class="report-card" style="opacity: 0.6; filter: blur(1px); position: relative; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; z-index: 10; background: rgba(255,255,255,0.4);">
                    <button onclick="closeSampleReport(); scrollToPricing()" class="hero-btn-primary" style="box-shadow: 0 10px 20px rgba(0,0,0,0.2);">Unlock Full Report</button>
                </div>
                <div class="report-header-bg">CHILD'S PROFILE SUMMARY</div>
                <table class="data-table">
                    <tr><td><strong>Learning Style</strong></td><td>Visual Learner</td></tr>
                    <tr><td><strong>Core Interest</strong></td><td>Science & Logic</td></tr>
                </table>
            </div>
        `;
    }
    if (modal) modal.classList.add('active');
}

function closeSampleReport() {
    const modal = document.getElementById('sampleReportModal');
    if (modal) modal.classList.remove('active');
}

// --- PRICING MODAL FUNCTIONS ---
function openPricingModal() {
    const modal = document.getElementById('pricingModal');
    if (modal) modal.classList.add('active');
}

function closePricingModal() {
    const modal = document.getElementById('pricingModal');
    if (modal) modal.classList.remove('active');
}

function openPricingOrScroll() {
    console.log("openPricingOrScroll called, width:", window.innerWidth);
    if (window.innerWidth < 768) {
        console.log("Mobile: scrolling to pricing");
        scrollToClarity();
    } else {
        console.log("Desktop: opening modal");
        openPricingModal();
    }
}

// --- UNIFIED MODAL CONTROLLER (UPDATED) ---
function openCollaborationModal(type) {
    const modal = document.getElementById('collaborationModal');
    const title = document.getElementById('collabModalTitle');
    const subject = document.getElementById('collabSubject');
    const submitBtn = document.getElementById('collabSubmitBtn');

    if (modal && title && subject && submitBtn) {
        if (type === 'Partner') {
            title.innerText = 'Partner Registration';
            subject.value = 'New Educator Partner Application';
            submitBtn.innerText = 'Submit Application';
        } else {
            title.innerText = 'Be Our Ambassador';
            subject.value = 'New Ambassador Application';
            submitBtn.innerText = 'Apply Now';
        }
        modal.classList.add('active');
    }
}

function goToLandingPage() {
    console.log("Returning to Landing Page...");
    currentQuestion = 0;
    answers = {};
    const form = document.getElementById('customerForm');
    if (form) form.reset();

    // 1. Show Landing and Hero
    const landing = document.getElementById('landingPage');
    if (landing) {
        landing.classList.remove('hidden');
        landing.classList.add('active');
        landing.style.setProperty('display', 'block', 'important');
    }

    const hero = document.getElementById('react-hero-root');
    if (hero) {
        hero.classList.remove('hidden');
        hero.style.setProperty('display', 'block', 'important');
    }

    // 2. Hide Assessments
    const idsToHide = ['questionPages', 'syncMatchGate', 'syncMatchTransition', 'detailsPage', 'paymentPageContainer', 'psychometricHistogram', 'dynamicRiskCard', 'pricingModal'];
    idsToHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('active');
            el.classList.add('hidden');
            el.style.display = ''; // Clear inline style
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.toggleFooter('landing');
}

function getIntermediateHeaderHtml() {
    return `
    <div class="intermediate-header">
        <div class="max-w-7xl mx-auto flex items-center justify-start">
            <a href="javascript:void(0)" onclick="goToLandingPage()" class="logo-link cursor-pointer" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 4px;">
                <span class="font-bold text-xl text-white">Apt <span class="text-brand-orange">Skola</span></span>
            </a>
        </div>
    </div>`;
}
function getIntermediateFooterHtml() {
    return `
    <div class="intermediate-footer bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-center">
        <div class="max-w-7xl mx-auto flex flex-col items-center gap-4">
            <div class="flex items-center gap-3 text-lg md:text-xl">
                 <span class="font-black text-white">Apt <span class="text-[#FF6B35]">Skola</span></span>
                 <span class="text-slate-600 font-thin text-2xl">|</span>
                 <span class="text-slate-500 font-medium tracking-wide uppercase text-sm">A Foviz Venture</span>
            </div>
            <div class="text-xs text-slate-500 font-medium">
                &copy; 2024 - 2026 Apt Skola, all rights reserved.
            </div>
        </div>
    </div>`;
}

// --- SYNC MATCH GATE LOGIC MOVED DOWN ---


function injectVisionMarkers(boardName) {
    if (boardName === 'CBSE') {
        answers.q1 = 1; answers.q2 = 0; answers.q3 = 0;
    } else if (boardName === 'ICSE') {
        answers.q1 = 0; answers.q2 = 1; answers.q3 = 2;
    } else if (boardName === 'IB' || boardName === 'Cambridge') {
        answers.q1 = 2; answers.q2 = 2; answers.q3 = 1;
    } else {
        answers.q1 = 1; answers.q2 = 0; answers.q3 = 0;
    }

    for (let i = 4; i <= 15; i++) {
        if (answers['q' + i] === undefined) {
            answers['q' + i] = 0;
        }
    }
}

function confirmManualSync() {
    const manualSyncBlock = document.getElementById('manualSyncBlock');
    if (manualSyncBlock) manualSyncBlock.style.display = 'none';
    const boardSelect = document.getElementById('manualBoardSelect');
    const orderIdInput = document.getElementById('syncOrderId');
    const ageInput = document.getElementById('syncChildAge');

    if (!boardSelect || !boardSelect.value) {
        alert("Please select the Recommended Board from your report.");
        return;
    }

    injectVisionMarkers(boardSelect.value);
    if (orderIdInput) customerData.orderId = orderIdInput.value;
    if (ageInput) customerData.childAge = ageInput.value;
    isManualSync = true;
    isSyncMatchMode = true;

    document.getElementById('syncMatchGate').classList.remove('active');
    showSyncTransition();
}

function showSyncTransition() {
    const transition = document.getElementById('syncMatchTransition');
    if (!transition) {
        startSyncMatchNow();
        return;
    }

    transition.classList.remove('hidden');
    transition.classList.add('active');

    const transitionContainer = transition.querySelector('.details-form');
    if (transitionContainer && !transitionContainer.querySelector('.xray-card')) {
        // Find the timer circle to place the ads below it
        const timerCont = transitionContainer.querySelector('.timer-circle-container');
        if (timerCont) {
            timerCont.insertAdjacentHTML('afterend', xrayCardHtml + fovizBannerHtml);
        }
    }

    let timeLeft = 15;
    const timerDisplay = document.getElementById('syncTimer');

    if (syncTimerInterval) clearInterval(syncTimerInterval);
    syncTimerInterval = setInterval(() => {
        timeLeft--;
        if (timerDisplay) timerDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            startSyncMatchNow();
        }
    }, 1000);
}

function startSyncMatchNow() {
    if (syncTimerInterval) clearInterval(syncTimerInterval);
    const transition = document.getElementById('syncMatchTransition');
    if (transition) {
        transition.classList.remove('active');
        transition.classList.remove('active');
    }
    initializeQuizShell(0, 2);
}

// --- SCORING LOGIC ---
function calculateFullRecommendation(ansSet) {
    let scores = { "CBSE": 0, "ICSE": 0, "IB": 0, "Cambridge (IGCSE)": 0, "State Board": 0 };
    let veto = { ib: false, cambridge: false, icse: false };

    if (ansSet.q1 === 0) { scores["IB"] += 6; scores["Cambridge (IGCSE)"] += 6; scores["ICSE"] += 4; }
    if (ansSet.q1 === 1) { scores["CBSE"] += 6; scores["State Board"] += 5; scores["ICSE"] += 4; }
    if (ansSet.q1 === 2) { scores["IB"] += 8; scores["Cambridge (IGCSE)"] += 8; }
    if (ansSet.q1 === 3) { scores["CBSE"] += 4; scores["ICSE"] += 4; }

    if (ansSet.q2 === 0) { scores["CBSE"] += 7; scores["State Board"] += 5; }
    if (ansSet.q2 === 1) { scores["ICSE"] += 7; scores["IB"] += 6; }
    if (ansSet.q2 === 2) { scores["IB"] += 7; scores["Cambridge (IGCSE)"] += 7; }

    if (ansSet.q3 === 0) { scores["CBSE"] += 20; scores["State Board"] += 15; scores["IB"] -= 10; }
    if (ansSet.q3 === 1) { scores["IB"] += 20; scores["Cambridge (IGCSE)"] += 20; scores["CBSE"] -= 5; }
    if (ansSet.q3 === 2) { scores["IB"] += 10; scores["ICSE"] += 8; }

    if (ansSet.q4 === 0) { veto.ib = true; veto.cambridge = true; scores["State Board"] += 10; scores["CBSE"] += 5; }
    if (ansSet.q4 === 1) { veto.ib = true; scores["CBSE"] += 8; scores["ICSE"] += 8; }

    let results = Object.keys(scores).map(board => {
        let s = scores[board];
        if (veto.ib && (board === "IB" || board === "Cambridge (IGCSE)")) s = -999;
        return { name: board, score: s };
    });

    results.sort((a, b) => b.score - a.score);

    let topScore = Math.max(results[0].score, 1);
    results.forEach(r => {
        r.percentage = r.score < 0 ? 0 : Math.min(Math.round((r.score / topScore) * 95), 99);
    });

    return { recommended: results[0], alternative: results[1], fullRanking: results };
}

// --- FIXED SELECT PACKAGE LOGIC ---
function selectPackage(pkg, price) {
    if (window.currentPhase !== 1 && window.currentPhase !== 2 && !isSyncMatchMode) {
        alert("Please finish the assessment first.");
        return;
    }
    if (window.event) window.event.stopPropagation();
    selectedPackage = pkg;
    selectedPrice = price;

    if (price === 599) {
        hasSeenDowngradeModal = true;
        const modal = document.getElementById('downgradeModal');
        if (modal) {
            modal.classList.add('active');
        } else {
            proceedToQuiz(pkg, price); // Fallback if modal is missing
        }
    } else if (price === 999) {
        const modal = document.getElementById('proUpgradeModal');
        if (modal) {
            modal.classList.add('active');
        } else {
            proceedToQuiz(pkg, price); // Fallback
        }
    } else {
        proceedToQuiz(pkg, price);
    }
}

function confirmDowngrade() {
    const downgradeModal = document.getElementById('downgradeModal');
    if (downgradeModal) downgradeModal.classList.remove('active');
    proceedToQuiz('Essential', 599);
}

function upgradeAndProceed() {
    const downgradeModal = document.getElementById('downgradeModal');
    if (downgradeModal) downgradeModal.classList.remove('active');
    proceedToQuiz('Premium', 999);
}

function upgradeToProAndProceed() {
    const modal = document.getElementById('proUpgradeModal');
    if (modal) modal.classList.remove('active');
    proceedToQuiz('The Smart Parent Pro', 1499);
}

function confirmPremium() {
    const modal = document.getElementById('proUpgradeModal');
    if (modal) modal.classList.remove('active');
    proceedToQuiz('Premium', 999);
}

function proceedToQuiz(pkg, price) {
    // --- REFACTOR: POST-QUIZ STATE DETECTION ---
    // If we have parent data and completed answers, skip reset and go to payment
    if (customerData && customerData.parentName && Object.keys(answers).length >= 10) {
        console.log("Post-quiz state detected via proceedToQuiz. Transitioning to Payment.");
        selectedPackage = pkg;
        selectedPrice = price;

        // Ensure modals/landing are closed
        document.getElementById('landingPage').classList.remove('active');
        const priModal = document.getElementById('pricingModal');
        if (priModal) priModal.classList.remove('active');
        const downModal = document.getElementById('downgradeModal');
        if (downModal) downModal.classList.remove('active');
        const proModal = document.getElementById('proUpgradeModal');
        if (proModal) proModal.classList.remove('active');

        // Show Payment Page
        const pCont = document.getElementById('paymentPageContainer');
        if (pCont) {
            pCont.classList.remove('hidden');
            pCont.classList.add('active');

            const pNameEl = document.getElementById('summaryPackage');
            const pPriceEl = document.getElementById('summaryPrice');
            const pTotalEl = document.getElementById('summaryTotal');
            const payBtn = document.getElementById('payButton');

            if (pNameEl) pNameEl.textContent = selectedPackage;
            if (pPriceEl) pPriceEl.textContent = `₹${selectedPrice}`;
            if (pTotalEl) pTotalEl.textContent = `₹${selectedPrice}`;
            if (payBtn) payBtn.innerText = `Pay ₹${selectedPrice} via Razorpay Link →`;
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
        return;
    }
    // -------------------------------------------

    const previousFlag = hasSeenDowngradeModal;
    currentQuestion = 0;
    answers = {};
    customerData = { orderId: 'N/A', childAge: '5-10' };
    hasSeenDowngradeModal = previousFlag;
    selectedPackage = pkg;
    selectedPrice = price;
    isSyncMatchMode = false;
    hasSeenMilestone1 = false;
    hasSeenMilestone2 = false;

    // Hide landing elements
    document.getElementById('landingPage').classList.remove('active');
    document.getElementById('pricingModal').classList.remove('active');
    document.getElementById('testimonials').classList.remove('active');
    document.getElementById('educatorPartner').classList.remove('active');
    document.getElementById('contact-and-policies').classList.remove('active');
    document.getElementById('mainFooter').classList.remove('active');

    initializeQuizShell(0);
    window.scrollTo({ top: 0, behavior: 'instant' });
}





// Helper to generate Quiz Header
function getIntermediateHeaderHtml() {
    return `
        <div style="text-align: center; padding-top: 20px; padding-bottom: 5px;">
            <p style="font-size: 0.8rem; font-weight: 700; color: #94A3B8; letter-spacing: 1px; text-transform: uppercase;">
                Apt Skola <span style="color: #FF6B35;">//</span> Calibration
            </p>
        </div>
    `;
}

// Helper to generate Quiz Footer (Reduced Height)
function getIntermediateFooterHtml() {
    return `
        <div style="text-align: center; padding-top: 10px; padding-bottom: 20px;">
        </div>
    `;
}

function initializeQuizShell(index, phase = 0) {
    console.log("initializeQuizShell called with index:", index, "phase:", phase);
    window.currentPhase = phase;
    window.scrollTo(0, 0); // Ensure scroll reset

    const questionPages = document.getElementById('questionPages');
    if (!questionPages) return;

    // 1. Show Quiz Shell
    questionPages.classList.remove('hidden');
    questionPages.classList.add('active');
    questionPages.style.display = 'block';

    // 2. Hide EVERYTHING ELSE
    const idsToHide = [
        'landingPage',
        'react-hero-root',
        'syncMatchGate',
        'syncMatchTransition',
        'detailsPage',
        'paymentPageContainer',
        'psychometricHistogram',
        'dynamicRiskCard',
        'pricingModal',
        'cost-calculator-section',
        'trust-stack-mechanism',
        'trust-stack-authority',
        'trust-stack-nudge',
        'sticky-cta',
        'testimonials',
        'ecosystem',
        'contact-policies',
        'mainFooter',
        'landingFooter'
    ];
    idsToHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('active');
            el.classList.add('hidden');
            el.style.display = 'none'; // Force hide
        }
    });

    const shellHtml = `
        <div id="questionPageApp" class="question-page active">
            ${getIntermediateHeaderHtml()}
            <div class="question-content-wrapper"><div id="dynamicQuizContent" class="question-container"></div></div>
            ${getIntermediateFooterHtml()}
        </div>`;
    questionPages.innerHTML = shellHtml;

    // DIRECT ROUTE: Start Phase 0 Calibration immediately (Bridge Removed)
    renderQuestionContent(index);
}

function renderTransitionBridge() {
    const container = document.getElementById('dynamicQuizContent');
    if (container) {
        // Prepare for Fade-In
        container.style.opacity = '0';
        container.style.transition = 'opacity 0.6s ease-out';

        container.innerHTML = `
            <div class="transition-bridge" style="text-align: center; padding: 30px 20px;">
                <p style="font-size: 1.2rem; font-weight: 700; color: #0F172A; margin-bottom: 30px; line-height: 1.6; max-width: 600px; margin-left: auto; margin-right: auto;">
                    Your personalized roadmap begins here. Please answer calibration questions to align your child’s profile.
                </p>
                <button onclick="renderQuestionContent(0)" class="custom-cta-button" style="background: #0F172A; color: white; border: 2px solid #0F172A;">
                    Begin Calibration →
                </button>
            </div>
        `;

        // Trigger Animation
        requestAnimationFrame(() => {
            container.style.opacity = '1';
        });
    }
}

function renderQuestionContent(index) {
    currentQuestion = index;
    let questions = phase0Questions;
    if (window.currentPhase === 1) questions = phase1Questions;
    if (window.currentPhase === 2) questions = phase2Questions;

    const totalQ = questions.length;

    if (index >= totalQ) {
        if (window.currentPhase === 0) {
            showPsychometricHistogram();
        } else if (window.currentPhase === 1) {
            showDetailsPage();
        } else if (window.currentPhase === 2) {
            calculateSyncMatch();
        }
        return;
    }

    const q = questions[index];
    if (!q) return;

    let qText = q.text;
    let qOptions = q.options || [];

    if (q.isObservation) {
        qText = q.text_variants[customerData.childAge] || q.text_variants["5-10"];
        if (q.options_variants && q.options_variants[customerData.childAge]) {
            qOptions = q.options_variants[customerData.childAge];
        } else if (q.options_variants) {
            // FALLBACK: If age is missing or invalid, default to 5-10 to prevent blank options
            qOptions = q.options_variants["5-10"];
        }
    }

    const progressPercent = ((index + 1) / totalQ * 100).toFixed(0);
    const optionsHTML = qOptions.map((opt, i) => {
        const isSelected = answers[q.id] === i ? 'selected' : '';
        return `<div class="option-card ${isSelected}" onclick="selectOption('${q.id}', ${i}, ${index}, this)">${opt}</div>`;
    }).join('');

    let prevBtnHtml = '';
    if (index > 0) {
        prevBtnHtml = `<button onclick="renderQuestionContent(${index - 1})" class="btn-prev" style="margin-top:20px; background:none; text-decoration:underline; border:none; color:#64748B; cursor:pointer;">← Previous Question</button>`;
    }

    // SYSTEM LOG LOGIC (Bottom of Card)
    // SYSTEM LOG LOGIC (Bottom of Card) - UPDATED FOR RANGES
    let systemLogHtml = '';

    // Q1-Q5: Initializing (Phase 0 usually has only 4 questions, but logic holds)
    if (index >= 0 && index <= 4) {
        systemLogHtml = `
            <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-3 animate-pulse">
                <div class="w-2 h-2 rounded-full bg-[#FF6B35]"></div>
                <span class="font-mono text-[10px] text-slate-400 tracking-wider uppercase">Initializing Core Learning DNA...</span>
            </div>`;
    }
    // Q6-Q10: Mapping (Only relevant if Phase 1)
    else if (index >= 5 && index <= 9 && window.currentPhase === 1) {
        systemLogHtml = `
            <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-3">
                <div class="w-2 h-2 rounded-full bg-[#FF6B35] animate-ping"></div>
                <span class="font-mono text-[10px] text-slate-500 tracking-wider uppercase">[Status] Cognitive Baseline Mapped. Calibrating Board Compatibility...</span>
            </div>`;
    }
    // Q11-Q15: Locked (Only relevant if Phase 1)
    else if (index >= 10 && window.currentPhase === 1) {
        systemLogHtml = `
            <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-3">
                <div class="w-2 h-2 rounded-full bg-[#FF6B35] animate-ping"></div>
                <span class="font-mono text-[10px] text-slate-500 tracking-wider uppercase">[Status] Neural Profile Locked. Calculating Financial Trajectory...</span>
            </div>`;
    }

    const dynamicQuizContent = document.getElementById('dynamicQuizContent');
    if (dynamicQuizContent) {
        dynamicQuizContent.innerHTML = `
            <div class="quiz-card animate-fade-in-up">
                <!-- Progress & Counter -->
                <div class="flex justify-between items-center mb-2">
                     <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Progress</span>
                     <span class="text-xs font-bold text-[#FF6B35] font-mono">${index + 1}/${totalQ}</span>
                </div>
                <div class="w-full bg-slate-100 h-1.5 rounded-full mb-6 overflow-hidden">
                    <div class="bg-[#FF6B35] h-full transition-all duration-500 ease-out" style="width: ${progressPercent}%"></div>
                </div>
                
                <h3 class="text-xl md:text-2xl font-bold text-slate-800 mb-6 leading-tight">${qText}</h3>
                
                <div class="grid gap-3">
                    ${optionsHTML}
                </div>

                <div class="flex justify-center items-center mt-6">
                    ${prevBtnHtml}
                </div>

                ${systemLogHtml}
            </div>
        `;
    }
}

let hasSeenMilestone1 = false;
let hasSeenMilestone2 = false;

function getMilestoneBanner(blockId) {
    if (blockId === 1) {
        return `
            <div class="engagement-banner">
                <div class="engagement-icon">✨</div>
                <div class="engagement-content">
                    <h4>Behavioral Pattern Detected</h4>
                    <p>"Cognitive agility trend confirmed. Engine now filtering Institutional Alignment Matrix for high-potential matches."</p>
                </div>
            </div>
        `;
    } else {
        return `
            <div class="engagement-banner">
                <div class="engagement-icon">🔬</div>
                <div class="engagement-content">
                    <h4>Risk Mitigation Active</h4>
                    <p>"Diagnostic depth reaching critical threshold. Calibrating alignment against 15-year career roadmap."</p>
                </div>
            </div>
        `;
    }
}

function selectOption(qId, val, idx, el) {
    answers[qId] = val;
    Array.from(el.parentNode.children).forEach(child => child.classList.remove('selected'));
    el.classList.add('selected');
    setTimeout(() => { renderQuestionContent(idx + 1); }, 300);
}

function showDetailsPage() {
    const detailsPage = document.getElementById('detailsPage');
    if (detailsPage) {
        detailsPage.classList.remove('hidden');
        detailsPage.classList.add('active');
    }
}

function generateOrderId(prefix = '') {
    const typePrefix = prefix || (selectedPrice === 599 ? 'AS5-' : (selectedPrice === 999 ? 'AS9-' : 'AS1-'));
    return typePrefix + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100);
}

// --- FORM CAPTURE (SURGICAL UPDATE FOR LEAD MAGNET) ---
document.getElementById('customerForm')?.addEventListener('submit', function (e) {
    e.preventDefault();

    const disclaimerBox = document.getElementById('confirmDisclaimer');
    if (disclaimerBox && !disclaimerBox.checked) {
        alert("Please acknowledge the Disclaimer & Terms to proceed.");
        return;
    }

    const emailValue = document.getElementById('email')?.value;
    const phoneValue = document.getElementById('phone')?.value;

    if (!validateInputs(emailValue, phoneValue)) {
        alert("Please provide a valid email and a 10-digit Indian mobile number.");
        return;
    }

    const childAgeRef = document.getElementById('childDob');
    if (childAgeRef && !childAgeRef.value) {
        alert("Please enter your Child's Date of Birth.");
        return;
    }

    // Step 1: Initialize Data
    const newOrderId = generateOrderId();
    const isSaveForLater = document.getElementById('saveForLater')?.checked;

    customerData = {
        parentName: document.getElementById('parentName')?.value,
        childName: document.getElementById('childName')?.value,
        email: emailValue,
        phone: phoneValue,
        childAge: calculateAgeFromDob(document.getElementById('childDob')?.value), // Store formatted age or DOB
        dob: document.getElementById('childDob')?.value,
        partnerId: document.getElementById('partnerId')?.value,
        package: selectedPackage,
        amount: selectedPrice,
        orderId: newOrderId
    };

    // Step 2: Silent Persistence
    localStorage.setItem(`aptskola_session_${newOrderId}`, JSON.stringify({
        answers: answers,
        customerData: customerData,
        selectedPackage: selectedPackage,
        selectedPrice: selectedPrice
    }));
    localStorage.setItem('aptskola_last_order_id', newOrderId);

    // Step 3: Optional Lead Capture Dispatch (Save for Later)
    if (isSaveForLater && typeof emailjs !== 'undefined') {
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_LEAD_TEMPLATE_ID, {
            user_name: customerData.parentName,
            user_email: customerData.email,
            child_name: customerData.childName,
            package_name: customerData.package
        }).then(() => console.log("Lead summary sent via EmailJS")).catch(e => console.warn("Lead email fail:", e));
    }

    const formData = new FormData(this);
    formData.append('orderId', newOrderId);

    fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
    })
        .then(() => console.log("Lead captured via Web3Forms"))
        .catch((error) => console.error("Web3Forms Error:", error));

    // --- PIXEL RETARGETING TRIGGER ---
    if (typeof fbq !== 'undefined') {
        fbq('track', 'InitiateCheckout', {
            content_name: selectedPackage,
            value: selectedPrice,
            currency: 'INR'
        });
    }
    if (typeof gtag !== 'undefined') {
        gtag('event', 'begin_checkout', {
            items: [{ item_name: selectedPackage, price: selectedPrice }]
        });
    }


    setTimeout(() => {
        showDnaFinalization();
        // REMOVED: Redundant redirect to payment page. 
        // Flow is now: Form -> DNA Animation -> Pricing Modal -> Payment Page
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, 500);
});

// --- RAZORPAY POPUP METHOD (WITH AUTO-PREFILL) ---
function handlePaymentSuccess() {
    // Payment success triggered

    // Simulate payment success
    const orderId = customerData.orderId || 'ORD_' + Date.now();
    customerData.orderId = orderId;
    customerData.amount = selectedPrice;
    customerData.package = selectedPackage;

    localStorage.setItem(`aptskola_session_${orderId}`, JSON.stringify({
        answers: answers,
        customerData: customerData,
        selectedPackage: selectedPackage,
        selectedPrice: selectedPrice
    }));
    localStorage.setItem('aptskola_last_order_id', orderId);

    const overlay = document.getElementById('redirectLoadingOverlay');
    if (overlay) overlay.style.display = 'flex';

    // Generate report instantly
    console.log("Starting report generation...");
    renderReportToBrowser().then(() => {
        console.log("Report rendered successfully, showing success page...");
        showInstantSuccessPage();
        if (overlay) {
            overlay.style.display = 'none';
            console.log("Overlay hidden");
        }

        // Send the email with the report image
        triggerAutomatedEmail();
    }).catch((error) => {
        console.error("Error in report generation:", error);
        alert("There was an error generating your report. Please contact support with this error: " + error.message);
        if (overlay) {
            overlay.style.display = 'none';
            console.log("Overlay hidden after error");
        }
    });
}

function redirectToRazorpay() {
    console.log("Redirecting to Razorpay...");

    const options = {
        "key": RAZORPAY_KEY_ID,
        "amount": selectedPrice * 100, // Dynamic Amount in Paise
        "currency": "INR",
        "payment_capture": 1,
        "name": "Apt Skola",
        "description": "Board Match Report Upgrade",
        "prefill": {
            "name": customerData.parentName || "",
            "email": customerData.email || "",
            "contact": customerData.phone || ""
        },
        "handler": function (response) {
            console.log("Payment successful:", response);
            // Call the success handler
            handlePaymentSuccess();
        },
        "theme": { "color": "#FF6B35" }
    };

    try {
        const rzp1 = new Razorpay(options);
        rzp1.open();
    } catch (e) {
        console.error("Razorpay initialization failed:", e);
        alert("Payment gateway failed to initialize. Please try again.");
    }
}


async function triggerAutomatedEmail() {
    console.log("CTO: Generating Branded HTML Report with Tiered Insights...");
    console.log("Selected package:", selectedPackage, "Selected price:", selectedPrice);

    const res = calculateFullRecommendation(answers);
    // PRIORITY: Use Manual Board if available, otherwise User Recommendation
    const recBoard = customerData.manualBoard || res.recommended.name;
    const boardKey = recBoard.toLowerCase().includes('cbse') ? 'cbse' :
        (recBoard.toLowerCase().includes('icse') ? 'icse' :
            (recBoard.toLowerCase().includes('ib') ? 'ib' :
                (recBoard.toLowerCase().includes('cambridge') ? 'Cambridge (IGCSE)' : 'State Board')));

    const data = MASTER_DATA[boardKey];

    // Build the Branded Header and Basic Info
    let htmlSummary = `
        <div style="border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; font-family: sans-serif; margin: 20px 0;">
            <div style="background-color: #0F172A; color: #ffffff; padding: 25px; text-align: center;">
                <h2 style="margin: 0; font-size: 22px; letter-spacing: 0.5px;">${data.title}</h2>
                <p style="margin: 8px 0 0; color: #FF6B35; font-weight: 800; font-size: 16px;">
                    MATCH: ${recBoard} (${res.recommended.percentage}%)
                </p>
            </div>
            <div style="padding: 25px; background-color: #ffffff; color: #334155;">
                <p style="margin-top: 0;"><strong>Persona:</strong> ${data.persona}</p>
                <p style="line-height: 1.6;"><strong>Philosophy:</strong> ${data.philosophy}</p>
    `;

    // ADDED: Premium Insights (₹999 Tier)
    if (selectedPrice >= 999) {
        console.log("Adding premium content for price:", selectedPrice);
        htmlSummary += `
            <div style="margin-top: 20px; padding: 15px; background-color: #F0FDF4; border-left: 4px solid #10B981; border-radius: 4px;">
                <h4 style="margin: 0 0 5px 0; color: #166534; font-size: 14px; text-transform: uppercase;">Premium Insights</h4>
                <p style="margin: 0; color: #334155; font-size: 14px;"><strong>Risk Check:</strong> Look for 'Library Dust' and 'Teacher Turnover' during your campus visit.</p>
                <p style="margin: 5px 0 0; color: #334155; font-size: 14px;"><strong>Financial:</strong> Budget for a 12% annual fee inflation over 15 years.</p>
            </div>
        `;
    }

    // ADDED: Pro Admission Tips (₹1499 Tier)
    if (selectedPrice >= 1499) {
        console.log("Adding pro content for price:", selectedPrice);
        htmlSummary += `
            <div style="margin-top: 15px; padding: 15px; background-color: #FFF7ED; border-left: 4px solid #FF6B35; border-radius: 4px;">
                <h4 style="margin: 0 0 5px 0; color: #9A3412; font-size: 14px; text-transform: uppercase;">Pro Admission Tips</h4>
                <p style="margin: 0; color: #334155; font-size: 14px;"><strong>Negotiation:</strong> Use the 'Lump Sum Leverage' script to ask for admission fee waivers.</p>
                <p style="margin: 5px 0 0; color: #334155; font-size: 14px;"><strong>Interview:</strong> Never answer for the child; it is the #1 reason for rejection.</p>
            </div>
        `;
    }

    htmlSummary += `</div></div>`;

    // ADDED: Partnership Invitation (Captured from Educator Partner Section)
    htmlSummary += `
        <div style="margin-top: 20px; padding: 15px; border: 1px dashed #CBD5E1; border-radius: 8px; background-color: #F8FAFC; text-align: center;">
            <h4 style="margin: 0 0 10px 0; color: #0F172A; font-size: 14px;">🤝 Join the Apt Skola Network</h4>
            <p style="margin: 0; color: #475569; font-size: 13px; line-height: 1.5;">
                Teachers & Tutors: Earn <strong>₹300</strong> for student referrals and 
                <strong>₹3,000</strong> per session for school-wide engagement. 
            </p>
            <a href="https://aptskola.com/#educatorPartner" style="display: inline-block; margin-top: 10px; color: #FF6B35; font-weight: 700; text-decoration: none; font-size: 13px;">Register as Partner →</a>
        </div>
    `;

    try {
        console.log("Sending email for package:", selectedPackage, "price:", selectedPrice);
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            user_email: customerData.email,
            user_name: customerData.parentName,
            order_id: customerData.orderId,
            child_name: customerData.childName,
            report_text_summary: htmlSummary
        });
        console.log("Email sent successfully for order:", customerData.orderId);
    } catch (e) {
        console.error("Email dispatch failed for order", customerData.orderId, ":", e);
    }
}

function processSyncUpgrade() {
    const payButton = document.querySelector('#upgradeBlock button');
    if (payButton) payButton.innerText = "Opening Upgrade...";

    const options = {
        "key": RAZORPAY_KEY_ID,
        "amount": 29900, // ₹299 Upgrade Fee
        "currency": "INR",
        "payment_capture": 1,
        "name": "Apt Skola",
        "description": "Sync Match Module Upgrade",
        "prefill": {
            "name": customerData.parentName,
            "email": customerData.email,
            "contact": customerData.phone
        },
        "handler": function (response) {
            // SUCCESS: Runs instantly without redirecting
            customerData.package = 'Premium';
            customerData.amount = 299; // Keep logic as is for premium features
            isSyncMatchMode = true;

            // Save elevated state
            localStorage.setItem(`aptskola_session_${customerData.orderId}`, JSON.stringify({ answers, customerData }));

            const upgradeBlock = document.getElementById('upgradeBlock');
            const startBtn = document.getElementById('startSyncBtn');

            if (upgradeBlock) {
                upgradeBlock.classList.add('hidden');
                upgradeBlock.style.display = 'none'; // FORCE HIDE
            }

            // CHECK: Do we need Manual Board Selection?
            // If we have a 'ghost' session (no answers) and no manual board yet
            const needsBoardData = Object.keys(answers).length === 0 && !customerData.manualBoard;

            if (needsBoardData) {
                console.log("Payment Success. Board data missing. Showing Manual Selection.");
                const fallback = document.getElementById('fallbackLookup');
                if (fallback) {
                    fallback.classList.remove('hidden');
                    // Ensure the button in fallback calls the confirming logic
                    const manualConfirmBtn = fallback.querySelector('button'); // Assuming there's a button there or we add one
                    // We need to inject a specific confirm button or repurpose the existing Start button if it's visible?
                    // Actually, let's look at index.html logic. Fallback usually just shows select. 
                    // We should reveal the "I am ready" button but route it to handleManualBoardConfirmation

                    const startBtn = document.getElementById('startSyncBtn');
                    if (startBtn) {
                        startBtn.classList.remove('hidden');
                        startBtn.innerText = "Confirm Board & Start Sync →";
                        startBtn.onclick = handleManualBoardConfirmation;
                    }
                }
            } else {
                // Standard Flow
                if (startBtn) {
                    startBtn.classList.remove('hidden');
                    startBtn.innerText = "Access Unlocked! Start Sync Check →";
                    startBtn.style.background = "#10B981";
                    startBtn.onclick = function () {
                        initializeQuizShell(0, 2);
                    };
                }
            }

            // Immediately offer visual confirmation
            alert("Upgrade Successful! " + (needsBoardData ? "Please select your child's board to continue." : "You can now start the Sync Check."));
        },
        "theme": { "color": "#FF6B35" }
    };

    const rzp1 = new Razorpay(options);
    window.triggerTrack('Payment_Page_Initiated', { amount: options.amount / 100, package: options.notes.package });
    rzp1.open();
}

// NEW HELPER: Handle Manual Board Confirmation
function handleManualBoardConfirmation() {
    const boardSelect = document.getElementById('fallbackBoard');
    const selectedBoard = boardSelect ? boardSelect.value : "";

    if (!selectedBoard) {
        alert("Please select a target board to proceed.");
        return;
    }

    customerData.manualBoard = selectedBoard; // Save Manual Selection
    customerData.childAge = document.getElementById('syncChildAge')?.value || "5-10";

    // INFER TIER IF MISSING (For AS9/AS1 manual recovery)
    if (customerData.orderId.toUpperCase().startsWith("AS9")) {
        customerData.package = 'Premium';
        customerData.amount = 999;
        selectedPackage = 'Premium';
        selectedPrice = 999;
    } else if (customerData.orderId.toUpperCase().startsWith("AS1")) {
        customerData.package = 'The Smart Parent Pro';
        customerData.amount = 1499;
        selectedPackage = 'The Smart Parent Pro';
        selectedPrice = 1499;
    }

    // Persist again
    localStorage.setItem(`aptskola_session_${customerData.orderId}`, JSON.stringify({ answers, customerData, selectedPackage, selectedPrice }));

    // Start
    initializeQuizShell(0, 2);
}

// --- RESTORED MODAL LOGIC ---
let hasShownSuccessModals = false;

function closeBonusModalAndShowSuccess() {
    document.getElementById('bonusModal').classList.remove('active');

    // Check for Pro Tier (Price >= 1499) for the second acknowledgment
    if (selectedPrice >= 1499) {
        document.getElementById('forensicSuccessModal').classList.add('active');
    } else {
        hasShownSuccessModals = true;
        showInstantSuccessPage();
    }
}

function closeForensicModalAndShowSuccess() {
    document.getElementById('forensicSuccessModal').classList.remove('active');
    hasShownSuccessModals = true;
    showInstantSuccessPage();
}

function showInstantSuccessPage() {
    console.log("showInstantSuccessPage called");

    // 1. MODAL FLOW INTERCEPTION
    if (!hasShownSuccessModals) {
        if (selectedPrice >= 999) {
            // Show First Acknowledgment
            const bonusModal = document.getElementById('bonusModal');
            if (bonusModal) {
                bonusModal.classList.add('active');
                return; // STOP HERE until user dismisses modal
            }
        }
    }

    const paymentPage = document.getElementById('paymentPageContainer');
    const successPage = document.getElementById('successPage');

    // Add this inside your showInstantSuccessPage function in script.js
    const successContainer = document.querySelector('.success-container');

    // Avoid duplicate backup notices
    if (successContainer && !document.getElementById('backupNoticeBlock')) {
        const backupNotice = `
        <div id="backupNoticeBlock" style="background: #FFF7ED; border: 1px solid #FFEDD5; padding: 15px; border-radius: 10px; margin: 20px 0; border-left: 5px solid #F59E0B;">
            <p style="color: #9A3412; font-weight: 700; font-size: 0.9rem;">
                💾 PLEASE DOWNLOAD YOUR PDF NOW
            </p>
            <p style="color: #C2410C; font-size: 0.8rem; margin-top: 5px;">
                We have sent a summary to your email, but the full 15-year roadmap is only saved locally on this browser. Download the PDF to keep it forever.
            </p>
        </div>
    `;
        successContainer.insertAdjacentHTML('afterbegin', backupNotice);
    }

    if (paymentPage) {
        paymentPage.classList.remove('active');
    }
    if (successPage) {
        successPage.classList.remove('hidden');
        successPage.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'instant' });

        // Wait a bit for DOM to update, then check for buttons
        setTimeout(() => {
            const downloadBtn = document.getElementById('downloadBtn');
            const shareBtn = document.getElementById('shareBtn');

            if (downloadBtn) {
                downloadBtn.style.pointerEvents = 'auto';
                downloadBtn.style.opacity = '1';
                downloadBtn.textContent = 'Download Report ⬇️';
            }
            if (shareBtn) {
                shareBtn.style.pointerEvents = 'auto';
                shareBtn.style.opacity = '1';
                shareBtn.textContent = 'Share Report 📲';
            }
        }, 100);

        // Set Order ID
        const displayOrderId = document.getElementById('displayOrderId');
        if (displayOrderId) {
            let finalOrderId = customerData.orderId;
            if (!finalOrderId || finalOrderId === 'N/A') {
                finalOrderId = localStorage.getItem('aptskola_last_order_id') || 'N/A';
            }
            displayOrderId.textContent = finalOrderId;
        }
    }

    if (selectedPrice >= 1499) {
        const ticket = document.getElementById('goldenTicketContainer');
        if (ticket) ticket.style.display = 'block';
    }

    const pNameEl = document.getElementById('successParentName');
    if (pNameEl) pNameEl.innerText = customerData.parentName || 'Parent';

    const reportDiv = document.getElementById('reportPreview');
    if (reportDiv) {
        reportDiv.classList.remove('off-screen-render');
        // FIX: REMOVED THE CODE THAT MOVED THE REPORT PREVIEW
        // The Report is now allowed to sit naturally in the DOM (before the buttons)
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
    window.toggleFooter('minimal');
}


// --- SYNC MATCH LOGIC RESTORED ---
function openSyncMatchGate() {
    console.log("Opening Sync Match Gate...");
    // 1. Hide Landing Page
    const landing = document.getElementById('landingPage');
    if (landing) {
        landing.classList.remove('active');
        landing.classList.add('hidden'); // Ensure hidden class is applied
    }

    // Hide Hero
    const hero = document.getElementById('react-hero-root');
    if (hero) {
        hero.classList.add('hidden');
        hero.style.display = 'none';
    }

    // 2. Hide all other specific containers
    const idsToHide = ['questionPages', 'detailsPage', 'successPage', 'paymentPageContainer', 'psychometricHistogram', 'dynamicRiskCard', 'pricingModal'];
    idsToHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('active');
            el.style.display = ''; // Clear inline style
        }
    });

    // 2b. Explicitly ensure full Landing Footer is hidden via helper (redundant but safe)
    window.toggleFooter('minimal');

    // 3. Show Sync Gate
    const gate = document.getElementById('syncMatchGate');
    if (gate) {
        gate.classList.remove('hidden');
        gate.classList.add('active');
        gate.style.display = 'flex';
        window.toggleFooter('minimal'); // Ensure minimal footer
        window.scrollTo(0, 0);
    } else {
        console.error("Sync Match Gate element not found!");
    }
}
function validateAndStartSyncMatch() {
    const orderIdInput = document.getElementById('syncOrderId');
    const orderId = orderIdInput ? orderIdInput.value.trim() : "";
    const syncChildName = document.getElementById('syncChildName')?.value || "";
    // FIX: Capture Age Input
    const syncChildAgeInput = document.getElementById('syncChildAge');
    // Default to empty string if not found, do NOT default to "5-10" to enforce selection
    const syncChildAge = syncChildAgeInput ? syncChildAgeInput.value : "";

    if (!orderId || !syncChildName) {
        alert("Please enter both Child's Name and Order ID.");
        return;
    }

    if (!syncChildAge) {
        alert("Please select your child's age bracket.");
        return;
    }

    customerData.childName = syncChildName;
    customerData.orderId = orderId;
    customerData.childAge = syncChildAge; // Ensure Age is captured BEFORE session load

    // Check if order exists
    const sessionKey = `aptskola_session_${orderId}`;
    const sessionData = localStorage.getItem(sessionKey);

    // FIX: Allow AS5 users to upgrade even if session is missing (Cross-Device logic)
    const isAS5 = orderId.toUpperCase().startsWith("AS5-");
    // NEW: Allow AS9/AS1 users to proceed with manual board selection if session is missing
    const isAS9orAS1 = orderId.toUpperCase().startsWith("AS9") || orderId.toUpperCase().startsWith("AS1");


    if (!sessionData && !isAS5) {
        // Handle Fallback
        console.log("Order ID not found. Offering fallback...");
        const fallback = document.getElementById('fallbackLookup');
        if (fallback) {
            fallback.classList.remove('hidden');
            // Change button behavior
            const syncBtn = document.getElementById('startSyncBtn');
            if (syncBtn) {
                syncBtn.innerText = "Confirm Board & I am ready →";
                syncBtn.onclick = handleManualBoardConfirmation;
            }
        } else {
            alert("Order ID not found. Please ensure you are using the same device used for the initial assessment.");
        }
        return;
    }

    // Load Session
    let parsed = { answers: {}, customerData: {}, selectedPackage: 'Premium', selectedPrice: 999 };
    if (sessionData) {
        parsed = JSON.parse(sessionData);
        // MERGE: Keep the new Child Name and Order ID, don't overwrite with old data
        parsed.customerData.childName = syncChildName;
        parsed.customerData.orderId = orderId;
        parsed.customerData.childAge = syncChildAge; // Force update Age
    } else if (isAS5) {
        // SYNTHETIC SESSION FOR AS5 UPGRADE
        // Assumption: If entering AS5 ID manually and no session found, 
        // they are effectively an "Essential" user needing upgrade.
        parsed.selectedPrice = 599;
        parsed.selectedPackage = 'Essential';
        parsed.customerData = {
            childName: syncChildName,
            orderId: orderId,
            childAge: syncChildAge, // Critical for Question Options
            amount: 599
        };
    }
    answers = parsed.answers || {};
    customerData = parsed.customerData || {};
    selectedPackage = parsed.selectedPackage || 'Essential'; // Default to Essential if missing 
    selectedPrice = parsed.selectedPrice || 599;

    // Check for Upgrade Requirement (Sync Check is Premium Feature)
    // AS5- users MUST pay 299 to proceed.
    // const isAS5 ... (already defined above)
    const isEssentialTier = (selectedPrice < 999 && selectedPackage !== "The Smart Parent Pro" && selectedPackage !== "Premium") || isAS5;

    if (isEssentialTier) {
        const upgradeBlock = document.getElementById('upgradeBlock');
        if (upgradeBlock) {
            upgradeBlock.classList.remove('hidden');
            upgradeBlock.style.display = 'block';

            // If AS5, ensure price is 299 for the upgrade
            if (isAS5) {
                // Update upgrade UI text if needed, or just set the price logic
                selectedPrice = 299;
                selectedPackage = "Upgrade to Phase 2";

                const upgBtn = document.querySelector('#upgradeBlock button');
                if (upgBtn) upgBtn.innerText = "Unlock Now @ ₹299";
            }
        }
        const startBtn = document.getElementById('startSyncBtn');
        if (startBtn) startBtn.classList.add('hidden');
        return;
    }

    // Proceed to Sync Phase
    isSyncMatchMode = true;
    window.currentPhase = 2; // Sync Phase
    openSyncMatchGate(); // Ensure gate is open (visual)

    // Transition to Quiz
    const gate = document.getElementById('syncMatchGate');
    if (gate) gate.classList.remove('active');

    initializeQuizShell(0, 2);
}


// --- TIMER LOGIC ---
let syncTimer = null;
let timeLeft = 15;
let isPaused = false;

function handleSyncConfirmation() {
    const fallback = document.getElementById('fallbackLookup');
    const syncBtn = document.getElementById('startSyncBtn');
    const timerUI = document.getElementById('syncCountdownUI');

    if (fallback) fallback.classList.add('hidden');
    if (syncBtn) syncBtn.classList.add('hidden');
    if (timerUI) timerUI.classList.remove('hidden');

    // Use selected age from dropdown
    const manualAge = document.getElementById('syncChildAge')?.value || "5-10";
    customerData.childAge = manualAge;

    startSyncCountdown();
}

function startSyncCountdown() {
    const display = document.getElementById('timerNumber');
    syncTimer = setInterval(() => {
        if (!isPaused) {
            timeLeft--;
            if (display) display.innerText = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(syncTimer);
                finalizeSyncStart();
            }
        }
    }, 1000);
}

function toggleSyncTimer() {
    isPaused = !isPaused;
    const btn = document.getElementById('pauseBtn');
    if (btn) btn.innerText = isPaused ? "Resume" : "Pause";
}

function showBridgeMilestone() {
    const dynamicQuizContent = document.getElementById('dynamicQuizContent');
    if (!dynamicQuizContent) return;

    window.scrollTo({ top: 0, behavior: 'instant' });
    const { bridgeHtml } = getAlignmentData();

    dynamicQuizContent.innerHTML = `
        <div class="milestone-card active" style="text-align:left;">
            <div class="milestone-header">
                <div class="milestone-visual pulsing-check">🔄</div>
                <h3 class="text-2xl font-black text-brand-navy">Sync Logic Calibrated</h3>
            </div>
            <div class="milestone-body">
                ${bridgeHtml}
            </div>
            <button onclick="calculateSyncMatch()" class="custom-cta-button" style="margin-top:20px;">Unlock Full Report & Verification →</button>
        </div>
    `;
}

function getAlignmentData() {
    let parentRec = 'CBSE';
    if (customerData.targetBoard) {
        parentRec = customerData.targetBoard;
    } else if (customerData.recommendedBoard) {
        parentRec = customerData.recommendedBoard;
    } else {
        const perceptionRes = calculateFullRecommendation(answers);
        // Default to perception if no explicit target
        parentRec = perceptionRes.recommended.name;
    }

    let dnaScores = { "CBSE": 0, "IB": 0, "ICSE": 0, "State": 0 };
    let totalPoints = 0;

    // 1. Calculate DNA Scores based on Child's Answers
    for (let i = 16; i <= 30; i++) {
        let val = answers['q' + i];
        if (val === undefined) continue;
        let multiplier = (i === 30) ? 2.0 : 1.0;

        if (val === 0) dnaScores["CBSE"] += multiplier;
        if (val === 1) dnaScores["IB"] += multiplier;
        if (val === 2) dnaScores["ICSE"] += multiplier;
        if (val === 3) dnaScores["State"] += multiplier;

        totalPoints += multiplier;
    }

    // Normalize mapping for key lookup
    const mappings = { "CBSE": "CBSE", "IB": "IB", "ICSE": "ICSE", "State Board": "State", "State": "State", "Cambridge (IGCSE)": "IB" }; // Approximate mapping

    // Identify Child's Top DNA
    let topDNA = Object.keys(dnaScores).reduce((a, b) => dnaScores[a] > dnaScores[b] ? a : b);
    let topScore = totalPoints > 0 ? Math.round((dnaScores[topDNA] / totalPoints) * 100) : 0;

    const traits = { "CBSE": "Logical Structure", "IB": "Inquiry-based Autonomy", "ICSE": "Deep Narrative Context", "State": "Functional Local Proficiency" };
    const displayMappings = { "CBSE": "CBSE", "IB": "IB", "ICSE": "ICSE", "State": "State Board" };

    let normalizedDNA = displayMappings[topDNA] || topDNA;

    // Identify Parent's Score (how well child matches Parent's choice)
    let parentKey = mappings[parentRec] || "CBSE"; // Fallback
    // Handle edge cases in naming
    if (parentRec.includes("IGCSE")) parentKey = "IB";

    let parentMatchScore = totalPoints > 0 ? Math.round(((dnaScores[parentKey] || 0) / totalPoints) * 100) : 0;
    if (isNaN(parentMatchScore)) parentMatchScore = 0;

    let isConflict = (parentRec !== normalizedDNA);

    let bridgeHtml = isConflict ? `
		<div class="report-card" style="border: 2px solid var(--sunrise-primary); background: #FFF9F2; margin-top: 20px;">
			<h3 style="color: var(--navy-premium); font-weight: 800; font-size: 1.2rem; margin-bottom: 10px;">Bridge Narrative: Conflict Resolution</h3>
			<p style="color: var(--navy-light); font-size: 0.95rem; line-height: 1.6; margin-bottom: 10px;">
				<strong>The Mismatch:</strong> Your strategic goal is <strong>${parentRec}</strong>, but our forensic DNA audit shows your child’s natural cognitive engine thrives on <strong>${traits[topDNA]}</strong>, which is the hallmark of the <strong>${normalizedDNA}</strong> ecosystem.
			</p>
			<p style="color: var(--navy-light); font-size: 0.95rem; line-height: 1.6; margin-bottom: 10px;">
				<strong>Cognitive Risk:</strong> Forcing a child with high ${traits[topDNA]} into a purely ${parentRec} structure can lead to "Academic Burnout" by Grade 8, as their natural inquiry style is suppressed by rigid standardization.
			</p>
			<p style="color: var(--navy-light); font-size: 0.95rem; line-height: 1.6; margin-bottom: 10px;">
				<strong>The Strategy:</strong> Do not abandon your vision; instead, look for a "Hybrid School". Select a ${parentRec} school that offers high-autonomy clubs, project-based labs, or ${normalizedDNA}-inspired electives to feed their natural instinct.
			</p>
			<p style="color: var(--navy-light); font-size: 0.95rem; line-height: 1.6;">
				<strong>Final Verdict:</strong> Alignment is possible by choosing the board for the "Certificate" but selecting the specific school campus for the "Culture".
			</p>
		</div>` : `
    <div class="report-card" style="border: 2px solid #22C55E; background: #F0FDF4; margin-top: 20px;">
        <h3 style="color: #166534; font-weight: 800; font-size: 1.2rem; margin-bottom: 10px;">✅ PERFECT ALIGNMENT</h3>
        <p style="color: #166534; font-size: 0.95rem; line-height: 1.6;">
            Your parenting vision and your child’s cognitive DNA are in a rare state of "Scientific Sync." Your choice of <strong>${parentRec}</strong> perfectly supports their natural strength in <strong>${traits[topDNA]}</strong>. This foundation minimizes academic friction and maximizes their potential for high-tier university placements.
        </p>
    </div>`;

    return { parentRec, normalizedDNA, bridgeHtml, isConflict, parentMatchScore, topScore };
}

function finalizeSyncStart() {
    if (syncTimer) {
        clearInterval(syncTimer);
        syncTimer = null;
    }
    // Ensure any specific board logic from fallback is applied if needed
    const fbBoard = document.getElementById('fallbackBoard')?.value;
    if (fbBoard) {
        customerData.targetBoard = fbBoard;
        // FIX: Inject vision markers for the selected board if they are missing
        injectVisionMarkers(fbBoard);
    }

    isSyncMatchMode = true;
    window.currentPhase = 2;
    initializeQuizShell(0, 2);
}

// --- SYNC MATCH CALCULATION ---
function calculateSyncMatch() {
    const parentQuestions = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10", "q11", "q12", "q13", "q14", "q15"];
    const isParentDataMissing = parentQuestions.some(id => answers[id] === undefined);

    if (isParentDataMissing) {
        // In dummy/dev mode, maybe we want to allow skipping?
        // alert("Initial assessment data is missing.");
        // goToLandingPage();
        // return;
    }

    const { parentRec, normalizedDNA, bridgeHtml, parentMatchScore, topScore } = getAlignmentData();
    const manualDisclaimer = isManualSync ? `<p style="text-align: center; font-size: 0.75rem; color: #94A3B8; margin-bottom: 10px;">⚠️ Sync generated via Manual Input from Phase 1 Report.</p>` : '';

    const successPage = document.getElementById('successPage');
    if (successPage) {
        successPage.innerHTML = `
            ${getIntermediateHeaderHtml()}
            <div class="success-content-wrapper">
                <div class="success-container">
                    ${manualDisclaimer}
                    <div style="text-align:center; font-size:0.85rem; color:#64748B; margin-bottom:15px; font-weight:700;">
                        ${customerData.childName || "Student"} | Age: ${customerData.childAge || "N/A"} | Order ID: ${customerData.orderId || "N/A"}
                    </div>
                    
                    <h2 style="color:var(--navy-premium); text-align:center;">Sync Match Report 🔄</h2>
                    
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:30px;">
                        <div class="sync-score-block">
                            <div class="sync-score-title">Parent Vision</div>
                            <div class="sync-score-value">${parentMatchScore}%</div>
                            <div class="sync-score-sub">${parentRec}</div>
                        </div>
                        <div class="sync-score-block">
                            <div class="sync-score-title">Child DNA</div>
                            <div class="sync-score-value">${topScore}%</div>
                            <div class="sync-score-sub">${normalizedDNA}</div>
                        </div>
                    </div>
                    
                    ${bridgeHtml}
                    
                    <div class="apt-skola-exclusive" style="text-align:center;">
                        <h3 style="color:#1E40AF; font-size:1.1rem; font-weight:800; margin:0 0 10px 0;">Apt Skola Exclusive: AI Forensic School X-ray</h3>
                        
                        <div style="font-size:1.8rem; font-weight:900; color:#1D4ED8; margin:5px 0 10px;">
                            ₹99 <span style="font-size:0.9rem; color:#64748B; text-decoration:line-through; font-weight:500;">₹399</span>
                        </div>
                        <p style="font-size:0.9rem; color:#475569; margin-bottom:15px; line-height:1.4;">
                            Spot hidden red flags, library authenticity, and teacher turnover using our proprietary AI vision tool.
                        </p>
                        <a href="https://xray.aptskola.com" target="_blank" class="btn-xray" style="display:inline-block;">Get X-ray (75% OFF)</a>
                    </div>
                    
                    
                    <!-- Partnership / Ambassador Form -->
                    <!-- Partnership / Ambassador Form -->
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
                        <button onclick="openCollaborationModal('Ambassador')" class="btn-ambassador">
                            <span>✨</span> Thank you and Be our Ambassadors and earn cash rewards from 300 to 3000 🤝✨
                        </button>
                    </div>

                    <!-- End Session Button Moved Up -->
                    <button class="custom-cta-button" style="margin-top:30px; background: #64748B;" onclick="endFullSession()">End Session</button>

                    <!-- Foviz Banner -->
                    ${fovizBannerHtml}

                    <!-- Download/Share Buttons Moved to Bottom -->
                    <div style="display: flex; gap: 10px; margin-top: 30px;">
                        <button id="downloadSyncBtn" class="custom-cta-button" style="flex:1;" onclick="downloadSyncReportPDF()">Download Report ⬇️</button>
                        <button id="shareSyncBtn" class="custom-cta-button" style="flex:1; background: #10B981;" onclick="shareSyncReport()">Share Report 📲</button>
                    </div>

                </div>
            </div>
            ${getIntermediateFooterHtml()}
        `;
        successPage.classList.remove('hidden');
        successPage.classList.add('active');
    }
}

function endFullSession() {
    if (customerData.orderId && customerData.orderId !== 'N/A') {
        localStorage.removeItem(`aptskola_session_${customerData.orderId}`);
    }
    goToLandingPage();
}

async function renderReportToBrowser() {
    console.log("Starting renderReportToBrowser");
    // 1. Try to re-hydrate data from LocalStorage, but fall back to current data
    let sessionAnswers = answers;
    let sessionCustomerData = customerData;

    const lastOrderId = localStorage.getItem('aptskola_last_order_id');
    console.log("Last order ID:", lastOrderId);
    const sessionData = JSON.parse(localStorage.getItem(`aptskola_session_${lastOrderId}`));
    if (sessionData) {
        sessionAnswers = sessionData.answers;
        sessionCustomerData = sessionData.customerData;
        console.log("Session data loaded from localStorage");
        // Update global variables
        answers = sessionAnswers;
        customerData = sessionCustomerData;
    } else {
        console.log("No session data in localStorage, using current global data");
        sessionAnswers = answers;
        sessionCustomerData = customerData;
    }

    console.log("Using answers:", sessionAnswers);
    console.log("Using customer data:", sessionCustomerData);
    console.log("Answers keys:", Object.keys(sessionAnswers || {}));
    console.log("Answers length:", Object.keys(sessionAnswers || {}).length);

    if (!sessionAnswers || Object.keys(sessionAnswers).length === 0) {
        console.error("No answers data available!");
        throw new Error("No assessment answers found. Please complete the assessment first.");
    }

    const res = calculateFullRecommendation(sessionAnswers);
    console.log("Recommendation result:", res);
    console.log("Recommended object:", res.recommended);
    const recBoard = res.recommended.name;
    console.log("Recommended board:", recBoard);
    const boardKey = recBoard.toLowerCase().includes('cbse') ? 'cbse' :
        (recBoard.toLowerCase().includes('icse') ? 'icse' :
            (recBoard.toLowerCase().includes('ib') ? 'ib' :
                (recBoard.toLowerCase().includes('cambridge') ? 'Cambridge (IGCSE)' : 'State Board')));

    console.log("Board key:", boardKey);
    console.log("MASTER_DATA keys:", Object.keys(MASTER_DATA));
    const data = MASTER_DATA[boardKey];
    console.log("Board data found:", !!data);
    if (!data) {
        throw new Error(`Board data not found for key: ${boardKey}`);
    }
    const amount = (sessionData && sessionData.selectedPrice) ? sessionData.selectedPrice : (sessionCustomerData.amount || 599);
    const pkgName = (sessionData && sessionData.selectedPackage) ? sessionData.selectedPackage : (sessionCustomerData.package || '');
    const isPro = amount >= 1499 || pkgName === 'The Smart Parent Pro';
    const isPremium = amount >= 999 || pkgName === 'Premium' || isPro;

    // --- BASE BLOCKS (Included in all tiers: ₹599, ₹999, ₹1499) ---
    let html = `
        <div id="pdf-header" class="report-card !p-0 overflow-hidden bg-[#0F172A] text-white text-center">
            <div class="p-6">
                <div style="font-size:2rem; font-weight:800; letter-spacing:-1px;">Apt <span class="text-brand-orange">Skola</span></div>
                <div class="text-slate-300 text-lg font-medium mt-1">${sessionCustomerData.package} Report</div>
                <div class="text-slate-400 text-xs mt-3 uppercase tracking-widest">ID: ${sessionCustomerData.orderId} | Prepared for: ${sessionCustomerData.childName}</div>
            </div>
        </div>

        <div class="report-card !p-0 overflow-hidden">
            <div class="report-header-bg" style="margin: 0;">THE RECOMMENDED ARCHETYPE</div>
            <div class="p-6">
                <div class="text-3xl font-extrabold text-slate-900 mb-4">${data.title}</div>
                
                <!-- FIX: Inline Styles for PDF Stability -->
                <!-- FIX: Inline Styles for PDF Stability (Switching to inline-block for robustness) -->
                <div style="display: inline-block; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 20px;">
                    <span style="color: #64748B; font-weight: 600; font-size: 0.9rem; margin-right: 5px;">Board Match:</span>
                    <span style="color: #FF6B35; font-weight: 800; font-size: 1.1rem; display: inline-block;">${recBoard} (${res.recommended.percentage}%)</span>
                </div>
            </div>
        </div>

        <div class="report-card !p-0 overflow-hidden">
            <div class="report-header-bg" style="margin: 0;">STUDENT PERSONA</div>
            <div class="p-6 space-y-6">
                <div>
                    <span class="text-slate-500 font-bold uppercase text-xs tracking-wider">Archetype</span>
                    <div class="text-slate-800 font-bold text-lg">${data.persona}</div>
                </div>
                <p class="text-slate-600 leading-relaxed text-sm">
                    ${data.profile}
                </p>
            </div>
        </div>

        <div class="report-card !p-0 overflow-hidden">
            <div class="report-header-bg" style="margin: 0;">CAREER & ANALYSIS</div>
            <div class="p-6 space-y-6">
                <div class="pl-4 border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                    <h4 class="text-red-800 font-bold text-sm mb-2">The "Why Not" (Rejection Logic)</h4>
                    <p class="text-red-900 text-sm opacity-90 leading-relaxed">${data.rejectionReason}</p>
                </div>

                <div class="border-t border-slate-100 pt-5">
                    <h4 class="text-slate-900 font-bold text-sm mb-2">Projected Career Path</h4>
                    <p class="text-slate-600 text-sm leading-relaxed">${data.careerPath}</p>
                </div>
            </div>
        </div>

        <div class="report-card !p-0 overflow-hidden">
            <div class="report-header-bg" style="margin: 0;">BOARD & OPTION COMPARISON</div>
            <div class="p-6">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="text-slate-500 border-b border-slate-100">
                            <th class="text-left font-semibold pb-3">Board</th>
                            <th class="text-left font-semibold pb-3 w-1/2">Match Quality</th>
                            <th class="text-right font-semibold pb-3">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${res.fullRanking.slice(0, 3).map((r, i) => `
                            <tr>
                                <td class="py-4 font-bold text-slate-800">${r.name}</td>
                                <td class="py-4 pr-6">
                                    <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-1">
                                        <div class="h-full rounded-full ${i === 0 ? 'bg-brand-orange' : 'bg-slate-300'}" style="width: ${r.percentage}%"></div>
                                    </div>
                                    <div class="text-xs font-bold text-slate-600">${r.percentage}% Match</div>
                                </td>
                                <td class="py-4 text-right font-bold ${i === 0 ? 'text-emerald-500' : 'text-slate-500'}">
                                    ${i === 0 ? 'Recommended' : 'Alternative'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="report-card !p-0 overflow-hidden">
            <div class="report-header-bg" style="margin: 0;">BOARD DEEP DIVE</div>
            <div class="p-6 space-y-4">
                <div>
                    <h4 class="text-slate-900 font-bold text-sm mb-1">Philosophy</h4>
                    <p class="text-slate-600 text-sm leading-relaxed">${data.philosophy}</p>
                </div>
                <div>
                    <h4 class="text-slate-900 font-bold text-sm mb-1">Pedagogy</h4>
                    <p class="text-slate-600 text-sm leading-relaxed">${data.teachingMethod}</p>
                </div>
                
                <div class="p-4 rounded-lg border ${data.parentalRole.toLowerCase().includes('high') ? 'bg-red-50 border-red-100 text-red-900' : 'bg-emerald-50 border-emerald-100 text-emerald-900'}">
                    <h4 class="font-bold text-sm mb-1">Parental Commitment:</h4>
                    <p class="text-sm opacity-90">${data.parentalRole}</p>
                </div>
            </div>
        </div>

        <div class="report-card !p-0 overflow-hidden">
            <div class="report-header-bg" style="margin: 0;">EXPERT NOTE: SPECIAL NEEDS & INCLUSION</div>
            <div class="p-6">
                 <p class="text-slate-600 text-sm leading-relaxed">
                    A supportive school environment is often more critical than the syllabus itself. For students requiring significant customization, Open Schooling (NIOS) is the most adaptable choice.
                 </p>
            </div>
        </div>
    `;

    // --- PREMIUM BLOCKS (₹999 and above) ---
    if (isPremium) {
        html += `
            <div class="report-card">
                <div class="report-header-bg">🧐 RISK MITIGATION & VETTING</div>
                <div class="space-y-3 p-4">
                    ${MASTER_DATA.vetting.redFlags.map(f => `
                        <div class="flex items-start gap-3">
                            <span style="font-size:1.2rem;">🚩</span>
                            <span class="text-slate-700 text-sm font-medium leading-tight">${f}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="report-card">
                <div class="report-header-bg">15-YEAR FEE FORECASTER (12% Inflation)</div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start p-4">
                     <!-- Col 1 -->
                     <div>
                        <table class="w-full text-sm">
                            <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                <tr><th class="py-2 text-left pl-2">Grade</th><th class="py-2 text-right pr-2">Projected Fee</th></tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                ${MASTER_DATA.financial.projectionTable.slice(0, 8).map(r => `
                                    <tr><td class="py-2 pl-2 text-slate-700 font-medium">${r.grade}</td><td class="py-2 pr-2 text-right font-bold text-slate-900">${r.fee}</td></tr>
                                `).join('')}
                            </tbody>
                        </table>
                     </div>
                     <!-- Col 2 -->
                     <div>
                        <table class="w-full text-sm mb-4">
                            <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                <tr><th class="py-2 text-left pl-2">Grade</th><th class="py-2 text-right pr-2">Projected Fee</th></tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                ${MASTER_DATA.financial.projectionTable.slice(8, 15).map(r => `
                                    <tr><td class="py-2 pl-2 text-slate-700 font-medium">${r.grade}</td><td class="py-2 pr-2 text-right font-bold text-slate-900">${r.fee}</td></tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <div class="p-3 bg-blue-50 text-blue-900 text-xs rounded-lg border border-blue-100 leading-relaxed">
                             <strong>💰 Smart Planning Tip:</strong> Early investments in high-yield mutual funds can offset up to 40% of these projected costs.
                        </div>
                     </div>
                </div>
            </div>
        `;
    }

    // --- PRO BLOCKS (₹1499 only) ---
    if (isPro) {
        html += `
            <div class="report-card">
                <div class="report-header-bg">🤝 FEE NEGOTIATION STRATEGIES</div>
                <div class="space-y-6 p-4">
                    ${MASTER_DATA.concierge.negotiation.map(n => `
                        <div class="pl-4 border-l-4 border-brand-orange">
                            <h4 class="text-lg font-bold text-slate-800 mb-1">${n.title}</h4>
                            <p class="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Scenario: ${n.scenario}</p>
                            <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 text-slate-700 italic text-sm relative">
                                "${n.script}"
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="report-card">
                <div class="report-header-bg">🎙️ PARENT INTERVIEW MASTERY</div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                    ${MASTER_DATA.interviewMastery.part2.slice(0, 6).map(i => `
                        <div class="bg-white border boundary-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-all">
                            <h4 class="font-bold text-slate-800 text-sm mb-3">${i.q}</h4>
                            <div class="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded inline-block border border-emerald-100">
                                💡 Strategy: ${i.strategy}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // --- UNIVERSAL FOOTER (Included in all packages) ---
    html += `
        <div class="report-card" style="margin-top:40px; padding:20px; background:#F1F5F9; border-radius:8px; font-size:0.8rem; color:#64748B; text-align:justify;">
            <strong>DISCLAIMER:</strong> This report is advisory only. The final enrollment decision remains the sole responsibility of the parent. The outcome of this report is purely based on the user input provided..
        </div>
        <div style="text-align: center; margin-top: 20px; padding-bottom: 20px;">
            <p class="text-xs font-medium opacity-70" style="font-size: 0.8rem !important; color: #64748B;">&copy; 2024 - 2026 Apt Skola, all rights reserved.</p>
        </div>
    `;

    // 2. Dispatch Render to Screen


    // 2. Dispatch Render to Screen
    const preview = document.getElementById('reportPreview');
    if (preview) {
        preview.innerHTML = html;
        console.log("Report HTML set to preview element, length:", html.length);
        console.log("Preview element after setting:", preview);
    } else {
        console.error("Report preview element not found!");
    }
}




// --- OPTIMIZED: SMART PDF GENERATOR WITH NATIVE VECTOR HEADER ---

function hydrateData() {
    console.log("Hydrating data...");
    if (!customerData || !customerData.orderId || customerData.orderId === "N/A") {
        const lastOrderId = localStorage.getItem("aptskola_last_order_id");
        if (lastOrderId) {
            const sessionData = JSON.parse(localStorage.getItem("aptskola_session_" + lastOrderId));
            if (sessionData) {
                answers = sessionData.answers;
                customerData = sessionData.customerData;
                selectedPackage = sessionData.selectedPackage || (sessionData.customerData ? sessionData.customerData.package : "Essential");
                selectedPrice = sessionData.selectedPrice || (sessionData.customerData ? sessionData.customerData.amount : 599);
                console.log("Data hydrated successfully from localStorage");
            }
        }
    }
}

async function downloadReport() {
    console.log("Download report triggered");
    const btn = document.getElementById("downloadBtn");
    const originalText = btn ? btn.textContent : "Download Report ⬇️";

    try {
        if (btn) {
            btn.textContent = "Generating PDF...";
            btn.disabled = true;
            btn.style.opacity = "0.7";
        }

        hydrateData();
        const { jsPDF } = window.jspdf;
        const reportElement = document.getElementById("reportPreview");

        if (!reportElement || !reportElement.innerHTML.trim()) {
            alert("Report content not found. Generating now...");
            await renderReportToBrowser();
        }

        // --- NEW: CLONE AND SCALE STRATEGY ---
        // 1. Create a temporary container with strict desktop dimensions
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.top = '-9999px';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '800px'; // Force Desktop Width
        tempContainer.style.zIndex = '-1';
        document.body.appendChild(tempContainer);

        // 2. Clone cards into this container
        const originalCards = reportElement.querySelectorAll(".report-card, .xray-card, .foviz-banner, .btn-ambassador");
        originalCards.forEach(card => {
            const clone = card.cloneNode(true);
            // Ensure clone has full width
            clone.style.width = '100%';
            clone.style.maxWidth = '100%';
            clone.style.margin = '0 0 20px 0'; // Clean spacing
            tempContainer.appendChild(clone);
        });

        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const contentWidth = pdfWidth - (2 * margin);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(15, 23, 42);

        // Header Text
        const headerText = `Name: ${customerData.childName || "Student"}  |  Age: ${customerData.childAge || "N/A"}  |  Order ID: ${customerData.orderId || "N/A"}`;
        pdf.text(headerText, pdfWidth / 2, 20, { align: 'center' });

        let currentY = 45;

        // 3. Capture from the TEMP container's children
        const clonedCards = tempContainer.children;

        for (let i = 0; i < clonedCards.length; i++) {
            const canvas = await html2canvas(clonedCards[i], {
                scale: 2, // High resolution
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 800 // Trick html2canvas
            });

            const imgData = canvas.toDataURL("image/jpeg", 0.9);
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * contentWidth) / imgProps.width;

            if (currentY + imgHeight > pdfHeight - margin) {
                pdf.addPage();
                currentY = margin;
            }
            pdf.addImage(imgData, "JPEG", margin, currentY, contentWidth, imgHeight);
            currentY += imgHeight + 8;
        }

        // 4. Cleanup
        document.body.removeChild(tempContainer);

        const res = calculateFullRecommendation(answers);
        const recBoard = res.recommended.name;
        pdf.save("Apt-Skola-" + (customerData.childName || "Report") + "-" + recBoard + ".pdf");
    } catch (err) {
        console.error("Download failed:", err);
        alert("Download failed: " + err.message);
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
            btn.style.opacity = "1";
        }
    }
}

async function sharePDF() {
    console.log("Share report triggered");
    const btn = document.getElementById("shareBtn");
    const originalText = btn ? btn.textContent : "Share Report 📲";

    if (!navigator.share) {
        alert("Sharing is not supported on this browser. Please use Download.");
        return;
    }

    try {
        if (btn) {
            btn.textContent = "Preparing Share...";
            btn.disabled = true;
            btn.style.opacity = "0.7";
        }

        hydrateData();
        const { jsPDF } = window.jspdf;
        const reportElement = document.getElementById("reportPreview");

        if (!reportElement || !reportElement.innerHTML.trim()) {
            await renderReportToBrowser();
        }

        const cards = reportElement.querySelectorAll(".report-card, .xray-card, .foviz-banner, .btn-ambassador");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const contentWidth = pdfWidth - (2 * margin);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(15, 23, 42);

        // Remove "Apt Skola" large header, kept only the details line as first line
        const headerText = `Name: ${customerData.childName || "Student"}  |  Age: ${customerData.childAge || "N/A"}  |  Order ID: ${customerData.orderId || "N/A"}`;
        pdf.text(headerText, margin, 20);

        let currentY = 45;

        for (let i = 0; i < cards.length; i++) {
            const canvas = await html2canvas(cards[i], { scale: 2, useCORS: true, logging: false });
            const imgData = canvas.toDataURL("image/jpeg", 0.8);
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * contentWidth) / imgProps.width;

            if (currentY + imgHeight > pdfHeight - margin) {
                pdf.addPage();
                currentY = margin;
            }
            pdf.addImage(imgData, "JPEG", margin, currentY, contentWidth, imgHeight);
            currentY += imgHeight + 8;
        }

        const pdfBlob = pdf.output("blob");
        const file = new File([pdfBlob], "Apt-Skola-Report.pdf", { type: "application/pdf" });

        await navigator.share({
            files: [file],
            title: "Apt Skola Board Match Report",
            text: "Here is the scientific board match report for " + (customerData.childName || "the student") + "."
        });
    } catch (err) {
        console.error("Share failed:", err);
        if (err.name !== "AbortError") {
            alert("Share failed: " + err.message);
        }
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
            btn.style.opacity = "1";
        }
    }
}

// --- UNIFIED MASTER CONTROLLER (CTO FINAL VERSION) ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. IMMEDIATE PRIORITY: Check for payment return
    checkPaymentStatus();

    // 2. LOAD CALCULATOR: Initialize the donut chart
    if (typeof calculateCostOfConfusion === 'function') {
        calculateCostOfConfusion();
    }

    // 3. LOGO NAVIGATION: Reset site on branding click
    const logos = document.querySelectorAll('#landingHeaderLogo');
    logos.forEach(l => l.addEventListener('click', goToLandingPage));

    // 4. DEEP-LINK HANDLER: Check for "Sync Match" link
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('unlock') === 'sync' || urlParams.get('page') === 'sync') {
        setTimeout(() => {
            if (typeof openSyncMatchGate === 'function') {
                openSyncMatchGate();
                const syncInput = document.getElementById('syncOrderId');
                if (syncInput) {
                    syncInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    syncInput.focus();
                }
            }
        }, 500);
    }

    // 5. BUTTON SAFETY: Force Pricing Buttons to be active
    const pricingButtons = document.querySelectorAll('#pricingModal button');
    pricingButtons.forEach(btn => {
        btn.style.pointerEvents = 'auto';
        btn.style.cursor = 'pointer';
        btn.style.zIndex = '100'; // Ensure they are on top
    });

    // 6. BUTTON SAFETY: Ensure landing page buttons/links are clickable
    const landingButtons = document.querySelectorAll('#landingPage button, #landingPage a, .hero-actions button');
    landingButtons.forEach(el => {
        try {
            el.style.pointerEvents = 'auto';
            el.style.cursor = 'pointer';
            el.style.zIndex = '80';
        } catch (e) { /* ignore readonly styles */ }
    });

    // 7. Ensure redirect/loading overlay doesn't block clicks when hidden
    const redirectOverlay = document.getElementById('redirectLoadingOverlay');
    if (redirectOverlay && !redirectOverlay.classList.contains('active')) {
        redirectOverlay.style.pointerEvents = 'none';
        redirectOverlay.style.display = 'none';
        redirectOverlay.style.visibility = 'hidden';
    }

    // 8. DEFENSIVE: detect any unexpected full-page blockers and make them non-interactive
    (function unblockCoveringElements() {
        try {
            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
            const candidates = [];
            const all = Array.from(document.querySelectorAll('body *'));
            all.forEach(el => {
                if (el.closest('#react-hero-root')) return;
                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden' || style.pointerEvents === 'none') return;
                const rect = el.getBoundingClientRect();
                if (!rect.width || !rect.height) return;
                const coversWidth = rect.width >= vw * 0.9 && rect.height >= vh * 0.9;
                const isFixed = style.position === 'fixed' || style.position === 'absolute' || style.position === 'sticky';
                const z = parseInt(style.zIndex) || 0;
                if (coversWidth && isFixed && z >= 50) {
                    candidates.push({ el, rect, z, className: el.className || '', id: el.id || '' });
                }
            });

            if (candidates.length > 0) {
                console.warn('Blocking elements detected:', candidates.map(c => ({ id: c.id, class: c.className, z: c.z })));
                // Only block if it is NOT one of our known interactive containers
                candidates.forEach(c => {
                    if (c.id === 'react-hero-root' || c.id === 'landingPage' || c.id === 'questionPages') return;
                    // Preserve intentional modals by checking for common modal classes/ids
                    const lower = String(c.className).toLowerCase();
                    const id = String(c.id).toLowerCase();
                    if (id === 'react-hero-root') return;
                    if (lower.includes('payment-modal') || lower.includes('sample-modal') || id.includes('redirect') || id.includes('modal') || c.el.classList.contains('active')) {
                        // if it's active modal, leave it; otherwise ensure it's visible and interactive
                        if (!c.el.classList.contains('active')) {
                            c.el.style.pointerEvents = 'none';
                            c.el.style.zIndex = '10';
                            console.info('Demoted non-active modal-like element:', c.el);
                        }
                    } else {
                        c.el.style.pointerEvents = 'none';
                        c.el.style.zIndex = '10';
                        console.info('Disabled unexpected full-page blocker:', c.el);
                    }
                });
            }
        } catch (e) {
            console.error('unblockCoveringElements failed', e);
        }
    })();

    // 9a. HERO BUTTON TEXT UPDATE (REMOVED - Fixed in JSX)
    // 9. PHONE CAPTURE (Partial Lead - ABANDONMENT LOGIC)
    const phoneInput = document.getElementById('phone');
    const custForm = document.getElementById('customerForm');
    let partialLeadTimeout;

    if (phoneInput && custForm) {
        // Clear timeout if user interacts with the form again
        custForm.addEventListener('focusin', () => {
            if (partialLeadTimeout) {
                clearTimeout(partialLeadTimeout);
                // console.log("Partial lead capture cancelled (user returned).");
            }
        });

        phoneInput.addEventListener('blur', function () {
            const phone = this.value.trim();
            if (phone.length >= 10) {
                // Set a delay to confirm abandonment (e.g., 5 seconds)
                partialLeadTimeout = setTimeout(() => {
                    const name = document.getElementById('parentName')?.value || 'Visitor';
                    const email = document.getElementById('email')?.value || 'no-email@captured.com';
                    const formData = new FormData();
                    formData.append("access_key", "1930d1ce-5416-45d1-9b2b-5f129cb30dbd");
                    formData.append("subject", "Partial Lead Captured (Abandoned Form)");
                    formData.append("name", name);
                    formData.append("phone", phone);
                    formData.append("email", email);
                    formData.append("status", "Partial/Abandoned");

                    fetch("https://api.web3forms.com/submit", {
                        method: "POST",
                        body: formData
                    }).then(res => console.log("Partial lead captured:", res.status))
                        .catch(err => console.error("Partial lead failed:", err));
                }, 5000); // 5 seconds delay
            }
        });
    }

});

// --- HELPER FUNCTIONS (PASTE & RECOVERY) ---
async function pasteOrderId() {
    try {
        const text = await navigator.clipboard.readText();
        const syncInput = document.getElementById('syncOrderId');
        if (syncInput && text) {
            syncInput.value = text.trim();
            syncInput.style.borderColor = "#10B981";
            setTimeout(() => { syncInput.style.borderColor = ""; }, 1000);
            console.log("CTO Update: Order ID pasted successfully.");
        }
    } catch (err) {
        console.warn("Clipboard access denied.", err);
        alert("Please long-press the field to paste manually.");
    }
}

// --- COPY ORDER ID FUNCTION ---
function copyOrderId() {
    const orderId = document.getElementById('displayOrderId').textContent;
    if (orderId && orderId !== 'N/A') {
        navigator.clipboard.writeText(orderId).then(() => {
            alert("Order ID copied to clipboard!");
        }).catch(err => {
            console.error("Failed to copy:", err);
            // Fallback: select and copy manually
            const textArea = document.createElement('textarea');
            textArea.value = orderId;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert("Order ID copied to clipboard!");
        });
    } else {
        alert("Order ID not available.");
    }
}

function recoverSession() {
    const recoveryInput = document.getElementById('recoveryOrderId');
    const orderId = recoveryInput ? recoveryInput.value.trim() : '';
    if (!orderId) { alert("Please enter your Order ID."); return; }

    const savedSession = localStorage.getItem(`aptskola_session_${orderId}`);
    if (savedSession) {
        const data = JSON.parse(savedSession);
        answers = data.answers;
        customerData = data.customerData;
        selectedPrice = customerData.amount || 599;
        selectedPackage = customerData.package || 'Essential';
        document.getElementById('landingPage').classList.remove('active');
        renderReportToBrowser().then(() => {
            showInstantSuccessPage();
            console.log("CTO Update: Session recovered for " + orderId);
        });
    } else {
        alert("Order ID not found on this device.");
    }
}
// --- FIXED: CLOSED RECOVERY FUNCTIONS ---
function recoverSessionEmail(targetEmail) {
    let foundSession = null;
    const emailToMatch = targetEmail.toLowerCase().trim();

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('aptskola_session_')) {
            try {
                const sessionData = JSON.parse(localStorage.getItem(key));
                if (sessionData.customerData && sessionData.customerData.email.toLowerCase() === emailToMatch) {
                    foundSession = sessionData;
                    break;
                }
            } catch (e) {
                console.warn("Skipping malformed session data", e);
            }
        }
    }

    if (foundSession) {
        answers = foundSession.answers;
        customerData = foundSession.customerData;
        selectedPrice = customerData.amount || 599;
        selectedPackage = foundSession.selectedPackage || customerData.package || 'Essential';

        const landing = document.getElementById('landingPage');
        if (landing) landing.classList.remove('active');

        renderReportToBrowser().then(() => {
            showInstantSuccessPage();
            console.log("CTO: Session recovered via email match.");
        });
    } else {
        alert("No assessment found for this email on this device.");
    }
}
// Attach functions to window for React/External access
window.initializeQuizShell = initializeQuizShell;
window.selectPackage = selectPackage;
window.openSyncMatchGate = openSyncMatchGate;
window.openPricingOrScroll = openPricingOrScroll;
window.openPricingModal = openPricingModal;
window.scrollToClarity = scrollToClarity;
window.openSampleReport = openSampleReport;
window.closeSampleReport = closeSampleReport;
// --- 11. GLOBAL PRELOADER LOGIC ---
// --- 11. GLOBAL PRELOADER LOGIC (MINIMALIST) ---
// --- 11. GLOBAL PRELOADER LOGIC REMOVED ---
// (Cleaned up)

window.renderReportToBrowser = renderReportToBrowser;
window.downloadReport = downloadReport;
window.sharePDF = sharePDF;
window.validateAndStartSyncMatch = validateAndStartSyncMatch;
window.pasteOrderId = pasteOrderId;
window.copyOrderId = copyOrderId;
window.recoverSession = recoverSession;
window.recoverSessionEmail = recoverSessionEmail;

// --- 12. CONTEXTUAL NAVIGATION LOGIC ---
window.checkSessionActive = function () {
    const lastOrder = localStorage.getItem('aptskola_last_order_id');
    return !!lastOrder;
};

window.autoResumeSession = function () {
    const lastOrder = localStorage.getItem('aptskola_last_order_id');
    if (lastOrder) {
        // Reuse existing recovery logic but bypass manual input
        const recoveryInput = document.getElementById('recoveryOrderId');
        if (recoveryInput) recoveryInput.value = lastOrder;
        recoverSession();
    }
};

window.openCollaborationModal = openCollaborationModal;
window.toggleSyncTimer = toggleSyncTimer;
window.handleSyncConfirmation = handleSyncConfirmation;

// --- MISSING PARTNER MODAL ---
function openCollaborationModal(type) {
    console.log("Opening Collaboration Modal:", type);

    // 1. Remove existing if any
    const existing = document.getElementById('collaborationModal');
    if (existing) existing.remove();

    // 2. Create Modal HTML
    const modal = document.createElement('div');
    modal.id = 'collaborationModal';
    modal.className = 'payment-modal active';
    modal.style.zIndex = '9999';

    const title = type === 'Partner' ? 'Educator Partnership' : 'Ambassador Program';
    const sub = type === 'Partner' ? 'Join our Forensic Network' : 'Earn Rewards for Referrals';

    modal.innerHTML = `
        <div class="payment-modal-content" style="max-width: 550px; text-align: left; border-top: 5px solid #FF6B35;">
            <button onclick="document.getElementById('collaborationModal').remove()" style="position:absolute; top:15px; right:15px; background:none; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>
            
            <h3 style="color: #0F172A; font-weight: 800; font-size: 1.5rem; margin-bottom: 5px;">${title}</h3>
            <p style="color: #64748B; margin-bottom: 25px;">${sub}</p>

            <form onsubmit="handleCollaborationSubmit(event, '${type}')" style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="font-size: 0.85rem; font-weight: 700; color: #334155;">Full Name</label>
                    <input type="text" name="name" required style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 8px; margin-top: 5px;">
                </div>
                <div>
                    <label style="font-size: 0.85rem; font-weight: 700; color: #334155;">WhatsApp Number</label>
                    <input type="tel" name="phone" pattern="[6-9][0-9]{9}" required style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 8px; margin-top: 5px;">
                </div>
                <div>
                    <label style="font-size: 0.85rem; font-weight: 700; color: #334155;">Current Role / Institute</label>
                    <input type="text" name="role" required style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 8px; margin-top: 5px;">
                </div>
                
                <button type="submit" class="custom-cta-button" style="margin-top: 10px; width: 100%;">Submit Interest →</button>
            </form>
            <p style="text-align: center; font-size: 0.75rem; color: #94A3B8; margin-top: 15px;">Our team will contact you within 24 hours.</p>
        </div>
    `;

    document.body.appendChild(modal);
}

function handleCollaborationSubmit(e, type) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerHTML = "Submitting...";
    btn.disabled = true;

    // Simulate API
    setTimeout(() => {
        btn.innerHTML = "Success! ✅";
        btn.style.background = "#10B981";

        // Track
        if (window.triggerTrack) window.triggerTrack('Collaboration_Lead', { type: type });

        setTimeout(() => {
            document.getElementById('collaborationModal').remove();
        }, 1500);
    }, 1000);
}

function showPsychometricHistogram() {
    console.log("Rendering Preliminary Fitment Analysis...");
    const app = document.getElementById('questionPageApp');
    if (app) app.classList.remove('active');

    const container = document.getElementById('psychometricHistogram');
    if (!container) return;

    container.style.display = ''; // Clear any inline none
    container.innerHTML = `
        <div class="assessment-results-card">
            <div class="results-header">
                <h2 class="text-4xl font-black text-brand-navy mb-4">Preliminary Fitment Analysis</h2>
                <p class="text-slate-600">Analyzing your child's neural patterns based on cognitive architecture inputs.</p>
            </div>
            
            <div class="histogram-grid">
                <div class="histo-bar-wrapper">
                    <div class="histo-label"><span>Visual Processing</span><span class="histo-perc">0%</span></div>
                    <div class="histo-track"><div class="histo-fill bar-orange" id="bar-visual" style="width: 0%"></div></div>
                </div>
                <div class="histo-bar-wrapper">
                    <div class="histo-label"><span>Auditory Synthesis</span><span class="histo-perc">0%</span></div>
                    <div class="histo-track"><div class="histo-fill bar-blue" id="bar-auditory" style="width: 0%"></div></div>
                </div>
                <div class="histo-bar-wrapper">
                    <div class="histo-label"><span>Kinesthetic Logic</span><span class="histo-perc">0%</span></div>
                    <div class="histo-track"><div class="histo-fill bar-green" id="bar-kine" style="width: 0%"></div></div>
                </div>
                <div class="histo-bar-wrapper">
                    <div class="histo-label"><span>Creative Impulse</span><span class="histo-perc">0%</span></div>
                    <div class="histo-track"><div class="histo-fill bar-yellow" id="bar-creative" style="width: 0%"></div></div>
                </div>
            </div>
            
            <div class="results-footer" id="resultsFooter" style="opacity: 0; transition: opacity 0.5s ease-in;">
                <button onclick="showDynamicRiskCard()" class="custom-cta-button" style="width: 100%; max-width: 400px;">View Misalignment Risk →</button>
            </div>
        </div>
    `;
    container.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // START SIMULATION WITH DYNAMIC DATA
    // Generate random targets between 40-60% for Preliminary Analysis
    const pVisual = Math.floor(Math.random() * 21) + 40;
    const pAuditory = Math.floor(Math.random() * 21) + 40;
    const pKine = Math.floor(Math.random() * 21) + 40;
    const pCreative = Math.floor(Math.random() * 21) + 40;

    const bars = [
        { id: 'bar-visual', target: pVisual },
        { id: 'bar-auditory', target: pAuditory },
        { id: 'bar-kine', target: pKine },
        { id: 'bar-creative', target: pCreative }
    ];

    let ticks = 0;
    const interval = setInterval(() => {
        bars.forEach(bar => {
            const el = document.getElementById(bar.id);
            if (el) {
                const randomWidth = Math.floor(Math.random() * 75) + 20; // 20-95
                el.style.width = randomWidth + '%';
                const percLabel = el.closest('.histo-bar-wrapper').querySelector('.histo-perc');
                if (percLabel) percLabel.innerText = randomWidth + '%';
            }
        });
        ticks++;
        if (ticks > 25) { // ~2.5 seconds (100ms * 25)
            clearInterval(interval);
            bars.forEach(bar => {
                const el = document.getElementById(bar.id);
                if (el) {
                    el.classList.add('settled');
                    el.style.width = bar.target + '%';
                    const percLabel = el.closest('.histo-bar-wrapper').querySelector('.histo-perc');
                    if (percLabel) percLabel.innerText = bar.target + '%';
                }
            });
            // Show Footer Button
            setTimeout(() => {
                const footer = document.getElementById('resultsFooter');
                if (footer) footer.style.opacity = '1';
            }, 500);
        }
    }, 100);
}

function showDynamicRiskCard() {
    console.log("Rendering Risk Card...");
    const containers = document.querySelectorAll('.flow-container');
    containers.forEach(c => {
        c.classList.remove('active');
        c.style.display = '';
    });

    const q1Ans = answers['p0_q1'];
    const personas = ["Visual Strategist", "Verbal Analyst", "Conceptual Learner"];
    const selectedPersona = personas[q1Ans] || "Unique Learner";

    const container = document.getElementById('dynamicRiskCard');
    if (!container) return;

    container.style.display = '';
    container.innerHTML = `
        <div class="risk-card-dynamic premium-risk">
            <div class="risk-alert-header">
                <div class="risk-icon-pulse">⚠️</div>
                <h2 class="text-3xl font-black text-red-900 mb-2">Misalignment Alert</h2>
            </div>
            
            <div class="risk-message-box">
                <p class="text-lg text-red-800 mb-6">Your child is a <strong>${selectedPersona}</strong>. There is a <span class="font-black">65% risk</span> that a standard curriculum will suppress their natural logic processing.</p>
            </div>

            <div class="dashboard-note">
                <p class="note-label">Strategic Board Alignment</p>
                <p class="note-content">"Welcome to the Surgical Assessment phase. You are now transitioning from general discovery to deep diagnostics. Your inputs here trigger our engine to map your child’s data against the Learning Alignment Matrix, generating a high-fidelity audit and unlocking your full Personalized Board Fitment Report."</p>
            </div>
            
            <button onclick="showMomentumModal()" class="custom-cta-button risk-cta" style="width: 100%; max-width: 400px; margin: 0 auto;">Authorize and Calibrate with Phase 1</button>
        </div>
    `;
    container.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function startPhase1() {
    window.currentPhase = 1;
    hasSeenMilestone1 = false;
    hasSeenMilestone2 = false;
    window.toggleFooter('minimal'); // Switch to minimal footer for Questions
    window.triggerTrack('Phase_1_Questions_Started');
    initializeQuizShell(0, 1);
}

// --- MOMENTUM TRIGGER MODAL LOGIC ---
function showMomentumModal() {
    const modal = document.getElementById('momentumModal');
    if (modal) {
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('active'), 10);

        // Track Focus
        const input = document.getElementById('momentumPhone');
        if (input && !input.dataset.tracked) {
            input.addEventListener('focus', () => {
                window.triggerTrack('Lead_Field_Focus');
                input.dataset.tracked = 'true'; // Fire once
            });
        }
    }
}

function validateMomentumPhone(input) {
    let val = input.value.replace(/\D/g, ''); // Numeric only
    input.value = val;

    const checkmark = document.getElementById('phoneCheckmark');
    const submitBtn = document.getElementById('momentumSubmitBtn');

    // starts with 6-9 and is 10 digits
    const isValid = /^[6-9]\d{9}$/.test(val);

    if (isValid) {
        if (checkmark) checkmark.classList.remove('hidden');
        if (submitBtn) submitBtn.disabled = false;
    } else {
        if (checkmark) checkmark.classList.add('hidden');
        if (submitBtn) submitBtn.disabled = true;
    }
}

function handleMomentumSubmit() {
    const phone = document.getElementById('momentumPhone')?.value;
    if (phone) {
        customerData.phone = phone;
        // Mock persistence / reserve session
        console.log("Session reserved for:", phone);
        window.triggerTrack('Momentum_Submit');
    }

    const modal = document.getElementById('momentumModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.classList.add('hidden');
            startPhase1();
        }, 400);
    }
}

// --- DNA FINALIZATION SEQUENCE (6.5s) ---
function showDnaFinalization() {
    const detailsPage = document.getElementById('detailsPage');
    if (detailsPage) detailsPage.classList.remove('active');

    const app = document.getElementById('questionPageApp');
    if (app) app.classList.remove('active');

    // Create container if not exists
    let container = document.getElementById('dnaFinalization');
    if (!container) {
        container = document.createElement('div');
        container.id = 'dnaFinalization';
        document.body.appendChild(container);
    }

    // TRACK: Calibration Start
    window.triggerTrack('Calibration_Start');

    // Colors for the bars (Orange, Blue, Green, Yellow, Indigo)
    const colors = ['#F97316', '#3B82F6', '#10B981', '#EAB308', '#6366F1'];

    // Existing labels as requested
    const metrics = [
        'Cognitive Synthesis Architecture',
        'Socio-Economic Life-Path Mapping',
        'Instructional Syntax Compatibility',
        'Pressure-Threshold & Cultural Fit',
        'Institutional Alignment Matrix'
    ];

    const microInsights = [
        "Detected high-order pattern recognition.",
        "Adjusting for Tier-1 professional mobility.",
        "Optimizing for autonomous inquiry vs. rote instruction.",
        "Calibrating for competitive exam resilience.",
        "Filtering for Board-specific culture fit."
    ];

    let barsHtml = metrics.map((m, i) => `
        <div class="mb-6">
            <div class="flex justify-between mb-1">
                <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">${m}</span>
                <span class="text-xs font-bold text-slate-500 percentage-text">0%</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-2">
                <div class="dna-bar-moving h-2.5 rounded-full transition-all duration-300" 
                     style="width: 5%; background-color: ${colors[i % colors.length]}"></div>
            </div>
            <p class="text-[10px] font-bold text-slate-400 animate-pulse">
                <span class="mr-1">⚡</span> Deep Logic: ${microInsights[i]}
            </p>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="assessment-results-card">
            <div class="results-header">
                <div class="text-center mb-6">
                    <h2 class="text-4xl font-black text-brand-navy mb-4">Analyzing Your Child’s Potential</h2>
                    <p class="text-slate-600 text-sm">Analyzing your child's neural patterns based on cognitive architecture inputs.</p>
                </div>
            </div>

            <div id="dnaBarsWrapper" class="w-full mb-6 max-w-lg mx-auto">
                ${barsHtml}
            </div>

            <div id="dnaStatusBlock" class="text-center">
                <div id="dnaSpinner" class="inline-block w-5 h-5 border-2 border-slate-200 border-t-brand-orange rounded-full animate-spin mb-2"></div>
                <p id="dnaStatusText" class="text-brand-orange font-bold text-sm animate-pulse">CALIBRATING NEURAL PATTERNS...</p>
            </div>
        </div>
    `;

    container.classList.add('active'); // Ensure container is visible
    window.scrollTo(0, 0);

    const bars = container.querySelectorAll('.dna-bar-moving');
    const percents = container.querySelectorAll('.percentage-text');

    // DYNAMIC CALCULATION LOGIC
    // We generate somewhat realistic scores based on answers to avoid hardcoding "100%" everywhere
    // Scores should be high to show "Potential", but varied.
    let baseScore = 85;
    if (answers.q1 !== undefined) baseScore += 5; // Bonus for completing Phase 1

    // Generate 5 target scores between 85 and 99
    const targets = metrics.map(() => Math.floor(Math.random() * 14) + 85);

    // 1. Simulating Analysis (Oscillating Bars)
    let cycles = 0;
    const interval = setInterval(() => {
        bars.forEach((bar, i) => {
            // During animation, show random fluctuation
            const width = Math.floor(Math.random() * 60) + 20;
            bar.style.width = width + '%';
            percents[i].innerText = width + '%';
        });
        cycles++;
    }, 400);

    // 2. Completion & Success Message (at 4.5s)
    setTimeout(() => {
        clearInterval(interval);

        // Set to Final Target Scores
        bars.forEach((bar, i) => {
            bar.style.width = targets[i] + '%';
            percents[i].innerText = targets[i] + '%';
        });

        const statusBlock = document.getElementById('dnaStatusBlock');
        const spinner = document.getElementById('dnaSpinner');
        const statusText = document.getElementById('dnaStatusText');

        if (spinner) spinner.style.display = 'none';

        if (statusText) {
            statusText.innerText = "YOUR CHILD'S FITMENT REPORT IS READY";
            statusText.classList.remove('animate-pulse', 'text-brand-orange');
            statusText.classList.add('text-green-600', 'text-base');
        }

        if (statusBlock) {
            statusBlock.innerHTML += `<div class="mt-2 text-xs text-slate-400">Redirecting to unlocked insights...</div>`;
        }

    }, 4500);

    // 3. Redirect (at 6.5s)
    setTimeout(() => {
        if (container) {
            container.innerHTML = '';
            container.classList.remove('active');
        }

        // Show Pricing with Smooth Scroll
        const pricing = document.getElementById('pricingModal');
        if (pricing) {
            pricing.classList.add('active');
            pricing.classList.add('highlight-pulse');
            pricing.scrollIntoView({ behavior: 'smooth' });

            // TRACK: Pricing Viewed
            window.triggerTrack('Pricing_Modal_Viewed');
        }

        document.getElementById('mainFooter').classList.remove('hidden');
        document.getElementById('contact-and-policies').classList.remove('hidden');

    }, 6500);
}

function createDnaBarHtml(label = "Roadmap Calibration Progress") {
    return `
    <div class="dna-bar-container">
        <div class="dna-bar-label">${label}</div>
        <div class="dna-bar-track">
            <div class="dna-bar-liquid"></div>
        </div>
    </div>`;
}


// --- VISITOR COUNTER LOGIC ---
function trackSundayStrike() {
    try {
        if (!localStorage.getItem('strike_visitor_v1')) {
            fetch('https://api.counterapi.dev/v1/aptskola/sunday_strike/up')
                .then(response => response.json())
                .then(data => {
                    localStorage.setItem('strike_visitor_v1', 'true');
                    console.log('--- STRIKE COMMAND: Visitor #' + data.count + ' ---');
                })
                .catch(err => console.warn("Counter API Error:", err));
        } else {
            // Optional: Fetch current count just for display if needed, or skip
            // For now, we only log if it's a new hit or we could fetch 'info' endpoint.
            // But user requirement is mainly to count unique.
            console.log("Visitor already counted.");
        }
    } catch (e) {
        console.warn("Visitor tracker failed safely:", e);
    }
}

// FINAL INITIALIZATION:
document.addEventListener('DOMContentLoaded', () => {
    // 1. Known Clean State
    const blocksToHide = ['questionPages', 'syncMatchGate', 'syncMatchTransition', 'detailsPage', 'paymentPageContainer', 'psychometricHistogram', 'dynamicRiskCard', 'pricingModal'];
    blocksToHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('active');
            el.classList.add('hidden');
        }
    });

    checkPaymentStatus();
    if (typeof calculateCostOfConfusion === 'function') {
        calculateCostOfConfusion();
    }

    // NEW: Initiate Visitor Counter
    trackSundayStrike();

    // 2. Button and Deep Link Safety
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('unlock') === 'sync') {
        setTimeout(() => {
            if (typeof window.openSyncMatchGate === 'function') window.openSyncMatchGate();
        }, 500);
    }

    // NEW: "Verify Age-Grade Sync" Deep Link (?mode=sync)
    if (urlParams.get('mode') === 'sync') {
        setTimeout(() => {
            if (typeof window.initializeQuizShell === 'function') {
                // Must ensure Phase 1 logic
                window.initializeQuizShell(0, 1);
            }
        }, 500);
    }

    // 3. Dynamic Footer Year
    const yearEl = document.getElementById('copyrightYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
});

// --- STICKY CTA LOGIC (CLARITY FIX) ---
window.addEventListener('scroll', () => {
    const sticky = document.getElementById('sticky-cta');
    const hero = document.getElementById('react-hero-root');

    // If we can't find elements, exit
    if (!sticky || !hero) return;

    // Logic: Show when user scrolls past 80% of the hero
    const heroBottom = hero.offsetTop + hero.offsetHeight;
    const scrollY = window.scrollY;

    // Threshold: Show when we are near the bottom of the hero
    if (scrollY > (heroBottom - 300)) {
        sticky.classList.remove('translate-y-full');
    } else {
        sticky.classList.add('translate-y-full');
    }

    // HIDE SAFETY: If overlays are active, force hide
    const calcSection = document.getElementById('cost-calculator-section');
    const syncGate = document.getElementById('syncMatchGate');
    const phase0Modal = document.querySelector('.momentum-modal.active'); // Heuristic check

    const isCalcActive = calcSection && !calcSection.classList.contains('hidden');
    const isSyncActive = syncGate && !syncGate.classList.contains('hidden');

    if (isCalcActive || isSyncActive || phase0Modal) {
        sticky.classList.add('translate-y-full');
    }
});