package com.smartehs.controller;

import com.smartehs.service.TranslationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/translation")
@RequiredArgsConstructor
public class TranslationController {

    private final TranslationService translationService;

    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> testTranslation(
            @RequestParam(defaultValue = "안녕하세요") String text) {

        Map<String, String> result = new HashMap<>();
        result.put("original", text);
        result.put("english", translationService.translateToEnglish(text));
        result.put("chinese", translationService.translateToChinese(text));

        return ResponseEntity.ok(result);
    }
}
