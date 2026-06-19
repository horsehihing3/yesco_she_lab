package com.smartehs.controller;

import com.smartehs.dto.request.PpeStockRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.PpeStockResponse;
import com.smartehs.service.PpeStockService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ppe-stocks")
@RequiredArgsConstructor
@Tag(name = "PPE - 재고 관리", description = "보호구·장비 창고별 재고")
public class PpeStockController {

    private final PpeStockService service;

    @GetMapping
    @Operation(summary = "재고 목록 (페이징)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(page, size)));
    }

    @GetMapping("/search")
    @Operation(summary = "재고 검색 (품목명·창고)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.search(keyword, page, size)));
    }

    @GetMapping("/location/{location}")
    @Operation(summary = "창고별 재고")
    public ResponseEntity<ApiResponse<Map<String, Object>>> findByLocation(
            @PathVariable String location,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findByLocation(location, page, size)));
    }

    @GetMapping("/low")
    @Operation(summary = "최소 기준 미달 재고")
    public ResponseEntity<ApiResponse<List<PpeStockResponse>>> findLowStock() {
        return ResponseEntity.ok(ApiResponse.success(service.findLowStock()));
    }

    @GetMapping("/expiring")
    @Operation(summary = "유효기간 만료 임박 재고 (기본 30일)")
    public ResponseEntity<ApiResponse<List<PpeStockResponse>>> findExpiringSoon(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(ApiResponse.success(service.findExpiringSoon(days)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "재고 상세")
    public ResponseEntity<ApiResponse<PpeStockResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/kpi")
    @Operation(summary = "KPI (총 재고/부족 건수/만료 임박)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getKpi() {
        return ResponseEntity.ok(ApiResponse.success(service.getKpi()));
    }

    @PostMapping
    @Operation(summary = "재고 등록")
    public ResponseEntity<ApiResponse<PpeStockResponse>> create(@RequestBody PpeStockRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.create(req)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "재고 수정")
    public ResponseEntity<ApiResponse<PpeStockResponse>> update(
            @PathVariable Long id, @RequestBody PpeStockRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "재고 삭제 (soft)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
