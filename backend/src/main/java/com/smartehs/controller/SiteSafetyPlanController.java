package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.IdmUser;
import com.smartehs.model.SiteSafetyPlan;
import com.smartehs.model.SiteSafetyWorker;
import com.smartehs.service.SiteSafetyPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/site-safety-plans")
@RequiredArgsConstructor
@Tag(name = "Site Safety Plan", description = "현장 안전 작업계획")
public class SiteSafetyPlanController {

    private final SiteSafetyPlanService svc;
    private final IdmMapper idmMapper;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<SiteSafetyPlan>>> findAll(
            @RequestParam(value = "planType", required = false) String planType,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(svc.findAll(planType, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SiteSafetyPlan>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(svc.findById(id)));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<Page<SiteSafetyPlan>>> findByStatus(
            @PathVariable String status,
            @RequestParam(value = "planType", required = false) String planType,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(svc.findByStatus(planType, status, pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SiteSafetyPlan>> create(
            @RequestBody SiteSafetyPlan plan, Authentication authentication) {
        if (authentication != null) {
            IdmUser u = idmMapper.findByUid(authentication.getName());
            if (u != null) {
                plan.setCreatedByUserId(u.getUidNumber());
                plan.setCreatedByName(u.getUserName());
                plan.setCreatedByTeam(u.getGroupName());
                plan.setCreatedByPosition(u.getTitleName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(svc.create(plan)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SiteSafetyPlan>> update(
            @PathVariable Long id,
            @RequestBody SiteSafetyPlan plan,
            Authentication authentication) {
        if (authentication != null) {
            plan.setModifiedBy(authentication.getName());
            IdmUser u = idmMapper.findByUid(authentication.getName());
            if (u != null) {
                plan.setModifiedByName(u.getUserName());
                plan.setModifiedByTeam(u.getGroupName());
                plan.setModifiedByPosition(u.getTitleName());
                plan.setModifiedByUserId(u.getUidNumber());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(svc.update(id, plan)));
    }

    @PatchMapping("/{id}/transition")
    public ResponseEntity<ApiResponse<SiteSafetyPlan>> transition(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        String action = String.valueOf(body.get("action"));
        String rejectReason = body.get("rejectReason") != null ? String.valueOf(body.get("rejectReason")) : null;
        String username = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success(svc.transition(id, action, username, rejectReason)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        svc.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/{id}/workers")
    public ResponseEntity<ApiResponse<List<SiteSafetyWorker>>> getWorkers(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(svc.findWorkersByPlanId(id)));
    }

    @PostMapping("/{id}/workers")
    public ResponseEntity<ApiResponse<SiteSafetyWorker>> addWorker(@PathVariable Long id, @RequestBody SiteSafetyWorker worker) {
        return ResponseEntity.ok(ApiResponse.success(svc.addWorker(id, worker)));
    }

    @DeleteMapping("/{id}/workers")
    public ResponseEntity<ApiResponse<Void>> deleteWorkers(@PathVariable Long id) {
        svc.deleteWorkersByPlanId(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/edit-lock")
    public ResponseEntity<ApiResponse<Map<String, Object>>> acquireEditLock(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(svc.tryAcquireEditLock(id, authentication.getName())));
    }

    @DeleteMapping("/{id}/edit-lock")
    public ResponseEntity<ApiResponse<Void>> releaseEditLock(@PathVariable Long id, Authentication authentication) {
        svc.releaseEditLock(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
