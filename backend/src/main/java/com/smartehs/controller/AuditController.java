package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.Audit;
import com.smartehs.model.AuditLog;
import com.smartehs.model.AuditLogItem;
import com.smartehs.model.IdmUser;
import com.smartehs.service.AuditService;
import com.smartehs.service.AuditLogService;
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
@RequestMapping("/audit")
@RequiredArgsConstructor
@Tag(name = "Audit", description = "감사 실시/결과 관리")
public class AuditController {

    private final AuditService auditService;
    private final AuditLogService auditLogService;
    private final IdmMapper idmMapper;

    @GetMapping
    @Operation(summary = "감사 전체 목록 조회")
    public ResponseEntity<ApiResponse<Page<Audit>>> findAll(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(auditService.findAll(pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "감사 상세 조회")
    public ResponseEntity<ApiResponse<Audit>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(auditService.findById(id)));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "상태별 감사 조회")
    public ResponseEntity<ApiResponse<Page<Audit>>> findByStatus(
            @PathVariable String status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(auditService.findByStatus(status, pageable)));
    }

    @PostMapping("/recalc-counts")
    @Operation(summary = "전체 감사 체크리스트 카운트 재계산 (부적합 사항 탭 진입 시)")
    public ResponseEntity<ApiResponse<Integer>> recalcCounts() {
        return ResponseEntity.ok(ApiResponse.success(auditService.recalcAllChecklistCounts()));
    }

    @PostMapping
    @Operation(summary = "감사 등록")
    public ResponseEntity<ApiResponse<Audit>> create(@RequestBody Audit audit) {
        return ResponseEntity.ok(ApiResponse.success(auditService.create(audit)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "감사 수정")
    public ResponseEntity<ApiResponse<Audit>> update(@PathVariable Long id, @RequestBody Audit audit, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        audit.setModifiedBy(username);
        if (authentication != null) {
            IdmUser u = idmMapper.findByUid(authentication.getName());
            if (u != null) {
                audit.setModifiedByUserId(u.getUidNumber());
                audit.setModifiedByName(u.getUserName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(auditService.update(id, audit)));
    }

    @PatchMapping("/{id}/complete")
    @Operation(summary = "감사 완료 승인 (지정된 완료 승인자 또는 admin 만)")
    public ResponseEntity<ApiResponse<Audit>> complete(
            @PathVariable Long id,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success(auditService.completeAudit(id, username)));
    }

    @PatchMapping("/{id}/reject")
    @Operation(summary = "감사 완료 결재 반려 (지정된 완료 승인자 또는 admin 만, rejectReason 필수)")
    public ResponseEntity<ApiResponse<Audit>> reject(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, Object> body,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        String rejectReason = body != null && body.get("rejectReason") != null
                ? String.valueOf(body.get("rejectReason")) : null;
        return ResponseEntity.ok(ApiResponse.success(auditService.rejectAudit(id, username, rejectReason)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "감사 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        auditService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/{id}/logs")
    @Operation(summary = "감사 변경 이력 조회")
    public ResponseEntity<ApiResponse<java.util.List<AuditLog>>> getLogs(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.findByAuditId(id)));
    }

    @GetMapping("/logs/{logId}/items")
    @Operation(summary = "감사 변경 이력 항목 상세 조회")
    public ResponseEntity<ApiResponse<java.util.List<AuditLogItem>>> getLogItems(@PathVariable Long logId) {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.findItemsByLogId(logId)));
    }
}
