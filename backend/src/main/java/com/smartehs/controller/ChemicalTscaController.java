package com.smartehs.controller;

import com.smartehs.dto.request.ChemicalTscaRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.ChemicalTsca;
import com.smartehs.service.ChemicalTscaService;
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
@RequestMapping("/chemical-tsca")
@RequiredArgsConstructor
@Tag(name = "Chemical TSCA", description = "TSCA 관리 API")
public class ChemicalTscaController {

    private final ChemicalTscaService chemicalTscaService;

    @GetMapping
    @Operation(summary = "TSCA 목록 조회")
    public ResponseEntity<ApiResponse<Page<ChemicalTsca>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalTsca> result = chemicalTscaService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/search")
    @Operation(summary = "TSCA 검색")
    public ResponseEntity<ApiResponse<Page<ChemicalTsca>>> search(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalTsca> result = chemicalTscaService.search(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "TSCA 상세 조회")
    public ResponseEntity<ApiResponse<ChemicalTsca>> findById(@PathVariable Long id) {
        ChemicalTsca result = chemicalTscaService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "TSCA 등록")
    public ResponseEntity<ApiResponse<ChemicalTsca>> create(
            @Valid @RequestBody ChemicalTscaRequest request) {
        ChemicalTsca result = chemicalTscaService.create(request);
        return ResponseEntity.ok(ApiResponse.success("ChemicalTsca created successfully", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "TSCA 수정")
    public ResponseEntity<ApiResponse<ChemicalTsca>> update(
            @PathVariable Long id,
            @Valid @RequestBody ChemicalTscaRequest request) {
        ChemicalTsca result = chemicalTscaService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("ChemicalTsca updated successfully", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "TSCA 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        chemicalTscaService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("ChemicalTsca deleted successfully", null));
    }
}
