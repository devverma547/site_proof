import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, CheckCircle2, Bug, Lightbulb, AlertCircle } from 'lucide-react';
import { contactService } from '../../services/database.service';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Report a Bug / Website Issue',
    message: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await contactService.save(formData);
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit contact message:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlaceholder = () => {
    switch (formData.subject) {
      case 'Report a Bug / Website Issue':
        return 'Please describe the bug or problem you encountered on the website (e.g., page where it happened, error message, or steps to reproduce)...';
      case 'Feature Request & Improvement':
        return 'Tell us about the new feature, audit check, or improvement you would like us to add...';
      case 'Audit Report Support':
        return 'Describe your question regarding scan scores, recommendations, or false positives...';
      default:
        return 'Share your thoughts, questions, or feedback with us...';
    }
  };

  const detailCards = [
    {
      icon: Bug,
      title: 'Found a Bug or Issue?',
      text: 'If something is not working right or you see an error on the site, tell us right away. We prioritize fixing bugs reported by our users.',
      accent: 'emerald',
      meta: 'Average resolution time: < 24 hours',
    },
    {
      icon: Mail,
      title: 'Direct Email Support',
      text: 'support@siteproof.io',
      accent: 'blue',
      meta: 'For security & general concerns',
    },
    {
      icon: Lightbulb,
      title: 'Suggestions & Ideas',
      text: 'Want a new scanner module or feature? Share your suggestions with our dev team.',
      accent: 'amber',
      meta: 'Product ideas welcome',
    },
  ];

  return (
    <div className="w-full flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-3xl mx-auto space-y-5"
      >
        <div className="section-eyebrow mx-auto">
          <Bug size={14} /> Help us improve
        </div>
        <h1 className="section-title text-4xl sm:text-5xl lg:text-6xl">
          Get in touch with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F5A0] via-[#00E093] to-[#00B4D8]">SiteProof</span>
        </h1>
        <p className="section-copy max-w-2xl mx-auto">
          Spotted a bug, glitch, or broken link on our website? Or have ideas to make SiteProof better?
          Let us know. Your feedback directly helps us fix issues and build a better experience for everyone.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {detailCards.map((card, index) => {
          const Icon = card.icon;
          const iconClasses =
            card.accent === 'emerald'
              ? 'bg-emerald-500/10 text-[#00F5A0] border border-emerald-500/20'
              : card.accent === 'blue'
                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20';

          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + index * 0.08 }}
              className="soft-card hover-lift rounded-3xl p-6 space-y-4"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${iconClasses}`}>
                <Icon size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{card.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-gray-400">{card.text}</p>
              <div className="text-[11px] font-semibold text-[#00F5A0] flex items-center gap-1.5">
                {card.accent === 'emerald' && <AlertCircle size={13} />}
                {card.meta}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="md:col-span-3 soft-card rounded-[2rem] p-6 sm:p-8"
        >
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <CheckCircle2 className="w-14 h-14 text-[#00F5A0] mx-auto animate-bounce" />
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Thank you for your feedback!</h3>
              <p className="text-sm text-slate-600 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">
                Your message has been securely logged. If you reported a website bug or technical issue, our development team will inspect and fix it promptly.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', subject: 'Report a Bug / Website Issue', message: '' });
                }}
                className="mt-2 rounded-full bg-slate-100 dark:bg-white/5 px-6 py-2.5 text-sm font-semibold text-slate-900 dark:text-white transition hover:bg-slate-200 dark:hover:bg-white/10"
              >
                Submit another report or question
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Send us a message</h2>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Select the topic that best matches your issue or idea.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 dark:text-gray-300">Your name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Alex Mercer"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-[#00F5A0] focus:ring-2 focus:ring-[#00F5A0]/20 transition-all dark:border-white/10 dark:bg-[#080C14] dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 dark:text-gray-300">Email address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@company.com"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-[#00F5A0] focus:ring-2 focus:ring-[#00F5A0]/20 transition-all dark:border-white/10 dark:bg-[#080C14] dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 dark:text-gray-300">Subject</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:border-[#00F5A0] focus:ring-2 focus:ring-[#00F5A0]/20 transition-all dark:border-white/10 dark:bg-[#080C14] dark:text-white"
                >
                  <option value="Report a Bug / Website Issue">🐛 Report a Bug / Website Issue</option>
                  <option value="Feature Request & Improvement">💡 Feature Request & Improvement</option>
                  <option value="Audit Report Support">📊 Audit Report Support</option>
                  <option value="General Inquiry & Feedback">💬 General Inquiry & Feedback</option>
                  <option value="Enterprise & Business Plan">💼 Enterprise & Business Inquiry</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 dark:text-gray-300">Message</label>
                <textarea
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={getPlaceholder()}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-[#00F5A0] focus:ring-2 focus:ring-[#00F5A0]/20 transition-all dark:border-white/10 dark:bg-[#080C14] dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#00F5A0] px-7 py-3 font-bold text-slate-950 shadow-[0_0_24px_rgba(0,245,160,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#00E093] disabled:opacity-60"
              >
                {isSubmitting ? 'Saving message...' : 'Send Message'} <Send size={16} />
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}

