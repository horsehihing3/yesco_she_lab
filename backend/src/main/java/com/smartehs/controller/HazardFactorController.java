package com.smartehs.controller;

import com.smartehs.dto.request.HazardFactorRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.HazardFactorResponse;
import com.smartehs.service.HazardFactorService;
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
@RequestMapping("/hazard-factors")
@RequiredArgsConstructor
@Tag(name = "Disease Prevention", description = "질병예방 유해인자 관리 API")
public class HazardFactorController {

    private final HazardFactorService hazardFactorService;

    @GetMapping("/type/{hazardType}")
    @Operation(summary = "List hazard factors by type", description = "유해인자 유형별 목록 조회 (페이징)")
    public ResponseEntity<ApiResponse<Page<HazardFactorResponse>>> findByType(
            @PathVariable String hazardType,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<HazardFactorResponse> result = hazardFactorService.findByType(hazardType, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/type/{hazardType}/risk/{riskLevel}")
    @Operation(summary = "Filter by risk level", description = "유해인자 유형 및 위험도별 조회")
    public ResponseEntity<ApiResponse<Page<HazardFactorResponse>>> findByTypeAndRiskLevel(
            @PathVariable String hazardType,
            @PathVariable String riskLevel,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<HazardFactorResponse> result = hazardFactorService.findByTypeAndRiskLevel(hazardType, riskLevel, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/type/{hazardType}/search")
    @Operation(summary = "Search hazard factors", description = "유해인자명 검색")
    public ResponseEntity<ApiResponse<Page<HazardFactorResponse>>> searchByName(
            @PathVariable String hazardType,
            @RequestParam String name,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<HazardFactorResponse> result = hazardFactorService.searchByName(hazardType, name, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get hazard factor by ID", description = "유해인자 상세 조회")
    public ResponseEntity<ApiResponse<HazardFactorResponse>> findById(@PathVariable Long id) {
        HazardFactorResponse result = hazardFactorService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "Create hazard factor", description = "유해인자 등록")
    public ResponseEntity<ApiResponse<HazardFactorResponse>> create(
            @Valid @RequestBody HazardFactorRequest request) {
        HazardFactorResponse result = hazardFactorService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Hazard factor created successfully", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update hazard factor", description = "유해인자 수정")
    public ResponseEntity<ApiResponse<HazardFactorResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody HazardFactorRequest request) {
        HazardFactorResponse result = hazardFactorService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Hazard factor updated successfully", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete hazard factor", description = "유해인자 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        hazardFactorService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Hazard factor deleted successfully", null));
    }
}
