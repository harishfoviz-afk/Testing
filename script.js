// --- FORCE DOMAIN CONSISTENCY ---
if (location.hostname !== 'localhost' && location.hostname === 'www.aptskola.com') {
    location.replace(location.href.replace('www.', ''));
}

// --- FORCE HTTPS (Add to top of script.js) ---
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
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
const PAYMENT_LINKS = {
    599: "https://rzp.io/rzp/fQ0kiUb",
    999: "https://rzp.io/rzp/JSA3F7g",
    1499: "https://rzp.io/rzp/1L9W83a",
    299: "https://rzp.io/rzp/Jq71ACDV"
};
window.currentPhase = 0; // 0: Phase0, 1: Phase1, 2: Sync


// --- INITIALIZATION ---
(function() {
    if (typeof emailjs !== 'undefined') {
        emailjs.init({
            publicKey: EMAILJS_PUBLIC_KEY, // Pass as an object property
        });
    }
})();

// --- STATE MANAGEMENT ---
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
    <div class="foviz-banner">
        <h3><a href="https://foviz.in" target="_blank" style="color: inherit; text-decoration: none; hover: underline;">Plan the "Next Phase" with 5D Analysis</a></h3>
        <p>Your board choice is Step 1. Foviz Career GPS maps your path to 2040.</p>
    </div>
`;

const ambassadorButtonHtml = `
    <button onclick="openCollaborationModal('Ambassador')" class="btn-ambassador">
        <span>✨</span> Thank you and Be our Ambassadors and earn cash rewards from 300 to 3000 <span>🤝</span><span>✨</span>
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
        title: "The International Achiever",
        persona: "Flexible Specialist",
        profile: "This profile values subject depth and assessment flexibility, allowing students to tailor their studies for international university application.",
        rejectionReason: "Why not CBSE? Requires much higher English proficiency and is not directly aligned with Indian competitive exams.",
        careerPath: "International University Admissions and Specialized Career Paths (Finance, Design).",
        philosophy: 'Subject depth and international curriculum portability.',
        teachingMethod: 'Application-based learning. Requires external resources and focuses on critical thinking over rote memorization.',
        parentalRole: 'Moderate to High. You must manage complex curriculum choices and ensure external support for topics like Math/Science.'
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
    { id: "q15", text: "Where are you looking for schools?", options: ["Metro City (Delhi, Mumbai, Hyd, etc.)", "Tier-2 City (Jaipur, Vizag, etc.)", "Small Town / Rural Area"] },

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
            "10-15": ["Give me the answers", "Help me find them", "Either is fine", "I don mind"],
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
                if(overlay) overlay.style.display = 'none';
                triggerAutomatedEmail();
            });
        } else {
            if(overlay) overlay.style.display = 'none';
            if(landing) landing.style.display = 'block';
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

    if(emailEl) emailEl.classList.remove('input-error');
    if(phoneEl) phoneEl.classList.remove('input-error');

    if (!emailRegex.test(email)) {
        if(emailEl) emailEl.classList.add('input-error');
        isValid = false;
    }
    if (!mobileRegex.test(phone)) {
        if(phoneEl) phoneEl.classList.add('input-error');
        isValid = false;
    }
    return isValid;
}

