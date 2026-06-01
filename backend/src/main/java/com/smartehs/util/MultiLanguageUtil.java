package com.smartehs.util;

/**
 * Utility class for selecting the appropriate language value based on current language context.
 */
public class MultiLanguageUtil {

    /**
     * Returns the appropriate text based on current language context.
     * Falls back to Korean (default) if the requested language value is null or empty.
     */
    public static String getLocalizedText(String ko, String en, String zh) {
        String language = LanguageContext.getLanguage();

        switch (language) {
            case LanguageContext.ENGLISH:
                return (en != null && !en.isEmpty()) ? en : ko;
            case LanguageContext.CHINESE:
                return (zh != null && !zh.isEmpty()) ? zh : ko;
            case LanguageContext.KOREAN:
            default:
                return ko;
        }
    }

    /**
     * Returns all language values as a LocalizedText object.
     */
    public static LocalizedText createLocalizedText(String ko, String en, String zh) {
        return new LocalizedText(ko, en, zh);
    }

    /**
     * Data class for holding multi-language text values.
     */
    public static class LocalizedText {
        private final String ko;
        private final String en;
        private final String zh;

        public LocalizedText(String ko, String en, String zh) {
            this.ko = ko;
            this.en = en;
            this.zh = zh;
        }

        public String getKo() { return ko; }
        public String getEn() { return en; }
        public String getZh() { return zh; }

        /**
         * Returns the text for the current language context.
         */
        public String get() {
            return MultiLanguageUtil.getLocalizedText(ko, en, zh);
        }
    }
}
