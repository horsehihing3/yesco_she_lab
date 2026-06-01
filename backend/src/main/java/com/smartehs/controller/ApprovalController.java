package com.smartehs.controller;

import com.smartehs.dto.request.ApprovalRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.ApprovalResponse;
import com.smartehs.service.ApprovalService;
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
@RequestMapping("/approvals")
@RequiredArgsConstructor
@Tag(name = "Approval", description = "승인 관리 API")
public class ApprovalController {

    private final ApprovalService approvalService;

    @GetMapping
    @Operation(summary = "승인 목록 조회", description = "승인 목록을 페이징, 상태 필터, 검색과 함께 조회")
    public ResponseEntity<ApiResponse<Page<ApprovalResponse>>> findAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ApprovalResponse> approvals = approvalService.findAll(status, keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(approvals));
    }

    @GetMapping("/{id}")
    @Operation(summary = "승인 상세 조회", description = "ID로 승인 상세 조회")
    public ResponseEntity<ApiResponse<ApprovalResponse>> findById(@PathVariable Long id) {
        ApprovalResponse approval = approvalService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(approval));
    }

    @PostMapping
    @Operation(summary = "승인 등록", description = "새로운 승인 요청 등록")
    public ResponseEntity<ApiResponse<ApprovalResponse>> create(
            @Valid @RequestBody ApprovalRequest request) {
        ApprovalResponse approval = approvalService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Approval created successfully", approval));
    }

    @PutMapping("/{id}")
    @Operation(summary = "승인 수정", description = "승인 정보 수정")
    public ResponseEntity<ApiResponse<ApprovalResponse>> update(
            @PathVariable Long id,
            @RequestBody ApprovalRequest request) {
        ApprovalResponse approval = approvalService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Approval updated successfully", approval));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "승인 삭제", description = "승인 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        approvalService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Approval deleted successfully", null));
    }

    @GetMapping("/my-pending")
    @Operation(summary = "내가 처리해야 할 결재 목록")
    public ResponseEntity<ApiResponse<Page<ApprovalResponse>>> findMyPending(
            @RequestParam String approverEmail,
            @PageableDefault(size = 10) Pageable pageable) {
        Page<ApprovalResponse> approvals = approvalService.findMyPending(approverEmail, pageable);
        return ResponseEntity.ok(ApiResponse.success(approvals));
    }

    @GetMapping("/my-drafted")
    @Operation(summary = "내가 기안한 결재 목록")
    public ResponseEntity<ApiResponse<Page<ApprovalResponse>>> findMyDrafted(
            @RequestParam String applicantEmail,
            @PageableDefault(size = 10) Pageable pageable) {
        Page<ApprovalResponse> approvals = approvalService.findMyDrafted(applicantEmail, pageable);
        return ResponseEntity.ok(ApiResponse.success(approvals));
    }

    @GetMapping("/my-history")
    @Operation(summary = "내 결재 히스토리")
    public ResponseEntity<ApiResponse<Page<ApprovalResponse>>> findMyHistory(
            @RequestParam String email,
            @PageableDefault(size = 10) Pageable pageable) {
        Page<ApprovalResponse> approvals = approvalService.findMyHistory(email, pageable);
        return ResponseEntity.ok(ApiResponse.success(approvals));
    }
}
