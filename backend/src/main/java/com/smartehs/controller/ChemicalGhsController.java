package com.smartehs.controller;

import com.smartehs.dto.request.ChemicalGhsRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.ChemicalGhs;
import com.smartehs.service.ChemicalGhsService;
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
@RequestMapping("/chemical-ghs")
@RequiredArgsConstructor
@Tag(name = "Chemical GHS", description = "GHS 분류 관리 API")
public class ChemicalGhsController {

    private final ChemicalGhsService chemicalGhsService;

    @GetMapping
    @Operation(summary = "GHS 분류 목록 조회")
    public ResponseEntity<ApiResponse<Page<ChemicalGhs>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalGhs> result = chemicalGhsService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/search")
    @Operation(summary = "GHS 분류 검색")
    public ResponseEntity<ApiResponse<Page<ChemicalGhs>>> search(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalGhs> result = chemicalGhsService.search(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "GHS 분류 상세 조회")
    public ResponseEntity<ApiResponse<ChemicalGhs>> findById(@PathVariable Long id) {
        ChemicalGhs result = chemicalGhsService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "GHS 분류 등록")
    public ResponseEntity<ApiResponse<ChemicalGhs>> create(
            @Valid @RequestBody ChemicalGhsRequest request) {
        ChemicalGhs result = chemicalGhsService.create(request);
        return ResponseEntity.ok(ApiResponse.success("ChemicalGhs created successfully", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "GHS 분류 수정")
    public ResponseEntity<ApiResponse<ChemicalGhs>> update(
            @PathVariable Long id,
            @Valid @RequestBody ChemicalGhsRequest request) {
        ChemicalGhs result = chemicalGhsService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("ChemicalGhs updated successfully", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "GHS 분류 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        chemicalGhsService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("ChemicalGhs deleted successfully", null));
    }
}
