package com.smartehs.controller;

import com.smartehs.dto.request.HealthCheckupRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.HealthCheckupResponse;
import com.smartehs.service.HealthCheckupService;
import io.swagger.v3.oas.annotations.Operation;
import java.util.List;
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
@RequestMapping("/health-checkup")
@RequiredArgsConstructor
@Tag(name = "Health Checkup", description = "Health Checkup Management API")
public class HealthCheckupController {

    private final HealthCheckupService healthCheckupService;

    @GetMapping
    @Operation(summary = "List health checkups", description = "Get all health checkups with pagination")
    public ResponseEntity<ApiResponse<Page<HealthCheckupResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<HealthCheckupResponse> checkups = healthCheckupService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(checkups));
    }

    @GetMapping("/search")
    @Operation(summary = "Search by employee name", description = "Search health checkups by employee name")
    public ResponseEntity<ApiResponse<Page<HealthCheckupResponse>>> searchByName(
            @RequestParam String name,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<HealthCheckupResponse> checkups = healthCheckupService.searchByName(name, pageable);
        return ResponseEntity.ok(ApiResponse.success(checkups));
    }

    @GetMapping("/year/{year}")
    @Operation(summary = "Find by year", description = "Get health checkups by checkup year")
    public ResponseEntity<ApiResponse<Page<HealthCheckupResponse>>> findByYear(
            @PathVariable int year,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<HealthCheckupResponse> checkups = healthCheckupService.findByYear(year, pageable);
        return ResponseEntity.ok(ApiResponse.success(checkups));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Find by status", description = "Get health checkups by status")
    public ResponseEntity<ApiResponse<Page<HealthCheckupResponse>>> findByStatus(
            @PathVariable String status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<HealthCheckupResponse> checkups = healthCheckupService.findByStatus(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(checkups));
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Find by employee", description = "Get health checkups by employee ID")
    public ResponseEntity<ApiResponse<Page<HealthCheckupResponse>>> findByEmployee(
            @PathVariable String employeeId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<HealthCheckupResponse> checkups = healthCheckupService.findByEmployee(employeeId, pageable);
        return ResponseEntity.ok(ApiResponse.success(checkups));
    }

    @GetMapping("/my")
    @Operation(summary = "Find my checkups", description = "Get all health checkups for current user by email, with details")
    public ResponseEntity<ApiResponse<List<HealthCheckupResponse>>> findMyCheckups(
            @RequestParam String email) {
        List<HealthCheckupResponse> checkups = healthCheckupService.findAllByEmail(email);
        return ResponseEntity.ok(ApiResponse.success(checkups));
    }

    @GetMapping("/targets/{year}")
    @Operation(summary = "Find checkup targets", description = "Get checkup target employees by year")
    public ResponseEntity<ApiResponse<Page<HealthCheckupResponse>>> findTargets(
            @PathVariable int year,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<HealthCheckupResponse> checkups = healthCheckupService.findTargets(year, pageable);
        return ResponseEntity.ok(ApiResponse.success(checkups));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get health checkup by ID", description = "Get a specific health checkup with details")
    public ResponseEntity<ApiResponse<HealthCheckupResponse>> findById(@PathVariable Long id) {
        HealthCheckupResponse checkup = healthCheckupService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(checkup));
    }

    @PostMapping
    @Operation(summary = "Create health checkup", description = "Create a new health checkup record")
    public ResponseEntity<ApiResponse<HealthCheckupResponse>> create(
            @Valid @RequestBody HealthCheckupRequest request) {
        HealthCheckupResponse checkup = healthCheckupService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Health checkup created successfully", checkup));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update health checkup", description = "Update an existing health checkup record")
    public ResponseEntity<ApiResponse<HealthCheckupResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody HealthCheckupRequest request) {
        HealthCheckupResponse checkup = healthCheckupService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Health checkup updated successfully", checkup));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete health checkup", description = "Soft delete a health checkup record")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        healthCheckupService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Health checkup deleted successfully", null));
    }
}
