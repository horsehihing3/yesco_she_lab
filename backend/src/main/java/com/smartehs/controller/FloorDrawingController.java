package com.smartehs.controller;

import com.smartehs.dto.request.FloorDrawingRequest;
import com.smartehs.dto.request.SafetyDeviceRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.FloorDrawingResponse;
import com.smartehs.dto.response.SafetyDeviceResponse;
import com.smartehs.service.FloorDrawingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/floor-drawings")
@RequiredArgsConstructor
public class FloorDrawingController {

    private final FloorDrawingService floorDrawingService;

    /**
     * Get all floor drawings
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<FloorDrawingResponse>>> getAllFloorDrawings(
            @RequestParam(required = false) String site) {
        List<FloorDrawingResponse> drawings;
        if (site != null && !site.isEmpty()) {
            drawings = floorDrawingService.getFloorDrawingsBySite(site);
        } else {
            drawings = floorDrawingService.getAllFloorDrawings();
        }
        return ResponseEntity.ok(ApiResponse.success(drawings));
    }

    /**
     * Get distinct sites
     */
    @GetMapping("/sites")
    public ResponseEntity<ApiResponse<List<String>>> getDistinctSites() {
        List<String> sites = floorDrawingService.getDistinctSites();
        return ResponseEntity.ok(ApiResponse.success(sites));
    }

    /**
     * Get floor drawing by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FloorDrawingResponse>> getFloorDrawingById(@PathVariable Long id) {
        FloorDrawingResponse drawing = floorDrawingService.getFloorDrawingById(id);
        return ResponseEntity.ok(ApiResponse.success(drawing));
    }

    /**
     * Create new floor drawing
     */
    @PostMapping
    public ResponseEntity<ApiResponse<FloorDrawingResponse>> createFloorDrawing(
            @RequestBody FloorDrawingRequest request) {
        FloorDrawingResponse created = floorDrawingService.createFloorDrawing(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created));
    }

    /**
     * Update floor drawing
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FloorDrawingResponse>> updateFloorDrawing(
            @PathVariable Long id,
            @RequestBody FloorDrawingRequest request) {
        FloorDrawingResponse updated = floorDrawingService.updateFloorDrawing(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    /**
     * Delete floor drawing
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFloorDrawing(@PathVariable Long id) {
        floorDrawingService.deleteFloorDrawing(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * Add device to floor drawing
     */
    @PostMapping("/{floorDrawingId}/devices")
    public ResponseEntity<ApiResponse<SafetyDeviceResponse>> addDevice(
            @PathVariable Long floorDrawingId,
            @RequestBody SafetyDeviceRequest request) {
        SafetyDeviceResponse device = floorDrawingService.addDevice(floorDrawingId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(device));
    }

    /**
     * Update device
     */
    @PutMapping("/devices/{deviceId}")
    public ResponseEntity<ApiResponse<SafetyDeviceResponse>> updateDevice(
            @PathVariable Long deviceId,
            @RequestBody SafetyDeviceRequest request) {
        SafetyDeviceResponse device = floorDrawingService.updateDevice(deviceId, request);
        return ResponseEntity.ok(ApiResponse.success(device));
    }

    /**
     * Delete device
     */
    @DeleteMapping("/devices/{deviceId}")
    public ResponseEntity<ApiResponse<Void>> deleteDevice(@PathVariable Long deviceId) {
        floorDrawingService.deleteDevice(deviceId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
