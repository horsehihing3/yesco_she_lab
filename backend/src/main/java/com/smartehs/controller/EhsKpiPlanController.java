package com.smartehs.controller;

import com.smartehs.dto.request.EhsKpiPlanRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.EhsKpiPlanResponse;
import com.smartehs.service.EhsKpiPlanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ehs-kpi-plan")
@RequiredArgsConstructor
@Tag(name = "EHS KPI Plan", description = "EHS KPI 계획 관리")
public class EhsKpiPlanController {

    private final EhsKpiPlanService ehsKpiPlanService;

    @GetMapping
    @Operation(summary = "KPI 계획 전체 목록 조회")
    public ResponseEntity<ApiResponse<Page<EhsKpiPlanResponse>>> findAll(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(ehsKpiPlanService.findAll(pageable)));
    }

    @GetMapping("/search")
    @Operation(summary = "KPI 계획 검색")
    public ResponseEntity<ApiResponse<Page<EhsKpiPlanResponse>>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String indicatorType,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(ehsKpiPlanService.search(keyword, indicatorType, pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "KPI 계획 상세 조회")
    public ResponseEntity<ApiResponse<EhsKpiPlanResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(ehsKpiPlanService.findById(id)));
    }

    @PostMapping
    @Operation(summary = "KPI 계획 등록")
    public ResponseEntity<ApiResponse<EhsKpiPlanResponse>> create(@Valid @RequestBody EhsKpiPlanRequest request) {
        return ResponseEntity.ok(ApiResponse.success(ehsKpiPlanService.create(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "KPI 계획 수정")
    public ResponseEntity<ApiResponse<EhsKpiPlanResponse>> update(@PathVariable Long id, @Valid @RequestBody EhsKpiPlanRequest request) {
        return ResponseEntity.ok(ApiResponse.success(ehsKpiPlanService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "KPI 계획 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        ehsKpiPlanService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
