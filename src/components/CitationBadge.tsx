import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ShieldCheck, ExternalLink, Sparkles, Scroll } from 'lucide-react';
import { CitationInfo, getCitationDetails } from '../constants/citationData';

interface CitationBadgeProps {
  citationKey: string;
  label: React.ReactNode;
  onSelect: (citation: CitationInfo) => void;
}

export const CitationBadge: React.FC<CitationBadgeProps> = ({ citationKey, label, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Parse key format: "cite:type:ref|url"
  // e.g. "cite:quran:2:183|https://quran.com/2/183"
  // or "cite:hadith:Bukhari:1|https://sunnah.com/bukhari:1"
  let type = 'quran';
  let ref = '1:1';
  let url = 'https://quran.com';

  try {
    const mainParts = citationKey.replace('cite:', '').split('|');
    url = mainParts[1] || '';
    
    const refParts = mainParts[0].split(':');
    type = refParts[0] || 'quran';
    ref = refParts.slice(1).join(':') || '1:1';
  } catch {
    // fallback
  }

  const citationInfo = getCitationDetails(type, ref, url);
  const isQuran = citationInfo.type === 'quran';

  return (
    <span 
      className="relative inline-block my-0.5 mx-0.5 align-middle"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onSelect(citationInfo);
        }}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold tracking-wide border transition-all cursor-pointer shadow-2xs ${
          isQuran
            ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#047857] hover:bg-[#d1fae5] hover:border-[#34d399]'
            : 'bg-[#fffbeb] border-[#fde68a] text-[#b45309] hover:bg-[#fef3c3] hover:border-[#fcd34d]'
        }`}
      >
        {isQuran ? (
          <BookOpen className="w-3.5 h-3.5 text-[#059669]" />
        ) : (
          <ShieldCheck className="w-3.5 h-3.5 text-[#d97706]" />
        )}
        <span>{label}</span>
      </button>

      {/* Floating Hover Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-white rounded-2xl shadow-xl border border-[#e5e5e0] p-3.5 z-50 pointer-events-none text-left"
          >
            {/* Tooltip Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#f3f4f6]">
              <div className="flex items-center gap-1.5 truncate pr-2">
                {isQuran ? <BookOpen className="w-3.5 h-3.5 text-[#064e3b] shrink-0" /> : <ShieldCheck className="w-3.5 h-3.5 text-[#d97706] shrink-0" />}
                <span className="font-serif font-bold text-xs text-[#064e3b] truncate">
                  {citationInfo.title}
                </span>
              </div>
              <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
                isQuran ? 'bg-[#ecfdf5] text-[#047857]' : 'bg-[#fffbeb] text-[#b45309]'
              }`}>
                {isQuran ? 'Quran' : 'Sahih'}
              </span>
            </div>

            {/* Subtitle & Ref */}
            <p className="text-[11px] font-semibold text-[#4b5563] mb-1.5">
              {citationInfo.subtitle}
            </p>

            {/* Text Excerpt Preview */}
            {citationInfo.excerpt && (
              <p className="text-[11px] text-[#374151] italic line-clamp-2 bg-[#fdfcf7] p-2 rounded-lg border border-[#e5e5e0] leading-snug mb-2">
                "{citationInfo.excerpt}"
              </p>
            )}

            {/* Click CTA Prompt */}
            <div className="flex items-center justify-between text-[10px] text-[#064e3b] font-medium pt-1 border-t border-[#f3f4f6]">
              <span className="flex items-center gap-1 text-[#d97706] font-semibold">
                <Sparkles className="w-3 h-3 text-[#d97706]" />
                Click for source details & Tafsir
              </span>
              <ExternalLink className="w-3 h-3 text-gray-400" />
            </div>

            {/* Tooltip pointer triangle */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2.5 h-2.5 bg-white border-b border-r border-[#e5e5e0] transform rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};
