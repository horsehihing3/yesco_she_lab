package com.smartehs.controller;

import com.smartehs.dto.request.RegulationCheckRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.RegulationCheck;
import com.smartehs.service.RegulationCheckService;
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
@RequestMapping("/regulation-checks")
@RequiredArgsConstructor
@Tag(name = "Regulation Check", description = "규제 점검 관리 API")
public class RegulationCheckController {

    private final RegulationCheckService regulationCheckService;

    @GetMapping
    @Operation(summary = "규제 점검 목록 조회")
    public ResponseEntity<ApiResponse<Page<RegulationCheck>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<RegulationCheck> result = regulationCheckService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/search")
    @Operation(summary = "규제 점검 검색")
    public ResponseEntity<ApiResponse<Page<RegulationCheck>>> search(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<RegulationCheck> result = regulationCheckService.search(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "규제 점검 상세 조회")
    public ResponseEntity<ApiResponse<RegulationCheck>> findById(@PathVariable Long id) {
        RegulationCheck result = regulationCheckService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "규제 점검 등록")
    public ResponseEntity<ApiResponse<RegulationCheck>> create(
            @Valid @RequestBody RegulationCheckRequest request) {
        RegulationCheck result = regulationCheckService.create(request);
        return ResponseEntity.ok(ApiResponse.success("RegulationCheck created successfully", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "규제 점검 수정")
    public ResponseEntity<ApiResponse<RegulationCheck>> update(
            @PathVariable Long id,
            @Valid @RequestBody RegulationCheckRequest request) {
        RegulationCheck result = regulationCheckService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("RegulationCheck updated successfully", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "규제 점검 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        regulationCheckService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("RegulationCheck deleted successfully", null));
    }
}
