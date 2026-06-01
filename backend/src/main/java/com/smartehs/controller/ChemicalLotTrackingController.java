package com.smartehs.controller;

import com.smartehs.dto.request.ChemicalLotTrackingRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.ChemicalLotTracking;
import com.smartehs.service.ChemicalLotTrackingService;
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
@RequestMapping("/chemical-lot-tracking")
@RequiredArgsConstructor
@Tag(name = "Chemical Lot Tracking", description = "화학물질 추적 관리 API")
public class ChemicalLotTrackingController {

    private final ChemicalLotTrackingService chemicalLotTrackingService;

    @GetMapping
    @Operation(summary = "화학물질 추적 목록 조회")
    public ResponseEntity<ApiResponse<Page<ChemicalLotTracking>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalLotTracking> result = chemicalLotTrackingService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/search")
    @Operation(summary = "화학물질 추적 검색")
    public ResponseEntity<ApiResponse<Page<ChemicalLotTracking>>> search(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalLotTracking> result = chemicalLotTrackingService.search(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "화학물질 추적 상세 조회")
    public ResponseEntity<ApiResponse<ChemicalLotTracking>> findById(@PathVariable Long id) {
        ChemicalLotTracking result = chemicalLotTrackingService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "화학물질 추적 등록")
    public ResponseEntity<ApiResponse<ChemicalLotTracking>> create(
            @Valid @RequestBody ChemicalLotTrackingRequest request) {
        ChemicalLotTracking result = chemicalLotTrackingService.create(request);
        return ResponseEntity.ok(ApiResponse.success("ChemicalLotTracking created successfully", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "화학물질 추적 수정")
    public ResponseEntity<ApiResponse<ChemicalLotTracking>> update(
            @PathVariable Long id,
            @Valid @RequestBody ChemicalLotTrackingRequest request) {
        ChemicalLotTracking result = chemicalLotTrackingService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("ChemicalLotTracking updated successfully", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "화학물질 추적 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        chemicalLotTrackingService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("ChemicalLotTracking deleted successfully", null));
    }
}
