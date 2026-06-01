package com.smartehs.controller;

import com.smartehs.dto.request.SafetyWorkListRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.SafetyWorkListResponse;
import com.smartehs.service.SafetyWorkListService;
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
@RequestMapping("/safety-works")
@RequiredArgsConstructor
@Tag(name = "Safety Work List", description = "Safety Work Permit API")
public class SafetyWorkListController {

    private final SafetyWorkListService safetyWorkService;

    @GetMapping
    @Operation(summary = "List safety works", description = "Get all safety works with pagination")
    public ResponseEntity<ApiResponse<Page<SafetyWorkListResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SafetyWorkListResponse> safetyWorks = safetyWorkService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(safetyWorks));
    }

    @GetMapping("/search")
    @Operation(summary = "Search safety works", description = "Search safety works by title")
    public ResponseEntity<ApiResponse<Page<SafetyWorkListResponse>>> search(
            @RequestParam String title,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SafetyWorkListResponse> safetyWorks = safetyWorkService.search(title, pageable);
        return ResponseEntity.ok(ApiResponse.success(safetyWorks));
    }

    @GetMapping("/location/{location}")
    @Operation(summary = "Find by location", description = "Get safety works by location")
    public ResponseEntity<ApiResponse<Page<SafetyWorkListResponse>>> findByLocation(
            @PathVariable String location,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SafetyWorkListResponse> safetyWorks = safetyWorkService.findByLocation(location, pageable);
        return ResponseEntity.ok(ApiResponse.success(safetyWorks));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Find by status", description = "Get safety works by status")
    public ResponseEntity<ApiResponse<Page<SafetyWorkListResponse>>> findByStatus(
            @PathVariable String status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SafetyWorkListResponse> safetyWorks = safetyWorkService.findByStatus(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(safetyWorks));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get safety work by ID", description = "Get a specific safety work by ID")
    public ResponseEntity<ApiResponse<SafetyWorkListResponse>> findById(@PathVariable Long id) {
        SafetyWorkListResponse safetyWork = safetyWorkService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(safetyWork));
    }

    @GetMapping("/uuid/{safetyWorkId}")
    @Operation(summary = "Get safety work by UUID", description = "Get a specific safety work by UUID")
    public ResponseEntity<ApiResponse<SafetyWorkListResponse>> findBySafetyWorkId(@PathVariable String safetyWorkId) {
        SafetyWorkListResponse safetyWork = safetyWorkService.findBySafetyWorkId(safetyWorkId);
        return ResponseEntity.ok(ApiResponse.success(safetyWork));
    }

    @PostMapping
    @Operation(summary = "Create safety work", description = "Create a new safety work permit")
    public ResponseEntity<ApiResponse<SafetyWorkListResponse>> create(
            @Valid @RequestBody SafetyWorkListRequest request) {
        SafetyWorkListResponse safetyWork = safetyWorkService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Safety work created successfully", safetyWork));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update safety work", description = "Update an existing safety work")
    public ResponseEntity<ApiResponse<SafetyWorkListResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody SafetyWorkListRequest request) {
        SafetyWorkListResponse safetyWork = safetyWorkService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Safety work updated successfully", safetyWork));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete safety work", description = "Delete a safety work")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        safetyWorkService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Safety work deleted successfully", null));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update status", description = "Update safety work status")
    public ResponseEntity<ApiResponse<SafetyWorkListResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        SafetyWorkListResponse safetyWork = safetyWorkService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Safety work status updated successfully", safetyWork));
    }
}
