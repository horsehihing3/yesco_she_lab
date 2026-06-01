package com.smartehs.controller;

import com.smartehs.dto.request.LegalImprovementRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.LegalImprovementResponse;
import com.smartehs.service.LegalImprovementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/legal/improvements")
@RequiredArgsConstructor
@Tag(name = "Legal Improvement", description = "개선 등록")
public class LegalImprovementController {

    private final LegalImprovementService service;

    @GetMapping
    @Operation(summary = "개선 목록")
    public ResponseEntity<ApiResponse<List<LegalImprovementResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "개선 상세")
    public ResponseEntity<ApiResponse<LegalImprovementResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/stats")
    @Operation(summary = "개선 통계")
    public ResponseEntity<ApiResponse<Map<String, Object>>> stats() {
        return ResponseEntity.ok(ApiResponse.success(service.getStats()));
    }

    @PostMapping
    @Operation(summary = "개선 등록")
    public ResponseEntity<ApiResponse<LegalImprovementResponse>> create(@Valid @RequestBody LegalImprovementRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.create(req)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "개선 수정")
    public ResponseEntity<ApiResponse<LegalImprovementResponse>> update(@PathVariable Long id, @Valid @RequestBody LegalImprovementRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "개선 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
