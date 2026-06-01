package com.smartehs.controller;

import com.smartehs.dto.request.ChemicalUsageRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.ChemicalUsage;
import com.smartehs.service.ChemicalUsageService;
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
@RequestMapping("/chemical-usage")
@RequiredArgsConstructor
@Tag(name = "Chemical Usage", description = "화학물질 사용 관리 API")
public class ChemicalUsageController {

    private final ChemicalUsageService chemicalUsageService;

    @GetMapping
    @Operation(summary = "화학물질 사용 목록 조회")
    public ResponseEntity<ApiResponse<Page<ChemicalUsage>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalUsage> result = chemicalUsageService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/search")
    @Operation(summary = "화학물질 사용 검색")
    public ResponseEntity<ApiResponse<Page<ChemicalUsage>>> search(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalUsage> result = chemicalUsageService.search(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "화학물질 사용 상세 조회")
    public ResponseEntity<ApiResponse<ChemicalUsage>> findById(@PathVariable Long id) {
        ChemicalUsage result = chemicalUsageService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "화학물질 사용 등록")
    public ResponseEntity<ApiResponse<ChemicalUsage>> create(
            @Valid @RequestBody ChemicalUsageRequest request) {
        ChemicalUsage result = chemicalUsageService.create(request);
        return ResponseEntity.ok(ApiResponse.success("ChemicalUsage created successfully", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "화학물질 사용 수정")
    public ResponseEntity<ApiResponse<ChemicalUsage>> update(
            @PathVariable Long id,
            @Valid @RequestBody ChemicalUsageRequest request) {
        ChemicalUsage result = chemicalUsageService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("ChemicalUsage updated successfully", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "화학물질 사용 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        chemicalUsageService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("ChemicalUsage deleted successfully", null));
    }
}
