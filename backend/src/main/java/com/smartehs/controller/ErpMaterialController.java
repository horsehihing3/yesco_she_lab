package com.smartehs.controller;

import com.smartehs.dto.request.ErpMaterialRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.ErpMaterial;
import com.smartehs.service.ErpMaterialService;
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
@RequestMapping("/erp-materials")
@RequiredArgsConstructor
@Tag(name = "ERP Material", description = "ERP 자재 관리 API")
public class ErpMaterialController {

    private final ErpMaterialService erpMaterialService;

    @GetMapping
    @Operation(summary = "ERP 자재 목록 조회")
    public ResponseEntity<ApiResponse<Page<ErpMaterial>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ErpMaterial> result = erpMaterialService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/search")
    @Operation(summary = "ERP 자재 검색")
    public ResponseEntity<ApiResponse<Page<ErpMaterial>>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ErpMaterial> result = erpMaterialService.search(keyword, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "ERP 자재 상세 조회")
    public ResponseEntity<ApiResponse<ErpMaterial>> findById(@PathVariable Long id) {
        ErpMaterial result = erpMaterialService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "ERP 자재 등록")
    public ResponseEntity<ApiResponse<ErpMaterial>> create(
            @Valid @RequestBody ErpMaterialRequest request) {
        ErpMaterial result = erpMaterialService.create(request);
        return ResponseEntity.ok(ApiResponse.success("ErpMaterial created successfully", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "ERP 자재 수정")
    public ResponseEntity<ApiResponse<ErpMaterial>> update(
            @PathVariable Long id,
            @Valid @RequestBody ErpMaterialRequest request) {
        ErpMaterial result = erpMaterialService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("ErpMaterial updated successfully", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "ERP 자재 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        erpMaterialService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("ErpMaterial deleted successfully", null));
    }
}
