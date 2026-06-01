package com.smartehs.controller;

import com.smartehs.dto.request.ChemicalRegulationRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.ChemicalRegulation;
import com.smartehs.service.ChemicalRegulationService;
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
@RequestMapping("/chemical-regulations")
@RequiredArgsConstructor
@Tag(name = "Chemical Regulation", description = "화학물질 규제 관리 API")
public class ChemicalRegulationController {

    private final ChemicalRegulationService chemicalRegulationService;

    @GetMapping
    @Operation(summary = "화학물질 규제 목록 조회")
    public ResponseEntity<ApiResponse<Page<ChemicalRegulation>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalRegulation> result = chemicalRegulationService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/search")
    @Operation(summary = "화학물질 규제 검색")
    public ResponseEntity<ApiResponse<Page<ChemicalRegulation>>> search(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalRegulation> result = chemicalRegulationService.search(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "화학물질 규제 상세 조회")
    public ResponseEntity<ApiResponse<ChemicalRegulation>> findById(@PathVariable Long id) {
        ChemicalRegulation result = chemicalRegulationService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "화학물질 규제 등록")
    public ResponseEntity<ApiResponse<ChemicalRegulation>> create(
            @Valid @RequestBody ChemicalRegulationRequest request) {
        ChemicalRegulation result = chemicalRegulationService.create(request);
        return ResponseEntity.ok(ApiResponse.success("ChemicalRegulation created successfully", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "화학물질 규제 수정")
    public ResponseEntity<ApiResponse<ChemicalRegulation>> update(
            @PathVariable Long id,
            @Valid @RequestBody ChemicalRegulationRequest request) {
        ChemicalRegulation result = chemicalRegulationService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("ChemicalRegulation updated successfully", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "화학물질 규제 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        chemicalRegulationService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("ChemicalRegulation deleted successfully", null));
    }
}
