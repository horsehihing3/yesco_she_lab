package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.*;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.IdmUser;
import com.smartehs.service.OccupationalDiseaseService;
import org.springframework.security.core.Authentication;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/occupational-disease")
@RequiredArgsConstructor
@Tag(name = "Occupational Disease", description = "직업병 관리")
public class OccupationalDiseaseController {

    private final OccupationalDiseaseService svc;
    private final IdmMapper idmMapper;

    @GetMapping("/stats")
    @Operation(summary = "통합 통계")
    public ResponseEntity<ApiResponse<Map<String, Object>>> stats() {
        return ResponseEntity.ok(ApiResponse.success(svc.getStats()));
    }

    // ===== Plan =====
    @GetMapping("/plans") public ResponseEntity<ApiResponse<List<OdPlan>>> listPlans() { return ResponseEntity.ok(ApiResponse.success(svc.findAllPlans())); }
    
    @PostMapping("/plans")
    public ResponseEntity<ApiResponse<OdPlan>> createPlan(@RequestBody OdPlan e, Authentication authentication) {
        if (authentication != null) {
            IdmUser u = idmMapper.findByUid(authentication.getName());
            if (u != null) {
                e.setCreatedByUserId(u.getUidNumber());
                e.setCreatedByName(u.getUserName());
                e.setCreatedByTeam(u.getGroupName());
                e.setCreatedByPosition(u.getTitleName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(svc.createPlan(e)));
    }
    
    @PutMapping("/plans/{id}") public ResponseEntity<ApiResponse<OdPlan>> updatePlan(@PathVariable Long id, @RequestBody OdPlan e) { return ResponseEntity.ok(ApiResponse.success(svc.updatePlan(id, e))); }
    @DeleteMapping("/plans/{id}") public ResponseEntity<ApiResponse<Void>> deletePlan(@PathVariable Long id) { svc.deletePlan(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // ===== Worker =====
    @GetMapping("/workers") public ResponseEntity<ApiResponse<List<OdWorker>>> listWorkers() { return ResponseEntity.ok(ApiResponse.success(svc.findAllWorkers())); }
    
    @PostMapping("/workers")
    public ResponseEntity<ApiResponse<OdWorker>> createWorker(@RequestBody OdWorker e, Authentication authentication) {
        if (authentication != null) {
            IdmUser u = idmMapper.findByUid(authentication.getName());
            if (u != null) {
                e.setCreatedByUserId(u.getUidNumber());
                e.setCreatedByName(u.getUserName());
                e.setCreatedByTeam(u.getGroupName());
                e.setCreatedByPosition(u.getTitleName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(svc.createWorker(e)));
    }
    
    @PutMapping("/workers/{id}") public ResponseEntity<ApiResponse<OdWorker>> updateWorker(@PathVariable Long id, @RequestBody OdWorker e) { return ResponseEntity.ok(ApiResponse.success(svc.updateWorker(id, e))); }
    @DeleteMapping("/workers/{id}") public ResponseEntity<ApiResponse<Void>> deleteWorker(@PathVariable Long id) { svc.deleteWorker(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // ===== Org =====
    @GetMapping("/orgs") public ResponseEntity<ApiResponse<List<OdOrg>>> listOrgs() { return ResponseEntity.ok(ApiResponse.success(svc.findAllOrgs())); }
    
    @PostMapping("/orgs")
    public ResponseEntity<ApiResponse<OdOrg>> createOrg(@RequestBody OdOrg e, Authentication authentication) {
        if (authentication != null) {
            IdmUser u = idmMapper.findByUid(authentication.getName());
            if (u != null) {
                e.setCreatedByUserId(u.getUidNumber());
                e.setCreatedByName(u.getUserName());
                e.setCreatedByTeam(u.getGroupName());
                e.setCreatedByPosition(u.getTitleName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(svc.createOrg(e)));
    }
    
    @PutMapping("/orgs/{id}") public ResponseEntity<ApiResponse<OdOrg>> updateOrg(@PathVariable Long id, @RequestBody OdOrg e) { return ResponseEntity.ok(ApiResponse.success(svc.updateOrg(id, e))); }
    @DeleteMapping("/orgs/{id}") public ResponseEntity<ApiResponse<Void>> deleteOrg(@PathVariable Long id) { svc.deleteOrg(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // ===== Exposure =====
    @GetMapping("/exposures") public ResponseEntity<ApiResponse<List<OdExposure>>> listExp() { return ResponseEntity.ok(ApiResponse.success(svc.findAllExposures())); }
    
    @PostMapping("/exposures")
    public ResponseEntity<ApiResponse<OdExposure>> createExp(@RequestBody OdExposure e, Authentication authentication) {
        if (authentication != null) {
            IdmUser u = idmMapper.findByUid(authentication.getName());
            if (u != null) {
                e.setCreatedByUserId(u.getUidNumber());
                e.setCreatedByName(u.getUserName());
                e.setCreatedByTeam(u.getGroupName());
                e.setCreatedByPosition(u.getTitleName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(svc.createExposure(e)));
    }
    
    @PutMapping("/exposures/{id}") public ResponseEntity<ApiResponse<OdExposure>> updateExp(@PathVariable Long id, @RequestBody OdExposure e) { return ResponseEntity.ok(ApiResponse.success(svc.updateExposure(id, e))); }
    @DeleteMapping("/exposures/{id}") public ResponseEntity<ApiResponse<Void>> deleteExp(@PathVariable Long id) { svc.deleteExposure(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // ===== Aftercare =====
    @GetMapping("/aftercare") public ResponseEntity<ApiResponse<List<OdAftercare>>> listAft() { return ResponseEntity.ok(ApiResponse.success(svc.findAllAftercare())); }
    
    @PostMapping("/aftercare")
    public ResponseEntity<ApiResponse<OdAftercare>> createAft(@RequestBody OdAftercare e, Authentication authentication) {
        if (authentication != null) {
            IdmUser u = idmMapper.findByUid(authentication.getName());
            if (u != null) {
                e.setCreatedByUserId(u.getUidNumber());
                e.setCreatedByName(u.getUserName());
                e.setCreatedByTeam(u.getGroupName());
                e.setCreatedByPosition(u.getTitleName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(svc.createAftercare(e)));
    }
    
    @PutMapping("/aftercare/{id}") public ResponseEntity<ApiResponse<OdAftercare>> updateAft(@PathVariable Long id, @RequestBody OdAftercare e) { return ResponseEntity.ok(ApiResponse.success(svc.updateAftercare(id, e))); }
    @DeleteMapping("/aftercare/{id}") public ResponseEntity<ApiResponse<Void>> deleteAft(@PathVariable Long id) { svc.deleteAftercare(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // ===== Fitness =====
    @GetMapping("/fitness") public ResponseEntity<ApiResponse<List<OdFitness>>> listFit() { return ResponseEntity.ok(ApiResponse.success(svc.findAllFitness())); }
    
    @PostMapping("/fitness")
    public ResponseEntity<ApiResponse<OdFitness>> createFit(@RequestBody OdFitness e) {
        return ResponseEntity.ok(ApiResponse.success(svc.createFitness(e)));
    }
    
    @PutMapping("/fitness/{id}") public ResponseEntity<ApiResponse<OdFitness>> updateFit(@PathVariable Long id, @RequestBody OdFitness e) { return ResponseEntity.ok(ApiResponse.success(svc.updateFitness(id, e))); }
    @DeleteMapping("/fitness/{id}") public ResponseEntity<ApiResponse<Void>> deleteFit(@PathVariable Long id) { svc.deleteFitness(id); return ResponseEntity.ok(ApiResponse.success(null)); }
}
