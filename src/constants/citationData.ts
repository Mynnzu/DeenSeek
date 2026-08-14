export interface CitationInfo {
  type: 'quran' | 'hadith' | 'general';
  title: string;
  subtitle: string;
  collectionOrSurah: string;
  referenceNumber: string;
  authenticity: string;
  authenticityGrade: 'divine' | 'sahih' | 'hasan' | 'scholarly';
  compilerOrContext: string;
  excerpt?: string;
  arabicExcerpt?: string;
  scholarlyNotes?: string;
  url: string;
}

export const QURAN_SURAHS: Record<number, { name: string; englishName: string; type: 'Meccan' | 'Medinan'; verses: number }> = {
  1: { name: 'Al-Fatiha', englishName: 'The Opening', type: 'Meccan', verses: 7 },
  2: { name: 'Al-Baqarah', englishName: 'The Cow', type: 'Medinan', verses: 286 },
  3: { name: 'Ali \'Imran', englishName: 'Family of Imran', type: 'Medinan', verses: 200 },
  4: { name: 'An-Nisa', englishName: 'The Women', type: 'Medinan', verses: 176 },
  5: { name: 'Al-Ma\'idah', englishName: 'The Table Spread', type: 'Medinan', verses: 120 },
  6: { name: 'Al-An\'am', englishName: 'The Cattle', type: 'Meccan', verses: 165 },
  7: { name: 'Al-A\'raf', englishName: 'The Heights', type: 'Meccan', verses: 206 },
  8: { name: 'Al-Anfal', englishName: 'The Spoils of War', type: 'Medinan', verses: 75 },
  9: { name: 'At-Tawbah', englishName: 'The Repentance', type: 'Medinan', verses: 129 },
  10: { name: 'Yunus', englishName: 'Jonah', type: 'Meccan', verses: 109 },
  11: { name: 'Hud', englishName: 'Hud', type: 'Meccan', verses: 123 },
  12: { name: 'Yusuf', englishName: 'Joseph', type: 'Meccan', verses: 111 },
  13: { name: 'Ar-Ra\'d', englishName: 'The Thunder', type: 'Medinan', verses: 43 },
  14: { name: 'Ibrahim', englishName: 'Abraham', type: 'Meccan', verses: 52 },
  15: { name: 'Al-Hijr', englishName: 'The Rocky Tract', type: 'Meccan', verses: 99 },
  16: { name: 'An-Nahl', englishName: 'The Bee', type: 'Meccan', verses: 128 },
  17: { name: 'Al-Isra', englishName: 'The Night Journey', type: 'Meccan', verses: 111 },
  18: { name: 'Al-Kahf', englishName: 'The Cave', type: 'Meccan', verses: 110 },
  19: { name: 'Maryam', englishName: 'Mary', type: 'Meccan', verses: 98 },
  20: { name: 'Taha', englishName: 'Ta-Ha', type: 'Meccan', verses: 135 },
  21: { name: 'Al-Anbiya', englishName: 'The Prophets', type: 'Meccan', verses: 112 },
  22: { name: 'Al-Hajj', englishName: 'The Pilgrimage', type: 'Medinan', verses: 78 },
  23: { name: 'Al-Mu\'minun', englishName: 'The Believers', type: 'Meccan', verses: 118 },
  24: { name: 'An-Nur', englishName: 'The Light', type: 'Medinan', verses: 64 },
  25: { name: 'Al-Furqan', englishName: 'The Criterion', type: 'Meccan', verses: 77 },
  26: { name: 'Ash-Shu\'ara', englishName: 'The Poets', type: 'Meccan', verses: 227 },
  27: { name: 'An-Naml', englishName: 'The Ant', type: 'Meccan', verses: 93 },
  28: { name: 'Al-Qasas', englishName: 'The Stories', type: 'Meccan', verses: 88 },
  29: { name: 'Al-Ankabut', englishName: 'The Spider', type: 'Meccan', verses: 69 },
  30: { name: 'Ar-Rum', englishName: 'The Romans', type: 'Meccan', verses: 60 },
  31: { name: 'Luqman', englishName: 'Luqman', type: 'Meccan', verses: 34 },
  32: { name: 'As-Sajdah', englishName: 'The Prostration', type: 'Meccan', verses: 30 },
  33: { name: 'Al-Ahzab', englishName: 'The Combined Forces', type: 'Medinan', verses: 73 },
  34: { name: 'Saba', englishName: 'Sheba', type: 'Meccan', verses: 54 },
  35: { name: 'Fatir', englishName: 'Originator', type: 'Meccan', verses: 45 },
  36: { name: 'Ya-Sin', englishName: 'Ya-Sin', type: 'Meccan', verses: 83 },
  37: { name: 'As-Saffat', englishName: 'Those who set the Ranks', type: 'Meccan', verses: 182 },
  38: { name: 'Sad', englishName: 'Sad', type: 'Meccan', verses: 88 },
  39: { name: 'Az-Zumar', englishName: 'The Troops', type: 'Meccan', verses: 75 },
  40: { name: 'Ghafir', englishName: 'The Forgiver', type: 'Meccan', verses: 85 },
  41: { name: 'Fussilat', englishName: 'Explained in Detail', type: 'Meccan', verses: 54 },
  42: { name: 'Ash-Shura', englishName: 'The Consultation', type: 'Meccan', verses: 53 },
  43: { name: 'Az-Zukhruf', englishName: 'The Ornaments of Gold', type: 'Meccan', verses: 89 },
  44: { name: 'Ad-Dukhan', englishName: 'The Smoke', type: 'Meccan', verses: 59 },
  45: { name: 'Al-Jathiyah', englishName: 'The Crouching', type: 'Meccan', verses: 37 },
  46: { name: 'Al-Ahqaf', englishName: 'The Wind-Curved Sandhills', type: 'Meccan', verses: 35 },
  47: { name: 'Muhammad', englishName: 'Muhammad', type: 'Medinan', verses: 38 },
  48: { name: 'Al-Fath', englishName: 'The Victory', type: 'Medinan', verses: 29 },
  49: { name: 'Al-Hujurat', englishName: 'The Rooms', type: 'Medinan', verses: 18 },
  50: { name: 'Qaf', englishName: 'Qaf', type: 'Meccan', verses: 45 },
  51: { name: 'Adh-Dhariyat', englishName: 'The Winnowing Winds', type: 'Meccan', verses: 60 },
  52: { name: 'At-Tur', englishName: 'The Mount', type: 'Meccan', verses: 49 },
  53: { name: 'An-Najm', englishName: 'The Star', type: 'Meccan', verses: 62 },
  54: { name: 'Al-Qamar', englishName: 'The Moon', type: 'Meccan', verses: 55 },
  55: { name: 'Ar-Rahman', englishName: 'The Beneficent', type: 'Medinan', verses: 78 },
  56: { name: 'Al-Waqi\'ah', englishName: 'The Inevitable', type: 'Meccan', verses: 96 },
  57: { name: 'Al-Hadid', englishName: 'The Iron', type: 'Medinan', verses: 29 },
  58: { name: 'Al-Mujadila', englishName: 'The Pleading Woman', type: 'Medinan', verses: 22 },
  59: { name: 'Al-Hashr', englishName: 'The Exile', type: 'Medinan', verses: 24 },
  60: { name: 'Al-Mumtahanah', englishName: 'She that is to be examined', type: 'Medinan', verses: 13 },
  61: { name: 'As-Saff', englishName: 'The Ranks', type: 'Medinan', verses: 14 },
  62: { name: 'Al-Jumu\'ah', englishName: 'Friday', type: 'Medinan', verses: 11 },
  63: { name: 'Al-Munafiqun', englishName: 'The Hypocrites', type: 'Medinan', verses: 11 },
  64: { name: 'At-Taghabun', englishName: 'The Mutual Disillusion', type: 'Medinan', verses: 18 },
  65: { name: 'At-Talaq', englishName: 'The Divorce', type: 'Medinan', verses: 12 },
  66: { name: 'At-Tahrim', englishName: 'The Prohibition', type: 'Medinan', verses: 12 },
  67: { name: 'Al-Mulk', englishName: 'The Sovereignty', type: 'Meccan', verses: 30 },
  68: { name: 'Al-Qalam', englishName: 'The Pen', type: 'Meccan', verses: 52 },
  69: { name: 'Al-Haqqah', englishName: 'The Inevitable Reality', type: 'Meccan', verses: 52 },
  70: { name: 'Al-Ma\'arij', englishName: 'The Ascending Stairways', type: 'Meccan', verses: 44 },
  71: { name: 'Nuh', englishName: 'Noah', type: 'Meccan', verses: 28 },
  72: { name: 'Al-Jinn', englishName: 'The Jinn', type: 'Meccan', verses: 28 },
  73: { name: 'Al-Muzzammil', englishName: 'The Enshrouded One', type: 'Meccan', verses: 20 },
  74: { name: 'Al-Muddaththir', englishName: 'The Cloaked One', type: 'Meccan', verses: 56 },
  75: { name: 'Al-Qiyamah', englishName: 'The Resurrection', type: 'Meccan', verses: 40 },
  76: { name: 'Al-Insan', englishName: 'Man', type: 'Medinan', verses: 31 },
  77: { name: 'Al-Mursalat', englishName: 'The Emissaries', type: 'Meccan', verses: 50 },
  78: { name: 'An-Naba', englishName: 'The Tidings', type: 'Meccan', verses: 40 },
  79: { name: 'An-Nazi\'at', englishName: 'Those who drag forth', type: 'Meccan', verses: 46 },
  80: { name: '\'Abasa', englishName: 'He Frowned', type: 'Meccan', verses: 42 },
  81: { name: 'At-Takwir', englishName: 'The Overthrowing', type: 'Meccan', verses: 29 },
  82: { name: 'Al-Infitar', englishName: 'The Cleaving', type: 'Meccan', verses: 19 },
  83: { name: 'Al-Mutaffifin', englishName: 'Defrauding', type: 'Meccan', verses: 36 },
  84: { name: 'Al-Inshiqaq', englishName: 'The Splitting Open', type: 'Meccan', verses: 25 },
  85: { name: 'Al-Buruj', englishName: 'The Mansions of the Stars', type: 'Meccan', verses: 22 },
  86: { name: 'At-Tariq', englishName: 'The Nightcomer', type: 'Meccan', verses: 17 },
  87: { name: 'Al-A\'la', englishName: 'The Most High', type: 'Meccan', verses: 19 },
  88: { name: 'Al-Ghashiyah', englishName: 'The Overwhelming', type: 'Meccan', verses: 26 },
  89: { name: 'Al-Fajr', englishName: 'The Dawn', type: 'Meccan', verses: 30 },
  90: { name: 'Al-Balad', englishName: 'The City', type: 'Meccan', verses: 20 },
  91: { name: 'Ash-Shams', englishName: 'The Sun', type: 'Meccan', verses: 15 },
  92: { name: 'Al-Lail', englishName: 'The Night', type: 'Meccan', verses: 21 },
  93: { name: 'Ad-Duha', englishName: 'The Morning Hours', type: 'Meccan', verses: 11 },
  94: { name: 'Ash-Sharh', englishName: 'The Relief', type: 'Meccan', verses: 8 },
  95: { name: 'At-Tin', englishName: 'The Fig', type: 'Meccan', verses: 8 },
  96: { name: 'Al-\'Alaq', englishName: 'The Clot', type: 'Meccan', verses: 19 },
  97: { name: 'Al-Qadr', englishName: 'The Power', type: 'Meccan', verses: 5 },
  98: { name: 'Al-Bayyinah', englishName: 'The Clear Proof', type: 'Medinan', verses: 8 },
  99: { name: 'Az-Zalzalah', englishName: 'The Earthquake', type: 'Medinan', verses: 8 },
  100: { name: 'Al-\'Adiyat', englishName: 'The Courser', type: 'Meccan', verses: 11 },
  101: { name: 'Al-Qari\'ah', englishName: 'The Calamity', type: 'Meccan', verses: 11 },
  102: { name: 'At-Takathur', englishName: 'Rivalry in worldly increase', type: 'Meccan', verses: 8 },
  103: { name: 'Al-\'Asr', englishName: 'The Declining Day', type: 'Meccan', verses: 3 },
  104: { name: 'Al-Humazah', englishName: 'The Traducer', type: 'Meccan', verses: 9 },
  105: { name: 'Al-Fil', englishName: 'The Elephant', type: 'Meccan', verses: 5 },
  106: { name: 'Quraysh', englishName: 'Quraysh', type: 'Meccan', verses: 4 },
  107: { name: 'Al-Ma\'un', englishName: 'Small Kindnesses', type: 'Meccan', verses: 7 },
  108: { name: 'Al-Kawthar', englishName: 'Abundance', type: 'Meccan', verses: 3 },
  109: { name: 'Al-Kafirun', englishName: 'The Disbelievers', type: 'Meccan', verses: 6 },
  110: { name: 'An-Nasr', englishName: 'Divine Support', type: 'Medinan', verses: 3 },
  111: { name: 'Al-Masad', englishName: 'Palm Fibre', type: 'Meccan', verses: 5 },
  112: { name: 'Al-Ikhlas', englishName: 'Sincerity', type: 'Meccan', verses: 4 },
  113: { name: 'Al-Falaq', englishName: 'The Daybreak', type: 'Meccan', verses: 5 },
  114: { name: 'An-Nas', englishName: 'Mankind', type: 'Meccan', verses: 6 }
};

