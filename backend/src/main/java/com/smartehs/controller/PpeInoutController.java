package com.smartehs.controller;

import com.smartehs.dto.request.PpeInoutRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.PpeInoutResponse;
import com.smartehs.service.PpeInoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ppe-inouts")
@RequiredArgsConstructor
@Tag(name = "PPE - 입출고 이력", description = "보호구·장비 입출고 기록")
public class PpeInoutController {

    private final PpeInoutService service;

    @GetMapping
    @Operation(summary = "입출고 이력 (페이징)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(page, size)));
    }

    @GetMapping("/search")
    @Operation(summary = "검색 (품목명·담당자·창고)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.search(keyword, page, size)));
    }

    @GetMapping("/type/{inoutType}")
    @Operation(summary = "타입별 (IN/OUT)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> findByType(
            @PathVariable String inoutType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findByType(inoutType, page, size)));
    }

    @GetMapping("/recent")
    @Operation(summary = "최근 N건 (기본 8건)")
    public ResponseEntity<ApiResponse<List<PpeInoutResponse>>> findRecent(
            @RequestParam(defaultValue = "8") int limit) {
        return ResponseEntity.ok(ApiResponse.success(service.findRecent(limit)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "입출고 상세")
    public ResponseEntity<ApiResponse<PpeInoutResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/kpi")
    @Operation(summary = "KPI (이번달 입고/출고)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getKpi() {
        return ResponseEntity.ok(ApiResponse.success(service.getKpi()));
    }

    @PostMapping
    @Operation(summary = "입출고 등록")
    public ResponseEntity<ApiResponse<PpeInoutResponse>> create(@RequestBody PpeInoutRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.create(req)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "입출고 수정")
    public ResponseEntity<ApiResponse<PpeInoutResponse>> update(
            @PathVariable Long id, @RequestBody PpeInoutRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "입출고 삭제 (soft)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
