package com.smartehs.controller;

import com.smartehs.dto.request.EhsPlanRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.EhsPlanResponse;
import com.smartehs.service.EhsPlanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/plans")
@RequiredArgsConstructor
@Tag(name = "SHE Plan", description = "SHE Plan API")
public class EhsPlanController {

    private final EhsPlanService planService;

    @GetMapping
    @Operation(summary = "List plans", description = "Get all SHE plans with pagination")
    public ResponseEntity<ApiResponse<Page<EhsPlanResponse>>> findAll(
            @PageableDefault(size = 20, sort = "planDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EhsPlanResponse> plans = planService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(plans));
    }

    @GetMapping("/search")
    @Operation(summary = "Search plans", description = "Search SHE plans by title")
    public ResponseEntity<ApiResponse<Page<EhsPlanResponse>>> search(
            @RequestParam String title,
            @PageableDefault(size = 20, sort = "planDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EhsPlanResponse> plans = planService.search(title, pageable);
        return ResponseEntity.ok(ApiResponse.success(plans));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Find by category", description = "Get SHE plans by category")
    public ResponseEntity<ApiResponse<Page<EhsPlanResponse>>> findByCategory(
            @PathVariable String category,
            @PageableDefault(size = 20, sort = "planDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EhsPlanResponse> plans = planService.findByCategory(category, pageable);
        return ResponseEntity.ok(ApiResponse.success(plans));
    }

    @GetMapping("/date-range")
    @Operation(summary = "Find by date range", description = "Get SHE plans within date range")
    public ResponseEntity<ApiResponse<List<EhsPlanResponse>>> findByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<EhsPlanResponse> plans = planService.findByDateRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(plans));
    }

    @GetMapping("/overlapping")
    @Operation(summary = "Find overlapping plans", description = "Get SHE plans that overlap with date range")
    public ResponseEntity<ApiResponse<List<EhsPlanResponse>>> findOverlappingPlans(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<EhsPlanResponse> plans = planService.findOverlappingPlans(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(plans));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get plan by ID", description = "Get a specific SHE plan by ID")
    public ResponseEntity<ApiResponse<EhsPlanResponse>> findById(@PathVariable Long id) {
        EhsPlanResponse plan = planService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(plan));
    }

    @PostMapping
    @Operation(summary = "Create plan", description = "Create a new SHE plan")
    public ResponseEntity<ApiResponse<EhsPlanResponse>> create(
            @Valid @RequestBody EhsPlanRequest request) {
        EhsPlanResponse plan = planService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Plan created successfully", plan));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update plan", description = "Update an existing SHE plan")
    public ResponseEntity<ApiResponse<EhsPlanResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody EhsPlanRequest request) {
        EhsPlanResponse plan = planService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Plan updated successfully", plan));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete plan", description = "Delete an SHE plan")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        planService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Plan deleted successfully", null));
    }
}
