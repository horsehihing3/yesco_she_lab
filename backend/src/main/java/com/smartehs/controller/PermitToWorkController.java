package com.smartehs.controller;

import com.smartehs.dto.request.PermitToWorkRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.PermitToWorkResponse;
import com.smartehs.mapper.PermitWorkerMapper;
import com.smartehs.model.PermitWorker;
import com.smartehs.service.PermitToWorkService;
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
@RequestMapping("/permit-to-work")
@RequiredArgsConstructor
@Tag(name = "Permit to Work", description = "작업 허가 관리")
public class PermitToWorkController {

    private final PermitToWorkService service;
    private final PermitWorkerMapper permitWorkerMapper;

    @GetMapping
    @Operation(summary = "작업 허가 전체 조회")
    public ResponseEntity<ApiResponse<Page<PermitToWorkResponse>>> findAll(
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "작업 허가 상세 조회")
    public ResponseEntity<ApiResponse<PermitToWorkResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "상태별 작업 허가 조회")
    public ResponseEntity<ApiResponse<Page<PermitToWorkResponse>>> findByStatus(
            @PathVariable String status, @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findByStatus(status, pageable)));
    }

    @GetMapping("/type/{permitType}")
    @Operation(summary = "유형별 작업 허가 조회")
    public ResponseEntity<ApiResponse<Page<PermitToWorkResponse>>> findByType(
            @PathVariable String permitType, @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findByType(permitType, pageable)));
    }

    @GetMapping("/requester/{requesterId}")
    @Operation(summary = "신청자별 작업 허가 조회")
    public ResponseEntity<ApiResponse<Page<PermitToWorkResponse>>> findByRequesterId(
            @PathVariable String requesterId, @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findByRequesterId(requesterId, pageable)));
    }

    @GetMapping("/search")
    @Operation(summary = "작업 허가 검색")
    public ResponseEntity<ApiResponse<Page<PermitToWorkResponse>>> search(
            @RequestParam String title, @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.searchByTitle(title, pageable)));
    }

    @PostMapping
    @Operation(summary = "작업 허가 등록")
    public ResponseEntity<ApiResponse<PermitToWorkResponse>> create(@Valid @RequestBody PermitToWorkRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.create(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "작업 허가 수정")
    public ResponseEntity<ApiResponse<PermitToWorkResponse>> update(
            @PathVariable Long id, @Valid @RequestBody PermitToWorkRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, request)));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "작업 허가 상태 변경")
    public ResponseEntity<ApiResponse<PermitToWorkResponse>> updateStatus(
            @PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(ApiResponse.success(service.updateStatus(id, status)));
    }

    @PatchMapping("/{id}/transition")
    @Operation(summary = "작업 허가 결재 흐름 전이",
            description = "action: submit | approve | reject | completionSubmit | complete")
    public ResponseEntity<ApiResponse<PermitToWorkResponse>> transition(
            @PathVariable Long id, @RequestBody java.util.Map<String, Object> body,
            org.springframework.security.core.Authentication auth) {
        String action = body.get("action") == null ? null : String.valueOf(body.get("action"));
        String rejectReason = body.get("rejectReason") == null ? null : String.valueOf(body.get("rejectReason"));
        String actor = auth != null ? auth.getName() : null;
        return ResponseEntity.ok(ApiResponse.success(service.transition(id, action, rejectReason, actor)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "작업 허가 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/external")
    @Operation(summary = "외부 직원 작업 허가 목록")
    public ResponseEntity<ApiResponse<Page<PermitToWorkResponse>>> findExternal(@PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findByIsExternal(true, pageable)));
    }

    @GetMapping("/{id}/workers")
    @Operation(summary = "작업 허가 작업자 목록 조회")
    public ResponseEntity<ApiResponse<java.util.List<PermitWorker>>> getWorkers(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(permitWorkerMapper.findByPermitId(id)));
    }

    @PostMapping("/{id}/workers")
    @Operation(summary = "작업 허가 작업자 등록")
    public ResponseEntity<ApiResponse<Void>> addWorker(@PathVariable Long id, @RequestBody PermitWorker worker) {
        worker.setPermitId(id);
        permitWorkerMapper.insert(worker);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/{id}/workers")
    @Operation(summary = "작업 허가 작업자 전체 삭제")
    public ResponseEntity<ApiResponse<Void>> deleteWorkers(@PathVariable Long id) {
        permitWorkerMapper.deleteByPermitId(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
