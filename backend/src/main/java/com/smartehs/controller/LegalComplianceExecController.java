package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.mapper.LegalComplianceLogMapper;
import com.smartehs.model.LegalComplianceExec;
import com.smartehs.model.LegalComplianceLog;
import com.smartehs.model.LegalComplianceLogItem;
import com.smartehs.service.LegalComplianceExecService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/legal-compliance")
@RequiredArgsConstructor
@Tag(name = "Legal Compliance Exec", description = "법규 대응 실시")
public class LegalComplianceExecController {

    private final LegalComplianceExecService service;
    private final LegalComplianceLogMapper logMapper;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<LegalComplianceExec>>> findAll(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LegalComplianceExec>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<Page<LegalComplianceExec>>> findByStatus(
            @PathVariable String status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findByStatus(status, pageable)));
    }

    @PostMapping("/recalc-counts")
    public ResponseEntity<ApiResponse<Integer>> recalcCounts() {
        return ResponseEntity.ok(ApiResponse.success(service.recalcAllChecklistCounts()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LegalComplianceExec>> create(@RequestBody LegalComplianceExec exec) {
        return ResponseEntity.ok(ApiResponse.success(service.create(exec)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<LegalComplianceExec>> update(@PathVariable Long id, @RequestBody LegalComplianceExec exec, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        exec.setModifiedBy(username);
        return ResponseEntity.ok(ApiResponse.success(service.update(id, exec)));
    }

    @PatchMapping("/{id}/grade")
    public ResponseEntity<ApiResponse<LegalComplianceExec>> updateGrade(@PathVariable Long id, @RequestParam String grade) {
        return ResponseEntity.ok(ApiResponse.success(service.updateGrade(id, grade)));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<LegalComplianceExec>> complete(
            @PathVariable Long id, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success(service.completeExec(id, username)));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<LegalComplianceExec>> reject(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, Object> body,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        String reason = body != null && body.get("rejectReason") != null ? String.valueOf(body.get("rejectReason")) : null;
        return ResponseEntity.ok(ApiResponse.success(service.rejectExec(id, username, reason)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/{id}/logs")
    public ResponseEntity<ApiResponse<List<LegalComplianceLog>>> getLogs(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(logMapper.findByAuditId(id)));
    }

    @GetMapping("/logs/{logId}/items")
    public ResponseEntity<ApiResponse<List<LegalComplianceLogItem>>> getLogItems(@PathVariable Long logId) {
        return ResponseEntity.ok(ApiResponse.success(logMapper.findItemsByLogId(logId)));
    }
}
