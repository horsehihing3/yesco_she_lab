package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.LegalComplianceFinding;
import com.smartehs.service.LegalComplianceFindingService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/legal-compliance-finding")
@RequiredArgsConstructor
@Tag(name = "Legal Compliance Finding", description = "법규 대응 부적합 사항")
public class LegalComplianceFindingController {

    private final LegalComplianceFindingService service;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<LegalComplianceFinding>>> findAll(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LegalComplianceFinding>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/audit/{auditId}")
    public ResponseEntity<ApiResponse<Page<LegalComplianceFinding>>> findByAuditId(
            @PathVariable Long auditId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findByAuditId(auditId, pageable)));
    }

    @PostMapping("/audit/{auditId}/sync")
    public ResponseEntity<ApiResponse<Integer>> syncFromChecklist(@PathVariable Long auditId) {
        return ResponseEntity.ok(ApiResponse.success("Synced", service.syncFromChecklist(auditId)));
    }

    @GetMapping("/severity/{severity}")
    public ResponseEntity<ApiResponse<Page<LegalComplianceFinding>>> findBySeverity(
            @PathVariable String severity,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findBySeverity(severity, pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LegalComplianceFinding>> create(@RequestBody LegalComplianceFinding finding) {
        return ResponseEntity.ok(ApiResponse.success(service.create(finding)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<LegalComplianceFinding>> update(@PathVariable Long id, @RequestBody LegalComplianceFinding finding) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, finding)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
