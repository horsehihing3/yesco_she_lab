package com.smartehs.controller;

import com.smartehs.dto.request.ChemicalReachRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.ChemicalReach;
import com.smartehs.service.ChemicalReachService;
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
@RequestMapping("/chemical-reach")
@RequiredArgsConstructor
@Tag(name = "Chemical REACH", description = "EU REACH 관리 API")
public class ChemicalReachController {

    private final ChemicalReachService chemicalReachService;

    @GetMapping
    @Operation(summary = "EU REACH 목록 조회")
    public ResponseEntity<ApiResponse<Page<ChemicalReach>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalReach> result = chemicalReachService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/search")
    @Operation(summary = "EU REACH 검색")
    public ResponseEntity<ApiResponse<Page<ChemicalReach>>> search(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalReach> result = chemicalReachService.search(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "EU REACH 상세 조회")
    public ResponseEntity<ApiResponse<ChemicalReach>> findById(@PathVariable Long id) {
        ChemicalReach result = chemicalReachService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "EU REACH 등록")
    public ResponseEntity<ApiResponse<ChemicalReach>> create(
            @Valid @RequestBody ChemicalReachRequest request) {
        ChemicalReach result = chemicalReachService.create(request);
        return ResponseEntity.ok(ApiResponse.success("ChemicalReach created successfully", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "EU REACH 수정")
    public ResponseEntity<ApiResponse<ChemicalReach>> update(
            @PathVariable Long id,
            @Valid @RequestBody ChemicalReachRequest request) {
        ChemicalReach result = chemicalReachService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("ChemicalReach updated successfully", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "EU REACH 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        chemicalReachService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("ChemicalReach deleted successfully", null));
    }
}
