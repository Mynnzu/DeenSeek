import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ExternalLink, X, Copy, Check, MessageSquare, ShieldCheck, Sparkles, Scroll, Info, Book } from 'lucide-react';
import { CitationInfo } from '../constants/citationData';

interface CitationModalProps {
  citation: CitationInfo | null;
  onClose: () => void;
  onAskAI: (prompt: string) => void;
}

export const CitationModal: React.FC<CitationModalProps> = ({ citation, onClose, onAskAI }) => {
  const [copied, setCopied] = useState(false);

  if (!citation) return null;

  const handleCopy = () => {
    const textToCopy = `${citation.title} [${citation.referenceNumber}]: "${citation.excerpt || ''}" - ${citation.url}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAskForTafsir = () => {
    const prompt = citation.type === 'quran'
      ? `Can you provide a detailed scholarly tafsir and explanation of ${citation.title} (${citation.referenceNumber})?`
      : `Can you explain the scholarly context, narrators, and juristic rulings derived from ${citation.title} Hadith #${citation.referenceNumber}?`;
    
    onAskAI(prompt);
    onClose();
  };

  const isQuran = citation.type === 'quran';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
        {/* Backdrop overlay click */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-white rounded-3xl shadow-2xl border border-[#e5e5e0] max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Banner Header */}
          <div className={`p-6 border-b border-[#e5e5e0] flex items-start justify-between relative overflow-hidden ${
            isQuran 
              ? 'bg-gradient-to-r from-[#064e3b] to-[#04392b] text-white' 
              : 'bg-gradient-to-r from-[#78350f] to-[#451a03] text-white'
          }`}>
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none transform translate-x-8 -translate-y-8">
              {isQuran ? <BookOpen className="w-full h-full text-white" /> : <ShieldCheck className="w-full h-full text-white" />}
            </div>

            <div className="space-y-1 z-10 pr-6">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                  isQuran ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30' : 'bg-amber-400/20 text-amber-200 border border-amber-400/30'
                }`}>
                  {isQuran ? 'Qur\'anic Reference' : 'Hadith Narration'}
                </span>
                <span className="text-[10px] uppercase font-semibold text-white/80">
                  {citation.authenticity}
                </span>
              </div>
              <h3 className="text-xl font-serif font-bold tracking-tight text-white">{citation.title}</h3>
              <p className="text-xs text-white/80 font-medium">{citation.subtitle} • {citation.compilerOrContext}</p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10 shrink-0"
              title="Close Reference Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto space-y-5 bg-[#fdfcf7]">
            {/* Arabic Excerpt if present */}
            {citation.arabicExcerpt && (
              <div className="bg-white p-4 rounded-2xl border border-[#e5e5e0] text-right font-serif text-lg leading-loose text-[#064e3b] shadow-xs dir-rtl">
                {citation.arabicExcerpt}
              </div>
            )}

            {/* Translation or Hadith Excerpt */}
            {citation.excerpt && (
              <div className="space-y-1.5">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-[#6b7280]">
                  {isQuran ? 'Translation Excerpt' : 'Hadith Text Preview'}
                </h4>
                <blockquote className="bg-white p-4 rounded-2xl border-l-4 border-[#d97706] text-sm text-[#374151] italic leading-relaxed shadow-xs">
                  "{citation.excerpt}"
                </blockquote>
              </div>
            )}

            {/* Scholarly Context & Tafsir Notes */}
            {citation.scholarlyNotes && (
              <div className="space-y-1.5">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-[#064e3b] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#d97706]" />
                  Scholarly Context & Tafsir
                </h4>
                <p className="text-xs text-[#4b5563] bg-[#f0fdf4] p-3.5 rounded-xl border border-[#bbf7d0] leading-relaxed">
                  {citation.scholarlyNotes}
                </p>
              </div>
            )}

            {/* Citation Metadata Badges */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-white p-3 rounded-xl border border-[#e5e5e0]">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Collection / Origin</span>
                <span className="font-bold text-[#064e3b] truncate block mt-0.5">{citation.collectionOrSurah}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#e5e5e0]">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Reference Index</span>
                <span className="font-bold text-[#d97706] truncate block mt-0.5">{citation.referenceNumber}</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-white border-t border-[#e5e5e0] flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleAskForTafsir}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-[#064e3b] hover:bg-[#053e2f] text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-emerald-900/10"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Ask DeenSeek for {isQuran ? 'Tafsir' : 'Scholarly Analysis'}
            </button>

            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#fefce8] hover:bg-[#fef9c3] text-[#854d0e] border border-[#fef08a] rounded-xl text-xs font-semibold transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Source
            </a>

            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#f5f5f0] hover:bg-[#e8e8e2] text-[#374151] rounded-xl text-xs font-semibold transition-all"
              title="Copy citation reference text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
