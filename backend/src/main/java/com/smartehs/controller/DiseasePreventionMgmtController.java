package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.*;
import com.smartehs.service.DiseasePreventionMgmtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/disease-prevention-mgmt")
@RequiredArgsConstructor
public class DiseasePreventionMgmtController {

    private final DiseasePreventionMgmtService svc;

    // MSD
    @GetMapping("/msd")          public ResponseEntity<ApiResponse<List<DpMsd>>> msd()                                        { return ResponseEntity.ok(ApiResponse.success(svc.findAllMsd())); }
    @PostMapping("/msd")         public ResponseEntity<ApiResponse<DpMsd>> createMsd(@RequestBody DpMsd e)                    { return ResponseEntity.ok(ApiResponse.success(svc.createMsd(e))); }
    @PutMapping("/msd/{id}")     public ResponseEntity<ApiResponse<DpMsd>> updateMsd(@PathVariable Long id, @RequestBody DpMsd e) { return ResponseEntity.ok(ApiResponse.success(svc.updateMsd(id, e))); }
    @DeleteMapping("/msd/{id}")  public ResponseEntity<ApiResponse<Void>> deleteMsd(@PathVariable Long id)                    { svc.deleteMsd(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // CVD
    @GetMapping("/cvd")          public ResponseEntity<ApiResponse<List<DpCvd>>> cvd()                                        { return ResponseEntity.ok(ApiResponse.success(svc.findAllCvd())); }
    @PostMapping("/cvd")         public ResponseEntity<ApiResponse<DpCvd>> createCvd(@RequestBody DpCvd e)                    { return ResponseEntity.ok(ApiResponse.success(svc.createCvd(e))); }
    @PutMapping("/cvd/{id}")     public ResponseEntity<ApiResponse<DpCvd>> updateCvd(@PathVariable Long id, @RequestBody DpCvd e) { return ResponseEntity.ok(ApiResponse.success(svc.updateCvd(id, e))); }
    @DeleteMapping("/cvd/{id}")  public ResponseEntity<ApiResponse<Void>> deleteCvd(@PathVariable Long id)                    { svc.deleteCvd(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Stress
    @GetMapping("/stress")          public ResponseEntity<ApiResponse<List<DpStress>>> stress()                                          { return ResponseEntity.ok(ApiResponse.success(svc.findAllStress())); }
    @PostMapping("/stress")         public ResponseEntity<ApiResponse<DpStress>> createStress(@RequestBody DpStress e)                  { return ResponseEntity.ok(ApiResponse.success(svc.createStress(e))); }
    @PutMapping("/stress/{id}")     public ResponseEntity<ApiResponse<DpStress>> updateStress(@PathVariable Long id, @RequestBody DpStress e) { return ResponseEntity.ok(ApiResponse.success(svc.updateStress(id, e))); }
    @DeleteMapping("/stress/{id}")  public ResponseEntity<ApiResponse<Void>> deleteStress(@PathVariable Long id)                        { svc.deleteStress(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Respi
    @GetMapping("/respi")          public ResponseEntity<ApiResponse<List<DpRespi>>> respi()                                       { return ResponseEntity.ok(ApiResponse.success(svc.findAllRespi())); }
    @PostMapping("/respi")         public ResponseEntity<ApiResponse<DpRespi>> createRespi(@RequestBody DpRespi e)                { return ResponseEntity.ok(ApiResponse.success(svc.createRespi(e))); }
    @PutMapping("/respi/{id}")     public ResponseEntity<ApiResponse<DpRespi>> updateRespi(@PathVariable Long id, @RequestBody DpRespi e) { return ResponseEntity.ok(ApiResponse.success(svc.updateRespi(id, e))); }
    @DeleteMapping("/respi/{id}")  public ResponseEntity<ApiResponse<Void>> deleteRespi(@PathVariable Long id)                    { svc.deleteRespi(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Hearing
    @GetMapping("/hearing")          public ResponseEntity<ApiResponse<List<DpHearing>>> hearing()                                           { return ResponseEntity.ok(ApiResponse.success(svc.findAllHearing())); }
    @PostMapping("/hearing")         public ResponseEntity<ApiResponse<DpHearing>> createHearing(@RequestBody DpHearing e)                  { return ResponseEntity.ok(ApiResponse.success(svc.createHearing(e))); }
    @PutMapping("/hearing/{id}")     public ResponseEntity<ApiResponse<DpHearing>> updateHearing(@PathVariable Long id, @RequestBody DpHearing e) { return ResponseEntity.ok(ApiResponse.success(svc.updateHearing(id, e))); }
    @DeleteMapping("/hearing/{id}")  public ResponseEntity<ApiResponse<Void>> deleteHearing(@PathVariable Long id)                          { svc.deleteHearing(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Thermal
    @GetMapping("/thermal")          public ResponseEntity<ApiResponse<List<DpThermal>>> thermal()                                           { return ResponseEntity.ok(ApiResponse.success(svc.findAllThermal())); }
    @PostMapping("/thermal")         public ResponseEntity<ApiResponse<DpThermal>> createThermal(@RequestBody DpThermal e)                  { return ResponseEntity.ok(ApiResponse.success(svc.createThermal(e))); }
    @PutMapping("/thermal/{id}")     public ResponseEntity<ApiResponse<DpThermal>> updateThermal(@PathVariable Long id, @RequestBody DpThermal e) { return ResponseEntity.ok(ApiResponse.success(svc.updateThermal(id, e))); }
    @DeleteMapping("/thermal/{id}")  public ResponseEntity<ApiResponse<Void>> deleteThermal(@PathVariable Long id)                          { svc.deleteThermal(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Infect
    @GetMapping("/infect")          public ResponseEntity<ApiResponse<List<DpInfect>>> infect()                                       { return ResponseEntity.ok(ApiResponse.success(svc.findAllInfect())); }
    @PostMapping("/infect")         public ResponseEntity<ApiResponse<DpInfect>> createInfect(@RequestBody DpInfect e)                { return ResponseEntity.ok(ApiResponse.success(svc.createInfect(e))); }
    @PutMapping("/infect/{id}")     public ResponseEntity<ApiResponse<DpInfect>> updateInfect(@PathVariable Long id, @RequestBody DpInfect e) { return ResponseEntity.ok(ApiResponse.success(svc.updateInfect(id, e))); }
    @DeleteMapping("/infect/{id}")  public ResponseEntity<ApiResponse<Void>> deleteInfect(@PathVariable Long id)                      { svc.deleteInfect(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> stats() {
        return ResponseEntity.ok(ApiResponse.success(svc.getStats()));
    }
}
