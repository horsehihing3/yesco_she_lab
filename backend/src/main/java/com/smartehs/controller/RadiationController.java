package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.RadAccidentResponse;
import com.smartehs.dto.response.RadDoseResponse;
import com.smartehs.dto.response.RadDrillResponse;
import com.smartehs.dto.response.RadHealthResponse;
import com.smartehs.dto.response.RadMeasurementResponse;
import com.smartehs.dto.response.RadSourceResponse;
import com.smartehs.dto.response.RadWorkerResponse;
import com.smartehs.dto.response.RadZoneResponse;
import com.smartehs.model.*;
import com.smartehs.service.RadiationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/radiation")
@RequiredArgsConstructor
@Tag(name = "Radiation", description = "방사선 안전 관리")
public class RadiationController {

    private final RadiationService svc;

    // Source
    @GetMapping("/sources") public ResponseEntity<ApiResponse<List<RadSourceResponse>>> listSrc() { return ResponseEntity.ok(ApiResponse.success(svc.findAllSources().stream().map(RadSourceResponse::from).collect(Collectors.toList()))); }
    @PostMapping("/sources") public ResponseEntity<ApiResponse<RadSourceResponse>> createSrc(@RequestBody RadSource e) { return ResponseEntity.ok(ApiResponse.success(RadSourceResponse.from(svc.createSource(e)))); }
    @PutMapping("/sources/{id}") public ResponseEntity<ApiResponse<RadSourceResponse>> updateSrc(@PathVariable Long id, @RequestBody RadSource e) { return ResponseEntity.ok(ApiResponse.success(RadSourceResponse.from(svc.updateSource(id, e)))); }
    @DeleteMapping("/sources/{id}") public ResponseEntity<ApiResponse<Void>> deleteSrc(@PathVariable Long id) { svc.deleteSource(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Worker
    @GetMapping("/workers") public ResponseEntity<ApiResponse<List<RadWorkerResponse>>> listWk() { return ResponseEntity.ok(ApiResponse.success(svc.findAllWorkers().stream().map(RadWorkerResponse::from).collect(Collectors.toList()))); }
    @PostMapping("/workers") public ResponseEntity<ApiResponse<RadWorkerResponse>> createWk(@RequestBody RadWorker e) { return ResponseEntity.ok(ApiResponse.success(RadWorkerResponse.from(svc.createWorker(e)))); }
    @PutMapping("/workers/{id}") public ResponseEntity<ApiResponse<RadWorkerResponse>> updateWk(@PathVariable Long id, @RequestBody RadWorker e) { return ResponseEntity.ok(ApiResponse.success(RadWorkerResponse.from(svc.updateWorker(id, e)))); }
    @DeleteMapping("/workers/{id}") public ResponseEntity<ApiResponse<Void>> deleteWk(@PathVariable Long id) { svc.deleteWorker(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Dose
    @GetMapping("/doses") public ResponseEntity<ApiResponse<List<RadDoseResponse>>> listDose() { return ResponseEntity.ok(ApiResponse.success(svc.findAllDoses().stream().map(RadDoseResponse::from).collect(Collectors.toList()))); }
    @PostMapping("/doses") public ResponseEntity<ApiResponse<RadDoseResponse>> createDose(@RequestBody RadDose e) { return ResponseEntity.ok(ApiResponse.success(RadDoseResponse.from(svc.createDose(e)))); }
    @PutMapping("/doses/{id}") public ResponseEntity<ApiResponse<RadDoseResponse>> updateDose(@PathVariable Long id, @RequestBody RadDose e) { return ResponseEntity.ok(ApiResponse.success(RadDoseResponse.from(svc.updateDose(id, e)))); }
    @DeleteMapping("/doses/{id}") public ResponseEntity<ApiResponse<Void>> deleteDose(@PathVariable Long id) { svc.deleteDose(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Zone
    @GetMapping("/zones") public ResponseEntity<ApiResponse<List<RadZoneResponse>>> listZ() { return ResponseEntity.ok(ApiResponse.success(svc.findAllZones().stream().map(RadZoneResponse::from).collect(Collectors.toList()))); }
    @PostMapping("/zones") public ResponseEntity<ApiResponse<RadZoneResponse>> createZ(@RequestBody RadZone e) { return ResponseEntity.ok(ApiResponse.success(RadZoneResponse.from(svc.createZone(e)))); }
    @PutMapping("/zones/{id}") public ResponseEntity<ApiResponse<RadZoneResponse>> updateZ(@PathVariable Long id, @RequestBody RadZone e) { return ResponseEntity.ok(ApiResponse.success(RadZoneResponse.from(svc.updateZone(id, e)))); }
    @DeleteMapping("/zones/{id}") public ResponseEntity<ApiResponse<Void>> deleteZ(@PathVariable Long id) { svc.deleteZone(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Measurement
    @GetMapping("/measurements") public ResponseEntity<ApiResponse<List<RadMeasurementResponse>>> listM() { return ResponseEntity.ok(ApiResponse.success(svc.findAllMeasurements().stream().map(RadMeasurementResponse::from).collect(Collectors.toList()))); }
    @PostMapping("/measurements") public ResponseEntity<ApiResponse<RadMeasurementResponse>> createM(@RequestBody RadMeasurement e) { return ResponseEntity.ok(ApiResponse.success(RadMeasurementResponse.from(svc.createMeasurement(e)))); }
    @PutMapping("/measurements/{id}") public ResponseEntity<ApiResponse<RadMeasurementResponse>> updateM(@PathVariable Long id, @RequestBody RadMeasurement e) { return ResponseEntity.ok(ApiResponse.success(RadMeasurementResponse.from(svc.updateMeasurement(id, e)))); }
    @DeleteMapping("/measurements/{id}") public ResponseEntity<ApiResponse<Void>> deleteM(@PathVariable Long id) { svc.deleteMeasurement(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Health
    @GetMapping("/healths") public ResponseEntity<ApiResponse<List<RadHealthResponse>>> listH() { return ResponseEntity.ok(ApiResponse.success(svc.findAllHealths().stream().map(RadHealthResponse::from).collect(Collectors.toList()))); }
    @PostMapping("/healths") public ResponseEntity<ApiResponse<RadHealthResponse>> createH(@RequestBody RadHealth e) { return ResponseEntity.ok(ApiResponse.success(RadHealthResponse.from(svc.createHealth(e)))); }
    @PutMapping("/healths/{id}") public ResponseEntity<ApiResponse<RadHealthResponse>> updateH(@PathVariable Long id, @RequestBody RadHealth e) { return ResponseEntity.ok(ApiResponse.success(RadHealthResponse.from(svc.updateHealth(id, e)))); }
    @DeleteMapping("/healths/{id}") public ResponseEntity<ApiResponse<Void>> deleteH(@PathVariable Long id) { svc.deleteHealth(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Accident
    @GetMapping("/accidents") public ResponseEntity<ApiResponse<List<RadAccidentResponse>>> listA() { return ResponseEntity.ok(ApiResponse.success(svc.findAllAccidents().stream().map(RadAccidentResponse::from).collect(Collectors.toList()))); }
    @PostMapping("/accidents") public ResponseEntity<ApiResponse<RadAccidentResponse>> createA(@RequestBody RadAccident e) { return ResponseEntity.ok(ApiResponse.success(RadAccidentResponse.from(svc.createAccident(e)))); }
    @PutMapping("/accidents/{id}") public ResponseEntity<ApiResponse<RadAccidentResponse>> updateA(@PathVariable Long id, @RequestBody RadAccident e) { return ResponseEntity.ok(ApiResponse.success(RadAccidentResponse.from(svc.updateAccident(id, e)))); }
    @DeleteMapping("/accidents/{id}") public ResponseEntity<ApiResponse<Void>> deleteA(@PathVariable Long id) { svc.deleteAccident(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    // Drill
    @GetMapping("/drills") public ResponseEntity<ApiResponse<List<RadDrillResponse>>> listD() { return ResponseEntity.ok(ApiResponse.success(svc.findAllDrills().stream().map(RadDrillResponse::from).collect(Collectors.toList()))); }
    @PostMapping("/drills") public ResponseEntity<ApiResponse<RadDrillResponse>> createD(@RequestBody RadDrill e) { return ResponseEntity.ok(ApiResponse.success(RadDrillResponse.from(svc.createDrill(e)))); }
    @PutMapping("/drills/{id}") public ResponseEntity<ApiResponse<RadDrillResponse>> updateD(@PathVariable Long id, @RequestBody RadDrill e) { return ResponseEntity.ok(ApiResponse.success(RadDrillResponse.from(svc.updateDrill(id, e)))); }
    @DeleteMapping("/drills/{id}") public ResponseEntity<ApiResponse<Void>> deleteD(@PathVariable Long id) { svc.deleteDrill(id); return ResponseEntity.ok(ApiResponse.success(null)); }

    @GetMapping("/stats") public ResponseEntity<ApiResponse<Map<String, Object>>> stats() { return ResponseEntity.ok(ApiResponse.success(svc.getStats())); }
}
