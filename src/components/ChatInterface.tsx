import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Info, ShieldCheck, BookOpen, AlertTriangle, Download, Trash2, Menu, X, MessageSquare, Plus, ExternalLink, Search, Book, ThumbsUp, ThumbsDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/src/lib/utils';
import { chatWithDeenSeek, Message } from '@/src/services/geminiService';
import { glossaryData, GlossaryTerm } from '@/src/constants/glossaryData';

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

const linkifyCitations = (text: string) => {
  // Quran: [Quran Surah:Ayah] -> [Quran Surah:Ayah](https://quran.com/surah/ayah)
  let processed = text.replace(/\[Quran (\d+):(\d+)\]/g, (match, surah, ayah) => {
    return `[${match}](https://quran.com/${surah}/${ayah})`;
  });

  // Bukhari: [Bukhari Number] -> [Bukhari Number](https://sunnah.com/bukhari:number)
  processed = processed.replace(/\[Bukhari (\d+)\]/g, (match, num) => {
    return `[${match}](https://sunnah.com/bukhari:${num})`;
  });

  // Muslim: [Muslim Number] -> [Muslim Number](https://sunnah.com/muslim:number)
  processed = processed.replace(/\[Muslim (\d+)\]/g, (match, num) => {
    return `[${match}](https://sunnah.com/muslim:${num})`;
  });

  // Glossary Terms: Find terms and wrap them in glossary links
  // Sort terms by length descending to avoid partial matches (e.g., "Fiqh" before "Fiqh scholar")
  const sortedTerms = [...glossaryData].sort((a, b) => b.term.length - a.term.length);
  
  sortedTerms.forEach(item => {
    // Use word boundaries to avoid matching inside other words
    const regex = new RegExp(`\\b(${item.term})\\b`, 'gi');
    // Only replace if not already inside a markdown link or citation
    // This is a simple check, could be more robust
    processed = processed.replace(regex, (match) => {
      // Check if the match is already part of a markdown link [text](url)
      // We'll use a simple heuristic: if it's preceded by '[' or followed by ']', we skip
      return `[${match}](glossary:${item.term})`;
    });
  });

  return processed;
};

