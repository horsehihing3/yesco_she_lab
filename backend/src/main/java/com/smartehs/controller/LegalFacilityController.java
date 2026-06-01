package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.FacilityEquipment;
import com.smartehs.model.FacilityInspection;
import com.smartehs.model.FacilityWatch;
import com.smartehs.model.FacilityWatchCheck;
import com.smartehs.service.FacilityEquipmentService;
import com.smartehs.service.FacilityInspectionService;
import com.smartehs.service.FacilityWatchCheckService;
import com.smartehs.service.FacilityWatchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/legal-facility")
@RequiredArgsConstructor
@Tag(name = "Legal Facility", description = "법정시설관리")
public class LegalFacilityController {

    private final FacilityEquipmentService eqSvc;
    private final FacilityInspectionService inspSvc;
    private final FacilityWatchService watchSvc;
    private final FacilityWatchCheckService checkSvc;

    // ===== Equipment (법정기구 대장) =====
    @GetMapping("/equipments")
    @Operation(summary = "법정기구 목록")
    public ResponseEntity<ApiResponse<List<FacilityEquipment>>> listEq() {
        return ResponseEntity.ok(ApiResponse.success(eqSvc.findAll()));
    }
    @GetMapping("/equipments/{id}")
    public ResponseEntity<ApiResponse<FacilityEquipment>> getEq(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(eqSvc.findById(id)));
    }
    @GetMapping("/equipments/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> statsEq() {
        return ResponseEntity.ok(ApiResponse.success(eqSvc.getStats()));
    }
    @PostMapping("/equipments")
    public ResponseEntity<ApiResponse<FacilityEquipment>> createEq(@RequestBody FacilityEquipment e) {
        return ResponseEntity.ok(ApiResponse.success(eqSvc.create(e)));
    }
    @PutMapping("/equipments/{id}")
    public ResponseEntity<ApiResponse<FacilityEquipment>> updateEq(@PathVariable Long id, @RequestBody FacilityEquipment e) {
        return ResponseEntity.ok(ApiResponse.success(eqSvc.update(id, e)));
    }
    @DeleteMapping("/equipments/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEq(@PathVariable Long id) {
        eqSvc.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ===== Inspection (검사 이력) =====
    @GetMapping("/inspections")
    public ResponseEntity<ApiResponse<List<FacilityInspection>>> listInsp() {
        return ResponseEntity.ok(ApiResponse.success(inspSvc.findAll()));
    }
    @GetMapping("/inspections/{id}")
    public ResponseEntity<ApiResponse<FacilityInspection>> getInsp(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(inspSvc.findById(id)));
    }
    @GetMapping("/inspections/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> statsInsp() {
        return ResponseEntity.ok(ApiResponse.success(inspSvc.getStats()));
    }
    @PostMapping("/inspections")
    public ResponseEntity<ApiResponse<FacilityInspection>> createInsp(@RequestBody FacilityInspection e) {
        return ResponseEntity.ok(ApiResponse.success(inspSvc.create(e)));
    }
    @PutMapping("/inspections/{id}")
    public ResponseEntity<ApiResponse<FacilityInspection>> updateInsp(@PathVariable Long id, @RequestBody FacilityInspection e) {
        return ResponseEntity.ok(ApiResponse.success(inspSvc.update(id, e)));
    }
    @DeleteMapping("/inspections/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteInsp(@PathVariable Long id) {
        inspSvc.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ===== Watch (관심시설) =====
    @GetMapping("/watches")
    public ResponseEntity<ApiResponse<List<FacilityWatch>>> listWatch() {
        return ResponseEntity.ok(ApiResponse.success(watchSvc.findAll()));
    }
    @GetMapping("/watches/{id}")
    public ResponseEntity<ApiResponse<FacilityWatch>> getWatch(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(watchSvc.findById(id)));
    }
    @GetMapping("/watches/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> statsWatch() {
        return ResponseEntity.ok(ApiResponse.success(watchSvc.getStats()));
    }
    @PostMapping("/watches")
    public ResponseEntity<ApiResponse<FacilityWatch>> createWatch(@RequestBody FacilityWatch e) {
        return ResponseEntity.ok(ApiResponse.success(watchSvc.create(e)));
    }
    @PutMapping("/watches/{id}")
    public ResponseEntity<ApiResponse<FacilityWatch>> updateWatch(@PathVariable Long id, @RequestBody FacilityWatch e) {
        return ResponseEntity.ok(ApiResponse.success(watchSvc.update(id, e)));
    }
    @DeleteMapping("/watches/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWatch(@PathVariable Long id) {
        watchSvc.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ===== Watch Check (점검 기록) =====
    @GetMapping("/watch-checks")
    public ResponseEntity<ApiResponse<List<FacilityWatchCheck>>> listCheck() {
        return ResponseEntity.ok(ApiResponse.success(checkSvc.findAll()));
    }
    @PostMapping("/watch-checks")
    public ResponseEntity<ApiResponse<FacilityWatchCheck>> createCheck(@RequestBody FacilityWatchCheck e) {
        return ResponseEntity.ok(ApiResponse.success(checkSvc.create(e)));
    }
    @PutMapping("/watch-checks/{id}")
    public ResponseEntity<ApiResponse<FacilityWatchCheck>> updateCheck(@PathVariable Long id, @RequestBody FacilityWatchCheck e) {
        return ResponseEntity.ok(ApiResponse.success(checkSvc.update(id, e)));
    }
    @DeleteMapping("/watch-checks/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCheck(@PathVariable Long id) {
        checkSvc.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
