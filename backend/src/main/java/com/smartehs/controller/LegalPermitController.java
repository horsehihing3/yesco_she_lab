package com.smartehs.controller;

import com.smartehs.dto.request.LegalPermitRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.LegalPermitResponse;
import com.smartehs.service.LegalPermitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/legal/permits")
@RequiredArgsConstructor
@Tag(name = "Legal Permit", description = "설비·시설 인허가")
public class LegalPermitController {

    private final LegalPermitService service;

    @GetMapping
    @Operation(summary = "인허가 목록")
    public ResponseEntity<ApiResponse<List<LegalPermitResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "인허가 상세")
    public ResponseEntity<ApiResponse<LegalPermitResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/stats")
    @Operation(summary = "인허가 통계")
    public ResponseEntity<ApiResponse<Map<String, Object>>> stats() {
        return ResponseEntity.ok(ApiResponse.success(service.getStats()));
    }

    @PostMapping
    @Operation(summary = "인허가 등록")
    public ResponseEntity<ApiResponse<LegalPermitResponse>> create(@Valid @RequestBody LegalPermitRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.create(req)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "인허가 수정")
    public ResponseEntity<ApiResponse<LegalPermitResponse>> update(@PathVariable Long id, @Valid @RequestBody LegalPermitRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "인허가 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
