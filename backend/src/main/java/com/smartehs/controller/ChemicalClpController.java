package com.smartehs.controller;

import com.smartehs.dto.request.ChemicalClpRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.ChemicalClp;
import com.smartehs.service.ChemicalClpService;
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
@RequestMapping("/chemical-clp")
@RequiredArgsConstructor
@Tag(name = "Chemical CLP", description = "EU CLP 관리 API")
public class ChemicalClpController {

    private final ChemicalClpService chemicalClpService;

    @GetMapping
    @Operation(summary = "EU CLP 목록 조회")
    public ResponseEntity<ApiResponse<Page<ChemicalClp>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalClp> result = chemicalClpService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/search")
    @Operation(summary = "EU CLP 검색")
    public ResponseEntity<ApiResponse<Page<ChemicalClp>>> search(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalClp> result = chemicalClpService.search(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "EU CLP 상세 조회")
    public ResponseEntity<ApiResponse<ChemicalClp>> findById(@PathVariable Long id) {
        ChemicalClp result = chemicalClpService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "EU CLP 등록")
    public ResponseEntity<ApiResponse<ChemicalClp>> create(
            @Valid @RequestBody ChemicalClpRequest request) {
        ChemicalClp result = chemicalClpService.create(request);
        return ResponseEntity.ok(ApiResponse.success("ChemicalClp created successfully", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "EU CLP 수정")
    public ResponseEntity<ApiResponse<ChemicalClp>> update(
            @PathVariable Long id,
            @Valid @RequestBody ChemicalClpRequest request) {
        ChemicalClp result = chemicalClpService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("ChemicalClp updated successfully", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "EU CLP 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        chemicalClpService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("ChemicalClp deleted successfully", null));
    }
}
