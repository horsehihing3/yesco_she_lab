package com.smartehs.controller;

import com.smartehs.dto.request.PpeItemRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.PpeItemResponse;
import com.smartehs.service.PpeItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/ppe-items")
@RequiredArgsConstructor
@Tag(name = "PPE - 품목 관리", description = "보호구·장비 품목 마스터 CRUD")
public class PpeItemController {

    private final PpeItemService service;

    @GetMapping
    @Operation(summary = "품목 목록 (페이징)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(page, size)));
    }

    @GetMapping("/search")
    @Operation(summary = "품목 검색 (이름·모델·공급업체·코드)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.search(keyword, page, size)));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "카테고리별 품목")
    public ResponseEntity<ApiResponse<Map<String, Object>>> findByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findByCategory(category, page, size)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "품목 상세")
    public ResponseEntity<ApiResponse<PpeItemResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/kpi")
    @Operation(summary = "KPI 통계 (전체/카테고리/공급업체 수)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getKpi() {
        return ResponseEntity.ok(ApiResponse.success(service.getKpi()));
    }

    @PostMapping
    @Operation(summary = "품목 등록")
    public ResponseEntity<ApiResponse<PpeItemResponse>> create(@RequestBody PpeItemRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.create(req)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "품목 수정")
    public ResponseEntity<ApiResponse<PpeItemResponse>> update(
            @PathVariable Long id, @RequestBody PpeItemRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "품목 삭제 (soft)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