export const POPULAR_VERSES_EXCERPTS: Record<string, { arabic: string; English: string; tafsir: string }> = {
  '1:1': {
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    English: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
    tafsir: 'Tafsir Ibn Kathir notes that beginning with the Basmalah brings divine blessing (Barakah) and acknowledges Allah\'s infinite mercy.'
  },
  '2:183': {
    arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ كَمَا كُتِبَ عَلَى الَّذِينَ مِن قَبْلِكُمْ لَعَلَّكُمْ تَتَّقُونَ',
    English: 'O you who have believed, decreed upon you is fasting as it was decreed upon those before you that you may become righteous.',
    tafsir: 'Tafsir Ibn Kathir highlights that fasting (Sawm) purifies the soul and cultivates Taqwa (God-consciousness) by restraining physical desires for Allah\'s sake.'
  },
  '2:255': {
    arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ',
    English: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of [all] existence. Neither drowsiness overtakes Him nor sleep.',
    tafsir: 'Known as Ayatul Kursi (The Verse of the Throne), regarded as the greatest verse in the Quran, affirming Allah\'s absolute sovereignty and eternal life.'
  },
  '3:103': {
    arabic: 'وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا وَلَا تَفَرَّقُوا',
    English: 'And hold firmly to the rope of Allah all together and do not become divided.',
    tafsir: 'Refers to Islamic unity and adherence to the Quran and Sunnah, forbidding sectarian division among believers.'
  },
  '4:59': {
    arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا أَطِيعُوا اللَّهَ وَأَطِيعُوا الرَّسُولَ وَأُولِي الْأَمْرِ مِنكُمْ',
    English: 'O you who have believed, obey Allah and obey the Messenger and those in authority among you.',
    tafsir: 'A foundational principle in Usul al-Fiqh establishing the primary sources of Islamic legislation: Quran, Sunnah, and consensus.'
  },
  '24:35': {
    arabic: 'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ ۚ مَثَلُ نُورِهِ كَمِشْكَاةٍ فِيهَا مِصْبَاحٌ',
    English: 'Allah is the Light of the heavens and the earth. The example of His light is like a niche within which is a lamp...',
    tafsir: 'Ayat an-Nur (Verse of Light) describes divine guidance illuminating the heart of a believer.'
  },
  '112:1': {
    arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
    English: 'Say, "He is Allah, [who is] One."',
    tafsir: 'Surah al-Ikhlas encapsulates pure Tawhid (Islamic Monotheism) and is equivalent to one-third of the Quran in reward.'
  }
};

