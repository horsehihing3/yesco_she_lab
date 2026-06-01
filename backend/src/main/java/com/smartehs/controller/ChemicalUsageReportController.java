package com.smartehs.controller;

import com.smartehs.dto.request.ChemicalUsageReportRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.ChemicalUsageReport;
import com.smartehs.service.ChemicalUsageReportService;
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
@RequestMapping("/chemical-usage-reports")
@RequiredArgsConstructor
@Tag(name = "Chemical Usage Report", description = "화학물질 사용 보고 API")
public class ChemicalUsageReportController {

    private final ChemicalUsageReportService chemicalUsageReportService;

    @GetMapping
    @Operation(summary = "화학물질 사용 보고 목록 조회")
    public ResponseEntity<ApiResponse<Page<ChemicalUsageReport>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalUsageReport> result = chemicalUsageReportService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/search")
    @Operation(summary = "화학물질 사용 보고 검색")
    public ResponseEntity<ApiResponse<Page<ChemicalUsageReport>>> search(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalUsageReport> result = chemicalUsageReportService.search(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "화학물질 사용 보고 상세 조회")
    public ResponseEntity<ApiResponse<ChemicalUsageReport>> findById(@PathVariable Long id) {
        ChemicalUsageReport result = chemicalUsageReportService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "화학물질 사용 보고 등록")
    public ResponseEntity<ApiResponse<ChemicalUsageReport>> create(
            @Valid @RequestBody ChemicalUsageReportRequest request) {
        ChemicalUsageReport result = chemicalUsageReportService.create(request);
        return ResponseEntity.ok(ApiResponse.success("ChemicalUsageReport created successfully", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "화학물질 사용 보고 수정")
    public ResponseEntity<ApiResponse<ChemicalUsageReport>> update(
            @PathVariable Long id,
            @Valid @RequestBody ChemicalUsageReportRequest request) {
        ChemicalUsageReport result = chemicalUsageReportService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("ChemicalUsageReport updated successfully", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "화학물질 사용 보고 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        chemicalUsageReportService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("ChemicalUsageReport deleted successfully", null));
    }
}
