package com.smartehs.controller;

import com.smartehs.dto.request.PpeIssueRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.PpeIssueResponse;
import com.smartehs.service.PpeIssueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/ppe-issues")
@RequiredArgsConstructor
@Tag(name = "PPE - 지급·반납", description = "보호구·장비 근로자 지급 및 반납 관리")
public class PpeIssueController {

    private final PpeIssueService service;

    @GetMapping
    @Operation(summary = "지급·반납 이력 (페이징)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(page, size)));
    }

    @GetMapping("/search")
    @Operation(summary = "검색 (근로자명·사번·품목명)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.search(keyword, page, size)));
    }

    @GetMapping("/department/{department}")
    @Operation(summary = "부서별 지급·반납")
    public ResponseEntity<ApiResponse<Map<String, Object>>> findByDepartment(
            @PathVariable String department,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findByDepartment(department, page, size)));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "상태별 지급·반납")
    public ResponseEntity<ApiResponse<Map<String, Object>>> findByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findByStatus(status, page, size)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "지급 상세")
    public ResponseEntity<ApiResponse<PpeIssueResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/kpi")
    @Operation(summary = "KPI (총지급/반납/교체요청/분실)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getKpi() {
        return ResponseEntity.ok(ApiResponse.success(service.getKpi()));
    }

    @PostMapping
    @Operation(summary = "지급 등록")
    public ResponseEntity<ApiResponse<PpeIssueResponse>> create(@RequestBody PpeIssueRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.create(req)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "지급 수정")
    public ResponseEntity<ApiResponse<PpeIssueResponse>> update(
            @PathVariable Long id, @RequestBody PpeIssueRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, req)));
    }

    @PostMapping("/{id}/return")
    @Operation(summary = "반납 처리 (status → RETURNED)")
    public ResponseEntity<ApiResponse<PpeIssueResponse>> returnItem(
            @PathVariable Long id, @RequestBody PpeIssueRequest who) {
        return ResponseEntity.ok(ApiResponse.success(service.changeStatus(id, "RETURNED", who)));
    }

    @PostMapping("/{id}/replace-request")
    @Operation(summary = "교체 요청 (status → REPLACE)")
    public ResponseEntity<ApiResponse<PpeIssueResponse>> replaceRequest(
            @PathVariable Long id, @RequestBody PpeIssueRequest who) {
        return ResponseEntity.ok(ApiResponse.success(service.changeStatus(id, "REPLACE", who)));
    }

    @PostMapping("/{id}/loss-report")
    @Operation(summary = "분실 신고 (status → LOSS)")
    public ResponseEntity<ApiResponse<PpeIssueResponse>> lossReport(
            @PathVariable Long id, @RequestBody PpeIssueRequest who) {
        return ResponseEntity.ok(ApiResponse.success(service.changeStatus(id, "LOSS", who)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "지급 삭제 (soft)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
