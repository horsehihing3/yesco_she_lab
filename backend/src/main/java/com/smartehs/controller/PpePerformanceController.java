package com.smartehs.controller;

import com.smartehs.dto.request.PpePerformanceRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.PpePerformanceResponse;
import com.smartehs.service.PpePerformanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/ppe-performances")
@RequiredArgsConstructor
@Tag(name = "PPE - 성능 관리", description = "보호구·장비 성능 평가 및 기준 충족 여부")
public class PpePerformanceController {

    private final PpePerformanceService service;

    @GetMapping
    @Operation(summary = "성능 평가 이력 (페이징)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(page, size)));
    }

    @GetMapping("/search")
    @Operation(summary = "검색 (품목명·성능기준·평가자)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.search(keyword, page, size)));
    }

    @GetMapping("/result/{result}")
    @Operation(summary = "결과별 (기준충족/성능미달/평가중)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> findByResult(
            @PathVariable String result,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findByResult(result, page, size)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "성능 평가 상세")
    public ResponseEntity<ApiResponse<PpePerformanceResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/kpi")
    @Operation(summary = "KPI (전체/기준충족/성능미달/평가중)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getKpi() {
        return ResponseEntity.ok(ApiResponse.success(service.getKpi()));
    }

    @PostMapping
    @Operation(summary = "성능 평가 등록")
    public ResponseEntity<ApiResponse<PpePerformanceResponse>> create(@RequestBody PpePerformanceRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.create(req)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "성능 평가 수정")
    public ResponseEntity<ApiResponse<PpePerformanceResponse>> update(
            @PathVariable Long id, @RequestBody PpePerformanceRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "성능 평가 삭제 (soft)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
