package com.smartehs.controller;

import com.smartehs.dto.request.ChemicalIncomingRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.ChemicalIncoming;
import com.smartehs.service.ChemicalIncomingService;
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
@RequestMapping("/chemical-incoming")
@RequiredArgsConstructor
@Tag(name = "Chemical Incoming", description = "화학물질 입고 관리 API")
public class ChemicalIncomingController {

    private final ChemicalIncomingService chemicalIncomingService;

    @GetMapping
    @Operation(summary = "화학물질 입고 목록 조회")
    public ResponseEntity<ApiResponse<Page<ChemicalIncoming>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalIncoming> result = chemicalIncomingService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/search")
    @Operation(summary = "화학물질 입고 검색")
    public ResponseEntity<ApiResponse<Page<ChemicalIncoming>>> search(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ChemicalIncoming> result = chemicalIncomingService.search(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "화학물질 입고 상세 조회")
    public ResponseEntity<ApiResponse<ChemicalIncoming>> findById(@PathVariable Long id) {
        ChemicalIncoming result = chemicalIncomingService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "화학물질 입고 등록")
    public ResponseEntity<ApiResponse<ChemicalIncoming>> create(
            @Valid @RequestBody ChemicalIncomingRequest request) {
        ChemicalIncoming result = chemicalIncomingService.create(request);
        return ResponseEntity.ok(ApiResponse.success("ChemicalIncoming created successfully", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "화학물질 입고 수정")
    public ResponseEntity<ApiResponse<ChemicalIncoming>> update(
            @PathVariable Long id,
            @Valid @RequestBody ChemicalIncomingRequest request) {
        ChemicalIncoming result = chemicalIncomingService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("ChemicalIncoming updated successfully", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "화학물질 입고 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        chemicalIncomingService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("ChemicalIncoming deleted successfully", null));
    }
}