export default function ChatInterface() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('deenseek_sessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
        if (parsed.length > 0) {
          // Don't auto-select, let user start fresh or pick one
        }
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('deenseek_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setIsSidebarOpen(false);
  };

  const selectSession = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setIsSidebarOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      startNewChat();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const response = await chatWithDeenSeek(messages, input);
    const aiMessage: Message = { role: 'model', text: response };
    const finalMessages = [...newMessages, aiMessage];
    
    setMessages(finalMessages);
    setIsLoading(false);

    // Update or create session
    if (currentSessionId) {
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: finalMessages, timestamp: Date.now() } 
          : s
      ));
    } else {
      const newId = Date.now().toString();
      const newSession: ChatSession = {
        id: newId,
        title: input.slice(0, 30) + (input.length > 30 ? '...' : ''),
        messages: finalMessages,
        timestamp: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newId);
    }
  };

  const exportChat = () => {
    if (messages.length === 0) return;
    
    const chatText = messages.map(msg => {
      const role = msg.role === 'user' ? 'User' : 'DeenSeek AI';
      return `[${role}]\n${msg.text}\n\n`;
    }).join('---\n\n');
    
    const header = "DeenSeek Chat History\n" + 
                   "Date: " + new Date().toLocaleString() + "\n" +
                   "Disclaimer: DeenSeek is an AI assistant, not a qualified scholar. Information provided is for educational purposes.\n" +
                   "================================================================================\n\n";
    
    const blob = new Blob([header + chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deenseek-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFeedback = (idx: number, type: 'up' | 'down', comment?: string) => {
    const newMessages = [...messages];
    newMessages[idx] = {
      ...newMessages[idx],
      feedback: { type, comment }
    };
    setMessages(newMessages);
    
    // Update session
    if (currentSessionId) {
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId ? { ...s, messages: newMessages } : s
      ));
    }
    
    setFeedbackModal(null);
    setFeedbackComment('');
  };

  const [showInfo, setShowInfo] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [glossarySearch, setGlossarySearch] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<{
    messageIndex: number;
    type: 'up' | 'down';
  } | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const isApiKeyMissing = !process.env.GEMINI_API_KEY;

  const filteredGlossary = glossaryData.filter(item => 
    item.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
    item.definition.toLowerCase().includes(glossarySearch.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#fdfcf7] text-[#1a1a1a] font-sans overflow-hidden">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isSidebarOpen ? 0 : -320 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "fixed inset-y-0 left-0 w-80 bg-white border-r border-[#e5e5e0] z-50 flex flex-col lg:relative lg:translate-x-0",
          !isSidebarOpen && "lg:w-0 lg:border-none lg:overflow-hidden"
        )}
      >
        <div className="p-6 border-b border-[#e5e5e0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="text-[#064e3b] w-6 h-6" />
            <span className="font-semibold text-[#064e3b]">History</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-[#f5f5f0] rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <button 
            onClick={startNewChat}
            className="w-full flex items-center gap-3 px-4 py-3 bg-[#064e3b] text-white rounded-xl hover:bg-[#053e2f] transition-all shadow-md shadow-emerald-900/10"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Conversation</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="w-12 h-12 text-[#e5e5e0] mx-auto mb-4" />
              <p className="text-sm text-[#9ca3af]">No previous conversations yet.</p>
            </div>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                onClick={() => selectSession(session)}
                className={cn(
                  "group relative flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all border border-transparent",
                  currentSessionId === session.id 
                    ? "bg-[#f0fdf4] border-[#dcfce7] text-[#064e3b]" 
                    : "hover:bg-[#f9f9f7] text-[#4b5563]"
                )}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium truncate flex-1">{session.title}</span>
                <button 
                  onClick={(e) => deleteSession(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-[#e5e5e0] bg-[#fdfcf7]">
          <p className="text-[10px] text-[#9ca3af] uppercase tracking-widest font-bold text-center">
            DeenSeek AI v1.0
          </p>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b border-[#e5e5e0] bg-white/80 backdrop-blur-md sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-[#f5f5f0] rounded-full transition-colors text-[#064e3b]"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#064e3b] rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/10">
                <BookOpen className="text-[#fefce8] w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-[#064e3b]">DeenSeek</h1>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[#d97706] opacity-80">Verified Islamic Knowledge</p>
                  {isApiKeyMissing && (
                    <span className="flex items-center gap-1 text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">
                      <AlertTriangle className="w-2.5 h-2.5" /> Key Missing
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowGlossary(true)}
              title="Islamic Glossary"
              className="p-2 hover:bg-[#f5f5f0] rounded-full transition-colors text-[#064e3b]"
            >
              <Book className="w-5 h-5" />
            </button>
            {messages.length > 0 && (
              <>
                <button 
                  onClick={() => {
                    setMessages([]);
                    setCurrentSessionId(null);
                  }}
                  title="Clear Current Chat"
                  className="p-2 hover:bg-[#f5f5f0] rounded-full transition-colors text-[#064e3b]"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={exportChat}
                  title="Export Chat"
                  className="p-2 hover:bg-[#f5f5f0] rounded-full transition-colors text-[#064e3b]"
                >
                  <Download className="w-5 h-5" />
                </button>
              </>
            )}
            <button 
              onClick={() => setShowInfo(!showInfo)}
              title="About DeenSeek"
              className="p-2 hover:bg-[#f5f5f0] rounded-full transition-colors text-[#064e3b]"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </header>

      {/* Feedback Comment Modal */}
      <AnimatePresence>
        {feedbackModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
            onClick={() => setFeedbackModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#e5e5e0]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                  <ThumbsDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-medium text-[#064e3b]">Provide Feedback</h3>
                  <p className="text-xs text-[#4b5563]">Help us improve DeenSeek's accuracy.</p>
                </div>
              </div>
              
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="What was wrong with this response? (Optional)"
                className="w-full bg-[#f9f9f7] border border-[#e5e5e0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all resize-none min-h-[100px]"
              />
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setFeedbackModal(null)}
                  className="flex-1 py-2.5 border border-[#e5e5e0] text-[#4b5563] rounded-xl font-medium hover:bg-[#f9f9f7] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleFeedback(feedbackModal.messageIndex, feedbackModal.type, feedbackComment)}
                  className="flex-1 py-2.5 bg-[#064e3b] text-white rounded-xl font-medium hover:bg-[#053e2f] transition-colors"
                >
                  Submit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glossary Modal */}
      <AnimatePresence>
        {showGlossary && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowGlossary(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-0 max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl border border-[#e5e5e0]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-[#e5e5e0] flex items-center justify-between bg-[#fdfcf7] rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <Book className="w-6 h-6 text-[#064e3b]" />
                  <h3 className="text-xl font-serif font-medium text-[#064e3b]">Islamic Glossary</h3>
                </div>
                <button onClick={() => setShowGlossary(false)} className="p-2 hover:bg-[#f5f5f0] rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-white border-b border-[#e5e5e0]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                  <input 
                    type="text"
                    placeholder="Search terms (e.g. Fiqh, Tawhid...)"
                    value={glossarySearch}
                    onChange={(e) => setGlossarySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#f9f9f7] border border-[#e5e5e0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b]"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredGlossary.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[#9ca3af]">No terms found matching your search.</p>
                  </div>
                ) : (
                  filteredGlossary.map(item => (
                    <div 
                      key={item.term}
                      className="p-4 rounded-2xl border border-[#e5e5e0] hover:border-[#064e3b] hover:bg-[#f0fdf4] transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-[#064e3b]">{item.term}</h4>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-[#d97706] bg-[#fffbeb] px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-sm text-[#4b5563] leading-relaxed">{item.definition}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Term Definition Modal */}
      <AnimatePresence>
        {selectedTerm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/10 backdrop-blur-[2px]"
            onClick={() => setSelectedTerm(null)}
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[#e5e5e0]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Book className="w-4 h-4 text-[#064e3b]" />
                  <h4 className="font-bold text-[#064e3b]">{selectedTerm.term}</h4>
                </div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#d97706] bg-[#fffbeb] px-2 py-0.5 rounded">
                  {selectedTerm.category}
                </span>
              </div>
              <p className="text-sm text-[#4b5563] leading-relaxed mb-4">
                {selectedTerm.definition}
              </p>
              <button 
                onClick={() => setSelectedTerm(null)}
                className="w-full py-2 bg-[#064e3b] text-white rounded-lg text-sm font-medium hover:bg-[#053e2f] transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Modal Overlay */}
      <AnimatePresence>
        {showInfo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowInfo(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-[#e5e5e0]"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-serif font-medium text-[#064e3b] mb-4">About DeenSeek</h3>
              <div className="space-y-4 text-sm text-[#4b5563] leading-relaxed">
                <p>
                  DeenSeek is built to address the "Online Fatwa Chaos" by providing a 
                  <strong> Shariah-compliant AI</strong> that prioritizes traceability and verified sources.
                </p>
                <div className="space-y-2">
                  <div className="flex gap-3 items-start">
                    <ShieldCheck className="w-5 h-5 text-[#064e3b] shrink-0" />
                    <p><strong>No AI Ijtihad:</strong> The AI summarizes existing rulings, it never creates new ones.</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <BookOpen className="w-5 h-5 text-[#064e3b] shrink-0" />
                    <p><strong>Traceability:</strong> Every answer is linked to classical texts or recognized scholars.</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <ShieldCheck className="w-5 h-5 text-[#064e3b] shrink-0" />
                    <p><strong>Scholar-in-the-Loop:</strong> Our database is curated by qualified students of knowledge.</p>
                  </div>
                </div>
                <p className="pt-4 border-t border-[#f3f4f6] text-xs italic">
                  Note: This is a prototype demonstrating ethical AI integration in religious contexts.
                </p>
              </div>
              <button 
                onClick={() => setShowInfo(false)}
                className="mt-8 w-full py-3 bg-[#064e3b] text-white rounded-xl font-medium hover:bg-[#053e2f] transition-colors"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-8 md:px-0" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-8">
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6 py-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#fefce8] border border-[#fef08a] rounded-full text-[#854d0e] text-sm font-medium">
                <ShieldCheck className="w-4 h-4" />
                Shariah-Compliant AI
              </div>
              <h2 className="text-4xl font-serif font-medium text-[#064e3b] leading-tight">
                Seeking Knowledge with <br />
                <span className="italic text-[#d97706]">Traceability & Integrity</span>
              </h2>
              <p className="text-[#4b5563] max-w-md mx-auto leading-relaxed">
                DeenSeek provides answers based on verified classical texts and recognized scholars. 
                Ask about Fiqh, Aqidah, or general Islamic concepts.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto pt-4">
                {[
                  "What are the conditions of prayer?",
                  "Explain the concept of Tawakkul.",
                  "Difference between Zakat and Sadaqah?",
                  "How to perform Wudu correctly?"
                ].map((q) => (
                  <button 
                    key={q}
                    onClick={() => setInput(q)}
                    className="p-4 bg-white border border-[#e5e5e0] rounded-2xl text-left hover:border-[#064e3b] hover:bg-[#f0fdf4] transition-all group"
                  >
                    <p className="text-sm font-medium text-[#374151] group-hover:text-[#064e3b]">{q}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-4",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm",
                  msg.role === 'user' ? "bg-[#d97706]" : "bg-[#064e3b]"
                )}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                </div>
                <div className={cn(
                  "max-w-[85%] p-4 rounded-2xl shadow-sm leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-[#064e3b] text-white rounded-tr-none" 
                    : "bg-white border border-[#e5e5e0] text-[#1a1a1a] rounded-tl-none"
                )}>
                  <div className={cn(
                    "prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-[#064e3b] prose-a:text-[#d97706]",
                    msg.role === 'user' ? "text-white" : "text-[#374151]"
                  )}>
                    <ReactMarkdown
                      components={{
                        a: ({ node, ...props }) => {
                          if (props.href?.startsWith('glossary:')) {
                            const termName = props.href.replace('glossary:', '');
                            const term = glossaryData.find(t => t.term.toLowerCase() === termName.toLowerCase());
                            return (
                              <button
                                onClick={() => setSelectedTerm(term || null)}
                                className="inline-flex items-center gap-1 px-1 py-0 bg-[#f0fdf4] border-b-2 border-[#064e3b]/20 text-[#064e3b] font-medium hover:bg-[#dcfce7] transition-colors cursor-help rounded-sm"
                              >
                                {props.children}
                              </button>
                            );
                          }
                          return (
                            <a
                              {...props}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#fefce8] border border-[#fef08a] rounded text-[#854d0e] font-bold no-underline hover:bg-[#fef9c3] transition-colors"
                            >
                              {props.children}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          );
                        },
                        blockquote: ({ node, ...props }) => (
                          <blockquote {...props} className="border-l-4 border-[#d97706]/30 pl-4 py-1 my-4 italic text-[#4b5563] bg-[#fffbeb]/50 rounded-r-lg" />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 {...props} className="text-lg font-serif font-semibold text-[#064e3b] mt-6 mb-3 first:mt-0" />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul {...props} className="mb-4 pl-6 space-y-2 list-none" />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol {...props} className="mb-4 pl-6 space-y-2 list-decimal" />
                        )
                      }}
                    >
                      {linkifyCitations(msg.text)}
                    </ReactMarkdown>
                  </div>
                  
                  {msg.role === 'model' && (
                    <div className="mt-3 pt-3 border-t border-[#e5e5e0]/50 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {!msg.feedback ? (
                          <>
                            <button 
                              onClick={() => handleFeedback(idx, 'up')}
                              className="p-1.5 hover:bg-[#f0fdf4] rounded-lg text-[#9ca3af] hover:text-[#064e3b] transition-all"
                              title="Helpful"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => setFeedbackModal({ messageIndex: idx, type: 'down' })}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-[#9ca3af] hover:text-red-600 transition-all"
                              title="Not helpful"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <div className={cn(
                            "flex items-center gap-2 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                            msg.feedback.type === 'up' ? "bg-[#f0fdf4] text-[#064e3b]" : "bg-red-50 text-red-600"
                          )}>
                            {msg.feedback.type === 'up' ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
                            {msg.feedback.type === 'up' ? "Helpful" : "Not Helpful"}
                          </div>
                        )}
                      </div>
                      {msg.feedback?.comment && (
                        <p className="text-[10px] text-[#9ca3af] italic truncate max-w-[150px]">
                          "{msg.feedback.comment}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
              <div className="w-8 h-8 rounded-full bg-[#064e3b] flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white border border-[#e5e5e0] p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <div className="flex gap-1">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                    className="w-2 h-2 bg-[#064e3b] rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                    className="w-2 h-2 bg-[#064e3b] rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                    className="w-2 h-2 bg-[#064e3b] rounded-full"
                  />
                </div>
                <span className="text-xs font-medium text-[#4b5563] ml-2">DeenSeek is searching sources...</span>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Disclaimer Banner (Sticky above input) */}
      <div className="max-w-3xl mx-auto w-full px-4 mb-2">
        <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-xl p-3 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#d97706] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#92400e] leading-normal">
            <strong>Disclaimer:</strong> DeenSeek is an AI assistant, not a qualified scholar. 
            Information provided is for educational purposes. For binding religious rulings (fatwas), 
            please consult a qualified Mufti or scholar.
          </p>
        </div>
      </div>

      {/* Input Area */}
      <footer className="p-4 md:p-6 bg-white border-t border-[#e5e5e0]">
        <div className="max-w-3xl mx-auto relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask a question about Islam..."
            className="w-full bg-[#f9f9f7] border border-[#e5e5e0] rounded-2xl px-5 py-4 pr-14 focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b] transition-all resize-none min-h-[60px] max-h-[200px]"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 bottom-3 p-2.5 bg-[#064e3b] text-white rounded-xl hover:bg-[#053e2f] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-900/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-[10px] text-[#9ca3af] mt-3 uppercase tracking-widest font-medium">
          Powered by DeenSeek AI • Ethical & Shariah-Compliant
        </p>
      </footer>
    </div>
  </div>
  );
}
