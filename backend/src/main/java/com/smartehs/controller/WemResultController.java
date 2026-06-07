package com.smartehs.controller;

import com.smartehs.dto.request.WemResultRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.WemResultResponse;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.IdmUser;
import com.smartehs.service.WemResultService;
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
@RequestMapping("/wem-results")
@RequiredArgsConstructor
@Tag(name = "WEM Result", description = "측정결과 입력 관리 API")
public class WemResultController {

    private final WemResultService wemResultService;
    private final IdmMapper idmMapper;

    private IdmUser current(Authentication auth) {
        return auth != null ? idmMapper.findByUid(auth.getName()) : null;
    }

    @GetMapping
    @Operation(summary = "List measurement results", description = "Get all WEM results with optional judgment filter and pagination")
    public ResponseEntity<ApiResponse<Page<WemResultResponse>>> findAll(
            @RequestParam(required = false) String judgment,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<WemResultResponse> results;
        if (judgment != null) {
            results = wemResultService.findByJudgment(judgment, pageable);
        } else {
            results = wemResultService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get result by ID", description = "Get a specific WEM result by ID")
    public ResponseEntity<ApiResponse<WemResultResponse>> findById(@PathVariable Long id) {
        WemResultResponse result = wemResultService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "Create result", description = "Create a new WEM result")
    public ResponseEntity<ApiResponse<WemResultResponse>> create(
            @Valid @RequestBody WemResultRequest request,
            Authentication authentication) {
        WemResultResponse result = wemResultService.create(request, current(authentication));
        return ResponseEntity.ok(ApiResponse.success("Result created successfully", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update result", description = "Update an existing WEM result")
    public ResponseEntity<ApiResponse<WemResultResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody WemResultRequest request,
            Authentication authentication) {
        WemResultResponse result = wemResultService.update(id, request, current(authentication));
        return ResponseEntity.ok(ApiResponse.success("Result updated successfully", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete result", description = "Delete a WEM result")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        wemResultService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Result deleted successfully", null));
    }
}
