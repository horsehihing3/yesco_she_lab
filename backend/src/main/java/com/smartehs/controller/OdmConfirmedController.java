package com.smartehs.controller;

import com.smartehs.dto.request.OdmConfirmedRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.OdmConfirmedResponse;
import com.smartehs.service.OdmConfirmedService;
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
@RequestMapping("/odm-confirmed")
@RequiredArgsConstructor
@Tag(name = "ODM Confirmed", description = "직업병 확정/산재 관리 API")
public class OdmConfirmedController {

    private final OdmConfirmedService odmConfirmedService;

    @GetMapping
    @Operation(summary = "List confirmed cases", description = "Get all confirmed cases with optional approvalStatus filter and pagination")
    public ResponseEntity<ApiResponse<Page<OdmConfirmedResponse>>> findAll(
            @RequestParam(required = false) String approvalStatus,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<OdmConfirmedResponse> confirmed;
        if (approvalStatus != null) {
            confirmed = odmConfirmedService.findByApprovalStatus(approvalStatus, pageable);
        } else {
            confirmed = odmConfirmedService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(confirmed));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get confirmed case by ID", description = "Get a specific confirmed case by ID")
    public ResponseEntity<ApiResponse<OdmConfirmedResponse>> findById(@PathVariable Long id) {
        OdmConfirmedResponse confirmed = odmConfirmedService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(confirmed));
    }

    @PostMapping
    @Operation(summary = "Create confirmed case", description = "Create a new confirmed case record")
    public ResponseEntity<ApiResponse<OdmConfirmedResponse>> create(
            @Valid @RequestBody OdmConfirmedRequest request) {
        OdmConfirmedResponse confirmed = odmConfirmedService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Confirmed case created successfully", confirmed));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update confirmed case", description = "Update an existing confirmed case record")
    public ResponseEntity<ApiResponse<OdmConfirmedResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody OdmConfirmedRequest request) {
        OdmConfirmedResponse confirmed = odmConfirmedService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Confirmed case updated successfully", confirmed));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete confirmed case", description = "Delete a confirmed case record")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        odmConfirmedService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Confirmed case deleted successfully", null));
    }
}
