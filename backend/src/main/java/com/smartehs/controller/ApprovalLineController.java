package com.smartehs.controller;

import com.smartehs.dto.request.ApprovalLineRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.ApprovalLineResponse;
import com.smartehs.service.ApprovalLineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/approval-lines")
@RequiredArgsConstructor
@Tag(name = "Approval Line", description = "승인 라인 관리 API")
public class ApprovalLineController {

    private final ApprovalLineService approvalLineService;

    @GetMapping("/{approvalItemCode}")
    @Operation(summary = "승인 라인 조회", description = "승인 항목 코드 + 부서 코드별 승인 라인 목록 조회")
    public ResponseEntity<ApiResponse<List<ApprovalLineResponse>>> findByApprovalItemCodeAndDeptCode(
            @PathVariable String approvalItemCode,
            @RequestParam String deptCode) {
        List<ApprovalLineResponse> lines = approvalLineService.findByApprovalItemCodeAndDeptCode(approvalItemCode, deptCode);
        return ResponseEntity.ok(ApiResponse.success(lines));
    }

    @PostMapping
    @Operation(summary = "승인 라인 추가", description = "새로운 승인 라인 추가")
    public ResponseEntity<ApiResponse<ApprovalLineResponse>> create(
            @Valid @RequestBody ApprovalLineRequest request) {
        ApprovalLineResponse line = approvalLineService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Approval line created successfully", line));
    }

    @PutMapping("/{id}")
    @Operation(summary = "승인 라인 수정", description = "승인 라인 수정")
    public ResponseEntity<ApiResponse<ApprovalLineResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ApprovalLineRequest request) {
        ApprovalLineResponse line = approvalLineService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Approval line updated successfully", line));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "승인 라인 삭제", description = "승인 라인 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        approvalLineService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Approval line deleted successfully", null));
    }

    @PutMapping("/batch/{approvalItemCode}")
    @Operation(summary = "승인 라인 일괄 저장", description = "승인 항목 + 부서별 승인 라인 전체 저장 (기존 삭제 후 재등록)")
    public ResponseEntity<ApiResponse<List<ApprovalLineResponse>>> saveAll(
            @PathVariable String approvalItemCode,
            @RequestParam String deptCode,
            @Valid @RequestBody List<ApprovalLineRequest> requests) {
        List<ApprovalLineResponse> lines = approvalLineService.saveAll(approvalItemCode, deptCode, requests);
        return ResponseEntity.ok(ApiResponse.success("Approval lines saved successfully", lines));
    }
}
