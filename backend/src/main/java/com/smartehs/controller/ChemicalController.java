package com.smartehs.controller;

import com.smartehs.dto.request.ChemicalRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.ChemicalResponse;
import com.smartehs.service.ChemicalService;
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
@RequestMapping("/chemicals")
@RequiredArgsConstructor
@Tag(name = "Chemical", description = "화학물질 관리 API")
public class ChemicalController {

    private final ChemicalService chemicalService;

    @GetMapping
    @Operation(summary = "화학물질 목록 조회")
    public ResponseEntity<ApiResponse<Page<ChemicalResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalResponse> result = chemicalService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/search")
    @Operation(summary = "화학물질 검색")
    public ResponseEntity<ApiResponse<Page<ChemicalResponse>>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String hazardClass,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalResponse> result = chemicalService.search(keyword, hazardClass, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "화학물질 상세 조��")
    public ResponseEntity<ApiResponse<ChemicalResponse>> findById(@PathVariable Long id) {
        ChemicalResponse result = chemicalService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "화학물질 등록")
    public ResponseEntity<ApiResponse<ChemicalResponse>> create(
            @Valid @RequestBody ChemicalRequest request) {
        ChemicalResponse result = chemicalService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Chemical created successfully", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "��학물질 수정")
    public ResponseEntity<ApiResponse<ChemicalResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ChemicalRequest request) {
        ChemicalResponse result = chemicalService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Chemical updated successfully", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "화학물질 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        chemicalService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Chemical deleted successfully", null));
    }
}
