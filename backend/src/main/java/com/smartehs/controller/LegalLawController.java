package com.smartehs.controller;

import com.smartehs.dto.request.LegalLawRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.LegalLawResponse;
import com.smartehs.service.LegalLawService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/legal/laws")
@RequiredArgsConstructor
@Tag(name = "Legal Law", description = "법규 검토")
public class LegalLawController {

    private final LegalLawService service;

    @GetMapping
    @Operation(summary = "법령 목록")
    public ResponseEntity<ApiResponse<List<LegalLawResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "법령 상세")
    public ResponseEntity<ApiResponse<LegalLawResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/stats")
    @Operation(summary = "법령 통계")
    public ResponseEntity<ApiResponse<Map<String, Object>>> stats() {
        return ResponseEntity.ok(ApiResponse.success(service.getStats()));
    }

    @PostMapping
    @Operation(summary = "법령 등록")
    public ResponseEntity<ApiResponse<LegalLawResponse>> create(@Valid @RequestBody LegalLawRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.create(req)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "법령 수정")
    public ResponseEntity<ApiResponse<LegalLawResponse>> update(@PathVariable Long id, @Valid @RequestBody LegalLawRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "법령 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
