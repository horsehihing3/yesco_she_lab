package com.smartehs.controller;

import com.smartehs.dto.request.ProcessActivityFormRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.ProcessActivityFormResponse;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.IdmUser;
import com.smartehs.service.ProcessActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/process-activity-forms")
@RequiredArgsConstructor
public class ProcessActivityController {

    private final ProcessActivityService service;
    private final IdmMapper idmMapper;

    private void applyAuditFromAuth(ProcessActivityFormRequest req, Authentication auth, boolean isCreate) {
        if (auth == null) return;
        IdmUser u = idmMapper.findByUid(auth.getName());
        if (u == null) return;
        if (isCreate) {
            req.setCreatedByUserId(u.getUidNumber());
            req.setCreatedByName(u.getUserName());
        }
        req.setModifiedByUserId(u.getUidNumber());
        req.setModifiedByName(u.getUserName());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProcessActivityFormResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(service.findAll(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProcessActivityFormResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProcessActivityFormResponse>> create(
            @RequestBody ProcessActivityFormRequest request,
            Authentication authentication) {
        applyAuditFromAuth(request, authentication, true);
        return ResponseEntity.ok(ApiResponse.success(service.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProcessActivityFormResponse>> update(
            @PathVariable Long id,
            @RequestBody ProcessActivityFormRequest request,
            Authentication authentication) {
        applyAuditFromAuth(request, authentication, false);
        return ResponseEntity.ok(ApiResponse.success(service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
