package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.mapper.UserMapper;
import com.smartehs.model.LegalCompliancePlan;
import com.smartehs.model.User;
import com.smartehs.service.LegalCompliancePlanService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/legal-compliance-plan")
@RequiredArgsConstructor
@Tag(name = "Legal Compliance Plan", description = "법규 대응 계획 관리")
public class LegalCompliancePlanController {

    private final LegalCompliancePlanService service;
    private final UserMapper userMapper;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<LegalCompliancePlan>>> findAll(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LegalCompliancePlan>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<Page<LegalCompliancePlan>>> findByStatus(
            @PathVariable String status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findByStatus(status, pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LegalCompliancePlan>> create(
            @RequestBody LegalCompliancePlan plan, Authentication authentication) {
        if (authentication != null) {
            User u = userMapper.findByUsername(authentication.getName());
            if (u != null) { plan.setCreatedByUserId(u.getId()); plan.setCreatedByName(u.getName()); }
        }
        return ResponseEntity.ok(ApiResponse.success(service.create(plan)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<LegalCompliancePlan>> update(@PathVariable Long id, @RequestBody LegalCompliancePlan plan) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, plan)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<LegalCompliancePlan>> submit(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.submit(id)));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<LegalCompliancePlan>> approve(
            @PathVariable Long id, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success(service.approve(id, username)));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<LegalCompliancePlan>> reject(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, Object> body,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        String reason = body != null && body.get("rejectReason") != null ? String.valueOf(body.get("rejectReason")) : null;
        return ResponseEntity.ok(ApiResponse.success(service.reject(id, username, reason)));
    }
}