// --- UPDATED: CALCULATOR LOGIC WITH DONUT CHART ---
function calculateCostOfConfusion() {
    const hoursInput = document.getElementById('researchHours');
    const rateInput = document.getElementById('hourlyRate');
    const tabsInput = document.getElementById('browserTabs');
    if (!hoursInput || !rateInput || !tabsInput) return;

    const hours = parseInt(hoursInput.value);
    const rate = parseInt(rateInput.value);
    const tabs = parseInt(tabsInput.value);
    
    const monthlyLoss = (hours * 4) * rate; 
    const anxietyLevel = Math.min(tabs * 5, 100); 

    const lossEl = document.getElementById('lossAmount');
    if(lossEl) lossEl.textContent = monthlyLoss.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
    
    const anxEl = document.getElementById('anxietyLevel');
    if(anxEl) anxEl.textContent = `${anxietyLevel}%`;

    const hVal = document.getElementById('hoursValue');
    if(hVal) hVal.textContent = `${hours} hours`;
    
    const rVal = document.getElementById('rateValue');
    if(rVal) rVal.textContent = `₹${rate.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    
    const tVal = document.getElementById('tabsValue');
    if(tVal) tVal.textContent = `${tabs} tabs`;

    const donut = document.getElementById('confusionDonut');
    if(donut) {
        donut.style.setProperty('--anxiety-degree', `${anxietyLevel}%`);
    }
}

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
    document.getElementById("react-hero-root").style.display = "block";
    document.getElementById("landingContentWrapper").style.display = "block";
    document.getElementById("mainFooter").style.display = "block";
    const heroRoot = document.getElementById('react-hero-root');
    if (heroRoot) heroRoot.style.display = 'block';
    const landingPage = document.getElementById('landingPage');
    if (landingPage) landingPage.style.display = 'block';
    currentQuestion = 0;
    answers = {};
    const form = document.getElementById('customerForm');
    if(form) form.reset();
    
    // Show landing elements
    document.getElementById('landingPage').classList.remove('hidden');
    document.getElementById('pricingModal').classList.remove('active');
    document.getElementById('testimonials').classList.remove('hidden');
    document.getElementById('educatorPartner').classList.remove('hidden');
    document.getElementById('contact-and-policies').classList.remove('hidden');
    document.getElementById('mainFooter').classList.remove('hidden');
    
    // Hide app pages
    const dPage = document.getElementById('detailsPage');
    if(dPage) dPage.classList.remove('active');
    const pCont = document.getElementById('paymentPageContainer');
    if(pCont) pCont.classList.remove('active');
    const sPage = document.getElementById('successPage');
    if(sPage) sPage.classList.remove('active');
    const sGate = document.getElementById('syncMatchGate');
    if(sGate) sGate.classList.remove('active');
    const sTrans = document.getElementById('syncMatchTransition');
    if(sTrans) sTrans.classList.remove('active');
    
    const app = document.getElementById('questionPageApp');
    if (app) app.classList.remove('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getIntermediateHeaderHtml() {
     return `<div class="intermediate-header" onclick="goToLandingPage()" style="cursor:pointer;"><div class="max-w-7xl mx-auto"><span class="font-bold text-xl">Apt <span class="text-brand-orange">Skola</span></span></div></div>`;
}
function getIntermediateFooterHtml() {
     return `<div class="intermediate-footer"><div class="max-w-7xl mx-auto text-center"><p>&copy; 2026 Apt Skola, all rights reserved.</p></div></div>`;
}

// --- SYNC MATCH GATE LOGIC ---
function openSyncMatchGate() {
    const landing = document.getElementById('landingPage');
    const gate = document.getElementById('syncMatchGate');
    
    if (landing && gate) {
        // Hide landing elements
        landing.classList.remove('active');
        document.getElementById('pricingModal').classList.remove('active');
        document.getElementById('testimonials').classList.remove('active');
        document.getElementById('educatorPartner').classList.remove('active');
        document.getElementById('contact-and-policies').classList.remove('active');
        document.getElementById('mainFooter').classList.remove('active');
        
        gate.classList.remove('hidden');
        gate.classList.add('active'); 
        
        // --- CTO FIX: Injecting the missing ads into the gate ---
        const gateContent = gate.querySelector('.details-form');
        if (gateContent && !gateContent.querySelector('.xray-card')) {
            const backLink = gateContent.querySelector('p[onclick*="goToLandingPage"]');
            if (backLink) {
                backLink.insertAdjacentHTML('beforebegin', xrayCardHtml);
                backLink.insertAdjacentHTML('beforebegin', fovizBannerHtml);
            }
        }
        window.scrollTo(0, 0);
    }
}

function validateAndStartSyncMatch() {
    const startBtn = document.getElementById('startSyncBtn');
    const orderIdInput = document.getElementById('syncOrderId');
    const ageInput = document.getElementById('syncChildAge');
      // Define here for global scope within function
    const orderId = orderIdInput ? orderIdInput.value.trim() : '';

    if(!orderId || orderId.length < 3) {
        alert("Please enter a valid Order ID.");
        return;
    }

    customerData.orderId = orderId; 

    // Handle session not found (Manual Recovery)
    const savedSession = localStorage.getItem(`aptskola_session_${orderId}`);
    if (!savedSession) {
        if (startBtn && !document.getElementById('manualSyncBlock')) {
            startBtn.insertAdjacentHTML('beforebegin', manualSyncUI);
            startBtn.classList.add('hidden'); // Hide the button immediately
            
            // Ensure the newly injected block is visible
            const manualBlock = document.getElementById('manualSyncBlock');
            if(manualBlock) manualBlock.style.display = 'block';
        }
        return;
    }

    // Handle session found
    const sessionData = JSON.parse(savedSession);
    answers = sessionData.answers;
    customerData = sessionData.customerData;
    if(ageInput) customerData.childAge = ageInput.value;

    // Proceed to transition
    document.getElementById('syncMatchGate').classList.remove('active');
    showSyncTransition();
}

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
    if(orderIdInput) customerData.orderId = orderIdInput.value;
    if(ageInput) customerData.childAge = ageInput.value;
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
        if(timerDisplay) timerDisplay.textContent = timeLeft;
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
    initializeQuizShell(15, 2); 
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
    const previousFlag = hasSeenDowngradeModal;
    currentQuestion = 0;
    answers = {};
    customerData = { orderId: 'N/A', childAge: '5-10' };
    hasSeenDowngradeModal = previousFlag;
    selectedPackage = pkg;
    selectedPrice = price;
    isSyncMatchMode = false; 
    
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



function initializeQuizShell(index, phase = 0) {
    document.getElementById("react-hero-root").style.display = "none";
    document.getElementById("landingContentWrapper").style.display = "none";
    document.getElementById("mainFooter").style.display = "none";
    const heroRoot = document.getElementById('react-hero-root');
    if (heroRoot) heroRoot.style.display = 'none';
    const landingPage = document.getElementById('landingPage');
    if (landingPage) landingPage.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'instant' });
    console.log("initializeQuizShell called with index:", index, "phase:", phase);
    window.currentPhase = phase;
    const questionPages = document.getElementById('questionPages');
    if (!questionPages) return;
    
    // Hide landing elements and flow containers
    const landing = document.getElementById('landingPage');
    if (landing) {
        landing.classList.remove('active');
        landing.classList.add('hidden');
    }
    
    const elementsToHide = [
        'pricingModal', 'testimonials', 'educatorPartner', 
        'contact-and-policies', 'mainFooter'
    ];
    elementsToHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });

    const containers = document.querySelectorAll('.flow-container');
    containers.forEach(c => c.classList.remove('active'));
    
    const shellHtml = `
        <div id="questionPageApp" class="question-page active">
            ${getIntermediateHeaderHtml()}
            <div class="question-content-wrapper"><div id="dynamicQuizContent" class="question-container"></div></div>
            ${getIntermediateFooterHtml()}
        </div>`;
    questionPages.innerHTML = shellHtml;
    renderQuestionContent(index);
}

function renderQuestionContent(index) {
    currentQuestion = index;
    const questions = window.currentPhase === 0 ? phase0Questions : phase1Questions;
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
    if(!q) return;

    let qText = q.text;
    let qOptions = q.options || [];

    if(q.isObservation) {
        qText = q.text_variants[customerData.childAge] || q.text_variants["5-10"];
        if(q.options_variants && q.options_variants[customerData.childAge]) {
            qOptions = q.options_variants[customerData.childAge];
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

    const dynamicQuizContent = document.getElementById('dynamicQuizContent');
    if (dynamicQuizContent) {
        dynamicQuizContent.innerHTML = `
            <div class="progress-container">
                <div class="progress-track"><div class="progress-fill" style="width: ${progressPercent}%"></div></div>
                <div class="progress-label">Phase ${window.currentPhase} - Question ${index + 1}/${totalQ}</div>
            </div>
            <div class="question-text">${qText}</div>
            <div class="options-grid">${optionsHTML}</div>
            <div style="text-align:center;">${prevBtnHtml}</div>
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
document.getElementById('customerForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const disclaimerBox = document.getElementById('confirmDisclaimer');
    if(disclaimerBox && !disclaimerBox.checked) {
        alert("Please acknowledge the Disclaimer & Terms to proceed.");
        return;
    }

    const emailValue = document.getElementById('email')?.value;
    const phoneValue = document.getElementById('phone')?.value;

    if (!validateInputs(emailValue, phoneValue)) {
        alert("Please provide a valid email and a 10-digit Indian mobile number.");
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
        childAge: document.getElementById('childAge')?.value,
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
        const pCont = document.getElementById('paymentPageContainer');
        if(pCont) {
            pCont.classList.remove('hidden');
            pCont.classList.add('active');
            
            document.getElementById('summaryPackage').textContent = selectedPackage;
            document.getElementById('summaryPrice').textContent = `₹${selectedPrice}`;
            document.getElementById('summaryTotal').textContent = `₹${selectedPrice}`;
            document.getElementById('payButton').innerText = `Pay ₹${selectedPrice} via Razorpay Link →`;
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, 500);
});

// --- RAZORPAY POPUP METHOD (WITH AUTO-PREFILL) ---
function testPaymentSuccess() {
    console.log("Test payment success triggered");
    
    // Simulate payment success
    const orderId = customerData.orderId || 'TEST_' + Date.now();
    customerData.orderId = orderId;
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
        if(overlay) {
            overlay.style.display = 'none';
            console.log("Overlay hidden");
        }
        
        // Send the email with the report image
        triggerAutomatedEmail();
    }).catch((error) => {
        console.error("Error in report generation:", error);
        alert("There was an error generating your report. Please contact support with this error: " + error.message);
        if(overlay) {
            overlay.style.display = 'none';
            console.log("Overlay hidden after error");
        }
    });
}
    
