package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.KpiRecord;
import com.smartehs.service.KpiRecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/kpi") @RequiredArgsConstructor
@Tag(name = "KPI Dashboard", description = "KPI 대시보드")
public class KpiRecordController {
    private final KpiRecordService service;

    @GetMapping("/year/{year}")
    @Operation(summary = "연도별 KPI 전체 조회")
    public ResponseEntity<ApiResponse<List<KpiRecord>>> findByYear(@PathVariable int year) {
        return ResponseEntity.ok(ApiResponse.success(service.findByYear(year)));
    }

    @GetMapping("/type/{kpiType}/year/{year}")
    @Operation(summary = "지표별 연도 조회")
    public ResponseEntity<ApiResponse<List<KpiRecord>>> findByTypeAndYear(@PathVariable String kpiType, @PathVariable int year) {
        return ResponseEntity.ok(ApiResponse.success(service.findByTypeAndYear(kpiType, year)));
    }

    @PostMapping
    @Operation(summary = "KPI 기록 등록")
    public ResponseEntity<ApiResponse<KpiRecord>> create(@RequestBody KpiRecord record) {
        return ResponseEntity.ok(ApiResponse.success(service.create(record)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "KPI 기록 수정")
    public ResponseEntity<ApiResponse<KpiRecord>> update(@PathVariable Long id, @RequestBody KpiRecord record) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, record)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "KPI 기록 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id); return ResponseEntity.ok(ApiResponse.success(null));
    }
}
