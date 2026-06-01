package com.smartehs.config;

import com.smartehs.util.LanguageContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Interceptor that reads the Accept-Language header and sets the language context.
 * Supported languages: ko, en, zh
 */
@Component
public class LanguageInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String acceptLanguage = request.getHeader("Accept-Language");
        String language = parseLanguage(acceptLanguage);
        LanguageContext.setLanguage(language);
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                 Object handler, Exception ex) {
        LanguageContext.clear();
    }

    private String parseLanguage(String acceptLanguage) {
        if (acceptLanguage == null || acceptLanguage.isEmpty()) {
            return LanguageContext.DEFAULT_LANGUAGE;
        }

        // Parse Accept-Language header (e.g., "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7,zh;q=0.6")
        String[] languages = acceptLanguage.split(",");
        for (String lang : languages) {
            String langCode = lang.split(";")[0].trim().toLowerCase();

            // Extract primary language code (e.g., "ko-KR" -> "ko")
            if (langCode.contains("-")) {
                langCode = langCode.split("-")[0];
            }

            if (LanguageContext.isValidLanguage(langCode)) {
                return langCode;
            }
        }

        return LanguageContext.DEFAULT_LANGUAGE;
    }
}