function redirectToRazorpay() {
    // For testing: bypass payment and show success page
    if (window.location.search.includes('test=1')) {
        console.log("TEST MODE: Bypassing payment");
        testPaymentSuccess();
        return;
    }
    
    if (typeof Razorpay === 'undefined') {
        alert("Payment gateway is still loading. Please refresh the page or check your internet connection.");
        return;
    }

    const payButton = document.getElementById('payButton');
    if (payButton) payButton.innerText = "Opening Secure Checkout...";
    
    // 1. Pull the price in Paise (e.g., 59900) from your config
    const amountInPaise = PACKAGE_PRICES[selectedPackage] || 59900;

    const options = {
        "key": RAZORPAY_KEY_ID, 
        "amount": amountInPaise, 
        "currency": "INR",
        "name": "Apt Skola",
        "description": `Payment for ${selectedPackage} Report`,
        "image": "https://aptskola.com/favicon.png", 
        
        // 2. THIS IS THE PREFILL LOGIC: 
        // It uses the data already entered in your details form.
        "prefill": {
            "name": customerData.parentName,
            "email": customerData.email,
            "contact": customerData.phone
        },
        
        "handler": function (response) {
            // SUCCESS: Runs after payment without leaving the page
            console.log("Payment Successful. ID: " + response.razorpay_payment_id);
            
            // Check if we have answers before proceeding
            if (!answers || Object.keys(answers).length === 0) {
                console.error("No answers found! Checking localStorage...");
                const lastOrderId = localStorage.getItem('aptskola_last_order_id');
                const sessionData = JSON.parse(localStorage.getItem(`aptskola_session_${lastOrderId}`));
                if (sessionData && sessionData.answers) {
                    answers = sessionData.answers;
                    customerData = sessionData.customerData;
                    selectedPackage = sessionData.selectedPackage;
                    selectedPrice = sessionData.selectedPrice;
                    console.log("Loaded answers from localStorage");
                } else {
                    alert("Assessment data not found. Please complete the assessment first.");
                    return;
                }
            }
            
            // Save payment success state to localStorage
            const orderId = customerData.orderId || 'ORDER_' + Date.now();
            customerData.orderId = orderId;
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
                if(overlay) {
                    overlay.style.display = 'none';
                    console.log("Overlay hidden");
                }
                
                // Send the email with the report image
                triggerAutomatedEmail();
            }).catch((error) => {
                console.error("Error in report generation:", error);
                alert("There was an error generating your report. Please contact support with this error: " + error.message);
                if(overlay) {
                    overlay.style.display = 'none';
                    console.log("Overlay hidden after error");
                }
            });
        },
        "theme": { "color": "#FF6B35" },
        "modal": {
            "ondismiss": function() {
                if(payButton) payButton.innerText = `Pay ₹${selectedPrice} via UPI / Card →`;
            }
        }
    };

    const rzp1 = new Razorpay(options);
    rzp1.open();
}