export const HADITH_COLLECTIONS: Record<string, {
  name: string;
  compiler: string;
  era: string;
  authenticity: string;
  grade: 'sahih' | 'hasan';
  description: string;
}> = {
  bukhari: {
    name: 'Sahih al-Bukhari',
    compiler: 'Imam Muhammad ibn Ismail al-Bukhari',
    era: '194–256 AH (810–870 CE)',
    authenticity: 'Sahih (100% Authentic - Highest Authority)',
    grade: 'sahih',
    description: 'The premier collection of authentic Hadith in Sunni Islam, compiled over 16 years with rigorous verification of narrators.'
  },
  muslim: {
    name: 'Sahih Muslim',
    compiler: 'Imam Muslim ibn al-Hajjaj',
    era: '204–261 AH (820–875 CE)',
    authenticity: 'Sahih (100% Authentic - Equal Rank with Bukhari)',
    grade: 'sahih',
    description: 'Renowned for its thematic arrangement and strict criteria for uninterrupted chains of transmission (Isnad).'
  },
  tirmidhi: {
    name: 'Sunan at-Tirmidhi',
    compiler: 'Imam Abu Isa Muhammad at-Tirmidhi',
    era: '209–279 AH (824–892 CE)',
    authenticity: 'Sahih / Hasan / Gradings annotated',
    grade: 'hasan',
    description: 'Distinguished by including scholarly commentary on legal rulings (Fiqh) of the Companions and early jurists.'
  },
  abudawud: {
    name: 'Sunan Abu Dawud',
    compiler: 'Imam Abu Dawud Sulayman ibn al-Ash\'ath',
    era: '202–275 AH (817–889 CE)',
    authenticity: 'Sahih / Hasan Ahkam focus',
    grade: 'hasan',
    description: 'A major collection focused specifically on Hadiths dealing with jurisprudence and practical legal rulings.'
  },
  nasai: {
    name: 'Sunan an-Nasa\'i',
    compiler: 'Imam Ahmad ibn Shu\'ayb an-Nasa\'i',
    era: '215–303 AH (829–915 CE)',
    authenticity: 'Sahih / High standard narrator criteria',
    grade: 'sahih',
    description: 'Known for minimal weak narrations among the Sunan collections due to strict narrator evaluation.'
  },
  ibnmajah: {
    name: 'Sunan Ibn Majah',
    compiler: 'Imam Ibn Majah Muhammad ibn Yazid',
    era: '209–273 AH (824–887 CE)',
    authenticity: 'Sahih / Hasan / Rare narrations',
    grade: 'hasan',
    description: 'One of the Kutub al-Sittah (Six Major Books), noted for excellent organization and unique beneficial narrations.'
  },
  muwatta: {
    name: 'Muwatta Malik',
    compiler: 'Imam Malik ibn Anas',
    era: '93–179 AH (711–795 CE)',
    authenticity: 'Sahih (Foundational text of Maliki School)',
    grade: 'sahih',
    description: 'The earliest surviving written compilation of Islamic law and Hadith from the scholars of Medina.'
  }
};

