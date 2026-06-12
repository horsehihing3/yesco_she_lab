package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.ContractorPlan;
import com.smartehs.model.ContractorWorker;
import com.smartehs.model.IdmUser;
import com.smartehs.service.ContractorPlanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/contractor-plans")
@RequiredArgsConstructor
@Tag(name = "Contractor Plan", description = "협력사 관리")
public class ContractorPlanController {

    private final ContractorPlanService contractorPlanService;
    private final IdmMapper idmMapper;

    @GetMapping
    @Operation(summary = "협력사 계획 전체 목록 조회")
    public ResponseEntity<ApiResponse<Page<ContractorPlan>>> findAll(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(contractorPlanService.findAll(pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "협력사 계획 상세 조회")
    public ResponseEntity<ApiResponse<ContractorPlan>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(contractorPlanService.findById(id)));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "상태별 협력사 계획 조회")
    public ResponseEntity<ApiResponse<Page<ContractorPlan>>> findByStatus(
            @PathVariable String status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(contractorPlanService.findByStatus(status, pageable)));
    }

    @PostMapping
    @Operation(summary = "협력사 계획 등록")
    public ResponseEntity<ApiResponse<ContractorPlan>> create(
            @RequestBody ContractorPlan plan, Authentication authentication) {
        if (authentication != null) {
            IdmUser u = idmMapper.findByUid(authentication.getName());
            if (u != null) {
                plan.setCreatedByUserId(u.getUidNumber());
                plan.setCreatedByName(u.getUserName());
                plan.setCreatedByTeam(u.getGroupName());
                plan.setCreatedByPosition(u.getTitleName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(contractorPlanService.create(plan)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "협력사 계획 수정")
    public ResponseEntity<ApiResponse<ContractorPlan>> update(
            @PathVariable Long id,
            @RequestBody ContractorPlan plan,
            Authentication authentication) {
        if (authentication != null) {
            IdmUser u = idmMapper.findByUid(authentication.getName());
            if (u != null) {
                plan.setModifiedByName(u.getUserName());
                plan.setModifiedByTeam(u.getGroupName());
                plan.setModifiedByPosition(u.getTitleName());
                plan.setModifiedByUserId(u.getUidNumber());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(contractorPlanService.update(id, plan)));
    }

    @PatchMapping("/{id}/approve")
    @Operation(summary = "협력사 계획 승인")
    public ResponseEntity<ApiResponse<ContractorPlan>> approve(@PathVariable Long id, Authentication authentication) {
        String approvedBy = authentication.getName();
        return ResponseEntity.ok(ApiResponse.success(contractorPlanService.approve(id, approvedBy)));
    }

    @PatchMapping("/{id}/transition")
    @Operation(summary = "협력사 계획 결재 전이",
               description = "action: submit / approve / reject / completionSubmit / complete; rejectReason required when reject")
    public ResponseEntity<ApiResponse<ContractorPlan>> transition(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        String action = String.valueOf(body.get("action"));
        String rejectReason = body.get("rejectReason") != null ? String.valueOf(body.get("rejectReason")) : null;
        String username = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success(contractorPlanService.transition(id, action, username, rejectReason)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "협력사 계획 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        contractorPlanService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/{id}/workers")
    @Operation(summary = "협력사 작업자 목록 조회")
    public ResponseEntity<ApiResponse<List<ContractorWorker>>> getWorkers(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(contractorPlanService.findWorkersByPlanId(id)));
    }

    @PostMapping("/{id}/workers")
    @Operation(summary = "협력사 작업자 등록")
    public ResponseEntity<ApiResponse<ContractorWorker>> addWorker(@PathVariable Long id, @RequestBody ContractorWorker worker) {
        return ResponseEntity.ok(ApiResponse.success(contractorPlanService.addWorker(id, worker)));
    }

    @DeleteMapping("/{id}/workers")
    @Operation(summary = "협력사 작업자 전체 삭제")
    public ResponseEntity<ApiResponse<Void>> deleteWorkers(@PathVariable Long id) {
        contractorPlanService.deleteWorkersByPlanId(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/edit-lock")
    @Operation(summary = "편집 잠금 획득 시도")
    public ResponseEntity<ApiResponse<Map<String, Object>>> acquireEditLock(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(contractorPlanService.tryAcquireEditLock(id, authentication.getName())));
    }

    @DeleteMapping("/{id}/edit-lock")
    @Operation(summary = "편집 잠금 해제")
    public ResponseEntity<ApiResponse<Void>> releaseEditLock(@PathVariable Long id, Authentication authentication) {
        contractorPlanService.releaseEditLock(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