async function triggerAutomatedEmail() {
    console.log("CTO: Generating Branded HTML Report with Tiered Insights...");
    console.log("Selected package:", selectedPackage, "Selected price:", selectedPrice);
    
    const res = calculateFullRecommendation(answers);
    const recBoard = res.recommended.name;
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
        "amount": 29900, // ₹299 in Paise
        "currency": "INR",
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
            isSyncMatchMode = true; 
            
            // Save elevated state
            localStorage.setItem(`aptskola_session_${customerData.orderId}`, JSON.stringify({ answers, customerData }));

            const upgradeBlock = document.getElementById('upgradeBlock');
             
            
            if(upgradeBlock) upgradeBlock.classList.remove('active');
            if(startBtn) {
                startBtn.classList.remove('hidden');
                startBtn.innerText = "Access Unlocked! Start Sync Check →";
                startBtn.style.background = "#10B981";
            }
            
            showSyncTransition();
        },
        "theme": { "color": "#FF6B35" }
    };
    const rzp1 = new Razorpay(options);
    rzp1.open();
}

function closeBonusModalAndShowSuccess() {
    document.getElementById('bonusModal').classList.remove('active');
    if (selectedPrice >= 1499) {
        document.getElementById('forensicSuccessModal').classList.add('active');
    } else {
        showInstantSuccessPage();
    }
}

function closeForensicModalAndShowSuccess() {
    document.getElementById('forensicSuccessModal').classList.remove('active');
    showInstantSuccessPage();
}

