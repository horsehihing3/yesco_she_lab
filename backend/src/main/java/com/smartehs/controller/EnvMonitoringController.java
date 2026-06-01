package com.smartehs.controller;

import com.smartehs.dto.request.EnvMonitoringRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.EnvMonitoringResponse;
import com.smartehs.service.EnvMonitoringService;
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

import java.util.Map;

@RestController
@RequestMapping("/env-monitoring")
@RequiredArgsConstructor
@Tag(name = "Environmental Monitoring", description = "Environmental Monitoring API")
public class EnvMonitoringController {

    private final EnvMonitoringService envMonitoringService;

    @GetMapping
    @Operation(summary = "List records", description = "Get all environmental monitoring records with pagination")
    public ResponseEntity<ApiResponse<Page<EnvMonitoringResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EnvMonitoringResponse> records = envMonitoringService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(records));
    }

    @GetMapping("/search")
    @Operation(summary = "Search records", description = "Search environmental monitoring records by keyword")
    public ResponseEntity<ApiResponse<Page<EnvMonitoringResponse>>> search(
            @RequestParam String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EnvMonitoringResponse> records = envMonitoringService.search(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(records));
    }

    @GetMapping("/type/{monitorType}")
    @Operation(summary = "Find by type", description = "Get records by monitor type")
    public ResponseEntity<ApiResponse<Page<EnvMonitoringResponse>>> findByType(
            @PathVariable String monitorType,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EnvMonitoringResponse> records = envMonitoringService.findByType(monitorType, pageable);
        return ResponseEntity.ok(ApiResponse.success(records));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Find by status", description = "Get records by status")
    public ResponseEntity<ApiResponse<Page<EnvMonitoringResponse>>> findByStatus(
            @PathVariable String status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EnvMonitoringResponse> records = envMonitoringService.findByStatus(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(records));
    }

    @GetMapping("/kpi")
    @Operation(summary = "Get KPI counts", description = "Get status-based KPI counts for dashboard")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getKpi() {
        Map<String, Integer> kpi = envMonitoringService.getKpiCounts();
        return ResponseEntity.ok(ApiResponse.success(kpi));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get record by ID", description = "Get a specific environmental monitoring record")
    public ResponseEntity<ApiResponse<EnvMonitoringResponse>> findById(@PathVariable Long id) {
        EnvMonitoringResponse record = envMonitoringService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(record));
    }

    @PostMapping
    @Operation(summary = "Create record", description = "Create a new environmental monitoring record")
    public ResponseEntity<ApiResponse<EnvMonitoringResponse>> create(
            @Valid @RequestBody EnvMonitoringRequest request) {
        EnvMonitoringResponse record = envMonitoringService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Environmental monitoring record created successfully", record));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update record", description = "Update an existing environmental monitoring record")
    public ResponseEntity<ApiResponse<EnvMonitoringResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody EnvMonitoringRequest request) {
        EnvMonitoringResponse record = envMonitoringService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Environmental monitoring record updated successfully", record));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete record", description = "Soft delete an environmental monitoring record")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        envMonitoringService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Environmental monitoring record deleted successfully", null));
    }
}