export const POPULAR_HADITH_EXCERPTS: Record<string, { arabic?: string; English: string; notes: string }> = {
  'bukhari:1': {
    arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    English: 'Narrated \'Umar bin Al-Khattab: I heard Allah\'s Messenger (ﷺ) saying, "The reward of deeds depends upon the intentions and every person will get the reward according to what he has intended..."',
    notes: 'Imam al-Bukhari famously placed this hadith at the beginning of his collection to remind scholars and seekers of knowledge to purify their intentions for Allah alone.'
  },
  'bukhari:2': {
    arabic: 'كَيْفَ كَانَ يَبْدَأُ الْوَحْيُ إِلَى رَسُولِ اللَّهِ صلى الله عليه وسلم',
    English: 'Narrated Aisha: Al-Harith bin Hisham asked Allah\'s Messenger (ﷺ) "O Allah\'s Messenger! How is the Divine Inspiration revealed to you?" Allah\'s Messenger replied, "Sometimes it is revealed like the ringing of a bell..."',
    notes: 'Details the physical weight and experience of divine revelation coming to the Prophet Muhammad (ﷺ).'
  },
  'muslim:1': {
    arabic: 'بَيْنَمَا نَحْنُ عِنْدَ رَسُولِ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ ذَاتَ يَوْمٍ إِذْ طَلَعَ عَلَيْنَا رَجُلٌ شَدِيدُ بَيَاضِ الثِّيَابِ',
    English: 'Known as Hadith Jibreel: While we were sitting with the Messenger of Allah, a man appeared in exceedingly white clothes and pitch-black hair, asking about Islam, Iman, and Ihsan...',
    notes: 'A foundational hadith outlining the three dimensions of Deen: Islam (outward worship), Iman (inner faith), and Ihsan (excellence/spiritual awareness).'
  },
  'tirmidhi:2606': {
    arabic: 'مَنْ سَلَكَ طَرِيقًا يَبْتَغِي فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ',
    English: 'The Messenger of Allah (ﷺ) said: "Whoever treads a path seeking knowledge, Allah makes easy for him a path to Paradise..."',
    notes: 'Emphasizes the elevated rank and spiritual blessings granted to those who sincerely seek religious knowledge.'
  },
  'abudawud:456': {
    arabic: 'مِفْتَاحُ الصَّلاَةِ الطُّهُورُ وَتَحْرِيمُهَا التَّكْبِيرُ وَتَحْلِيلُهَا التَّسْلِيمُ',
    English: 'The Messenger of Allah (ﷺ) said: "The key to prayer is purification (Wudu), its consecration is the Takbir, and its termination is the Taslim."',
    notes: 'Key foundational principle in Fiqh of Taharah establishing ritual purity as an absolute prerequisite for prayer.'
  }
};

