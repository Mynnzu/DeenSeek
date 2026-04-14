export interface GlossaryTerm {
  term: string;
  definition: string;
  category: 'Fiqh' | 'Aqidah' | 'Hadith' | 'General';
}

export const glossaryData: GlossaryTerm[] = [
  {
    term: "Fiqh",
    definition: "Islamic jurisprudence; the human understanding and application of Shariah (divine law) derived from the Quran and Sunnah.",
    category: "Fiqh"
  },
  {
    term: "Aqidah",
    definition: "Islamic creed or theology; the core beliefs that a Muslim must hold firmly.",
    category: "Aqidah"
  },
  {
    term: "Hadith",
    definition: "A record of the words, actions, or silent approval of the Prophet Muhammad (peace be upon him).",
    category: "Hadith"
  },
  {
    term: "Sunnah",
    definition: "The traditions and practices of the Prophet Muhammad (peace be upon him) that serve as a model for Muslims.",
    category: "General"
  },
  {
    term: "Ijma",
    definition: "Scholarly consensus; the unanimous agreement of Muslim scholars on a particular issue in a specific era.",
    category: "Fiqh"
  },
  {
    term: "Qiyas",
    definition: "Analogical reasoning; the process of legal deduction where a new case is decided based on its similarity to an existing case in the Quran or Sunnah.",
    category: "Fiqh"
  },
  {
    term: "Tawhid",
    definition: "The oneness and uniqueness of Allah; the central concept of monotheism in Islam.",
    category: "Aqidah"
  },
  {
    term: "Shirk",
    definition: "Associating partners with Allah; the opposite of Tawhid and considered the gravest sin in Islam.",
    category: "Aqidah"
  },
  {
    term: "Sahih",
    definition: "Authentic; a classification of Hadith that meets the highest standards of reliability in its chain of narration and text.",
    category: "Hadith"
  },
  {
    term: "Da'if",
    definition: "Weak; a classification of Hadith that does not meet the requirements for authenticity due to flaws in its chain or text.",
    category: "Hadith"
  },
  {
    term: "Wajib",
    definition: "Obligatory; an act that a Muslim is commanded to perform, the neglect of which is sinful.",
    category: "Fiqh"
  },
  {
    term: "Haram",
    definition: "Prohibited; an act that is strictly forbidden in Islam.",
    category: "Fiqh"
  },
  {
    term: "Halal",
    definition: "Permissible; an act or item that is allowed under Islamic law.",
    category: "Fiqh"
  },
  {
    term: "Makruh",
    definition: "Disliked; an act that is discouraged but not strictly forbidden or sinful.",
    category: "Fiqh"
  },
  {
    term: "Mustahabb",
    definition: "Recommended; an act that is encouraged and rewarded but not obligatory.",
    category: "Fiqh"
  },
  {
    term: "Ijtihad",
    definition: "Independent legal reasoning; the process by which a qualified scholar (Mujtahid) derives legal rulings from primary sources.",
    category: "Fiqh"
  },
  {
    term: "Fatwa",
    definition: "A non-binding legal opinion or ruling given by a qualified scholar (Mufti) on a point of Islamic law.",
    category: "Fiqh"
  },
  {
    term: "Madhhab",
    definition: "A school of thought within Islamic jurisprudence (e.g., Hanafi, Maliki, Shafi'i, Hanbali).",
    category: "Fiqh"
  },
  {
    term: "Isnad",
    definition: "The chain of narrators for a specific Hadith, used to verify its authenticity.",
    category: "Hadith"
  },
  {
    term: "Matn",
    definition: "The actual text or content of a Hadith.",
    category: "Hadith"
  }
];
