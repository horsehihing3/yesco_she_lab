package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.request.WorkplaceSiteRequest;
import com.smartehs.model.WorkplaceSite;
import com.smartehs.service.WorkplaceSiteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/workplace-sites")
@RequiredArgsConstructor
@Tag(name = "사업장 (Workplace Site)", description = "도면관리 사업장 마스터")
public class WorkplaceSiteController {

    private final WorkplaceSiteService service;

    @GetMapping
    @Operation(summary = "사업장 목록")
    public ApiResponse<List<WorkplaceSite>> list() {
        return ApiResponse.success(service.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "사업장 상세")
    public ApiResponse<WorkplaceSite> detail(@PathVariable Long id) {
        return ApiResponse.success(service.findById(id));
    }

    @PostMapping
    @Operation(summary = "사업장 등록 (건물 넘버 자동 부여)")
    public ApiResponse<WorkplaceSite> create(@RequestBody WorkplaceSiteRequest req) {
        return ApiResponse.success(service.create(req));
    }

    @PutMapping("/{id}")
    @Operation(summary = "사업장 수정")
    public ApiResponse<WorkplaceSite> update(@PathVariable Long id, @RequestBody WorkplaceSiteRequest req) {
        return ApiResponse.success(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "사업장 삭제 (soft)")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.success(null);
    }
}
