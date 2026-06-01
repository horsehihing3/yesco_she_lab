package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.mapper.UserMapper;
import com.smartehs.model.AuditPlan;
import com.smartehs.model.User;
import com.smartehs.service.AuditPlanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/audit-plan")
@RequiredArgsConstructor
@Tag(name = "Audit Plan", description = "감사 계획 관리")
public class AuditPlanController {

    private final AuditPlanService auditPlanService;
    private final UserMapper userMapper;

    @GetMapping
    @Operation(summary = "감사 계획 전체 목록 조회")
    public ResponseEntity<ApiResponse<Page<AuditPlan>>> findAll(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(auditPlanService.findAll(pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "감사 계획 상세 조회")
    public ResponseEntity<ApiResponse<AuditPlan>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(auditPlanService.findById(id)));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "상태별 감사 계획 조회")
    public ResponseEntity<ApiResponse<Page<AuditPlan>>> findByStatus(
            @PathVariable String status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(auditPlanService.findByStatus(status, pageable)));
    }

    @PostMapping
    @Operation(summary = "감사 계획 등록")
    public ResponseEntity<ApiResponse<AuditPlan>> create(
            @RequestBody AuditPlan auditPlan,
            Authentication authentication) {
        // 작성자 자동 매핑 (로그인 사용자)
        if (authentication != null) {
            User u = userMapper.findByUsername(authentication.getName());
            if (u != null) {
                auditPlan.setCreatedByUserId(u.getId());
                auditPlan.setCreatedByName(u.getName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(auditPlanService.create(auditPlan)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "감사 계획 수정")
    public ResponseEntity<ApiResponse<AuditPlan>> update(@PathVariable Long id, @RequestBody AuditPlan auditPlan) {
        return ResponseEntity.ok(ApiResponse.success(auditPlanService.update(id, auditPlan)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "감사 계획 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        auditPlanService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{id}/submit")
    @Operation(summary = "감사 계획 결재 상신 (status: PLAN → PENDING_APPROVAL)")
    public ResponseEntity<ApiResponse<AuditPlan>> submit(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(auditPlanService.submit(id)));
    }

    @PatchMapping("/{id}/approve")
    @Operation(summary = "감사 계획 승인 (지정된 계획 승인자 또는 admin 만)")
    public ResponseEntity<ApiResponse<AuditPlan>> approve(
            @PathVariable Long id,
            @RequestParam(required = false) String approvedBy,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : approvedBy;
        return ResponseEntity.ok(ApiResponse.success(auditPlanService.approve(id, username)));
    }

    @PatchMapping("/{id}/reject")
    @Operation(summary = "감사 계획 반려 (지정된 계획 승인자 또는 admin 만, rejectReason 필수)")
    public ResponseEntity<ApiResponse<AuditPlan>> reject(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, Object> body,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        String rejectReason = body != null && body.get("rejectReason") != null
                ? String.valueOf(body.get("rejectReason")) : null;
        return ResponseEntity.ok(ApiResponse.success(auditPlanService.reject(id, username, rejectReason)));
    }
}
