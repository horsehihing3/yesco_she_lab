package com.smartehs.controller;

import com.smartehs.dto.request.PpeHistoryRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.PpeHistoryResponse;
import com.smartehs.service.PpeHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ppe-history")
@RequiredArgsConstructor
@Tag(name = "PPE History", description = "보호구 지급·반납 이력 관리")
public class PpeHistoryController {

    private final PpeHistoryService historyService;

    @GetMapping
    @Operation(summary = "지급·반납 이력 조회")
    public ResponseEntity<ApiResponse<Page<PpeHistoryResponse>>> findAll(
            @PageableDefault(size = 10, sort = "actionDate") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(historyService.findAll(pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "이력 상세 조회")
    public ResponseEntity<ApiResponse<PpeHistoryResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(historyService.findById(id)));
    }

    @PostMapping
    @Operation(summary = "이력 등록")
    public ResponseEntity<ApiResponse<PpeHistoryResponse>> create(@Valid @RequestBody PpeHistoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(historyService.create(request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "이력 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        historyService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
