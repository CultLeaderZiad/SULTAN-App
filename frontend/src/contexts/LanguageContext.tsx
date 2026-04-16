import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (en: string, ar: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (en) => en,
  isRTL: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<Language>('en');

  useEffect(() => {
    AsyncStorage.getItem('sultan_language').then((val) => {
      if (val === 'ar' || val === 'en') setLang(val);
    });
  }, []);

  const setLanguage = (lang: Language) => {
    setLang(lang);
    AsyncStorage.setItem('sultan_language', lang);
  };

  const t = (en: string, ar: string) => (language === 'ar' ? ar : en);
  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
