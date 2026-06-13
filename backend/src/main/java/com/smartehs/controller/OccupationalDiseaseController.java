package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.OdAftercareResponse;
import com.smartehs.dto.response.OdExposureResponse;
import com.smartehs.dto.response.OdFitnessResponse;
import com.smartehs.dto.response.OdOrgResponse;
import com.smartehs.dto.response.OdPlanResponse;
import com.smartehs.dto.response.OdWorkerResponse;
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
import java.util.stream.Collectors;

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
    @GetMapping("/plans") public ResponseEntity<ApiResponse<List<OdPlanResponse>>> listPlans() { return ResponseEntity.ok(ApiResponse.success(svc.findAllPlans().stream().map(OdPlanResponse::from).collect(Collectors.toList()))); }

    @PostMapping("/plans")
    public ResponseEntity<ApiResponse<OdPlanResponse>> createPlan(@RequestBody OdPlan e, Authentication authentication) {
        if (authentication != null) {
            IdmUser u = idmMapper.findByUid(authentication.getName());
            if (u != null) {
                e.setCreatedByUserId(u.getUidNumber());
                e.setCreatedByName(u.getUserName());
                e.setCreatedByTeam(u.getGroupName());
                e.setCreatedByPosition(u.getTitleName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(OdPlanResponse.from(svc.createPlan(e))));
    }

    @PutMapping("/plans/{id}") public ResponseEntity<ApiResponse<OdPlanResponse>> updatePlan(@PathVariable Long id, @RequestBody OdPlan e) { return ResponseEntity.ok(ApiResponse.success(OdPlanResponse.from(svc.updatePlan(id, e)))); }
    @DeleteMapping("/plans/{id}") public ResponseEntity<ApiResponse<Void>> deletePlan(@PathVariable Long id) { svc.deletePlan(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // ===== Worker =====
    @GetMapping("/workers") public ResponseEntity<ApiResponse<List<OdWorkerResponse>>> listWorkers() { return ResponseEntity.ok(ApiResponse.success(svc.findAllWorkers().stream().map(OdWorkerResponse::from).collect(Collectors.toList()))); }

    @PostMapping("/workers")
    public ResponseEntity<ApiResponse<OdWorkerResponse>> createWorker(@RequestBody OdWorker e, Authentication authentication) {
        if (authentication != null) {
            IdmUser u = idmMapper.findByUid(authentication.getName());
            if (u != null) {
                e.setCreatedByUserId(u.getUidNumber());
                e.setCreatedByName(u.getUserName());
                e.setCreatedByTeam(u.getGroupName());
                e.setCreatedByPosition(u.getTitleName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(OdWorkerResponse.from(svc.createWorker(e))));
    }

    @PutMapping("/workers/{id}") public ResponseEntity<ApiResponse<OdWorkerResponse>> updateWorker(@PathVariable Long id, @RequestBody OdWorker e) { return ResponseEntity.ok(ApiResponse.success(OdWorkerResponse.from(svc.updateWorker(id, e)))); }
    @DeleteMapping("/workers/{id}") public ResponseEntity<ApiResponse<Void>> deleteWorker(@PathVariable Long id) { svc.deleteWorker(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // ===== Org =====
    @GetMapping("/orgs") public ResponseEntity<ApiResponse<List<OdOrgResponse>>> listOrgs() { return ResponseEntity.ok(ApiResponse.success(svc.findAllOrgs().stream().map(OdOrgResponse::from).collect(Collectors.toList()))); }

    @PostMapping("/orgs")
    public ResponseEntity<ApiResponse<OdOrgResponse>> createOrg(@RequestBody OdOrg e, Authentication authentication) {
        if (authentication != null) {
            IdmUser u = idmMapper.findByUid(authentication.getName());
            if (u != null) {
                e.setCreatedByUserId(u.getUidNumber());
                e.setCreatedByName(u.getUserName());
                e.setCreatedByTeam(u.getGroupName());
                e.setCreatedByPosition(u.getTitleName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(OdOrgResponse.from(svc.createOrg(e))));
    }

    @PutMapping("/orgs/{id}") public ResponseEntity<ApiResponse<OdOrgResponse>> updateOrg(@PathVariable Long id, @RequestBody OdOrg e) { return ResponseEntity.ok(ApiResponse.success(OdOrgResponse.from(svc.updateOrg(id, e)))); }
    @DeleteMapping("/orgs/{id}") public ResponseEntity<ApiResponse<Void>> deleteOrg(@PathVariable Long id) { svc.deleteOrg(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // ===== Exposure =====
    @GetMapping("/exposures") public ResponseEntity<ApiResponse<List<OdExposureResponse>>> listExp() { return ResponseEntity.ok(ApiResponse.success(svc.findAllExposures().stream().map(OdExposureResponse::from).collect(Collectors.toList()))); }

    @PostMapping("/exposures")
    public ResponseEntity<ApiResponse<OdExposureResponse>> createExp(@RequestBody OdExposure e, Authentication authentication) {
        if (authentication != null) {
            IdmUser u = idmMapper.findByUid(authentication.getName());
            if (u != null) {
                e.setCreatedByUserId(u.getUidNumber());
                e.setCreatedByName(u.getUserName());
                e.setCreatedByTeam(u.getGroupName());
                e.setCreatedByPosition(u.getTitleName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(OdExposureResponse.from(svc.createExposure(e))));
    }

    @PutMapping("/exposures/{id}") public ResponseEntity<ApiResponse<OdExposureResponse>> updateExp(@PathVariable Long id, @RequestBody OdExposure e) { return ResponseEntity.ok(ApiResponse.success(OdExposureResponse.from(svc.updateExposure(id, e)))); }
    @DeleteMapping("/exposures/{id}") public ResponseEntity<ApiResponse<Void>> deleteExp(@PathVariable Long id) { svc.deleteExposure(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // ===== Aftercare =====
    @GetMapping("/aftercare") public ResponseEntity<ApiResponse<List<OdAftercareResponse>>> listAft() { return ResponseEntity.ok(ApiResponse.success(svc.findAllAftercare().stream().map(OdAftercareResponse::from).collect(Collectors.toList()))); }

    @PostMapping("/aftercare")
    public ResponseEntity<ApiResponse<OdAftercareResponse>> createAft(@RequestBody OdAftercare e, Authentication authentication) {
        if (authentication != null) {
            IdmUser u = idmMapper.findByUid(authentication.getName());
            if (u != null) {
                e.setCreatedByUserId(u.getUidNumber());
                e.setCreatedByName(u.getUserName());
                e.setCreatedByTeam(u.getGroupName());
                e.setCreatedByPosition(u.getTitleName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(OdAftercareResponse.from(svc.createAftercare(e))));
    }

    @PutMapping("/aftercare/{id}") public ResponseEntity<ApiResponse<OdAftercareResponse>> updateAft(@PathVariable Long id, @RequestBody OdAftercare e) { return ResponseEntity.ok(ApiResponse.success(OdAftercareResponse.from(svc.updateAftercare(id, e)))); }
    @DeleteMapping("/aftercare/{id}") public ResponseEntity<ApiResponse<Void>> deleteAft(@PathVariable Long id) { svc.deleteAftercare(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // ===== Fitness =====
    @GetMapping("/fitness") public ResponseEntity<ApiResponse<List<OdFitnessResponse>>> listFit() { return ResponseEntity.ok(ApiResponse.success(svc.findAllFitness().stream().map(OdFitnessResponse::from).collect(Collectors.toList()))); }

    @PostMapping("/fitness")
    public ResponseEntity<ApiResponse<OdFitnessResponse>> createFit(@RequestBody OdFitness e) {
        return ResponseEntity.ok(ApiResponse.success(OdFitnessResponse.from(svc.createFitness(e))));
    }

    @PutMapping("/fitness/{id}") public ResponseEntity<ApiResponse<OdFitnessResponse>> updateFit(@PathVariable Long id, @RequestBody OdFitness e) { return ResponseEntity.ok(ApiResponse.success(OdFitnessResponse.from(svc.updateFitness(id, e)))); }
    @DeleteMapping("/fitness/{id}") public ResponseEntity<ApiResponse<Void>> deleteFit(@PathVariable Long id) { svc.deleteFitness(id); return ResponseEntity.ok(ApiResponse.success(null)); }
}
