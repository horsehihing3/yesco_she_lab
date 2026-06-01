package com.smartehs.controller;

import com.smartehs.dto.request.PpeIssuanceRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.PpeIssuanceResponse;
import com.smartehs.service.PpeIssuanceService;
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
@RequestMapping("/ppe-issuance")
@RequiredArgsConstructor
@Tag(name = "PPE Issuance", description = "보호구 지급 관리 API")
public class PpeIssuanceController {

    private final PpeIssuanceService issuanceService;

    @GetMapping
    @Operation(summary = "보호구 지급 목록 조회")
    public ResponseEntity<ApiResponse<Page<PpeIssuanceResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PpeIssuanceResponse> result = issuanceService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "보호구 지급 상세 조회")
    public ResponseEntity<ApiResponse<PpeIssuanceResponse>> findById(@PathVariable Long id) {
        PpeIssuanceResponse result = issuanceService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "직원별 보호구 지급 조회")
    public ResponseEntity<ApiResponse<Page<PpeIssuanceResponse>>> findByEmployee(
            @PathVariable String employeeId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PpeIssuanceResponse> result = issuanceService.findByEmployee(employeeId, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/type/{ppeType}")
    @Operation(summary = "보호구 종류별 조회")
    public ResponseEntity<ApiResponse<Page<PpeIssuanceResponse>>> findByPpeType(
            @PathVariable String ppeType,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PpeIssuanceResponse> result = issuanceService.findByPpeType(ppeType, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/search")
    @Operation(summary = "보호구 지급 검색")
    public ResponseEntity<ApiResponse<Page<PpeIssuanceResponse>>> search(
            @RequestParam String name,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PpeIssuanceResponse> result = issuanceService.searchByName(name, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "보호구 지급 등록")
    public ResponseEntity<ApiResponse<PpeIssuanceResponse>> create(
            @Valid @RequestBody PpeIssuanceRequest request) {
        PpeIssuanceResponse result = issuanceService.create(request);
        return ResponseEntity.ok(ApiResponse.success("PPE issuance created successfully", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "보호구 지급 수정")
    public ResponseEntity<ApiResponse<PpeIssuanceResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody PpeIssuanceRequest request) {
        PpeIssuanceResponse result = issuanceService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("PPE issuance updated successfully", result));
    }

    @PatchMapping("/{id}/sign")
    @Operation(summary = "보호구 수령 서명")
    public ResponseEntity<ApiResponse<PpeIssuanceResponse>> sign(@PathVariable Long id) {
        PpeIssuanceResponse result = issuanceService.sign(id);
        return ResponseEntity.ok(ApiResponse.success("PPE issuance signed successfully", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "보호구 지급 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        issuanceService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("PPE issuance deleted successfully", null));
    }
}
