package com.smartehs.controller;

import com.smartehs.dto.request.PpeWearRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.PpeWearResponse;
import com.smartehs.service.PpeWearService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ppe-wears")
@RequiredArgsConstructor
@Tag(name = "PPE - 착용 이행", description = "보호구·장비 착용 확인 및 이행 관리")
public class PpeWearController {

    private final PpeWearService service;

    @GetMapping
    @Operation(summary = "착용 확인 이력 (페이징)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(page, size)));
    }

    @GetMapping("/search")
    @Operation(summary = "검색 (근로자명·작업구역·확인자)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.search(keyword, page, size)));
    }

    @GetMapping("/department/{department}")
    @Operation(summary = "부서별")
    public ResponseEntity<ApiResponse<Map<String, Object>>> findByDepartment(
            @PathVariable String department,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findByDepartment(department, page, size)));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "착용 상태별")
    public ResponseEntity<ApiResponse<Map<String, Object>>> findByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findByStatus(status, page, size)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "착용 확인 상세")
    public ResponseEntity<ApiResponse<PpeWearResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/kpi")
    @Operation(summary = "KPI (이행율%/확인건수/미착용/교육조치)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getKpi() {
        return ResponseEntity.ok(ApiResponse.success(service.getKpi()));
    }

    @GetMapping("/department-rate")
    @Operation(summary = "부서별 이행율 통계")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> rateByDepartment() {
        return ResponseEntity.ok(ApiResponse.success(service.rateByDepartment()));
    }

    @PostMapping
    @Operation(summary = "착용 확인 등록")
    public ResponseEntity<ApiResponse<PpeWearResponse>> create(@RequestBody PpeWearRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.create(req)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "착용 확인 수정")
    public ResponseEntity<ApiResponse<PpeWearResponse>> update(
            @PathVariable Long id, @RequestBody PpeWearRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "착용 확인 삭제 (soft)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
