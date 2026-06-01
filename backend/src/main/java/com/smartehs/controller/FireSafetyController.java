package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.*;
import com.smartehs.service.FireSafetyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/fire-safety")
@RequiredArgsConstructor
public class FireSafetyController {

    private final FireSafetyService svc;

    // Facility
    @GetMapping("/facilities")    public ResponseEntity<ApiResponse<List<FireFacility>>> listFac() { return ResponseEntity.ok(ApiResponse.success(svc.findAllFacilities())); }
    @PostMapping("/facilities")   public ResponseEntity<ApiResponse<FireFacility>> createFac(@RequestBody FireFacility e) { return ResponseEntity.ok(ApiResponse.success(svc.createFacility(e))); }
    @PutMapping("/facilities/{id}")    public ResponseEntity<ApiResponse<FireFacility>> updateFac(@PathVariable Long id, @RequestBody FireFacility e) { return ResponseEntity.ok(ApiResponse.success(svc.updateFacility(id, e))); }
    @DeleteMapping("/facilities/{id}") public ResponseEntity<ApiResponse<Void>> deleteFac(@PathVariable Long id) { svc.deleteFacility(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Inspection
    @GetMapping("/inspections")    public ResponseEntity<ApiResponse<List<FireInspection>>> listInsp() { return ResponseEntity.ok(ApiResponse.success(svc.findAllInspections())); }
    @PostMapping("/inspections")   public ResponseEntity<ApiResponse<FireInspection>> createInsp(@RequestBody FireInspection e) { return ResponseEntity.ok(ApiResponse.success(svc.createInspection(e))); }
    @PutMapping("/inspections/{id}")    public ResponseEntity<ApiResponse<FireInspection>> updateInsp(@PathVariable Long id, @RequestBody FireInspection e) { return ResponseEntity.ok(ApiResponse.success(svc.updateInspection(id, e))); }
    @DeleteMapping("/inspections/{id}") public ResponseEntity<ApiResponse<Void>> deleteInsp(@PathVariable Long id) { svc.deleteInspection(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Issue
    @GetMapping("/issues")    public ResponseEntity<ApiResponse<List<FireIssue>>> listIss() { return ResponseEntity.ok(ApiResponse.success(svc.findAllIssues())); }
    @PostMapping("/issues")   public ResponseEntity<ApiResponse<FireIssue>> createIss(@RequestBody FireIssue e) { return ResponseEntity.ok(ApiResponse.success(svc.createIssue(e))); }
    @PutMapping("/issues/{id}")    public ResponseEntity<ApiResponse<FireIssue>> updateIss(@PathVariable Long id, @RequestBody FireIssue e) { return ResponseEntity.ok(ApiResponse.success(svc.updateIssue(id, e))); }
    @DeleteMapping("/issues/{id}") public ResponseEntity<ApiResponse<Void>> deleteIss(@PathVariable Long id) { svc.deleteIssue(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Plan
    @GetMapping("/plans")    public ResponseEntity<ApiResponse<List<FirePlan>>> listPlan() { return ResponseEntity.ok(ApiResponse.success(svc.findAllPlans())); }
    @PostMapping("/plans")   public ResponseEntity<ApiResponse<FirePlan>> createPlan(@RequestBody FirePlan e) { return ResponseEntity.ok(ApiResponse.success(svc.createPlan(e))); }
    @PutMapping("/plans/{id}")    public ResponseEntity<ApiResponse<FirePlan>> updatePlan(@PathVariable Long id, @RequestBody FirePlan e) { return ResponseEntity.ok(ApiResponse.success(svc.updatePlan(id, e))); }
    @DeleteMapping("/plans/{id}") public ResponseEntity<ApiResponse<Void>> deletePlan(@PathVariable Long id) { svc.deletePlan(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Disaster Facility
    @GetMapping("/disaster-facilities")    public ResponseEntity<ApiResponse<List<DisasterFacility>>> listDis() { return ResponseEntity.ok(ApiResponse.success(svc.findAllDisFacilities())); }
    @PostMapping("/disaster-facilities")   public ResponseEntity<ApiResponse<DisasterFacility>> createDis(@RequestBody DisasterFacility e) { return ResponseEntity.ok(ApiResponse.success(svc.createDisFacility(e))); }
    @PutMapping("/disaster-facilities/{id}")    public ResponseEntity<ApiResponse<DisasterFacility>> updateDis(@PathVariable Long id, @RequestBody DisasterFacility e) { return ResponseEntity.ok(ApiResponse.success(svc.updateDisFacility(id, e))); }
    @DeleteMapping("/disaster-facilities/{id}") public ResponseEntity<ApiResponse<Void>> deleteDis(@PathVariable Long id) { svc.deleteDisFacility(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Disaster Inspection
    @GetMapping("/disaster-inspections")    public ResponseEntity<ApiResponse<List<DisasterInspection>>> listDisInsp() { return ResponseEntity.ok(ApiResponse.success(svc.findAllDisInspections())); }
    @PostMapping("/disaster-inspections")   public ResponseEntity<ApiResponse<DisasterInspection>> createDisInsp(@RequestBody DisasterInspection e) { return ResponseEntity.ok(ApiResponse.success(svc.createDisInspection(e))); }
    @PutMapping("/disaster-inspections/{id}")    public ResponseEntity<ApiResponse<DisasterInspection>> updateDisInsp(@PathVariable Long id, @RequestBody DisasterInspection e) { return ResponseEntity.ok(ApiResponse.success(svc.updateDisInspection(id, e))); }
    @DeleteMapping("/disaster-inspections/{id}") public ResponseEntity<ApiResponse<Void>> deleteDisInsp(@PathVariable Long id) { svc.deleteDisInspection(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Contact
    @GetMapping("/contacts")    public ResponseEntity<ApiResponse<List<FireContact>>> listCt() { return ResponseEntity.ok(ApiResponse.success(svc.findAllContacts())); }
    @PostMapping("/contacts")   public ResponseEntity<ApiResponse<FireContact>> createCt(@RequestBody FireContact e) { return ResponseEntity.ok(ApiResponse.success(svc.createContact(e))); }
    @PutMapping("/contacts/{id}")    public ResponseEntity<ApiResponse<FireContact>> updateCt(@PathVariable Long id, @RequestBody FireContact e) { return ResponseEntity.ok(ApiResponse.success(svc.updateContact(id, e))); }
    @DeleteMapping("/contacts/{id}") public ResponseEntity<ApiResponse<Void>> deleteCt(@PathVariable Long id) { svc.deleteContact(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Drill
    @GetMapping("/drills")    public ResponseEntity<ApiResponse<List<FireDrill>>> listDr() { return ResponseEntity.ok(ApiResponse.success(svc.findAllDrills())); }
    @PostMapping("/drills")   public ResponseEntity<ApiResponse<FireDrill>> createDr(@RequestBody FireDrill e) { return ResponseEntity.ok(ApiResponse.success(svc.createDrill(e))); }
    @PutMapping("/drills/{id}")    public ResponseEntity<ApiResponse<FireDrill>> updateDr(@PathVariable Long id, @RequestBody FireDrill e) { return ResponseEntity.ok(ApiResponse.success(svc.updateDrill(id, e))); }
    @DeleteMapping("/drills/{id}") public ResponseEntity<ApiResponse<Void>> deleteDr(@PathVariable Long id) { svc.deleteDrill(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Compliance
    @GetMapping("/compliances")    public ResponseEntity<ApiResponse<List<FireCompliance>>> listCp() { return ResponseEntity.ok(ApiResponse.success(svc.findAllCompliances())); }
    @PostMapping("/compliances")   public ResponseEntity<ApiResponse<FireCompliance>> createCp(@RequestBody FireCompliance e) { return ResponseEntity.ok(ApiResponse.success(svc.createCompliance(e))); }
    @PutMapping("/compliances/{id}")    public ResponseEntity<ApiResponse<FireCompliance>> updateCp(@PathVariable Long id, @RequestBody FireCompliance e) { return ResponseEntity.ok(ApiResponse.success(svc.updateCompliance(id, e))); }
    @DeleteMapping("/compliances/{id}") public ResponseEntity<ApiResponse<Void>> deleteCp(@PathVariable Long id) { svc.deleteCompliance(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Report
    @GetMapping("/reports")    public ResponseEntity<ApiResponse<List<FireReport>>> listRp() { return ResponseEntity.ok(ApiResponse.success(svc.findAllReports())); }
    @PostMapping("/reports")   public ResponseEntity<ApiResponse<FireReport>> createRp(@RequestBody FireReport e) { return ResponseEntity.ok(ApiResponse.success(svc.createReport(e))); }
    @PutMapping("/reports/{id}")    public ResponseEntity<ApiResponse<FireReport>> updateRp(@PathVariable Long id, @RequestBody FireReport e) { return ResponseEntity.ok(ApiResponse.success(svc.updateReport(id, e))); }
    @DeleteMapping("/reports/{id}") public ResponseEntity<ApiResponse<Void>> deleteRp(@PathVariable Long id) { svc.deleteReport(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    @GetMapping("/stats") public ResponseEntity<ApiResponse<Map<String, Object>>> stats() { return ResponseEntity.ok(ApiResponse.success(svc.getStats())); }
}
