package com.smartehs.controller;

import com.smartehs.dto.request.WorkplaceMeasurementRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.WorkplaceMeasurementResponse;
import com.smartehs.service.WorkplaceMeasurementService;
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
@RequestMapping("/workplace-measurement")
@RequiredArgsConstructor
@Tag(name = "Workplace Measurement", description = "작업환경측정 관리 API")
public class WorkplaceMeasurementController {

    private final WorkplaceMeasurementService measurementService;

    @GetMapping
    @Operation(summary = "작업환경측정 목록 조회")
    public ResponseEntity<ApiResponse<Page<WorkplaceMeasurementResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<WorkplaceMeasurementResponse> result = measurementService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "작업환경측정 상세 조회")
    public ResponseEntity<ApiResponse<WorkplaceMeasurementResponse>> findById(@PathVariable Long id) {
        WorkplaceMeasurementResponse result = measurementService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/year/{year}")
    @Operation(summary = "연도별 작업환경측정 조회")
    public ResponseEntity<ApiResponse<Page<WorkplaceMeasurementResponse>>> findByYear(
            @PathVariable int year,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<WorkplaceMeasurementResponse> result = measurementService.findByYear(year, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/search")
    @Operation(summary = "작업환경측정 검색")
    public ResponseEntity<ApiResponse<Page<WorkplaceMeasurementResponse>>> search(
            @RequestParam String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<WorkplaceMeasurementResponse> result = measurementService.searchByKeyword(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "작업환경측정 등록")
    public ResponseEntity<ApiResponse<WorkplaceMeasurementResponse>> create(
            @Valid @RequestBody WorkplaceMeasurementRequest request) {
        WorkplaceMeasurementResponse result = measurementService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Workplace measurement created successfully", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "작업환경측정 수정")
    public ResponseEntity<ApiResponse<WorkplaceMeasurementResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody WorkplaceMeasurementRequest request) {
        WorkplaceMeasurementResponse result = measurementService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Workplace measurement updated successfully", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "작업환경측정 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        measurementService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Workplace measurement deleted successfully", null));
    }
}
