import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Compass, Users, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  const stats = [
    { value: '12', label: 'quality & security modules' },
    { value: '60+', label: 'individual technical checks' },
    { value: '2 min', label: 'average scan completion' },
  ];

  const principles = [
    {
      icon: Eye,
      title: 'Show the evidence',
      text: 'Every score links back to the exact check that produced it. No black-box grades.',
    },
    {
      icon: Compass,
      title: 'Rank by impact',
      text: 'A missing privacy policy outranks a stray console warning. We sort your work for you.',
    },
    {
      icon: Users,
      title: 'Written for builders',
      text: 'Plain language over jargon, with the fix spelled out — not just the failure.',
    },
  ];

  return (
    <div className="w-full flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-14">
      <section className="max-w-4xl mx-auto text-center space-y-7">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="section-eyebrow mx-auto"
        >
          Built for fast-moving teams
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="section-title mx-auto max-w-4xl"
        >
          AI ships sites fast.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F5A0] via-[#00E093] to-[#00B4D8]">
            Nobody checks them.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="section-copy max-w-2xl mx-auto"
        >
          A generated site looks finished the moment it renders. The gaps show up later — a missing privacy policy, contrast that fails WCAG, a 2 MB hero image, or no security headers. SiteProof is the review step between “it looks done” and “it is done.”
        </motion.p>
      </section>

      <section className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.value}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + index * 0.08 }}
              className="soft-card hover-lift rounded-3xl p-7 text-center"
            >
              <div className="text-4xl font-extrabold text-[#00F5A0] font-mono tracking-tight">{stat.value}</div>
              <div className="mt-3 text-xs uppercase tracking-[0.14em] text-slate-600 dark:text-gray-400 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="section-title text-3xl sm:text-4xl">What we hold ourselves to</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {principles.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.08 }}
                className="soft-card hover-lift rounded-3xl p-6 space-y-4"
              >
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[#00F5A0] shadow-[0_0_18px_rgba(0,245,160,0.18)]">
                  <Icon size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed">{item.text}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="max-w-5xl mx-auto pt-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="soft-card relative overflow-hidden rounded-[2rem] p-10 text-center"
        >
          <div className="absolute inset-0 animated-gradient opacity-80" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(0,245,160,0.15) 0%, transparent 65%)' }} />
          <div className="relative z-10 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Run your first audit</h2>
            <p className="max-w-xl mx-auto text-sm sm:text-base text-slate-600 dark:text-gray-300">
              Paste a URL and see all 12 modules scored in under 2 minutes.
            </p>

            <div className="pt-2">
              <Link
                to="/#scan"
                className="inline-flex items-center gap-2 rounded-full bg-[#00F5A0] px-7 py-3 font-bold text-slate-950 shadow-[0_0_25px_rgba(0,245,160,0.35)] transition-all hover:-translate-y-0.5 hover:bg-[#00E093]"
              >
                Scan a website <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

