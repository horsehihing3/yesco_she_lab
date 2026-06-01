package com.smartehs.controller;

import com.smartehs.dto.request.ChemicalHazardReportRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.ChemicalHazardReport;
import com.smartehs.service.ChemicalHazardReportService;
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
@RequestMapping("/chemical-hazard-reports")
@RequiredArgsConstructor
@Tag(name = "Chemical Hazard Report", description = "유해화학물질 사용 보고 API")
public class ChemicalHazardReportController {

    private final ChemicalHazardReportService chemicalHazardReportService;

    @GetMapping
    @Operation(summary = "유해화학물질 사용 보고 목록 조회")
    public ResponseEntity<ApiResponse<Page<ChemicalHazardReport>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalHazardReport> result = chemicalHazardReportService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/search")
    @Operation(summary = "유해화학물질 사용 보고 검색")
    public ResponseEntity<ApiResponse<Page<ChemicalHazardReport>>> search(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalHazardReport> result = chemicalHazardReportService.search(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "유해화학물질 사용 보고 상세 조회")
    public ResponseEntity<ApiResponse<ChemicalHazardReport>> findById(@PathVariable Long id) {
        ChemicalHazardReport result = chemicalHazardReportService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "유해화학물질 사용 보고 등록")
    public ResponseEntity<ApiResponse<ChemicalHazardReport>> create(
            @Valid @RequestBody ChemicalHazardReportRequest request) {
        ChemicalHazardReport result = chemicalHazardReportService.create(request);
        return ResponseEntity.ok(ApiResponse.success("ChemicalHazardReport created successfully", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "유해화학물질 사용 보고 수정")
    public ResponseEntity<ApiResponse<ChemicalHazardReport>> update(
            @PathVariable Long id,
            @Valid @RequestBody ChemicalHazardReportRequest request) {
        ChemicalHazardReport result = chemicalHazardReportService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("ChemicalHazardReport updated successfully", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "유해화학물질 사용 보고 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        chemicalHazardReportService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("ChemicalHazardReport deleted successfully", null));
    }
}
