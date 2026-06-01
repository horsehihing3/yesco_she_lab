package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.EmergencyResource;
import com.smartehs.service.EmergencyResourceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/emergency-resource")
@RequiredArgsConstructor
@Tag(name = "Emergency Resource", description = "비상 자원 관리")
public class EmergencyResourceController {

    private final EmergencyResourceService emergencyResourceService;

    @GetMapping
    @Operation(summary = "비상 자원 전체 목록 조회")
    public ResponseEntity<ApiResponse<Page<EmergencyResource>>> findAll(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(emergencyResourceService.findAll(pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "비상 자원 상세 조회")
    public ResponseEntity<ApiResponse<EmergencyResource>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(emergencyResourceService.findById(id)));
    }

    @GetMapping("/type/{resourceType}")
    @Operation(summary = "유형별 비상 자원 조회")
    public ResponseEntity<ApiResponse<Page<EmergencyResource>>> findByResourceType(
            @PathVariable String resourceType,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(emergencyResourceService.findByResourceType(resourceType, pageable)));
    }

    @PostMapping
    @Operation(summary = "비상 자원 등록")
    public ResponseEntity<ApiResponse<EmergencyResource>> create(@RequestBody EmergencyResource emergencyResource) {
        return ResponseEntity.ok(ApiResponse.success(emergencyResourceService.create(emergencyResource)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "비상 자원 수정")
    public ResponseEntity<ApiResponse<EmergencyResource>> update(@PathVariable Long id, @RequestBody EmergencyResource emergencyResource) {
        return ResponseEntity.ok(ApiResponse.success(emergencyResourceService.update(id, emergencyResource)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "비상 자원 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        emergencyResourceService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
