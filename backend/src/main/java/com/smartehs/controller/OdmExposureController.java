package com.smartehs.controller;

import com.smartehs.dto.request.OdmExposureRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.OdmExposureResponse;
import com.smartehs.service.OdmExposureService;
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
@RequestMapping("/odm-exposures")
@RequiredArgsConstructor
@Tag(name = "ODM Exposure", description = "유해인자 노출 관리 API")
public class OdmExposureController {

    private final OdmExposureService odmExposureService;

    @GetMapping
    @Operation(summary = "List exposures", description = "Get all exposures with optional riskLevel filter and pagination")
    public ResponseEntity<ApiResponse<Page<OdmExposureResponse>>> findAll(
            @RequestParam(required = false) String riskLevel,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<OdmExposureResponse> exposures;
        if (riskLevel != null) {
            exposures = odmExposureService.findByRiskLevel(riskLevel, pageable);
        } else {
            exposures = odmExposureService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(exposures));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get exposure by ID", description = "Get a specific exposure by ID")
    public ResponseEntity<ApiResponse<OdmExposureResponse>> findById(@PathVariable Long id) {
        OdmExposureResponse exposure = odmExposureService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(exposure));
    }

    @PostMapping
    @Operation(summary = "Create exposure", description = "Create a new exposure record")
    public ResponseEntity<ApiResponse<OdmExposureResponse>> create(
            @Valid @RequestBody OdmExposureRequest request) {
        OdmExposureResponse exposure = odmExposureService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Exposure created successfully", exposure));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update exposure", description = "Update an existing exposure record")
    public ResponseEntity<ApiResponse<OdmExposureResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody OdmExposureRequest request) {
        OdmExposureResponse exposure = odmExposureService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Exposure updated successfully", exposure));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete exposure", description = "Delete an exposure record")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        odmExposureService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Exposure deleted successfully", null));
    }
}
