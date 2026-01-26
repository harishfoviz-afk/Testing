// Comprehensive Hero Component Overhaul - Functional & UI & Momentum
// Transpiled manually to remove Babel dependency
(function () {
    const { useState, useEffect, useRef } = React;
    // Safe Fallback for Framer Motion
    const MotionLib = window.Motion || window.FramerMotion || {};
    const motion = MotionLib.motion || new Proxy({}, {
        get: (target, prop) => prop // Fallback: motion.div -> 'div'
    });
    const AnimatePresence = MotionLib.AnimatePresence || (({ children }) => children);
    const h = React.createElement;
    const Fragment = React.Fragment;

    const Hero = () => {
        const slides = [
            { prefix: "STOP", word: "Worrying", pColor: "text-red-500", wColor: "text-white" },
            { prefix: "STOP", word: "Doubting", pColor: "text-red-500", wColor: "text-white" },
            { prefix: "STOP", word: "Guessing", pColor: "text-red-500", wColor: "text-white" },
            { prefix: "START", word: "Knowing", pColor: "text-green-500", wColor: "text-[#FF6B35]" }
        ];
        const [index, setIndex] = useState(0);
        const currentYear = new Date().getFullYear();
        const targetYear = new Date() < new Date(`${currentYear}-03-31`) ? currentYear : currentYear + 1;
        const [buttonText, setButtonText] = useState(`Start ${targetYear} Grade 1 Admission Decoder Scan`);
        const [showToast, setShowToast] = useState(false);

        useEffect(() => {
            const timer = setInterval(() => setIndex((prev) => (prev + 1) % slides.length), 2000);
            return () => clearInterval(timer);
        }, []);

        // Momentum Feature 2: Progressive Slide-In (Nudge)
        useEffect(() => {
            const timer = setTimeout(() => setShowToast(true), 5000);
            return () => clearTimeout(timer);
        }, []);

        const triggerStart = (startAtIndex = 0) => {
            console.log("[Hero] Trigger Start Clicked. Index:", startAtIndex);
            if (typeof window.initializeQuizShell === 'function') {
                window.initializeQuizShell(startAtIndex);
            } else {
                console.warn("[Hero] initializeQuizShell missing. Retrying...");
                // Retry once after 200ms
                setTimeout(() => {
                    if (typeof window.initializeQuizShell === 'function') {
                        window.initializeQuizShell(startAtIndex);
                    } else {
                        console.error("[Hero] initializeQuizShell Failed to Load.");
                        alert("System is still loading. Please wait 2 seconds and try again.");
                    }
                }, 500); // Increased timeout to 500ms
            }
        };

        // Momentum Feature 1: Phase 0 Preview Logic
        const handlePhase0OptionClick = (optionIndex) => {
            window.answers = window.answers || {};
            window.answers["p0_q1"] = optionIndex;
            triggerStart(1); // Launch at index 1 since 0 is answered
        };

        // Universal Click Fix
        useEffect(() => {
            const handleGlobalClick = (e) => {
                const target = e.target;
                if (!target) return;
                const isCtaClick = target.closest('.unstoppable-cta');
                if (isCtaClick) {
                    console.log("Global Unstoppable Catch: Targeted CTA Clicked");
                    triggerStart(0);
                }
            };
            window.addEventListener('click', handleGlobalClick, true);
            return () => window.removeEventListener('click', handleGlobalClick, true);
        }, []);

        // --- RENDER HELPERS ---

        // 1. Top Buttons
        const renderTopButtons = () => {
            return h('div', { className: "absolute top-6 right-6 flex flex-col md:flex-row gap-4 z-[1000]" },
                h('button', {
                    onClick: () => window.openSyncMatchGate && window.openSyncMatchGate(),
                    className: "text-xs font-bold text-slate-400 border border-slate-700/50 px-5 py-2 rounded-full hover:bg-slate-800 transition backdrop-blur-sm shadow-xl",
                    style: { background: 'rgba(30, 41, 59, 0.4)', cursor: 'pointer' }
                }, "Unlock Parent & Child Sync Check"),
                h('a', {
                    href: "https://xray.aptskola.com",
                    target: "_blank",
                    className: "text-xs font-bold text-slate-400 border border-slate-700/50 px-5 py-2 rounded-full hover:bg-slate-800 transition backdrop-blur-sm shadow-xl text-center",
                    style: { background: 'rgba(30, 41, 59, 0.4)' }
                }, "🔎 School/College Forensic Report")
            );
        };

        // 2. Branding
        const renderBranding = () => {
            return h('div', { className: "mt-4 mb-12 text-center animate-fade-in-up" },
                h('h1', { className: "text-5xl md:text-6xl font-black text-white tracking-tighter" },
                    "Apt ", h('span', { className: "text-[#FF6B35]" }, "Skola")
                ),
                h('div', { className: "flex items-center justify-center gap-3 mt-4 opacity-70" },
                    h('div', { className: "h-px w-8 bg-slate-600" }),
                    h('span', { className: "text-sm font-bold text-slate-400 uppercase tracking-[0.2em]" }, "A Foviz Venture"),
                    h('div', { className: "h-px w-8 bg-slate-600" })
                )
            );
        };

        // 3. Headline
        const renderHeadline = () => {
            const currentSlide = slides[index];
            return h('div', { className: "flex flex-col items-center justify-center gap-4 min-h-[160px]" },
                h('div', { className: "flex items-center gap-4 md:gap-8" },
                    h(AnimatePresence, { mode: "wait" },
                        h(motion.div, {
                            key: index, // Key by index to enforce full re-render of the pair
                            initial: { y: 20, opacity: 0 },
                            animate: { y: 0, opacity: 1 },
                            exit: { y: -20, opacity: 0 },
                            transition: { duration: 0.3, ease: "easeOut" },
                            className: "flex items-center gap-4 md:gap-8"
                        },
                            h('span', { className: `text-5xl md:text-8xl font-black ${currentSlide.pColor}` }, currentSlide.prefix),
                            h('span', { className: `text-5xl md:text-8xl font-black ${currentSlide.wColor}` }, currentSlide.word)
                        )
                    )
                ),
                h('div', { className: "text-center px-4 max-w-5xl mx-auto mt-6" },
                    h('h1', { className: "text-2xl md:text-4xl font-extrabold text-[#FF6B35] leading-[1.3] mb-4 tracking-tight" }, "School Board Selection is a 15-Year Financial & Academic Commitment."),
                    h('p', { className: "text-lg md:text-xl font-bold text-white tracking-wide leading-relaxed" },
                        "Is your child's Age, Grade, and Learning Style in perfect ",
                        h('span', { className: "text-[#FF6B35] font-bold" }, "sync"),
                        "?"
                    )
                )
            );
        };

        // 4. Subtext (Value Proposition)
        const renderSubtext = () => {
            return h('p', { className: "text-slate-400 text-lg md:text-2xl text-center max-w-3xl mx-auto mt-12 leading-relaxed font-medium" },
                "Stop the guesswork. Audit your child's alignment with NEP 2026 standards and find the Board that fits their future—and your budget."
            );
        };

        // 5. Social Proof
        const renderSocialProof = () => {
            return h('div', { className: "mt-12 flex flex-col items-center gap-4" },
                h('div', { className: "flex -space-x-4" },
                    [1, 2, 3, 4, 5].map(i =>
                        h('div', { key: i, className: "w-12 h-12 rounded-full border-4 border-[#0F172A] bg-slate-700 flex items-center justify-center text-white font-bold text-xs overflow-hidden" },
                            h('img', { src: `https://i.pravatar.cc/100?img=${i + 10}`, className: "w-full h-full object-cover", alt: "Parent Avatar" })
                        )
                    ),
                    h('div', { className: "w-12 h-12 rounded-full border-4 border-[#0F172A] bg-[#FF6B35] flex items-center justify-center text-white font-black text-xs" }, "1K+")
                ),
                h('p', { className: "text-slate-500 text-sm font-bold uppercase tracking-widest" }, "Joined by 1,000+ parents this week")
            );
        };

        // 6. CTA Button (Split Action)
        const renderCTA = () => {
            return h('div', { className: "relative mt-16 z-[40] flex flex-col md:flex-row gap-4 items-center w-full max-w-2xl px-4" },
                // Primary Button
                h('div', { className: "relative group w-full md:w-auto flex-1" },
                    h('div', { className: "absolute -inset-1 bg-gradient-to-r from-[#FF6B35] to-yellow-500 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000" }),
                    h('button', {
                        onClick: () => triggerStart(0),
                        className: "unstoppable-cta w-full relative bg-[#FF6B35] text-white px-6 py-4 rounded-full font-black text-lg md:text-xl shadow-xl hover:scale-105 active:scale-95 transition-all border-b-[4px] border-orange-800 flex items-center justify-center gap-2",
                        style: { pointerEvents: 'auto' }
                    }, `Start ${targetYear} Grade 1 Roadmap`, h('span', { className: "animate-pulse" }, "→"))
                ),
                // Secondary Button (Ghost/Utility)
                h('button', {
                    onClick: () => window.handleCostCalculatorClick ? window.handleCostCalculatorClick() : console.log("Calc not found"),
                    className: "w-full md:w-auto flex-1 px-6 py-4 rounded-full font-bold text-slate-300 border-2 border-slate-600 hover:border-[#FF6B35] hover:text-[#FF6B35] hover:bg-slate-800/50 transition-all text-lg md:text-xl flex items-center justify-center gap-2",
                    style: { pointerEvents: 'auto' }
                }, "Calculate My 'Cost of Confusion' ¥")
            );
        };

        // 7. Roadmap Text
        const renderRoadmapText = () => {
            return h('p', { className: "text-slate-400 text-center mt-8 mb-2 w-full max-w-5xl mx-auto px-2 font-medium animate-pulse text-xs md:text-lg md:whitespace-nowrap leading-tight" },
                "Your personalized roadmap begins here. Please answer calibration questions to align your child’s profile."
            );
        };

        // 8. Question Embed
        const renderQuestionEmbed = () => {
            return h('div', { className: "mt-4 w-full max-w-4xl bg-slate-900/50 border border-slate-700/50 p-8 md:p-12 rounded-[40px] backdrop-blur-xl" },
                h('div', { className: "text-center mb-10" },
                    h('span', { className: "text-[#FF6B35] font-black uppercase tracking-[0.3em] text-sm" }, "Verification Step 1: Baseline Momentum Audit (Subsidized Access)"),
                    h('h2', { className: "text-white text-2xl md:text-4xl font-extrabold mt-4" }, "How does your child process complex new data?")
                ),
                h('div', { className: "grid grid-cols-1 md:grid-cols-3 gap-6" },
                    ["Visual/Charts", "Auditory/Discussion", "Kinesthetic/Build"].map((opt, i) =>
                        h('button', {
                            key: i,
                            onClick: () => handlePhase0OptionClick(i),
                            className: "p-6 bg-slate-800/50 border-2 border-slate-700 rounded-2xl text-white font-bold text-xl hover:bg-[#FF6B35] hover:border-[#FF6B35] transition-all transform hover:-translate-y-2"
                        }, opt)
                    )
                )
            );
        };

        // 9. Toast
        const renderToast = () => {
            return h(AnimatePresence, {},
                showToast && h(motion.div, {
                    initial: { x: 400, opacity: 0 },
                    animate: { x: 0, opacity: 1 },
                    exit: { x: 400, opacity: 0 },
                    className: "fixed bottom-8 right-8 z-[10000] bg-white p-6 rounded-3xl shadow-2xl border-l-[8px] border-[#FF6B35] max-w-xs"
                },
                    h('button', { onClick: () => setShowToast(false), className: "absolute top-4 right-4 text-slate-400 hover:text-slate-600" }, "✕"),
                    h('p', { className: "text-slate-900 font-bold leading-tight mb-4" }, "Ready to see which board fits your child's personality? (Takes 5 mins)"),
                    h('button', {
                        onClick: () => { triggerStart(0); setShowToast(false); },
                        className: "w-full bg-[#FF6B35] text-white py-3 rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                    }, "Start Now")
                )
            );
        };

        return h(Fragment, {},
            h('section', { className: "relative pt-32 pb-20 px-4 overflow-hidden bg-[#0F172A] min-h-[95vh] flex flex-col items-center" },
                renderTopButtons(),
                renderBranding(),
                renderHeadline(),
                renderSubtext(),
                renderSocialProof(),
                renderCTA(),
                renderRoadmapText(),
                renderQuestionEmbed(),
                h('div', { className: "absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[150px] pointer-events-none" }),
                h('div', { className: "absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[180px] pointer-events-none" })
            ),
            renderToast()
        );
    };

    window.Hero = Hero; // Expose to window

    // Initialize
    window.addEventListener('load', () => {
        const container = document.getElementById('react-hero-root');
        if (container) {
            const root = ReactDOM.createRoot(container);
            root.render(h(Hero));
        }
    });

})();
