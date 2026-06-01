package com.smartehs.util;

/**
 * Thread-local context for storing the current language preference.
 * Supported languages: ko (Korean), en (English), zh (Chinese)
 */
public class LanguageContext {

    private static final ThreadLocal<String> currentLanguage = new ThreadLocal<>();

    public static final String KOREAN = "ko";
    public static final String ENGLISH = "en";
    public static final String CHINESE = "zh";
    public static final String DEFAULT_LANGUAGE = KOREAN;

    public static void setLanguage(String language) {
        if (isValidLanguage(language)) {
            currentLanguage.set(language);
        } else {
            currentLanguage.set(DEFAULT_LANGUAGE);
        }
    }

    public static String getLanguage() {
        String lang = currentLanguage.get();
        return lang != null ? lang : DEFAULT_LANGUAGE;
    }

    public static void clear() {
        currentLanguage.remove();
    }

    public static boolean isValidLanguage(String language) {
        return KOREAN.equals(language) || ENGLISH.equals(language) || CHINESE.equals(language);
    }

    public static boolean isKorean() {
        return KOREAN.equals(getLanguage());
    }

    public static boolean isEnglish() {
        return ENGLISH.equals(getLanguage());
    }

    public static boolean isChinese() {
        return CHINESE.equals(getLanguage());
    }
}
