package com.smartehs.controller;

import com.smartehs.dto.request.OdmSuspectRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.OdmSuspectResponse;
import com.smartehs.service.OdmSuspectService;
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
@RequestMapping("/odm-suspects")
@RequiredArgsConstructor
@Tag(name = "ODM Suspect", description = "직업병 의심자 관리 API")
public class OdmSuspectController {

    private final OdmSuspectService odmSuspectService;

    @GetMapping
    @Operation(summary = "List suspects", description = "Get all suspects with optional name/status filter and pagination")
    public ResponseEntity<ApiResponse<Page<OdmSuspectResponse>>> findAll(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<OdmSuspectResponse> suspects;
        if (name != null) {
            suspects = odmSuspectService.findByName(name, pageable);
        } else if (status != null) {
            suspects = odmSuspectService.findByStatus(status, pageable);
        } else {
            suspects = odmSuspectService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(suspects));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get suspect by ID", description = "Get a specific suspect by ID")
    public ResponseEntity<ApiResponse<OdmSuspectResponse>> findById(@PathVariable Long id) {
        OdmSuspectResponse suspect = odmSuspectService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(suspect));
    }

    @PostMapping
    @Operation(summary = "Create suspect", description = "Create a new suspect record")
    public ResponseEntity<ApiResponse<OdmSuspectResponse>> create(
            @Valid @RequestBody OdmSuspectRequest request) {
        OdmSuspectResponse suspect = odmSuspectService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Suspect created successfully", suspect));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update suspect", description = "Update an existing suspect record")
    public ResponseEntity<ApiResponse<OdmSuspectResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody OdmSuspectRequest request) {
        OdmSuspectResponse suspect = odmSuspectService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Suspect updated successfully", suspect));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete suspect", description = "Delete a suspect record")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        odmSuspectService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Suspect deleted successfully", null));
    }
}
