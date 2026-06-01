package com.smartehs.controller;

import com.smartehs.dto.request.LegalObligationRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.LegalObligationResponse;
import com.smartehs.service.LegalObligationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/legal/obligations")
@RequiredArgsConstructor
@Tag(name = "Legal Obligation", description = "의무 이행점검")
public class LegalObligationController {

    private final LegalObligationService service;

    @GetMapping
    @Operation(summary = "의무 목록")
    public ResponseEntity<ApiResponse<List<LegalObligationResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "의무 상세")
    public ResponseEntity<ApiResponse<LegalObligationResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/stats")
    @Operation(summary = "의무 통계")
    public ResponseEntity<ApiResponse<Map<String, Object>>> stats() {
        return ResponseEntity.ok(ApiResponse.success(service.getStats()));
    }

    @PostMapping
    @Operation(summary = "의무 등록")
    public ResponseEntity<ApiResponse<LegalObligationResponse>> create(@Valid @RequestBody LegalObligationRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.create(req)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "의무 수정")
    public ResponseEntity<ApiResponse<LegalObligationResponse>> update(@PathVariable Long id, @Valid @RequestBody LegalObligationRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "의무 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
