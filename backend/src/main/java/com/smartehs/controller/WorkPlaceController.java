package com.smartehs.controller;

import com.smartehs.dto.request.WorkPlaceRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.WorkPlaceResponse;
import com.smartehs.service.WorkPlaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/workplaces")
@RequiredArgsConstructor
@Tag(name = "Work Place", description = "Work Place API")
public class WorkPlaceController {

    private final WorkPlaceService workPlaceService;

    @GetMapping
    @Operation(summary = "List work places", description = "Get all work places with pagination")
    public ResponseEntity<ApiResponse<Page<WorkPlaceResponse>>> findAll(
            @PageableDefault(size = 20, sort = "place", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<WorkPlaceResponse> workPlaces = workPlaceService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(workPlaces));
    }

    @GetMapping("/all")
    @Operation(summary = "List all active work places", description = "Get all active work places without pagination")
    public ResponseEntity<ApiResponse<List<WorkPlaceResponse>>> findAllActive() {
        List<WorkPlaceResponse> workPlaces = workPlaceService.findAllActive();
        return ResponseEntity.ok(ApiResponse.success(workPlaces));
    }

    @GetMapping("/search")
    @Operation(summary = "Search work places", description = "Search work places by name")
    public ResponseEntity<ApiResponse<Page<WorkPlaceResponse>>> search(
            @RequestParam String place,
            @PageableDefault(size = 20, sort = "place", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<WorkPlaceResponse> workPlaces = workPlaceService.search(place, pageable);
        return ResponseEntity.ok(ApiResponse.success(workPlaces));
    }

    @GetMapping("/floor/{floor}")
    @Operation(summary = "Find by floor", description = "Get work places by floor")
    public ResponseEntity<ApiResponse<Page<WorkPlaceResponse>>> findByFloor(
            @PathVariable String floor,
            @PageableDefault(size = 20, sort = "place", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<WorkPlaceResponse> workPlaces = workPlaceService.findByFloor(floor, pageable);
        return ResponseEntity.ok(ApiResponse.success(workPlaces));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get work place by ID", description = "Get a specific work place by ID")
    public ResponseEntity<ApiResponse<WorkPlaceResponse>> findById(@PathVariable Long id) {
        WorkPlaceResponse workPlace = workPlaceService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(workPlace));
    }

    @PostMapping
    @Operation(summary = "Create work place", description = "Create a new work place")
    public ResponseEntity<ApiResponse<WorkPlaceResponse>> create(
            @Valid @RequestBody WorkPlaceRequest request) {
        WorkPlaceResponse workPlace = workPlaceService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Work place created successfully", workPlace));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update work place", description = "Update an existing work place")
    public ResponseEntity<ApiResponse<WorkPlaceResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody WorkPlaceRequest request) {
        WorkPlaceResponse workPlace = workPlaceService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Work place updated successfully", workPlace));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete work place", description = "Soft delete a work place")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        workPlaceService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Work place deleted successfully", null));
    }
}
