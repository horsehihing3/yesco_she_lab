package com.smartehs.controller;

import com.smartehs.dto.request.ChemicalWarehouseRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.ChemicalWarehouse;
import com.smartehs.service.ChemicalWarehouseService;
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
@RequestMapping("/chemical-warehouses")
@RequiredArgsConstructor
@Tag(name = "Chemical Warehouse", description = "화학물질 창고 관리 API")
public class ChemicalWarehouseController {

    private final ChemicalWarehouseService chemicalWarehouseService;

    @GetMapping
    @Operation(summary = "화학물질 창고 목록 조회")
    public ResponseEntity<ApiResponse<Page<ChemicalWarehouse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalWarehouse> result = chemicalWarehouseService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/search")
    @Operation(summary = "화학물질 창고 검색")
    public ResponseEntity<ApiResponse<Page<ChemicalWarehouse>>> search(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalWarehouse> result = chemicalWarehouseService.search(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "화학물질 창고 상세 조회")
    public ResponseEntity<ApiResponse<ChemicalWarehouse>> findById(@PathVariable Long id) {
        ChemicalWarehouse result = chemicalWarehouseService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "화학물질 창고 등록")
    public ResponseEntity<ApiResponse<ChemicalWarehouse>> create(
            @Valid @RequestBody ChemicalWarehouseRequest request) {
        ChemicalWarehouse result = chemicalWarehouseService.create(request);
        return ResponseEntity.ok(ApiResponse.success("ChemicalWarehouse created successfully", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "화학물질 창고 수정")
    public ResponseEntity<ApiResponse<ChemicalWarehouse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ChemicalWarehouseRequest request) {
        ChemicalWarehouse result = chemicalWarehouseService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("ChemicalWarehouse updated successfully", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "화학물질 창고 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        chemicalWarehouseService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("ChemicalWarehouse deleted successfully", null));
    }
}
