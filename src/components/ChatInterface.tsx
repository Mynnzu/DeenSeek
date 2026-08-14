import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User as UserIcon, Bot, Info, ShieldCheck, BookOpen, AlertTriangle, Download, Trash2, Menu, X, MessageSquare, Plus, ExternalLink, Search, Book, ThumbsUp, ThumbsDown, Archive, RotateCcw, Clock, Sparkles, Eye, EyeOff, LogIn, LogOut, Cloud, CloudOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/src/lib/utils';
import { chatWithDeenSeek, Message, generateChatTitle, generateTermRelevance } from '@/src/services/geminiService';
import { glossaryData, GlossaryTerm } from '@/src/constants/glossaryData';
import { PrayerTimesCard } from './PrayerTimes';
import { CitationBadge } from './CitationBadge';
import { CitationModal } from './CitationModal';
import { CitationInfo } from '../constants/citationData';
import { AuthModal } from './AuthModal';
import { 
  auth, 
  firebaseSignOut, 
  onAuthStateChanged, 
  User, 
  saveChatSession, 
  saveChatMessage, 
  deleteChatSession, 
  subscribeToUserSessions, 
  subscribeToSessionMessages 
} from '../lib/firebase';

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
  isArchived?: boolean;
}

const linkifyCitations = (text: string | undefined, dynamicTerms?: GlossaryTerm[]) => {
  if (!text) return '';
  
  // 1. Quran citations: [Quran 2:183], [Quran Surah:Ayah], [Quran 2:183-185]
  let processed = text.replace(/\[Quran\s+(\d+):(\d+)(?:-(\d+))?\]/gi, (match, surah, ayah, endAyah) => {
    const ref = endAyah ? `${surah}:${ayah}-${endAyah}` : `${surah}:${ayah}`;
    const url = `https://quran.com/${surah}/${ayah}`;
    const cleanLabel = match.replace(/^\[|\]$/g, '');
    return `[${cleanLabel}](cite:quran:${ref}|${url})`;
  });

  // 2. Hadith collections: [Bukhari 1], [Muslim 123], [Tirmidhi 2606], [Abu Dawud 456], etc.
  const collections = [
    'Bukhari', 'Muslim', 'Tirmidhi', 'Abu Dawud', 'Abu Dawood', 'Nasai', "Nasa'i",
    'Ibn Majah', 'Muwatta', 'Riyad as-Salihin'
  ];
  const hadithRegex = new RegExp(`\\[(${collections.join('|')})\\s+(\\d+)\\]`, 'gi');

  processed = processed.replace(hadithRegex, (match, collection, num) => {
    let key = collection.toLowerCase().replace(/['\s]/g, '');
    if (key === 'abudawood') key = 'abudawud';
    if (key === 'nasai') key = 'nasai';
    const url = `https://sunnah.com/${key}:${num}`;
    const cleanLabel = match.replace(/^\[|\]$/g, '');
    return `[${cleanLabel}](cite:hadith:${collection}:${num}|${url})`;
  });

  // Glossary Terms: Find terms and wrap them in glossary links
  const allTerms = [...glossaryData, ...(dynamicTerms || [])];
  // Sort terms by length descending to avoid partial matches
  const sortedTerms = [...allTerms].sort((a, b) => b.term.length - a.term.length);
  
  // Build dynamic patterns that match optional plurals (s/es) for each term
  const escapedTerms = sortedTerms.map(t => {
    const escaped = t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // If it ends with a word character, support optional plural forms like 's' or 'es'
    if (/\w$/.test(escaped)) {
      return `${escaped}(?:s|es)?`;
    }
    return escaped;
  });
  
  if (escapedTerms.length === 0) return processed;

  // Combined pattern: match existing markdown links, or glossary terms
  const linkPattern = '(\\[[^\\]]*\\]\\([^)]*\\))';
  const termPattern = `\\b(${escapedTerms.join('|')})\\b`;
  const combinedRegex = new RegExp(`${linkPattern}|${termPattern}`, 'gi');

  processed = processed.replace(combinedRegex, (match, link, term) => {
    if (link) return link; 
    // Find the original term by prefix matching (since matched term might have 's' or 'es' at the end)
    const termObj = sortedTerms.find(t => 
      term.toLowerCase() === t.term.toLowerCase() ||
      term.toLowerCase().startsWith(t.term.toLowerCase())
    );
    return `[${term}](glossary:${encodeURIComponent(termObj?.term || term)})`;
  });

  return processed;
};

export default function ChatInterface() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [dynamicGlossary, setDynamicGlossary] = useState<GlossaryTerm[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  // Auth and Firestore state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isSyncing, setIsSyncing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Sync sessions with Firestore or localStorage based on Auth status
  useEffect(() => {
    const savedGlossary = localStorage.getItem('deenseek_dynamic_glossary');
    if (savedGlossary) {
      try {
        setDynamicGlossary(JSON.parse(savedGlossary));
      } catch (e) {
        console.error("Failed to parse dynamic glossary", e);
      }
    }

    if (!currentUser) {
      const savedSessions = localStorage.getItem('deenseek_sessions');
      if (savedSessions) {
        try {
          setSessions(JSON.parse(savedSessions));
        } catch (e) {
          console.error("Failed to parse local sessions", e);
        }
      }
      return;
    }

    setIsSyncing(true);
    const unsubscribe = subscribeToUserSessions(currentUser.uid, (storedSessions) => {
      setSessions(prev => {
        return storedSessions.map(st => {
          const existing = prev.find(p => p.id === st.id);
          return {
            id: st.id,
            title: st.title,
            messages: existing ? existing.messages : [],
            timestamp: st.createdAt,
            isArchived: existing?.isArchived || false
          };
        });
      });
      setIsSyncing(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Save sessions and dynamic glossary to localStorage whenever they change (for offline/guest)
  useEffect(() => {
    if (!currentUser) {
      localStorage.setItem('deenseek_sessions', JSON.stringify(sessions));
    }
  }, [sessions, currentUser]);

  useEffect(() => {
    localStorage.setItem('deenseek_dynamic_glossary', JSON.stringify(dynamicGlossary));
  }, [dynamicGlossary]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setIsSidebarOpen(false);
    setSuggestions([]);
  };

  const selectSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setIsSidebarOpen(false);
    setSuggestions([]);

    if (currentUser) {
      // Subscribe to messages in Firestore for this session
      subscribeToSessionMessages(currentUser.uid, session.id, (msgs) => {
        const formattedMsgs: Message[] = msgs.map(m => ({
          role: (m.role === 'assistant' || (m.role as string) === 'model') ? 'model' : 'user',
          text: m.content
        }));
        setMessages(formattedMsgs);
        setSessions(prev => prev.map(s => s.id === session.id ? { ...s, messages: formattedMsgs } : s));
      });
    } else {
      setMessages(session.messages);
    }
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentUser) {
      await deleteChatSession(currentUser.uid, id);
    }
    if (currentSessionId === id) {
      startNewChat();
    }
  };

  const toggleArchiveSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => prev.map(s => 
      s.id === id ? { ...s, isArchived: !s.isArchived } : s
    ));
    
    // If we're archiving the current session, start a new chat or deselect
    const sessionToToggle = sessions.find(s => s.id === id);
    if (!sessionToToggle?.isArchived && currentSessionId === id) {
      startNewChat();
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: textToSend };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setSuggestions([]);

    const response = await chatWithDeenSeek(messages, textToSend);
    const { cleanText, suggestions: newSuggestions, terms: newTerms } = extractSuggestions(response);
    
    if (newTerms.length > 0) {
      setDynamicGlossary(prev => {
        const existingTerms = new Set([...glossaryData, ...prev].map(t => t.term.toLowerCase()));
        const uniqueNewTerms = newTerms.filter(t => !existingTerms.has(t.term.toLowerCase()));
        return [...prev, ...uniqueNewTerms];
      });
    }

    const aiMessage: Message = { role: 'model', text: cleanText };
    const finalMessages = [...newMessages, aiMessage];
    
    setMessages(finalMessages);
    setSuggestions(newSuggestions);
    setIsLoading(false);

    // Session Title
    const activeSession = sessions.find(s => s.id === currentSessionId);
    let sessionTitle = activeSession?.title || textToSend.slice(0, 30) + (textToSend.length > 30 ? '...' : '');

    // Update or create session locally and in Firestore
    if (currentSessionId) {
      setSessions(prev => {
        const updatedSessions = prev.map(s => 
          s.id === currentSessionId 
            ? { ...s, messages: finalMessages, timestamp: Date.now() } 
            : s
        );

        if (activeSession && activeSession.messages.filter(m => m.role === 'user').length === 1) {
          generateChatTitle(finalMessages).then(async newTitle => {
            setSessions(latest => latest.map(ls => 
              ls.id === currentSessionId ? { ...ls, title: newTitle } : ls
            ));
            if (currentUser) {
              await saveChatSession(currentUser.uid, {
                id: currentSessionId,
                title: newTitle,
                createdAt: activeSession.timestamp
              });
            }
          });
        }
        
        return updatedSessions;
      });

      if (currentUser) {
        await saveChatSession(currentUser.uid, {
          id: currentSessionId,
          title: sessionTitle,
          createdAt: activeSession?.timestamp || Date.now()
        });

        // Save last user and assistant messages
        await saveChatMessage(currentUser.uid, currentSessionId, {
          id: Date.now().toString() + '-user',
          role: 'user',
          content: textToSend,
          timestamp: Date.now() - 1000
        });

        await saveChatMessage(currentUser.uid, currentSessionId, {
          id: Date.now().toString() + '-ai',
          role: 'assistant',
          content: cleanText,
          timestamp: Date.now()
        });
      }
    } else {
      const newId = Date.now().toString();
      const newSession: ChatSession = {
        id: newId,
        title: sessionTitle,
        messages: finalMessages,
        timestamp: Date.now(),
        isArchived: false
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newId);

      if (currentUser) {
        await saveChatSession(currentUser.uid, {
          id: newId,
          title: sessionTitle,
          createdAt: newSession.timestamp
        });

        await saveChatMessage(currentUser.uid, newId, {
          id: Date.now().toString() + '-user',
          role: 'user',
          content: textToSend,
          timestamp: Date.now() - 1000
        });

        await saveChatMessage(currentUser.uid, newId, {
          id: Date.now().toString() + '-ai',
          role: 'assistant',
          content: cleanText,
          timestamp: Date.now()
        });
      }

      // Generate title asynchronously after the first AI response
      generateChatTitle(finalMessages).then(async newTitle => {
        setSessions(prev => prev.map(s => 
          s.id === newId ? { ...s, title: newTitle } : s
        ));

        if (currentUser) {
          await saveChatSession(currentUser.uid, {
            id: newId,
            title: newTitle,
            createdAt: newSession.timestamp
          });
        }
      });
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
  const [selectedCitation, setSelectedCitation] = useState<CitationInfo | null>(null);
  const [termRelevance, setTermRelevance] = useState<string | null>(null);
  const [isRelevanceLoading, setIsRelevanceLoading] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{
    messageIndex: number;
    type: 'up' | 'down';
  } | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const isApiKeyMissing = !process.env.GEMINI_API_KEY;

  const extractSuggestions = (text: string) => {
    // Extract related questions
    const relatedMatch = text.match(/<related>([\s\S]*?)<\/related>/);
    let questions: string[] = [];
    if (relatedMatch) {
      questions = relatedMatch[1]
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }
    
    // Extract dynamic glossary terms
    const termRegex = /<term>(.*?)<\/term>/g;
    const terms: GlossaryTerm[] = [];
    let match;
    while ((match = termRegex.exec(text)) !== null) {
      const parts = match[1].split('|');
      if (parts.length >= 2) {
        terms.push({
          term: parts[0].trim(),
          definition: parts[1].trim(),
          category: (parts[2]?.trim() as any) || 'General'
        });
      }
    }
      
    const cleanText = text
      .replace(/<related>[\s\S]*?<\/related>/, '')
      .replace(/<term>[\s\S]*?<\/term>/g, '')
      .trim();

    return { cleanText, suggestions: questions, terms };
  };

  useEffect(() => {
    if (selectedTerm && messages.length > 0) {
      setIsRelevanceLoading(true);
      setTermRelevance(null);
      generateTermRelevance(selectedTerm.term, selectedTerm.definition, messages)
        .then(relevance => {
          setTermRelevance(relevance);
          setIsRelevanceLoading(false);
        })
        .catch(() => {
          setTermRelevance("Unable to determine contextual relevance.");
          setIsRelevanceLoading(false);
        });
    } else {
      setTermRelevance(null);
      setIsRelevanceLoading(false);
    }
  }, [selectedTerm, messages]);

  const allGlossaryTerms = [...glossaryData, ...dynamicGlossary];

  const filteredGlossary = allGlossaryTerms.filter(item => 
    item.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
    item.definition.toLowerCase().includes(glossarySearch.toLowerCase())
  );

  const renderInspectorContent = (term: GlossaryTerm) => {
    // Find related terms from the same category (excluding current term)
    const relatedTerms = allGlossaryTerms
      .filter(t => t.category === term.category && t.term.toLowerCase() !== term.term.toLowerCase())
      .slice(0, 3);

    return (
      <div className="flex flex-col h-full bg-white text-[#1a1a1a]">
        <div className="p-5 border-b border-[#e5e5e0] flex items-center justify-between bg-[#fdfcf7]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#064e3b]" />
            <span className="font-serif font-bold text-[#064e3b] text-base">Term Inspector</span>
          </div>
          <button 
            onClick={() => setSelectedTerm(null)} 
            className="p-1.5 hover:bg-[#f5f5f0] rounded-full text-[#4b5563] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-serif font-bold text-[#064e3b] tracking-tight">{term.term}</h2>
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#d97706] bg-[#fffbeb] border border-[#fef08a] px-2 py-0.5 rounded">
                {term.category}
              </span>
            </div>
            <p className="text-sm text-[#4b5563] leading-relaxed bg-[#fdfcf7] p-4 rounded-xl border border-[#e5e5e0] font-medium">
              {term.definition}
            </p>
          </div>

          {(isRelevanceLoading || termRelevance) && (
            <div className="space-y-2">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-[#d97706] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#d97706]" />
                Contextual Relevance
              </h3>
              {isRelevanceLoading ? (
                <div className="flex items-center gap-2 bg-[#fffbeb]/40 p-3 rounded-xl border border-[#fef08a]/50">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-[#d97706] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-[#d97706] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-[#d97706] rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-[11px] text-[#92400e]">Analyzing conversation...</span>
                </div>
              ) : (
                <div className="bg-[#fffbeb] p-3.5 rounded-xl border border-[#fef08a] shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-200/10 rounded-full blur-xl -z-10"></div>
                  <p className="text-xs text-[#374151] italic leading-relaxed">
                    {termRelevance}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Actions</h3>
            <button
              onClick={() => {
                const prompt = `Can you explain the Islamic concept of "${term.term}" in more detail, especially regarding its practical application?`;
                handleSend(prompt);
                // On mobile, close it so the user sees the chat
                if (window.innerWidth < 1280) {
                  setSelectedTerm(null);
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#064e3b] hover:bg-[#053e2f] text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-emerald-900/10 hover:shadow-emerald-900/20"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Ask DeenSeek about {term.term}
            </button>
          </div>

          {relatedTerms.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Related {term.category} Terms</h3>
              <div className="grid grid-cols-1 gap-1.5">
                {relatedTerms.map(rt => (
                  <button
                    key={rt.term}
                    onClick={() => setSelectedTerm(rt)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-[#e5e5e0] hover:border-[#064e3b] hover:bg-[#f0fdf4] transition-all text-left"
                  >
                    <div className="truncate flex-1 mr-2">
                      <p className="text-xs font-bold text-[#064e3b]">{rt.term}</p>
                      <p className="text-[10px] text-[#9ca3af] truncate">{rt.definition}</p>
                    </div>
                    <BookOpen className="w-3.5 h-3.5 text-[#064e3b] opacity-40 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#fdfcf7] text-[#1a1a1a] font-sans overflow-hidden">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && !isFocusMode && (
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
        animate={{ x: (isSidebarOpen && !isFocusMode) ? 0 : -320 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "fixed inset-y-0 left-0 w-80 bg-white border-r border-[#e5e5e0] z-50 flex flex-col lg:relative lg:translate-x-0",
          (!isSidebarOpen || isFocusMode) && "lg:hidden lg:w-0 lg:border-none lg:overflow-hidden"
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

        <div className="p-4 flex gap-2">
          <button 
            onClick={startNewChat}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#064e3b] text-white rounded-xl hover:bg-[#053e2f] transition-all shadow-md shadow-emerald-900/10"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium text-sm">New</span>
          </button>
          <button 
            onClick={() => setShowArchived(!showArchived)}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all border",
              showArchived 
                ? "bg-[#d97706] border-[#d97706] text-white" 
                : "bg-white border-[#e5e5e0] text-[#064e3b] hover:bg-[#f9f9f7]"
            )}
            title={showArchived ? "View Active Chats" : "View Archived Chats"}
          >
            {showArchived ? <RotateCcw className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
          </button>
        </div>

        <div className="px-4 mb-4">
          <PrayerTimesCard />
        </div>

        <div className="px-6 py-2">
          <h2 className="text-[10px] uppercase tracking-widest font-bold text-[#9ca3af]">
            {showArchived ? "Archived Conversations" : "Recent Conversations"}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sessions.filter(s => !!s.isArchived === showArchived).length === 0 ? (
            <div className="text-center py-12 px-4">
              {showArchived ? (
                <Archive className="w-12 h-12 text-[#e5e5e0] mx-auto mb-4" />
              ) : (
                <MessageSquare className="w-12 h-12 text-[#e5e5e0] mx-auto mb-4" />
              )}
              <p className="text-sm text-[#9ca3af]">
                {showArchived ? "No archived chats." : "No previous conversations yet."}
              </p>
            </div>
          ) : (
            sessions.filter(s => !!s.isArchived === showArchived).map(session => (
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
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={(e) => toggleArchiveSession(e, session.id)}
                    className="p-1 hover:text-[#064e3b] transition-all"
                    title={session.isArchived ? "Unarchive" : "Archive"}
                  >
                    {session.isArchived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                  </button>
                  <button 
                    onClick={(e) => deleteSession(e, session.id)}
                    className="p-1 hover:text-red-600 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-[#e5e5e0] bg-[#fdfcf7] space-y-3">
          {currentUser ? (
            <div className="p-3 bg-white border border-[#e5e5e0] rounded-2xl shadow-xs space-y-2.5">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt={currentUser.displayName || 'User'} className="w-9 h-9 rounded-full object-cover border border-[#e5e5e0]" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#064e3b] text-white flex items-center justify-center font-bold text-sm">
                    {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#064e3b] truncate">
                    {currentUser.displayName || 'User'}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate">
                    {currentUser.email}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                <span className="flex items-center gap-1 font-semibold">
                  <Cloud className="w-3 h-3" /> Cloud Synced
                </span>
                {isSyncing && <span className="animate-pulse">Syncing...</span>}
              </div>

              <button
                onClick={() => firebaseSignOut(auth)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium border border-transparent hover:border-red-100"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="p-3 bg-gradient-to-b from-[#f0fdf4] to-white border border-[#dcfce7] rounded-2xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#064e3b]">
                <Cloud className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Save Chat History</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-snug">
                Sign in with Google to keep your Islamic chat history saved safely in the cloud.
              </p>
              <button
                onClick={() => {
                  setAuthModalMode('signin');
                  setIsAuthModalOpen(true);
                }}
                className="w-full mt-1 flex items-center justify-center gap-2 py-2 bg-[#064e3b] hover:bg-[#053e2f] text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-emerald-900/10"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            </div>
          )}

          <p className="text-[10px] text-[#9ca3af] uppercase tracking-widest font-bold text-center pt-1">
            DeenSeek AI v1.0
          </p>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b border-[#e5e5e0] bg-white/80 backdrop-blur-md sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isFocusMode && (
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-[#f5f5f0] rounded-full transition-colors text-[#064e3b]"
                title="Toggle Sidebar"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#064e3b] rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/10">
                <BookOpen className="text-[#fefce8] w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight text-[#064e3b]">DeenSeek</h1>
                  {isFocusMode && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-[#064e3b]/10 text-[#064e3b] px-2 py-0.5 rounded-full">
                      Focus Reading
                    </span>
                  )}
                </div>
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
              onClick={() => setIsFocusMode(!isFocusMode)}
              title={isFocusMode ? "Exit Focus Reading" : "Focus Reading Mode"}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border shadow-sm",
                isFocusMode
                  ? "bg-[#064e3b] text-white border-[#064e3b] hover:bg-[#053e2f] shadow-emerald-900/20"
                  : "bg-[#f5f5f0] text-[#064e3b] border-[#e5e5e0] hover:bg-[#e8e8e2]"
              )}
            >
              {isFocusMode ? <EyeOff className="w-4 h-4 text-amber-300" /> : <Eye className="w-4 h-4 text-[#064e3b]" />}
              <span className="hidden sm:inline">{isFocusMode ? "Exit Focus" : "Focus Reading"}</span>
            </button>
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

            {/* Account Sign In / User Profile Button */}
            {currentUser ? (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex items-center gap-2 p-1.5 pl-2 pr-3 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-full transition-all text-[#064e3b]"
                title={`Signed in as ${currentUser.displayName || currentUser.email}`}
              >
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#064e3b] text-white flex items-center justify-center font-bold text-xs">
                    {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold max-w-[100px] truncate hidden sm:inline">
                  {currentUser.displayName || 'Account'}
                </span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthModalMode('signin');
                  setIsAuthModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#064e3b] hover:bg-[#053e2f] text-white rounded-full text-xs font-semibold transition-all shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
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
                    <button 
                      key={item.term}
                      onClick={() => setSelectedTerm(item)}
                      className="w-full text-left p-4 rounded-2xl border border-[#e5e5e0] hover:border-[#064e3b] hover:bg-[#f0fdf4] transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-[#064e3b]">{item.term}</h4>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-[#d97706] bg-[#fffbeb] px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-sm text-[#4b5563] leading-relaxed line-clamp-2">{item.definition}</p>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Responsive Overlay Drawer/Modal (Mobile & Tablet) */}
      <AnimatePresence>
        {selectedTerm && (
          <div className="xl:hidden fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-[2px]">
            {/* Backdrop click */}
            <div className="absolute inset-0" onClick={() => setSelectedTerm(null)} />
            
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#e5e5e0] overflow-hidden max-h-[85vh] sm:max-h-[80vh] flex flex-col z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {renderInspectorContent(selectedTerm)}
            </motion.div>
          </div>
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
          {isFocusMode && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-3.5 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-[#064e3b]">
                <Eye className="w-4 h-4 text-[#064e3b]" />
                <span><strong>Focus Reading Mode</strong> — Distraction-free view of conversation thread</span>
              </div>
              <button
                onClick={() => setIsFocusMode(false)}
                className="text-xs font-bold text-[#064e3b] hover:underline flex items-center gap-1"
              >
                <EyeOff className="w-3.5 h-3.5" />
                Exit
              </button>
            </motion.div>
          )}

          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6 py-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#fefce8] border border-[#fef08a] rounded-full text-[#854d0e] text-sm font-medium">
                <UserIcon className="w-4 h-4" />
                As-salamu alaykum{currentUser?.displayName ? `, ${currentUser.displayName}` : ''}
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
                    onClick={() => handleSend(q)}
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
                  {msg.role === 'user' ? <UserIcon className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
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
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ node, ...props }) => {
                          const href = props.href || '';
                          const isGlossary = href.startsWith('glossary:');
                          const isCitation = href.startsWith('cite:');

                          if (isCitation) {
                            return (
                              <CitationBadge
                                citationKey={href}
                                label={props.children}
                                onSelect={(citation) => setSelectedCitation(citation)}
                              />
                            );
                          }

                          if (isGlossary || !href.startsWith('http')) {
                            const termName = isGlossary 
                              ? decodeURIComponent(href.replace('glossary:', ''))
                              : href;
                              
                            const term = allGlossaryTerms.find(t => 
                              t.term.toLowerCase() === termName.toLowerCase() ||
                              t.term.toLowerCase() === decodeURIComponent(termName).toLowerCase()
                            );

                            return (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedTerm(term || null);
                                }}
                                className="inline-flex items-center gap-1 px-1 py-0 bg-[#f0fdf4] border-b-2 border-[#064e3b]/20 text-[#064e3b] font-medium hover:bg-[#dcfce7] transition-colors cursor-help rounded-sm"
                              >
                                {props.children}
                                <BookOpen className="w-3 h-3 opacity-50" />
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
                      {linkifyCitations(msg.text, dynamicGlossary)}
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

          {suggestions.length > 0 && !isLoading && !isFocusMode && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-2 justify-start ml-12"
            >
              {suggestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="px-4 py-2 bg-white border border-[#e5e5e0] rounded-full text-xs font-medium text-[#064e3b] hover:border-[#064e3b] hover:bg-[#f0fdf4] transition-all shadow-sm"
                >
                  {q}
                </button>
              ))}
            </motion.div>
          )}

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

          {isFocusMode && messages.length > 0 && (
            <div className="pt-6 pb-10 text-center">
              <button
                onClick={() => setIsFocusMode(false)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#064e3b] text-white text-xs font-medium rounded-full hover:bg-[#053e2f] transition-all shadow-md shadow-emerald-900/10"
              >
                <EyeOff className="w-4 h-4 text-amber-300" />
                Exit Focus Reading & Return to Chat
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Disclaimer Banner (Sticky above input) */}
      {!isFocusMode && (
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
      )}

      {/* Input Area */}
      {!isFocusMode && (
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
              onClick={() => handleSend()}
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
      )}
    </div>

    {/* Right Side Glossary Term Inspector (Desktop) */}
    <AnimatePresence>
      {selectedTerm && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 380, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="hidden xl:flex bg-white border-l border-[#e5e5e0] flex-col z-30 shadow-xl overflow-hidden shrink-0 h-full"
        >
          <div className="w-[380px] h-full flex flex-col">
            {renderInspectorContent(selectedTerm)}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Citation Details & Source Inspector Modal */}
    <CitationModal
      citation={selectedCitation}
      onClose={() => setSelectedCitation(null)}
      onAskAI={(prompt) => handleSend(prompt)}
    />

    {/* Firebase Auth Modal */}
    <AuthModal
      isOpen={isAuthModalOpen}
      onClose={() => setIsAuthModalOpen(false)}
      initialMode={authModalMode}
    />
  </div>
  );
}
