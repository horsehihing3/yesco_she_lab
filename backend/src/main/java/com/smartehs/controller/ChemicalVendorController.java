package com.smartehs.controller;

import com.smartehs.dto.request.ChemicalVendorRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.ChemicalVendor;
import com.smartehs.service.ChemicalVendorService;
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
@RequestMapping("/chemical-vendors")
@RequiredArgsConstructor
@Tag(name = "Chemical Vendor", description = "화학물질 협력사 관리 API")
public class ChemicalVendorController {

    private final ChemicalVendorService chemicalVendorService;

    @GetMapping
    @Operation(summary = "화학물질 협력사 목록 조회")
    public ResponseEntity<ApiResponse<Page<ChemicalVendor>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalVendor> result = chemicalVendorService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/search")
    @Operation(summary = "화학물질 협력사 검색")
    public ResponseEntity<ApiResponse<Page<ChemicalVendor>>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String grade,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalVendor> result = chemicalVendorService.search(keyword, grade, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "화학물질 협력사 상세 조회")
    public ResponseEntity<ApiResponse<ChemicalVendor>> findById(@PathVariable Long id) {
        ChemicalVendor result = chemicalVendorService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "화학물질 협력사 등록")
    public ResponseEntity<ApiResponse<ChemicalVendor>> create(
            @Valid @RequestBody ChemicalVendorRequest request) {
        ChemicalVendor result = chemicalVendorService.create(request);
        return ResponseEntity.ok(ApiResponse.success("ChemicalVendor created successfully", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "화학물질 협력사 수정")
    public ResponseEntity<ApiResponse<ChemicalVendor>> update(
            @PathVariable Long id,
            @Valid @RequestBody ChemicalVendorRequest request) {
        ChemicalVendor result = chemicalVendorService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("ChemicalVendor updated successfully", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "화학물질 협력사 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        chemicalVendorService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("ChemicalVendor deleted successfully", null));
    }
}
