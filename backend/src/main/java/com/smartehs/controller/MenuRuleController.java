package com.smartehs.controller;

import com.smartehs.model.MenuRule;
import com.smartehs.service.MenuRuleService;
import com.smartehs.dto.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/menu-rules")
@RequiredArgsConstructor
@Tag(name = "Menu Rule", description = "메뉴 노출 규칙 관리")
public class MenuRuleController {

    private final MenuRuleService service;

    @GetMapping
    @Operation(summary = "메뉴 규칙 전체 조회 (숨김 규칙 목록)")
    public ResponseEntity<ApiResponse<List<MenuRule>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @PutMapping
    @Operation(summary = "메뉴 규칙 저장 (숨김 규칙 전체 덮어쓰기)")
    public ResponseEntity<ApiResponse<Void>> saveAll(@RequestBody List<MenuRule> rules) {
        service.saveAll(rules);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
