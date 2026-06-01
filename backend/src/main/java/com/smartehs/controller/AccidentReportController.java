package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.AccidentReport;
import com.smartehs.service.AccidentReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/accident-reports")
@RequiredArgsConstructor
@Tag(name = "Accident Report", description = "보건안전 재해발생 정보 조사서")
public class AccidentReportController {

    private final AccidentReportService service;

    @GetMapping
    @Operation(summary = "재해발생 정보 목록 조회")
    public ResponseEntity<ApiResponse<List<AccidentReport>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "재해발생 정보 상세 조회")
    public ResponseEntity<ApiResponse<AccidentReport>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @PostMapping
    @Operation(summary = "재해발생 정보 등록")
    public ResponseEntity<ApiResponse<AccidentReport>> create(@RequestBody AccidentReport report) {
        return ResponseEntity.ok(ApiResponse.success(service.create(report)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "재해발생 정보 수정")
    public ResponseEntity<ApiResponse<AccidentReport>> update(
            @PathVariable Long id,
            @RequestBody AccidentReport report) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, report)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "재해발생 정보 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
