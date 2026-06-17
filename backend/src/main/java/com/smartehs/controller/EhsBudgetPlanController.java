package com.smartehs.controller;

import com.smartehs.dto.request.EhsBudgetPlanRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.EhsBudgetPlanResponse;
import com.smartehs.service.EhsBudgetPlanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ehs-budget-plans")
@RequiredArgsConstructor
@Tag(name = "SHE Budget Plan", description = "SHE 예산 계획 관리 API")
public class EhsBudgetPlanController {

    private final EhsBudgetPlanService ehsBudgetPlanService;

    @GetMapping
    @Operation(summary = "List budget plans", description = "Get all SHE budget plans with optional year filter and pagination")
    public ResponseEntity<ApiResponse<Page<EhsBudgetPlanResponse>>> findAll(
            @RequestParam(required = false, defaultValue = "2026") Integer year,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EhsBudgetPlanResponse> plans = ehsBudgetPlanService.findAll(year, pageable);
        return ResponseEntity.ok(ApiResponse.success(plans));
    }

    @GetMapping("/by-year/{year}")
    @Operation(summary = "List all plans for year", description = "Get all SHE budget plans for a specific year (no pagination, for compare view)")
    public ResponseEntity<ApiResponse<List<EhsBudgetPlanResponse>>> findByYear(@PathVariable Integer year) {
        List<EhsBudgetPlanResponse> plans = ehsBudgetPlanService.findByYear(year);
        return ResponseEntity.ok(ApiResponse.success(plans));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get budget plan by ID", description = "Get a specific SHE budget plan by ID")
    public ResponseEntity<ApiResponse<EhsBudgetPlanResponse>> findById(@PathVariable Long id) {
        EhsBudgetPlanResponse plan = ehsBudgetPlanService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(plan));
    }

    @PostMapping
    @Operation(summary = "Create budget plan", description = "Create a new SHE budget plan")
    public ResponseEntity<ApiResponse<EhsBudgetPlanResponse>> create(
            @Valid @RequestBody EhsBudgetPlanRequest request) {
        EhsBudgetPlanResponse plan = ehsBudgetPlanService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Budget plan created successfully", plan));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update budget plan", description = "Update an existing SHE budget plan")
    public ResponseEntity<ApiResponse<EhsBudgetPlanResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody EhsBudgetPlanRequest request) {
        EhsBudgetPlanResponse plan = ehsBudgetPlanService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Budget plan updated successfully", plan));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete budget plan", description = "Delete an SHE budget plan")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        ehsBudgetPlanService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Budget plan deleted successfully", null));
    }
}
