package com.smartehs.controller;

import com.smartehs.model.ButtonRule;
import com.smartehs.service.ButtonRuleService;
import com.smartehs.dto.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/button-rules")
@RequiredArgsConstructor
@Tag(name = "Button Rule", description = "버튼 노출 규칙 관리")
public class ButtonRuleController {

    private final ButtonRuleService service;

    @GetMapping
    @Operation(summary = "버튼 규칙 전체 조회")
    public ResponseEntity<ApiResponse<List<ButtonRule>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @PutMapping
    @Operation(summary = "버튼 규칙 전체 저장 (덮어쓰기)")
    public ResponseEntity<ApiResponse<Void>> saveAll(@RequestBody List<ButtonRule> rules) {
        service.saveAll(rules);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
