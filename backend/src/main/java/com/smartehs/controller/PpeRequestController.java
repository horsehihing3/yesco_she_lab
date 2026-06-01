package com.smartehs.controller;

import com.smartehs.dto.request.PpeRequestDto;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.PpeRequestResponse;
import com.smartehs.service.PpeRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/ppe-request") @RequiredArgsConstructor
@Tag(name = "PPE Request", description = "보호구 지급 신청 관리")
public class PpeRequestController {
    private final PpeRequestService service;

    @GetMapping
    @Operation(summary = "신청 목록 조회")
    public ResponseEntity<ApiResponse<Page<PpeRequestResponse>>> findAll(@PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "신청 상세 조회")
    public ResponseEntity<ApiResponse<PpeRequestResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "상태별 신청 조회")
    public ResponseEntity<ApiResponse<Page<PpeRequestResponse>>> findByStatus(
            @PathVariable String status, @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findByStatus(status, pageable)));
    }

    @GetMapping("/my/{requesterId}")
    @Operation(summary = "내 신청 조회")
    public ResponseEntity<ApiResponse<Page<PpeRequestResponse>>> findByRequester(
            @PathVariable String requesterId, @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findByRequester(requesterId, pageable)));
    }

    @PostMapping
    @Operation(summary = "보호구 신청")
    public ResponseEntity<ApiResponse<PpeRequestResponse>> create(@Valid @RequestBody PpeRequestDto dto) {
        return ResponseEntity.ok(ApiResponse.success(service.create(dto)));
    }

    @PatchMapping("/{id}/approve")
    @Operation(summary = "신청 승인")
    public ResponseEntity<ApiResponse<PpeRequestResponse>> approve(
            @PathVariable Long id, @RequestParam String approverName, @RequestParam String approverDept) {
        return ResponseEntity.ok(ApiResponse.success(service.approve(id, approverName, approverDept)));
    }

    @PatchMapping("/{id}/reject")
    @Operation(summary = "신청 반려")
    public ResponseEntity<ApiResponse<PpeRequestResponse>> reject(
            @PathVariable Long id, @RequestParam String approverName, @RequestParam String approverDept,
            @RequestParam(required = false) String rejectionReason) {
        return ResponseEntity.ok(ApiResponse.success(service.reject(id, approverName, approverDept, rejectionReason)));
    }

    @PatchMapping("/{id}/issue")
    @Operation(summary = "지급 완료 처리")
    public ResponseEntity<ApiResponse<PpeRequestResponse>> issue(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.issue(id)));
    }

    @PatchMapping("/{id}/return")
    @Operation(summary = "반납 처리", description = "지급 완료된 신청에 대해 반납 처리")
    public ResponseEntity<ApiResponse<PpeRequestResponse>> returnItem(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.returnItem(id)));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "신청 취소")
    public ResponseEntity<ApiResponse<PpeRequestResponse>> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.cancel(id)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "신청 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id); return ResponseEntity.ok(ApiResponse.success(null));
    }
}
