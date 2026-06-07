package com.smartehs.controller;

import com.smartehs.dto.request.WemFactorRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.WemFactorResponse;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.IdmUser;
import com.smartehs.service.WemFactorService;
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
@RequestMapping("/wem-factors")
@RequiredArgsConstructor
@Tag(name = "WEM Factor", description = "유해인자 관리 API")
public class WemFactorController {

    private final WemFactorService wemFactorService;
    private final IdmMapper idmMapper;

    private IdmUser current(Authentication auth) {
        return auth != null ? idmMapper.findByUid(auth.getName()) : null;
    }

    @GetMapping
    @Operation(summary = "List hazardous factors", description = "Get all WEM factors with optional type filter and pagination")
    public ResponseEntity<ApiResponse<Page<WemFactorResponse>>> findAll(
            @RequestParam(required = false) String factorType,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<WemFactorResponse> factors;
        if (factorType != null) {
            factors = wemFactorService.findByFactorType(factorType, pageable);
        } else {
            factors = wemFactorService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(factors));
    }

    @GetMapping("/search")
    @Operation(summary = "Search factors by name", description = "Search WEM factors by name keyword")
    public ResponseEntity<ApiResponse<Page<WemFactorResponse>>> searchByName(
            @RequestParam String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<WemFactorResponse> factors = wemFactorService.searchByName(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(factors));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get factor by ID", description = "Get a specific WEM factor by ID")
    public ResponseEntity<ApiResponse<WemFactorResponse>> findById(@PathVariable Long id) {
        WemFactorResponse factor = wemFactorService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(factor));
    }

    @PostMapping
    @Operation(summary = "Create factor", description = "Create a new WEM factor")
    public ResponseEntity<ApiResponse<WemFactorResponse>> create(
            @Valid @RequestBody WemFactorRequest request,
            Authentication authentication) {
        WemFactorResponse factor = wemFactorService.create(request, current(authentication));
        return ResponseEntity.ok(ApiResponse.success("Factor created successfully", factor));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update factor", description = "Update an existing WEM factor")
    public ResponseEntity<ApiResponse<WemFactorResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody WemFactorRequest request,
            Authentication authentication) {
        WemFactorResponse factor = wemFactorService.update(id, request, current(authentication));
        return ResponseEntity.ok(ApiResponse.success("Factor updated successfully", factor));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete factor", description = "Delete a WEM factor")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        wemFactorService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Factor deleted successfully", null));
    }
}
