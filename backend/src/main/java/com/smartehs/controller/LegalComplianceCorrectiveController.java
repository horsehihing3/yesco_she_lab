package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.LegalComplianceCorrective;
import com.smartehs.service.LegalComplianceCorrectiveService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/legal-compliance-corrective")
@RequiredArgsConstructor
@Tag(name = "Legal Compliance Corrective", description = "법규 대응 시정 조치")
public class LegalComplianceCorrectiveController {

    private final LegalComplianceCorrectiveService service;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<LegalComplianceCorrective>>> findAll(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LegalComplianceCorrective>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<Page<LegalComplianceCorrective>>> findByStatus(
            @PathVariable String status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findByStatus(status, pageable)));
    }

    @GetMapping("/audit/{auditId}")
    public ResponseEntity<ApiResponse<Page<LegalComplianceCorrective>>> findByAuditId(
            @PathVariable Long auditId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findByAuditId(auditId, pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LegalComplianceCorrective>> create(@RequestBody LegalComplianceCorrective c) {
        return ResponseEntity.ok(ApiResponse.success(service.create(c)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<LegalComplianceCorrective>> update(@PathVariable Long id, @RequestBody LegalComplianceCorrective c) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, c)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
