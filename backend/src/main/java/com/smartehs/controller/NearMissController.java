package com.smartehs.controller;

import com.smartehs.dto.request.NearMissRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.NearMissResponse;
import com.smartehs.service.NearMissService;
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
@RequestMapping("/near-miss")
@RequiredArgsConstructor
@Tag(name = "Near Miss", description = "Near Miss Report API")
public class NearMissController {

    private final NearMissService nearMissService;

    @GetMapping
    @Operation(summary = "List near miss reports", description = "Get all near miss reports with pagination")
    public ResponseEntity<ApiResponse<Page<NearMissResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<NearMissResponse> nearMisses = nearMissService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(nearMisses));
    }

    @GetMapping("/search")
    @Operation(summary = "Search near miss reports", description = "Search near miss reports by title")
    public ResponseEntity<ApiResponse<Page<NearMissResponse>>> search(
            @RequestParam String title,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<NearMissResponse> nearMisses = nearMissService.search(title, pageable);
        return ResponseEntity.ok(ApiResponse.success(nearMisses));
    }

    @GetMapping("/type/{incidentType}")
    @Operation(summary = "Find by incident type", description = "Get near miss reports by incident type (NEAR_MISS or ACCIDENT)")
    public ResponseEntity<ApiResponse<Page<NearMissResponse>>> findByIncidentType(
            @PathVariable String incidentType,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<NearMissResponse> nearMisses = nearMissService.findByIncidentType(incidentType, pageable);
        return ResponseEntity.ok(ApiResponse.success(nearMisses));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Find by status", description = "Get near miss reports by status")
    public ResponseEntity<ApiResponse<Page<NearMissResponse>>> findByStatus(
            @PathVariable String status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<NearMissResponse> nearMisses = nearMissService.findByStatus(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(nearMisses));
    }

    @GetMapping("/workplace/{workPlaceId}")
    @Operation(summary = "Find by workplace", description = "Get near miss reports by workplace ID")
    public ResponseEntity<ApiResponse<Page<NearMissResponse>>> findByWorkPlace(
            @PathVariable Long workPlaceId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<NearMissResponse> nearMisses = nearMissService.findByWorkPlace(workPlaceId, pageable);
        return ResponseEntity.ok(ApiResponse.success(nearMisses));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get near miss by ID", description = "Get a specific near miss report by ID")
    public ResponseEntity<ApiResponse<NearMissResponse>> findById(@PathVariable Long id) {
        NearMissResponse nearMiss = nearMissService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(nearMiss));
    }

    @GetMapping("/near-miss-id/{nearMissId}")
    @Operation(summary = "Get near miss by nearMissId", description = "Get a specific near miss report by nearMissId (format: YYYYMMDD_NNN)")
    public ResponseEntity<ApiResponse<NearMissResponse>> findByNearMissId(@PathVariable String nearMissId) {
        NearMissResponse nearMiss = nearMissService.findByNearMissId(nearMissId);
        return ResponseEntity.ok(ApiResponse.success(nearMiss));
    }

    @PostMapping
    @Operation(summary = "Create near miss report", description = "Create a new near miss report")
    public ResponseEntity<ApiResponse<NearMissResponse>> create(
            @Valid @RequestBody NearMissRequest request) {
        NearMissResponse nearMiss = nearMissService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Near miss report created successfully", nearMiss));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update near miss report", description = "Update an existing near miss report")
    public ResponseEntity<ApiResponse<NearMissResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody NearMissRequest request) {
        NearMissResponse nearMiss = nearMissService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Near miss report updated successfully", nearMiss));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete near miss report", description = "Soft delete a near miss report")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        nearMissService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Near miss report deleted successfully", null));
    }
}
