package com.smartehs.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
public class TranslationService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${translation.enabled:true}")
    private boolean translationEnabled;

    public TranslationService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Translate text between any two languages using Google Translate
     */
    public String translate(String text, String sourceLang, String targetLang) {
        if (!translationEnabled) {
            log.info("Translation is disabled");
            return text;
        }

        if (text == null || text.trim().isEmpty()) {
            return text;
        }

        if (sourceLang.equals(targetLang)) {
            return text;
        }

        log.info("Translating from {} to {}: {}", sourceLang, targetLang,
            text.length() > 50 ? text.substring(0, 50) + "..." : text);

        try {
            String encodedText = URLEncoder.encode(text, StandardCharsets.UTF_8);
            String urlString = String.format(
                "https://translate.googleapis.com/translate_a/single?client=gtx&sl=%s&tl=%s&dt=t&q=%s",
                sourceLang,
                targetLang,
                encodedText
            );

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
            headers.set("Accept", "application/json, text/plain, */*");
            headers.set("Accept-Language", "en-US,en;q=0.9,ko;q=0.8");

            RequestEntity<Void> request = RequestEntity
                .get(new URI(urlString))
                .headers(headers)
                .build();

            ResponseEntity<String> response = restTemplate.exchange(request, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String result = parseTranslationResponse(response.getBody(), text);
                log.info("Translation result: {}",
                    result.length() > 50 ? result.substring(0, 50) + "..." : result);
                return result;
            }

            log.warn("Translation failed with status: {}", response.getStatusCode());
            return text;

        } catch (Exception e) {
            log.error("Translation error: {} - {}", e.getClass().getSimpleName(), e.getMessage());
            return text;
        }
    }

    // Korean translations
    public String translateToEnglish(String koreanText) {
        return translate(koreanText, "ko", "en");
    }

    public String translateToChinese(String koreanText) {
        return translate(koreanText, "ko", "zh-CN");
    }

    // English translations
    public String translateEnglishToKorean(String englishText) {
        return translate(englishText, "en", "ko");
    }

    public String translateEnglishToChinese(String englishText) {
        return translate(englishText, "en", "zh-CN");
    }

    // Chinese translations
    public String translateChineseToKorean(String chineseText) {
        return translate(chineseText, "zh-CN", "ko");
    }

    public String translateChineseToEnglish(String chineseText) {
        return translate(chineseText, "zh-CN", "en");
    }

    private String parseTranslationResponse(String response, String originalText) {
        try {
            JsonNode root = objectMapper.readTree(response);
            StringBuilder result = new StringBuilder();

            JsonNode translations = root.get(0);
            if (translations != null && translations.isArray()) {
                for (JsonNode segment : translations) {
                    if (segment.isArray() && segment.size() > 0) {
                        JsonNode translatedText = segment.get(0);
                        if (translatedText != null && !translatedText.isNull()) {
                            result.append(translatedText.asText());
                        }
                    }
                }
            }

            String translated = result.toString();
            if (translated.isEmpty()) {
                log.warn("Empty translation result");
                return originalText;
            }

            return translated;

        } catch (Exception e) {
            log.error("Error parsing translation response: {}", e.getMessage());
            return originalText;
        }
    }

    // HTML translations - delegates to regular translate
    public String translateHtmlToEnglish(String koreanHtml) {
        return translate(koreanHtml, "ko", "en");
    }

    public String translateHtmlToChinese(String koreanHtml) {
        return translate(koreanHtml, "ko", "zh-CN");
    }
}
