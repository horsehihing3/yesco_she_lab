package com.smartehs.controller;

import com.smartehs.dto.request.MsdsRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.Msds;
import com.smartehs.service.MsdsService;
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
@RequestMapping("/msds")
@RequiredArgsConstructor
@Tag(name = "MSDS", description = "MSDS 관리 API")
public class MsdsController {

    private final MsdsService msdsService;

    @GetMapping
    @Operation(summary = "MSDS 목록 조회")
    public ResponseEntity<ApiResponse<Page<Msds>>> findByTypeAndLatest(
            @RequestParam(defaultValue = "RAW") String msdsType,
            @RequestParam(defaultValue = "true") Boolean isLatest,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<Msds> result = msdsService.findByTypeAndLatest(msdsType, isLatest, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/search")
    @Operation(summary = "MSDS 검색")
    public ResponseEntity<ApiResponse<Page<Msds>>> search(
            @RequestParam(required = false) String msdsType,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean isLatest,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<Msds> result = msdsService.search(msdsType, keyword, isLatest, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "MSDS 상세 조회")
    public ResponseEntity<ApiResponse<Msds>> findById(@PathVariable Long id) {
        Msds result = msdsService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "MSDS 등록")
    public ResponseEntity<ApiResponse<Msds>> create(
            @Valid @RequestBody MsdsRequest request) {
        Msds result = msdsService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Msds created successfully", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "MSDS 수정")
    public ResponseEntity<ApiResponse<Msds>> update(
            @PathVariable Long id,
            @Valid @RequestBody MsdsRequest request) {
        Msds result = msdsService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Msds updated successfully", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "MSDS 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        msdsService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Msds deleted successfully", null));
    }
}
