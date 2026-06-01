package com.smartehs.controller;

import com.smartehs.dto.request.OdmFollowupRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.OdmFollowupResponse;
import com.smartehs.service.OdmFollowupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/odm-followups")
@RequiredArgsConstructor
@Tag(name = "ODM Followup", description = "사후관리 추적 API")
public class OdmFollowupController {

    private final OdmFollowupService odmFollowupService;

    @GetMapping
    @Operation(summary = "List followups", description = "Get all followups with optional status filter and pagination")
    public ResponseEntity<ApiResponse<Page<OdmFollowupResponse>>> findAll(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<OdmFollowupResponse> followups;
        if (status != null) {
            followups = odmFollowupService.findByStatus(status, pageable);
        } else {
            followups = odmFollowupService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(followups));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get followup by ID", description = "Get a specific followup by ID")
    public ResponseEntity<ApiResponse<OdmFollowupResponse>> findById(@PathVariable Long id) {
        OdmFollowupResponse followup = odmFollowupService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(followup));
    }

    @PostMapping
    @Operation(summary = "Create followup", description = "Create a new followup record")
    public ResponseEntity<ApiResponse<OdmFollowupResponse>> create(
            @Valid @RequestBody OdmFollowupRequest request) {
        OdmFollowupResponse followup = odmFollowupService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Followup created successfully", followup));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update followup", description = "Update an existing followup record")
    public ResponseEntity<ApiResponse<OdmFollowupResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody OdmFollowupRequest request) {
        OdmFollowupResponse followup = odmFollowupService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Followup updated successfully", followup));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete followup", description = "Delete a followup record")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        odmFollowupService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Followup deleted successfully", null));
    }
}
