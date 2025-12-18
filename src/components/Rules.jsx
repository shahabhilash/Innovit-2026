import React from 'react';
import { motion } from 'framer-motion';
import DecryptedText from './DecryptedText';
import ElectricBorder from './ElectricBorder';
import { ParticleCard } from './MagicEffects';
import { useIsMobile } from '../hooks/useIsMobile';

const SectionCard = ({ title, children, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className="relative"
    >
        <ParticleCard
            className="magic-card"
            particleCount={8}
            glowColor="245, 188, 34"
            enableTilt
            enableMagnetism={false}
            clickEffect
            enableBorderGlow
        >
            <ElectricBorder color="#f5bc22" thickness={2} className="rounded-2xl">
                <div className="glass-strong rounded-2xl p-5 md:p-6">
                    <h3 className="text-xl md:text-2xl font-bold mb-3 gradient-text">{title}</h3>
                    <div className="text-[#fbe9bb] text-sm md:text-base leading-relaxed space-y-3">
                        {children}
                    </div>
                </div>
            </ElectricBorder>
        </ParticleCard>
    </motion.div>
);

const Rules = () => {
    const isMobile = useIsMobile();

    return (
        <section className="section-padding relative overflow-hidden">
            <div className="container relative z-10">
                {/* Header */}
                <motion.div
                    className="text-center mb-10 md:mb-14 px-4"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-3">
                        <DecryptedText
                            text="Rules & Regulations"
                            animateOn="view"
                            speed={8}
                            className="gradient-text"
                            encryptedClassName="text-yellow-200/50"
                        />
                    </h1>
                    <p className="text-base md:text-lg text-[#fbe9bb] max-w-2xl mx-auto">
                        Polished vibes, placeholder words. Edit anytime to finalize specifics.
                    </p>
                </motion.div>

                {/* Grid */}
                <div className="max-w-6xl mx-auto px-4 grid gap-4 md:gap-6 md:grid-cols-2">
                    <SectionCard title="Eligibility" delay={0.05}>
                        <ul className="space-y-2 list-none">
                            <li>• Lorem ipsum eligendus cohortus magna — campus, alumni, etc.</li>
                            <li>• Dolor sit amet participants duo-trio squads allowed.</li>
                            <li>• Consectetur tempus veritas — one team per person maximus.</li>
                        </ul>
                    </SectionCard>

                    <SectionCard title="Team Formation" delay={0.1}>
                        <ul className="space-y-2">
                            <li>• Min 2, max 4 aurum builders; solo optional per policy.</li>
                            <li>• Cross-year collab ok; cross-campus per organizer nodus.</li>
                            <li>• Replace members? Quasi-flex till Phase α confirmation.</li>
                        </ul>
                    </SectionCard>

                    <SectionCard title="Submission Guidelines" delay={0.15}>
                        <ul className="space-y-2">
                            <li>• Use official portals; filenames like INNOVIT_TeamName_v1.</li>
                            <li>• Repo public/private acceptable — grant judge access.</li>
                            <li>• Video demo: 3–5 mins; lorem voiceover clear et crisp.</li>
                        </ul>
                    </SectionCard>

                    <SectionCard title="Code of Conduct" delay={0.2}>
                        <ul className="space-y-2">
                            <li>• Be stellar humans: respectum, kindness, zero-harassio policy.</li>
                            <li>• Original work preferred; credit libraries and datasets.</li>
                            <li>• AI tools okay; disclose usage succinctly in README.md.</li>
                        </ul>
                    </SectionCard>

                    <SectionCard title="Judging & Evaluation" delay={0.25}>
                        <p>
                            Criteria ipsum: innovationis, feasibility ratio, blockchain-fit, impact potential, and
                            clarity of articulation. Bonus for polish, docs, and wow factor.
                        </p>
                    </SectionCard>

                    <SectionCard title="Intellectual Property" delay={0.3}>
                        <p>
                            You own your work. By submitting, you grant tempus-limited showcase rights for demos,
                            socials, and awards. Third-party licenses apply as declared by you.
                        </p>
                    </SectionCard>

                    <SectionCard title="Disqualification" delay={0.35}>
                        <ul className="space-y-2">
                            <li>• Plagiarism, tampering, or rule-flip leads to instant nullus.</li>
                            <li>• Late submissions post grace-window may be non-evaluated.</li>
                            <li>• Misconduct toward peers, mentors, or judges prohibited.</li>
                        </ul>
                    </SectionCard>

                    <SectionCard title="Logistics & Support" delay={0.4}>
                        <ul className="space-y-2">
                            <li>• All timings IST; updates via official channels.</li>
                            <li>• Queries: ping the WhatsApp float or contact page.</li>
                            <li>• Tech hiccups? Retry, capture evidence, and notify team.</li>
                        </ul>
                    </SectionCard>
                </div>

                {/* CTA */}
                <motion.div
                    className="mt-10 md:mt-14 flex justify-center px-4"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <a
                        href="/problem-statement"
                        className="btn-primary px-6 py-3 rounded-full hover:scale-105 transition-transform"
                    >
                        View Problem Statements
                    </a>
                </motion.div>
            </div>
        </section>
    );
};

export default Rules;
