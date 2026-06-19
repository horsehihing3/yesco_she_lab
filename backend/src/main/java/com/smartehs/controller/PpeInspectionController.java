package com.smartehs.controller;

import com.smartehs.dto.request.PpeInspectionRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.PpeInspectionResponse;
import com.smartehs.service.PpeInspectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ppe-inspections")
@RequiredArgsConstructor
@Tag(name = "PPE - 검사·점검", description = "보호구·장비 정기검사 / 자체점검 / 사전점검 기록")
public class PpeInspectionController {

    private final PpeInspectionService service;

    @GetMapping
    @Operation(summary = "점검 이력 (페이징)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(page, size)));
    }

    @GetMapping("/search")
    @Operation(summary = "검색 (품목명·점검자·품목코드)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.search(keyword, page, size)));
    }

    @GetMapping("/type/{type}")
    @Operation(summary = "점검 유형별")
    public ResponseEntity<ApiResponse<Map<String, Object>>> findByType(
            @PathVariable String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findByType(type, page, size)));
    }

    @GetMapping("/result/{result}")
    @Operation(summary = "점검 결과별")
    public ResponseEntity<ApiResponse<Map<String, Object>>> findByResult(
            @PathVariable String result,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findByResult(result, page, size)));
    }

    @GetMapping("/upcoming")
    @Operation(summary = "예정 점검 (기본 30일)")
    public ResponseEntity<ApiResponse<List<PpeInspectionResponse>>> findUpcoming(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(ApiResponse.success(service.findUpcoming(days)));
    }

    @GetMapping("/fails")
    @Operation(summary = "불합격·폐기 현황")
    public ResponseEntity<ApiResponse<List<PpeInspectionResponse>>> findFails() {
        return ResponseEntity.ok(ApiResponse.success(service.findFails()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "점검 상세")
    public ResponseEntity<ApiResponse<PpeInspectionResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/kpi")
    @Operation(summary = "KPI (전체/합격/불합격·폐기/예정)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getKpi() {
        return ResponseEntity.ok(ApiResponse.success(service.getKpi()));
    }

    @PostMapping
    @Operation(summary = "점검 등록")
    public ResponseEntity<ApiResponse<PpeInspectionResponse>> create(@RequestBody PpeInspectionRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.create(req)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "점검 수정")
    public ResponseEntity<ApiResponse<PpeInspectionResponse>> update(
            @PathVariable Long id, @RequestBody PpeInspectionRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "점검 삭제 (soft)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