export function getCitationDetails(type: string, ref: string, url: string): CitationInfo {
  if (type === 'quran') {
    // ref is e.g. "2:183" or "2:183-185"
    const parts = ref.split(':');
    const surahNum = parseInt(parts[0], 10);
    const surahData = QURAN_SURAHS[surahNum] || { name: `Surah ${surahNum}`, englishName: 'Quranic Chapter', type: 'Meccan', verses: 100 };
    const verseNum = parts[1] || '1';
    
    const excerptKey = `${surahNum}:${verseNum}`;
    const popExcerpt = POPULAR_VERSES_EXCERPTS[excerptKey];

    return {
      type: 'quran',
      title: `Surah ${surahData.name} (${surahData.englishName})`,
      subtitle: `Surah ${surahNum}, Verse ${verseNum}`,
      collectionOrSurah: `Quran • ${surahData.type} Revelation (${surahData.verses} Verses)`,
      referenceNumber: `${surahNum}:${verseNum}`,
      authenticity: 'Divine Revelation (Qur\'anic Text)',
      authenticityGrade: 'divine',
      compilerOrContext: `Revealed in ${surahData.type === 'Meccan' ? 'Makkah' : 'Madinah'} • Verse ${verseNum} of ${surahData.verses}`,
      excerpt: popExcerpt?.English || `Referencing Surah ${surahData.name}, Verse ${verseNum}. Click below to read the complete translation and Tafsir on Quran.com.`,
      arabicExcerpt: popExcerpt?.arabic,
      scholarlyNotes: popExcerpt?.tafsir || `This noble verse is preserved in Surah ${surahData.name}. In classical Tafsir (Ibn Kathir, Al-Qurtubi), verses from this surah form key legal and spiritual guidelines.`,
      url: url || `https://quran.com/${surahNum}/${verseNum}`
    };
  } else {
    // Hadith or general: ref is e.g. "Bukhari:1" or "Muslim:123"
    const parts = ref.split(':');
    const collectionRaw = parts[0] || 'Hadith';
    const num = parts[1] || '1';

    let collectionKey = collectionRaw.toLowerCase().replace(/['\s]/g, '');
    if (collectionKey === 'abudawood') collectionKey = 'abudawud';
    if (collectionKey === 'nasai') collectionKey = 'nasai';

    const collectionData = HADITH_COLLECTIONS[collectionKey] || {
      name: collectionRaw,
      compiler: `Scholarly Hadith Compilation (${collectionRaw})`,
      era: 'Classical Era',
      authenticity: 'Authentic Narration',
      grade: 'sahih' as const,
      description: 'Preserved collection of Hadith and prophetic traditions.'
    };

    const excerptKey = `${collectionKey}:${num}`;
    const popExcerpt = POPULAR_HADITH_EXCERPTS[excerptKey];

    return {
      type: 'hadith',
      title: collectionData.name,
      subtitle: `Hadith #${num}`,
      collectionOrSurah: collectionData.name,
      referenceNumber: num,
      authenticity: collectionData.authenticity,
      authenticityGrade: collectionData.grade === 'sahih' ? 'sahih' : 'hasan',
      compilerOrContext: `${collectionData.compiler} (${collectionData.era})`,
      excerpt: popExcerpt?.English || `Hadith #${num} in ${collectionData.name}. ${collectionData.description}`,
      arabicExcerpt: popExcerpt?.arabic,
      scholarlyNotes: popExcerpt?.notes || `${collectionData.name} is a canonical Sunni Hadith source. Hadith #${num} is recorded with its chain of transmission (Isnad).`,
      url: url || `https://sunnah.com/${collectionKey}:${num}`
    };
  }
}
