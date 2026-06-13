package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.DpCvdResponse;
import com.smartehs.dto.response.DpHearingResponse;
import com.smartehs.dto.response.DpInfectResponse;
import com.smartehs.dto.response.DpMsdResponse;
import com.smartehs.dto.response.DpRespiResponse;
import com.smartehs.dto.response.DpStressResponse;
import com.smartehs.dto.response.DpThermalResponse;
import com.smartehs.model.*;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.IdmUser;
import com.smartehs.service.DiseasePreventionMgmtService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.Authentication;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/disease-prevention-mgmt")
@RequiredArgsConstructor
@Tag(name = "Disease Prevention Mgmt", description = "질병 예방 관리")
public class DiseasePreventionMgmtController {

    private final DiseasePreventionMgmtService svc;
    private final IdmMapper idmMapper;

    // MSD
    @GetMapping("/msd")          public ResponseEntity<ApiResponse<List<DpMsdResponse>>> msd()                                { return ResponseEntity.ok(ApiResponse.success(svc.findAllMsd().stream().map(DpMsdResponse::from).collect(Collectors.toList()))); }

    @PostMapping("/msd")
    public ResponseEntity<ApiResponse<DpMsdResponse>> createMsd(@RequestBody DpMsd e, Authentication authentication) {
        if (authentication != null) {
            IdmUser u = idmMapper.findByUid(authentication.getName());
            if (u != null) {
                e.setCreatedByUserId(u.getUidNumber());
                e.setCreatedByName(u.getUserName());
                e.setCreatedByTeam(u.getGroupName());
                e.setCreatedByPosition(u.getTitleName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(DpMsdResponse.from(svc.createMsd(e))));
    }

    @PutMapping("/msd/{id}")     public ResponseEntity<ApiResponse<DpMsdResponse>> updateMsd(@PathVariable Long id, @RequestBody DpMsd e) { return ResponseEntity.ok(ApiResponse.success(DpMsdResponse.from(svc.updateMsd(id, e)))); }
    @DeleteMapping("/msd/{id}")  public ResponseEntity<ApiResponse<Void>> deleteMsd(@PathVariable Long id)                    { svc.deleteMsd(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // CVD
    @GetMapping("/cvd")          public ResponseEntity<ApiResponse<List<DpCvdResponse>>> cvd()                                { return ResponseEntity.ok(ApiResponse.success(svc.findAllCvd().stream().map(DpCvdResponse::from).collect(Collectors.toList()))); }

    @PostMapping("/cvd")
    public ResponseEntity<ApiResponse<DpCvdResponse>> createCvd(@RequestBody DpCvd e, Authentication authentication) {
        if (authentication != null) {
            IdmUser u = idmMapper.findByUid(authentication.getName());
            if (u != null) {
                e.setCreatedByUserId(u.getUidNumber());
                e.setCreatedByName(u.getUserName());
                e.setCreatedByTeam(u.getGroupName());
                e.setCreatedByPosition(u.getTitleName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(DpCvdResponse.from(svc.createCvd(e))));
    }

    @PutMapping("/cvd/{id}")     public ResponseEntity<ApiResponse<DpCvdResponse>> updateCvd(@PathVariable Long id, @RequestBody DpCvd e) { return ResponseEntity.ok(ApiResponse.success(DpCvdResponse.from(svc.updateCvd(id, e)))); }
    @DeleteMapping("/cvd/{id}")  public ResponseEntity<ApiResponse<Void>> deleteCvd(@PathVariable Long id)                    { svc.deleteCvd(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Stress
    @GetMapping("/stress")          public ResponseEntity<ApiResponse<List<DpStressResponse>>> stress()                      { return ResponseEntity.ok(ApiResponse.success(svc.findAllStress().stream().map(DpStressResponse::from).collect(Collectors.toList()))); }

    @PostMapping("/stress")
    public ResponseEntity<ApiResponse<DpStressResponse>> createStress(@RequestBody DpStress e, Authentication authentication) {
        if (authentication != null) {
            IdmUser u = idmMapper.findByUid(authentication.getName());
            if (u != null) {
                e.setCreatedByUserId(u.getUidNumber());
                e.setCreatedByName(u.getUserName());
                e.setCreatedByTeam(u.getGroupName());
                e.setCreatedByPosition(u.getTitleName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(DpStressResponse.from(svc.createStress(e))));
    }

    @PutMapping("/stress/{id}")     public ResponseEntity<ApiResponse<DpStressResponse>> updateStress(@PathVariable Long id, @RequestBody DpStress e) { return ResponseEntity.ok(ApiResponse.success(DpStressResponse.from(svc.updateStress(id, e)))); }
    @DeleteMapping("/stress/{id}")  public ResponseEntity<ApiResponse<Void>> deleteStress(@PathVariable Long id)              { svc.deleteStress(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Respi
    @GetMapping("/respi")          public ResponseEntity<ApiResponse<List<DpRespiResponse>>> respi()                         { return ResponseEntity.ok(ApiResponse.success(svc.findAllRespi().stream().map(DpRespiResponse::from).collect(Collectors.toList()))); }

    @PostMapping("/respi")
    public ResponseEntity<ApiResponse<DpRespiResponse>> createRespi(@RequestBody DpRespi e, Authentication authentication) {
        if (authentication != null) {
            IdmUser u = idmMapper.findByUid(authentication.getName());
            if (u != null) {
                e.setCreatedByUserId(u.getUidNumber());
                e.setCreatedByName(u.getUserName());
                e.setCreatedByTeam(u.getGroupName());
                e.setCreatedByPosition(u.getTitleName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(DpRespiResponse.from(svc.createRespi(e))));
    }

    @PutMapping("/respi/{id}")     public ResponseEntity<ApiResponse<DpRespiResponse>> updateRespi(@PathVariable Long id, @RequestBody DpRespi e) { return ResponseEntity.ok(ApiResponse.success(DpRespiResponse.from(svc.updateRespi(id, e)))); }
    @DeleteMapping("/respi/{id}")  public ResponseEntity<ApiResponse<Void>> deleteRespi(@PathVariable Long id)                { svc.deleteRespi(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Hearing
    @GetMapping("/hearing")          public ResponseEntity<ApiResponse<List<DpHearingResponse>>> hearing()                   { return ResponseEntity.ok(ApiResponse.success(svc.findAllHearing().stream().map(DpHearingResponse::from).collect(Collectors.toList()))); }

    @PostMapping("/hearing")
    public ResponseEntity<ApiResponse<DpHearingResponse>> createHearing(@RequestBody DpHearing e, Authentication authentication) {
        if (authentication != null) {
            IdmUser u = idmMapper.findByUid(authentication.getName());
            if (u != null) {
                e.setCreatedByUserId(u.getUidNumber());
                e.setCreatedByName(u.getUserName());
                e.setCreatedByTeam(u.getGroupName());
                e.setCreatedByPosition(u.getTitleName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(DpHearingResponse.from(svc.createHearing(e))));
    }

    @PutMapping("/hearing/{id}")     public ResponseEntity<ApiResponse<DpHearingResponse>> updateHearing(@PathVariable Long id, @RequestBody DpHearing e) { return ResponseEntity.ok(ApiResponse.success(DpHearingResponse.from(svc.updateHearing(id, e)))); }
    @DeleteMapping("/hearing/{id}")  public ResponseEntity<ApiResponse<Void>> deleteHearing(@PathVariable Long id)            { svc.deleteHearing(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Thermal
    @GetMapping("/thermal")          public ResponseEntity<ApiResponse<List<DpThermalResponse>>> thermal()                   { return ResponseEntity.ok(ApiResponse.success(svc.findAllThermal().stream().map(DpThermalResponse::from).collect(Collectors.toList()))); }

    @PostMapping("/thermal")
    public ResponseEntity<ApiResponse<DpThermalResponse>> createThermal(@RequestBody DpThermal e, Authentication authentication) {
        if (authentication != null) {
            IdmUser u = idmMapper.findByUid(authentication.getName());
            if (u != null) {
                e.setCreatedByUserId(u.getUidNumber());
                e.setCreatedByName(u.getUserName());
                e.setCreatedByTeam(u.getGroupName());
                e.setCreatedByPosition(u.getTitleName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(DpThermalResponse.from(svc.createThermal(e))));
    }

    @PutMapping("/thermal/{id}")     public ResponseEntity<ApiResponse<DpThermalResponse>> updateThermal(@PathVariable Long id, @RequestBody DpThermal e) { return ResponseEntity.ok(ApiResponse.success(DpThermalResponse.from(svc.updateThermal(id, e)))); }
    @DeleteMapping("/thermal/{id}")  public ResponseEntity<ApiResponse<Void>> deleteThermal(@PathVariable Long id)            { svc.deleteThermal(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Infect
    @GetMapping("/infect")          public ResponseEntity<ApiResponse<List<DpInfectResponse>>> infect()                      { return ResponseEntity.ok(ApiResponse.success(svc.findAllInfect().stream().map(DpInfectResponse::from).collect(Collectors.toList()))); }

    @PostMapping("/infect")
    public ResponseEntity<ApiResponse<DpInfectResponse>> createInfect(@RequestBody DpInfect e, Authentication authentication) {
        if (authentication != null) {
            IdmUser u = idmMapper.findByUid(authentication.getName());
            if (u != null) {
                e.setCreatedByUserId(u.getUidNumber());
                e.setCreatedByName(u.getUserName());
                e.setCreatedByTeam(u.getGroupName());
                e.setCreatedByPosition(u.getTitleName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(DpInfectResponse.from(svc.createInfect(e))));
    }

    @PutMapping("/infect/{id}")     public ResponseEntity<ApiResponse<DpInfectResponse>> updateInfect(@PathVariable Long id, @RequestBody DpInfect e) { return ResponseEntity.ok(ApiResponse.success(DpInfectResponse.from(svc.updateInfect(id, e)))); }
    @DeleteMapping("/infect/{id}")  public ResponseEntity<ApiResponse<Void>> deleteInfect(@PathVariable Long id)              { svc.deleteInfect(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> stats() {
        return ResponseEntity.ok(ApiResponse.success(svc.getStats()));
    }
}
