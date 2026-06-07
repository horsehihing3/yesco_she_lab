package com.smartehs.controller;

import com.smartehs.dto.request.WemImprovementRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.WemImprovementResponse;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.IdmUser;
import com.smartehs.service.WemImprovementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/wem-improvements")
@RequiredArgsConstructor
@Tag(name = "WEM Improvement", description = "초과·개선 관리 API")
public class WemImprovementController {

    private final WemImprovementService wemImprovementService;
    private final IdmMapper idmMapper;

    private IdmUser current(Authentication auth) {
        return auth != null ? idmMapper.findByUid(auth.getName()) : null;
    }

    @GetMapping
    @Operation(summary = "List improvements", description = "Get all WEM improvements with optional status/exceedLevel filter and pagination")
    public ResponseEntity<ApiResponse<Page<WemImprovementResponse>>> findAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String exceedLevel,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<WemImprovementResponse> improvements;
        if (status != null) {
            improvements = wemImprovementService.findByStatus(status, pageable);
        } else if (exceedLevel != null) {
            improvements = wemImprovementService.findByExceedLevel(exceedLevel, pageable);
        } else {
            improvements = wemImprovementService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(improvements));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get improvement by ID", description = "Get a specific WEM improvement by ID")
    public ResponseEntity<ApiResponse<WemImprovementResponse>> findById(@PathVariable Long id) {
        WemImprovementResponse improvement = wemImprovementService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(improvement));
    }

    @PostMapping
    @Operation(summary = "Create improvement", description = "Create a new WEM improvement")
    public ResponseEntity<ApiResponse<WemImprovementResponse>> create(
            @Valid @RequestBody WemImprovementRequest request,
            Authentication authentication) {
        WemImprovementResponse improvement = wemImprovementService.create(request, current(authentication));
        return ResponseEntity.ok(ApiResponse.success("Improvement created successfully", improvement));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update improvement", description = "Update an existing WEM improvement")
    public ResponseEntity<ApiResponse<WemImprovementResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody WemImprovementRequest request,
            Authentication authentication) {
        WemImprovementResponse improvement = wemImprovementService.update(id, request, current(authentication));
        return ResponseEntity.ok(ApiResponse.success("Improvement updated successfully", improvement));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete improvement", description = "Delete a WEM improvement")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        wemImprovementService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Improvement deleted successfully", null));
    }
}
