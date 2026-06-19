package com.smartehs.controller;

import com.smartehs.dto.request.PpeBudgetRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.PpeBudgetResponse;
import com.smartehs.service.PpeBudgetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ppe-budgets")
@RequiredArgsConstructor
@Tag(name = "PPE - 비용·예산", description = "보호구·장비 연간 예산 배정 및 집행 관리")
public class PpeBudgetController {

    private final PpeBudgetService service;

    @GetMapping
    @Operation(summary = "예산 목록 (페이징)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(page, size)));
    }

    @GetMapping("/year/{year}")
    @Operation(summary = "연도별 예산")
    public ResponseEntity<ApiResponse<List<PpeBudgetResponse>>> findByYear(@PathVariable Integer year) {
        return ResponseEntity.ok(ApiResponse.success(service.findByYear(year)));
    }

    @GetMapping("/department/{department}")
    @Operation(summary = "부서별 예산")
    public ResponseEntity<ApiResponse<List<PpeBudgetResponse>>> findByDepartment(@PathVariable String department) {
        return ResponseEntity.ok(ApiResponse.success(service.findByDepartment(department)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "예산 상세")
    public ResponseEntity<ApiResponse<PpeBudgetResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/kpi")
    @Operation(summary = "KPI (총예산/집행/잔여/집행율)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getKpi(@RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(ApiResponse.success(service.getKpi(year)));
    }

    @PostMapping
    @Operation(summary = "예산 등록")
    public ResponseEntity<ApiResponse<PpeBudgetResponse>> create(@RequestBody PpeBudgetRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.create(req)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "예산 수정")
    public ResponseEntity<ApiResponse<PpeBudgetResponse>> update(
            @PathVariable Long id, @RequestBody PpeBudgetRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "예산 삭제 (soft)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
