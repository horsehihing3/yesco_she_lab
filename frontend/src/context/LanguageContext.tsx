import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { queryClient } from '../lib/queryClient';

type Language = 'ko' | 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  changeLanguage: (lang: Language) => void;
  languages: { code: Language; name: string }[];
  isChangingLanguage: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = 'preferred_language';

const languages: { code: Language; name: string }[] = [
  { code: 'ko', name: '한국어' },
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
];

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const isInitialMount = useRef(true);
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return (saved as Language) || 'ko';
  });
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  useEffect(() => {
    i18n.changeLanguage(language);
    localStorage.setItem(LANGUAGE_KEY, language);

    // Invalidate all queries to refetch data with new language
    // Skip on initial mount to avoid unnecessary refetch
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      setIsChangingLanguage(true);
      queryClient.invalidateQueries().then(() => {
        // Wait a bit for queries to start refetching
        setTimeout(() => {
          setIsChangingLanguage(false);
        }, 800);
      });
    }
  }, [language, i18n]);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, languages, isChangingLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
