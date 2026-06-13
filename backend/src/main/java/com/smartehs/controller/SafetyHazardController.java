package com.smartehs.controller;

import com.smartehs.dto.request.SafetyHazardFormRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.SafetyHazardFormResponse;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.IdmUser;
import com.smartehs.service.SafetyHazardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/safety-hazard-forms")
@RequiredArgsConstructor
@Tag(name = "Safety Hazard Form", description = "안전 위험요인 양식")
public class SafetyHazardController {

    private final SafetyHazardService service;
    private final IdmMapper idmMapper;

    private void applyAuditFromAuth(SafetyHazardFormRequest req, Authentication auth, boolean isCreate) {
        if (auth == null) return;
        IdmUser u = idmMapper.findByUid(auth.getName());
        if (u == null) return;
        if (isCreate) {
            req.setCreatedByUserId(u.getUidNumber());
            req.setCreatedByName(u.getUserName());
            req.setCreatedByTeam(u.getGroupName());
            req.setCreatedByPosition(u.getTitleName());
        }
        req.setModifiedByUserId(u.getUidNumber());
        req.setModifiedByName(u.getUserName());
        req.setModifiedByTeam(u.getGroupName());
        req.setModifiedByPosition(u.getTitleName());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<SafetyHazardFormResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(service.findAll(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SafetyHazardFormResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SafetyHazardFormResponse>> create(
            @RequestBody SafetyHazardFormRequest request, Authentication authentication) {
        applyAuditFromAuth(request, authentication, true);
        return ResponseEntity.ok(ApiResponse.success(service.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SafetyHazardFormResponse>> update(
            @PathVariable Long id, @RequestBody SafetyHazardFormRequest request, Authentication authentication) {
        applyAuditFromAuth(request, authentication, false);
        return ResponseEntity.ok(ApiResponse.success(service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