function showInstantSuccessPage() {
    console.log("showInstantSuccessPage called");
    const paymentPage = document.getElementById('paymentPageContainer');
    const successPage = document.getElementById('successPage');
    console.log("Payment page element:", paymentPage);
    console.log("Success page element:", successPage);
    
    // Add this inside your showInstantSuccessPage function in script.js
	const successContainer = document.querySelector('.success-container');
	console.log("Success container:", successContainer);
	if (successContainer) {
    const backupNotice = `
        <div style="background: #FFF7ED; border: 1px solid #FFEDD5; padding: 15px; border-radius: 10px; margin: 20px 0; border-left: 5px solid #F59E0B;">
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
    if(paymentPage) {
        paymentPage.classList.remove('active');
        console.log("Payment page hidden");
    }
    if(successPage) {
        successPage.classList.remove('hidden');
        successPage.classList.add('active');
        console.log("Success page shown");
        
        // Scroll to top to show the success page
        window.scrollTo({ top: 0, behavior: 'instant' });
        
        // Wait a bit for DOM to update, then check for buttons
        setTimeout(() => {
            // Disable download and share buttons initially
            const downloadBtn = document.getElementById('downloadBtn');
            const shareBtn = document.getElementById('shareBtn');
            console.log("Looking for buttons after DOM update - Download btn:", downloadBtn, "Share btn:", shareBtn);
            console.log("Disabling buttons initially - Download btn:", downloadBtn, "Share btn:", shareBtn);
            if (downloadBtn) {
                downloadBtn.style.pointerEvents = 'none';
                downloadBtn.style.opacity = '0.6';
                downloadBtn.textContent = 'Generating Report...';
                console.log("Download button disabled");
            }
            if (shareBtn) {
                shareBtn.style.pointerEvents = 'none';
                shareBtn.style.opacity = '0.6';
                shareBtn.textContent = 'Generating Report...';
                console.log("Share button disabled");
            }
            
            // Ensure report is rendered
            // Note: Report is already rendered in the payment handler, just enable buttons
            console.log("Enabling buttons after report should be ready");
            // Re-enable buttons after report is rendered
            if (downloadBtn) {
                downloadBtn.style.pointerEvents = 'auto';
                downloadBtn.style.opacity = '1';
                downloadBtn.textContent = 'Download Report ⬇️';
                console.log("Download button enabled");
            }
            if (shareBtn) {
                shareBtn.style.pointerEvents = 'auto';
                shareBtn.style.opacity = '1';
                shareBtn.textContent = 'Share Report 📲';
                console.log("Share button enabled");
            }
        }, 100);
        
        // Set Order ID
        const displayOrderId = document.getElementById('displayOrderId');
        if (displayOrderId) displayOrderId.textContent = customerData.orderId || 'N/A';
    }
    
    if (selectedPrice >= 1499) {
        const ticket = document.getElementById('goldenTicketContainer');
        if (ticket) ticket.style.display = 'block';
    }

    const pNameEl = document.getElementById('successParentName');
    if(pNameEl) pNameEl.innerText = customerData.parentName || 'Parent';
    
    const reportDiv = document.getElementById('reportPreview');
    if(reportDiv) {
        reportDiv.classList.remove('off-screen-render');
        const dlBtn = document.getElementById('downloadBtn');
        if(dlBtn && dlBtn.parentNode && dlBtn.parentNode.parentNode) {
            const container = dlBtn.parentNode.parentNode;
            container.insertBefore(reportDiv, dlBtn.parentNode.nextSibling);
        }
    }
    
    window.scrollTo({ top: 0, behavior: 'instant' });
}

// --- SYNC MATCH CALCULATION ---
function calculateSyncMatch() {
    const parentQuestions = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10", "q11", "q12", "q13", "q14", "q15"];
    const isParentDataMissing = parentQuestions.some(id => answers[id] === undefined);

    if (isParentDataMissing) {
        alert("Initial assessment data is missing.");
        goToLandingPage();
        return;
    }

    let perceptionRes = calculateFullRecommendation(answers);
    let parentRec = perceptionRes.recommended.name;

    let dnaScores = { "CBSE": 0, "IB": 0, "ICSE": 0, "State": 0 };
    for(let i=16; i<=30; i++) {
        let val = answers['q'+i];
        if(val === undefined) continue;
        let multiplier = (i === 30) ? 2.0 : 1.0; 
        if(val === 0) dnaScores["CBSE"] += multiplier;
        if(val === 1) dnaScores["IB"] += multiplier;
        if(val === 2) dnaScores["ICSE"] += multiplier;
        if(val === 3) dnaScores["State"] += multiplier;
    }
    let topDNA = Object.keys(dnaScores).reduce((a, b) => dnaScores[a] > dnaScores[b] ? a : b);
    
    const traits = { "CBSE": "Logical Structure", "IB": "Inquiry-based Autonomy", "ICSE": "Deep Narrative Context", "State": "Functional Local Proficiency" };
    const mappings = { "CBSE": "CBSE", "IB": "IB", "ICSE": "ICSE", "State": "State Board" };
    
    let normalizedDNA = mappings[topDNA] || topDNA;
    let isConflict = (parentRec !== normalizedDNA);
    let alignmentScore = isConflict ? 45 : 92;

    const manualDisclaimer = isManualSync ? `<p style="text-align: center; font-size: 0.75rem; color: #94A3B8; margin-bottom: 10px;">⚠️ Sync generated via Manual Input from Phase 1 Report.</p>` : '';

    // REVISED: Forensic Bridge Narrative (Min 5 Lines)
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

    const successPage = document.getElementById('successPage');
    if(successPage) {
        successPage.innerHTML = `
            ${getIntermediateHeaderHtml()}
            <div class="success-content-wrapper">
                <div class="success-container">
                    ${manualDisclaimer}
                    <h2 style="color:var(--navy-premium); text-align:center;">Sync Match Report 🔄</h2>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:30px;">
                        <div style="background:#F0F9FF; padding:20px; border-radius:10px; border:1px solid #BAE6FD;">
                            <h3 style="font-size:0.9rem; font-weight:bold; color:#0369A1; text-transform:uppercase;">Vision Match</h3>
                            <div style="font-size:1.4rem; font-weight:800; color:#0C4A6E;">${parentRec}</div>
                        </div>
                        <div style="background:#FFF7ED; padding:20px; border-radius:10px; border:1px solid #FFEDD5;">
                            <h3 style="font-size:0.9rem; font-weight:bold; color:#C2410C; text-transform:uppercase;">DNA Verification</h3>
                            <div style="font-size:1.4rem; font-weight:800; color:#7C2D12;">${normalizedDNA}</div>
                        </div>
                    </div>
                    ${bridgeHtml}
                    ${ambassadorButtonHtml}
                    ${xrayCardHtml}
                    ${fovizBannerHtml}
                    <button class="custom-cta-button" style="margin-top:30px;" onclick="endFullSession()">End Session</button>
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
    const amount = sessionCustomerData.amount || 599;
    const pkgName = sessionCustomerData.package || '';
    const isPro = amount >= 1499 || pkgName === 'The Smart Parent Pro';
    const isPremium = amount >= 999 || pkgName === 'Premium' || isPro;

    // --- BASE BLOCKS (Included in all tiers: ₹599, ₹999, ₹1499) ---
    let html = `
        <div id="pdf-header" class="report-card" style="background:#0F172A; color:white; text-align:center;">
            <div style="font-size:2rem; font-weight:800;">Apt <span style="color:#FF6B35;">Skola</span></div>
            <div style="font-size:1.1rem; opacity:0.8;">${sessionCustomerData.package} Report</div>
            <div style="font-size:0.85rem; margin-top:10px;">ID: ${sessionCustomerData.orderId} | Prepared for: ${sessionCustomerData.childName}</div>
        </div>

        <div class="report-card">
            <div class="report-header-bg">THE RECOMMENDED ARCHETYPE</div>
            <div style="font-size:1.8rem; font-weight:800; color:#0F172A;">${data.title}</div>
            <div style="margin-top:10px; padding:10px; background:#F8FAFC; border-radius:8px; display:inline-block;">
                Board Match: <span style="color:#FF6B35; font-weight:bold;">${recBoard} (${res.recommended.percentage}%)</span>
            </div>
        </div>

        <div class="report-card">
            <div class="report-header-bg">STUDENT PERSONA & MATCH LOGIC</div>
            <p><strong>Archetype:</strong> ${data.persona}</p>
            <p style="margin-top:10px; line-height:1.6;">${data.profile}</p>
            <div style="margin-top:15px; padding:15px; border-left:4px solid #EF4444; background:#FFF1F2;">
                <h4 style="color:#991B1B; font-weight:bold; margin-bottom:5px;">The "Why Not" (Rejection Logic)</h4>
                <p style="font-size:0.9rem;">${data.rejectionReason}</p>
            </div>
            <div style="margin-top:15px; border-top: 1px solid #eee; padding-top:15px;">
                <h4 style="color:#0F172A; font-weight:bold; margin-bottom:5px;">Projected Career Path</h4>
                <p style="font-size:0.9rem; line-height:1.5;">${data.careerPath}</p>
            </div>
        </div>

        <div class="report-card">
            <div class="report-header-bg">BOARD & OPTION COMPARISON</div>
            <table class="data-table">
                <thead><tr><th>Board</th><th>Match Quality</th><th>Status</th></tr></thead>
                <tbody>
                    ${res.fullRanking.slice(0, 3).map((r, i) => `
                        <tr>
                            <td style="font-weight:600;">${r.name}</td>
                            <td class="progress-bar-cell">
                                <div class="table-progress-track"><div class="table-progress-fill" style="width: ${r.percentage}%"></div></div>
                                <span class="percentage-label">${r.percentage}% Match</span>
                            </td>
                            <td style="color:${i === 0 ? '#10B981' : '#64748B'}; font-weight:bold;">${i === 0 ? 'Recommended' : 'Alternative'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="report-card">
            <div class="report-header-bg">BOARD DEEP DIVE</div>
            <p><strong>Philosophy:</strong> ${data.philosophy}</p>
            <p style="margin-top:10px;"><strong>Pedagogy:</strong> ${data.teachingMethod}</p>
            <div style="margin-top:10px; padding:10px; border-radius:6px; background:${data.parentalRole.toLowerCase().includes('high') ? '#FEF2F2' : '#F0FDF4'}; border:1px solid ${data.parentalRole.toLowerCase().includes('high') ? '#FECDD3' : '#BBF7D0'};">
                <p style="color:${data.parentalRole.toLowerCase().includes('high') ? '#991B1B' : '#166534'}; margin:0;">
                    <strong>Parental Commitment:</strong> ${data.parentalRole} 
                </p>
            </div>
        </div>

        <div class="report-card">
            <div class="report-header-bg">EXPERT NOTE: SPECIAL NEEDS & INCLUSION</div>
            <p style="font-size:0.85rem; line-height:1.5; color:#475569;">
                A supportive school environment is often more critical than the syllabus itself. For students requiring significant customization, Open Schooling (NIOS) is the most adaptable choice.
            </p>
        </div>
    `;

    // --- PREMIUM BLOCKS (₹999 and above) ---
    if (isPremium) {
        html += `
            <div class="report-card">
                <div class="report-header-bg">🧐 RISK MITIGATION & VETTING</div>
                <ul style="list-style:none; padding:0; font-size:0.9rem;">
                    ${MASTER_DATA.vetting.redFlags.map(f => `<li style="margin-bottom:8px;">🚩 ${f}</li>`).join('')}
                </ul>
            </div>
            <div class="report-card">
                <div class="report-header-bg">15-YEAR FEE FORECASTER (12% Inflation)</div>
                <table class="data-table">
                    ${MASTER_DATA.financial.projectionTable.slice(0, 12).map(r => `<tr><td>${r.grade}</td><td>${r.fee}</td></tr>`).join('')}
                </table>
            </div>
        `;
    }

    // --- PRO BLOCKS (₹1499 only) ---
    if (isPro) {
        html += `
            <div class="report-card">
                <div class="report-header-bg">🤝 FEE NEGOTIATION STRATEGIES</div>
                ${MASTER_DATA.concierge.negotiation.map(n => `
                    <div class="narrative-item">
                        <h4 class="narrative-theme">${n.title}</h4>
                        <p style="font-size:0.85rem; margin-bottom:10px;"><strong>Scenario:</strong> ${n.scenario}</p>
                        <div class="script-box">"${n.script}"</div>
                    </div>
                `).join('')}
            </div>
            <div class="report-card">
                <div class="report-header-bg">🎙️ PARENT INTERVIEW MASTERY</div>
                <div class="interview-grid">
                    ${MASTER_DATA.interviewMastery.part2.slice(0, 6).map(i => `
                        <div class="interview-card">
                            <div class="interview-card-q">${i.q}</div>
                            <div class="interview-card-strategy">💡 Strategy: ${i.strategy}</div>
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

        const cards = reportElement.querySelectorAll(".report-card, .xray-card, .foviz-banner, .btn-ambassador");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const contentWidth = pdfWidth - (2 * margin);
        
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(24);
        pdf.setTextColor(15, 23, 42);
        pdf.text("Apt", margin, 20);
        pdf.setTextColor(255, 107, 53);
        pdf.text("Skola", margin + 16, 20);
        
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(100, 116, 139);
        pdf.text("Order ID: " + (customerData.orderId || "N/A"), margin, 33);
        
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
        pdf.setFontSize(24);
        pdf.setTextColor(15, 23, 42);
        pdf.text("Apt", margin, 20);
        pdf.setTextColor(255, 107, 53);
        pdf.text("Skola", margin + 16, 20);
        
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(100, 116, 139);
        pdf.text("Prepared for: " + (customerData.childName || "Student"), margin, 28);
        pdf.text("Order ID: " + (customerData.orderId || "N/A"), margin, 33);

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
                console.warn('Blocking elements detected:', candidates.map(c => ({id: c.id, class: c.className, z: c.z})));
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
window.goToLandingPage = goToLandingPage;
window.renderReportToBrowser = renderReportToBrowser;
window.downloadReport = downloadReport;
window.sharePDF = sharePDF;
window.validateAndStartSyncMatch = validateAndStartSyncMatch;
window.pasteOrderId = pasteOrderId;
window.copyOrderId = copyOrderId;
window.recoverSession = recoverSession;
window.recoverSessionEmail = recoverSessionEmail;

window.openCollaborationModal = openCollaborationModal;
function showPsychometricHistogram() {
    const app = document.getElementById('questionPageApp');
    if (app) app.classList.remove('active');
    
    const container = document.getElementById('psychometricHistogram');
    container.innerHTML = `
        <h2 class="text-3xl font-bold mb-4">DNA Snapshot: Analyzing Neural Patterns</h2>
        <p class="text-slate-600 mb-8">We are mapping your child's cognitive architecture based on Phase 0 inputs.</p>
        <div class="histogram-container">
            <div class="histo-bar-wrapper">
                <div class="histo-label"><span>Visual Processing</span><span>82%</span></div>
                <div class="histo-track"><div class="histo-fill" style="width: 82%"></div></div>
            </div>
            <div class="histo-bar-wrapper">
                <div class="histo-label"><span>Auditory Synthesis</span><span>45%</span></div>
                <div class="histo-track"><div class="histo-fill" style="width: 45%"></div></div>
            </div>
            <div class="histo-bar-wrapper">
                <div class="histo-label"><span>Kinesthetic Logic</span><span>91%</span></div>
                <div class="histo-track"><div class="histo-fill" style="width: 91%"></div></div>
            </div>
        </div>
        <button onclick="showDynamicRiskCard()" class="custom-cta-button" style="max-width: 300px;">View Misalignment Risk →</button>
    `;
    container.classList.add('active');
    window.scrollTo(0,0);
}

function showDynamicRiskCard() {
    const containers = document.querySelectorAll('.flow-container');
    containers.forEach(c => c.classList.remove('active'));
    
    const q1Ans = answers['p0_q1'];
    const personas = ["Visual Strategist", "Verbal Analyst", "Conceptual Learner"];
    const selectedPersona = personas[q1Ans] || "Unique Learner";
    
    const container = document.getElementById('dynamicRiskCard');
    container.innerHTML = `
        <div class="risk-card-dynamic">
            <div class="risk-icon-alert">⚠️</div>
            <h2 class="text-2xl font-bold text-red-900 mb-2">Misalignment Alert</h2>
            <p class="text-red-800 mb-6">Your child is a <strong>${selectedPersona}</strong>. There is a 65% risk that a standard curriculum will suppress their natural logic processing.</p>
            <div style="background: white; padding: 20px; border-radius: 12px; text-align: left; margin-bottom: 20px;">
                <p class="text-sm font-bold text-slate-700 mb-2">Smart Parent Pro Dashboard Note:</p>
                <p class="text-xs text-slate-500">Phase 1 will now calibrate your specific board preferences to mitigate this risk.</p>
            </div>
            <button onclick="startPhase1()" class="custom-cta-button" style="background: #0F172A;">Calibrate with Phase 1 →</button>
        </div>
    `;
    container.classList.add('active');
    window.scrollTo(0,0);
}

function startPhase1() {
    window.currentPhase = 1;
    initializeQuizShell(0, 1);
}

function showDnaFinalization() {
    const detailsPage = document.getElementById('detailsPage');
    if (detailsPage) detailsPage.classList.remove('active');
    
    const app = document.getElementById('questionPageApp');
    if (app) app.classList.remove('active');

    const container = document.getElementById('dnaFinalization');
    if (container) {
        container.innerHTML = `
            <div class="dna-final-sequence">
                <div class="gold-trust-icon">
                    <svg width="50" height="50" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                </div>
                <h2 class="text-4xl font-black text-brand-navy mb-4">DNA ALIGNMENT COMPLETE</h2>
                <p class="text-xl text-slate-600 mb-12">Your profile is secured. Redirecting to final validation...</p>
                <div class="spinner"></div>
            </div>
        `;
        container.classList.add('active');
    }
    
    window.scrollTo(0,0);
    
    setTimeout(() => {
        if (container) container.classList.remove('active');
        const pricing = document.getElementById('pricingModal');
        if (pricing) {
            pricing.classList.add('active');
            pricing.scrollIntoView({ behavior: 'smooth' });
            document.getElementById('mainFooter').classList.remove('hidden');
            document.getElementById('contact-and-policies').classList.remove('hidden');
        }
    }, 3000);
}

// FINAL INITIALIZATION:
document.addEventListener('DOMContentLoaded', () => {
    checkPaymentStatus();
    if (typeof calculateCostOfConfusion === 'function') {
        calculateCostOfConfusion();
    }
});
// Explicit Window Exports for Quiz and Sync Gate
window.initializeQuizShell = initializeQuizShell;
window.startSyncMatchNow = startSyncMatchNow;
