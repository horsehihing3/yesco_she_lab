package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.AuditFinding;
import com.smartehs.service.AuditFindingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/audit-finding")
@RequiredArgsConstructor
@Tag(name = "Audit Finding", description = "감사 부적합 사항 관리")
public class AuditFindingController {

    private final AuditFindingService findingService;

    @GetMapping
    @Operation(summary = "부적합 사항 전체 목록 조회")
    public ResponseEntity<ApiResponse<Page<AuditFinding>>> findAll(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(findingService.findAll(pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "부적합 사항 상세 조회")
    public ResponseEntity<ApiResponse<AuditFinding>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(findingService.findById(id)));
    }

    @GetMapping("/audit/{auditId}")
    @Operation(summary = "감사별 부적합 사항 조회")
    public ResponseEntity<ApiResponse<Page<AuditFinding>>> findByAuditId(
            @PathVariable Long auditId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(findingService.findByAuditId(auditId, pageable)));
    }

    @PostMapping("/audit/{auditId}/sync")
    @Operation(summary = "감사 체크리스트 FAIL 항목을 부적합 사항으로 동기화",
            description = "최신 체크리스트 저장 로그의 FAIL 항목을 tb_audit_finding 으로 자동 등록 (중복 description 은 건너뜀)")
    public ResponseEntity<ApiResponse<Integer>> syncFromChecklist(@PathVariable Long auditId) {
        int created = findingService.syncFromChecklist(auditId);
        return ResponseEntity.ok(ApiResponse.success("Synced", created));
    }

    @GetMapping("/severity/{severity}")
    @Operation(summary = "심각도별 부적합 사항 조회")
    public ResponseEntity<ApiResponse<Page<AuditFinding>>> findBySeverity(
            @PathVariable String severity,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(findingService.findBySeverity(severity, pageable)));
    }

    @PostMapping
    @Operation(summary = "부적합 사항 등록")
    public ResponseEntity<ApiResponse<AuditFinding>> create(@RequestBody AuditFinding finding) {
        return ResponseEntity.ok(ApiResponse.success(findingService.create(finding)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "부적합 사항 수정")
    public ResponseEntity<ApiResponse<AuditFinding>> update(@PathVariable Long id, @RequestBody AuditFinding finding) {
        return ResponseEntity.ok(ApiResponse.success(findingService.update(id, finding)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "부적합 사항 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        findingService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
