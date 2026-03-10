'use client';
import { useState } from 'react';
import { COMPANY } from '@/lib/constants';
import { Phone, Mail, MapPin, Send, Facebook } from 'lucide-react';
import SubPageAnimator from '@/components/animations/SubPageAnimator';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', projectType: '', message: '' });
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); alert('Thank you! We will be in touch shortly.'); };

  return (
    <SubPageAnimator>
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 blueprint-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-ro-black/95 to-ro-black" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 text-center">
          <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">Contact Us</span>
          <h1 className="text-ro-white font-heading text-5xl sm:text-6xl tracking-tight uppercase mb-4">
            Let&apos;s <span className="gradient-text-gold">Build</span>
          </h1>
          <div className="mx-auto w-24 gold-line mb-6" />
          <p className="text-ro-gray-400 text-lg max-w-xl mx-auto">{COMPANY.cta}</p>
          <p className="text-ro-gray-600 text-sm mt-3 max-w-md mx-auto">Reputation built on actions. <a href="/our-story" className="text-ro-gold/60 hover:text-ro-gold transition-colors">Learn who we are &rarr;</a></p>
        </div>
      </section>
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h3 className="text-ro-gold font-heading text-sm tracking-[0.2em] uppercase mb-6">Direct Contact</h3>
                <div className="space-y-4">
                  <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-4 text-ro-gray-300 hover:text-ro-gold transition-colors group">
                    <div className="w-10 h-10 border border-ro-gray-700 group-hover:border-ro-gold/30 flex items-center justify-center transition-colors"><Phone size={16} className="text-ro-gold/60" /></div>
                    <div><div className="text-xs text-ro-gray-500 uppercase tracking-wider">Phone</div><div className="font-mono">{COMPANY.phone}</div></div>
                  </a>
                  <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-4 text-ro-gray-300 hover:text-ro-gold transition-colors group">
                    <div className="w-10 h-10 border border-ro-gray-700 group-hover:border-ro-gold/30 flex items-center justify-center transition-colors"><Mail size={16} className="text-ro-gold/60" /></div>
                    <div><div className="text-xs text-ro-gray-500 uppercase tracking-wider">Email</div><div className="text-sm">{COMPANY.email}</div></div>
                  </a>
                  <div className="flex items-center gap-4 text-ro-gray-300">
                    <div className="w-10 h-10 border border-ro-gray-700 flex items-center justify-center"><MapPin size={16} className="text-ro-gold/60" /></div>
                    <div><div className="text-xs text-ro-gray-500 uppercase tracking-wider">Service Area</div><div className="text-sm">{COMPANY.serviceArea}</div></div>
                  </div>
                  <a href={COMPANY.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-ro-gray-300 hover:text-ro-gold transition-colors group">
                    <div className="w-10 h-10 border border-ro-gray-700 group-hover:border-ro-gold/30 flex items-center justify-center transition-colors"><Facebook size={16} className="text-ro-gold/60" /></div>
                    <div><div className="text-xs text-ro-gray-500 uppercase tracking-wider">Facebook</div><div className="text-sm">Follow RO Unlimited</div></div>
                  </a>
                </div>
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="relative border border-ro-gray-800 bg-ro-gray-900/30 p-8 sm:p-10">
                <div className="absolute top-3 left-3 w-2 h-2 border-t border-l border-ro-gold/20" />
                <div className="absolute top-3 right-3 w-2 h-2 border-t border-r border-ro-gold/20" />
                <div className="absolute bottom-3 left-3 w-2 h-2 border-b border-l border-ro-gold/20" />
                <div className="absolute bottom-3 right-3 w-2 h-2 border-b border-r border-ro-gold/20" />
                <h3 className="text-ro-white font-heading text-xl tracking-wider uppercase mb-8">Send Us Your Project</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div><label className="block text-ro-gray-500 text-xs uppercase tracking-wider mb-2">Name *</label>
                      <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-ro-black border border-ro-gray-700 px-4 py-3 text-ro-white text-sm focus:border-ro-gold/50 focus:outline-none transition-colors" placeholder="Your name" /></div>
                    <div><label className="block text-ro-gray-500 text-xs uppercase tracking-wider mb-2">Phone *</label>
                      <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-ro-black border border-ro-gray-700 px-4 py-3 text-ro-white text-sm focus:border-ro-gold/50 focus:outline-none transition-colors" placeholder="(864) 000-0000" /></div>
                  </div>
                  <div><label className="block text-ro-gray-500 text-xs uppercase tracking-wider mb-2">Email</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-ro-black border border-ro-gray-700 px-4 py-3 text-ro-white text-sm focus:border-ro-gold/50 focus:outline-none transition-colors" placeholder="your@email.com" /></div>
                  <div><label className="block text-ro-gray-500 text-xs uppercase tracking-wider mb-2">Project Type</label>
                    <select value={formData.projectType} onChange={(e) => setFormData({...formData, projectType: e.target.value})} className="w-full bg-ro-black border border-ro-gray-700 px-4 py-3 text-ro-white text-sm focus:border-ro-gold/50 focus:outline-none transition-colors">
                      <option value="">Select a project type</option><option value="residential">Residential / Custom Home</option><option value="commercial">Commercial Build</option>
                      <option value="grading">Land Grading / Site Prep</option><option value="renovation">Renovation / Remodel</option><option value="other">Other</option>
                    </select></div>
                  <div><label className="block text-ro-gray-500 text-xs uppercase tracking-wider mb-2">Project Details</label>
                    <textarea rows={5} value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full bg-ro-black border border-ro-gray-700 px-4 py-3 text-ro-white text-sm focus:border-ro-gold/50 focus:outline-none transition-colors resize-none" placeholder="Tell us about your project..." /></div>
                  <button type="submit" className="group flex items-center gap-3 px-8 py-4 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-all duration-300 w-full justify-center">
                    <Send size={16} />Submit Project
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SubPageAnimator>
  );
}



