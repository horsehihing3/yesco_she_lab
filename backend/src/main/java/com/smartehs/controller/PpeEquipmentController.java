package com.smartehs.controller;

import com.smartehs.dto.request.PpeEquipmentRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.PpeEquipmentResponse;
import com.smartehs.service.PpeEquipmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/ppe-equipment")
@RequiredArgsConstructor
@Tag(name = "PPE Equipment", description = "보호구·장비 재고 관리")
public class PpeEquipmentController {

    private final PpeEquipmentService equipmentService;

    @GetMapping
    @Operation(summary = "보호구·장비 전체 목록 조회")
    public ResponseEntity<ApiResponse<Page<PpeEquipmentResponse>>> findAll(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(equipmentService.findAll(pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "보호구·장비 상세 조회")
    public ResponseEntity<ApiResponse<PpeEquipmentResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(equipmentService.findById(id)));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "분류별 보호구·장비 조회")
    public ResponseEntity<ApiResponse<Page<PpeEquipmentResponse>>> findByCategory(
            @PathVariable String category,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(equipmentService.findByCategory(category, pageable)));
    }

    @GetMapping("/search")
    @Operation(summary = "보호구·장비 검색")
    public ResponseEntity<ApiResponse<Page<PpeEquipmentResponse>>> searchByName(
            @RequestParam String name,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(equipmentService.searchByName(name, pageable)));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "상태별 보호구·장비 조회")
    public ResponseEntity<ApiResponse<Page<PpeEquipmentResponse>>> findByStatus(
            @PathVariable String status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(equipmentService.findByStatus(status, pageable)));
    }

    @GetMapping("/kpi")
    @Operation(summary = "보호구·장비 KPI 통계")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getKpiStats() {
        return ResponseEntity.ok(ApiResponse.success(equipmentService.getKpiStats()));
    }

    @PostMapping
    @Operation(summary = "보호구·장비 등록")
    public ResponseEntity<ApiResponse<PpeEquipmentResponse>> create(@Valid @RequestBody PpeEquipmentRequest request) {
        return ResponseEntity.ok(ApiResponse.success(equipmentService.create(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "보호구·장비 수정")
    public ResponseEntity<ApiResponse<PpeEquipmentResponse>> update(@PathVariable Long id, @Valid @RequestBody PpeEquipmentRequest request) {
        return ResponseEntity.ok(ApiResponse.success(equipmentService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "보호구·장비 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        equipmentService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
