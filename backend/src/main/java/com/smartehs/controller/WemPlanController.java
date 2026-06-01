package com.smartehs.controller;

import com.smartehs.dto.request.WemPlanRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.WemPlanResponse;
import com.smartehs.service.WemPlanService;
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

@RestController
@RequestMapping("/wem-plans")
@RequiredArgsConstructor
@Tag(name = "WEM Plan", description = "작업환경 측정계획 관리 API")
public class WemPlanController {

    private final WemPlanService wemPlanService;

    @GetMapping
    @Operation(summary = "List measurement plans", description = "Get all WEM plans with optional status filter and pagination")
    public ResponseEntity<ApiResponse<Page<WemPlanResponse>>> findAll(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<WemPlanResponse> plans;
        if (status != null) {
            plans = wemPlanService.findByStatus(status, pageable);
        } else {
            plans = wemPlanService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(plans));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get plan by ID", description = "Get a specific WEM plan by ID")
    public ResponseEntity<ApiResponse<WemPlanResponse>> findById(@PathVariable Long id) {
        WemPlanResponse plan = wemPlanService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(plan));
    }

    @PostMapping
    @Operation(summary = "Create plan", description = "Create a new WEM plan")
    public ResponseEntity<ApiResponse<WemPlanResponse>> create(
            @Valid @RequestBody WemPlanRequest request) {
        WemPlanResponse plan = wemPlanService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Plan created successfully", plan));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update plan", description = "Update an existing WEM plan")
    public ResponseEntity<ApiResponse<WemPlanResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody WemPlanRequest request) {
        WemPlanResponse plan = wemPlanService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Plan updated successfully", plan));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete plan", description = "Delete a WEM plan")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        wemPlanService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Plan deleted successfully", null));
    }
}
