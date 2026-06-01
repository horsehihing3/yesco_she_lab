package com.smartehs.controller;

import com.smartehs.dto.request.EhsManagerRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.EhsManagerResponse;
import com.smartehs.service.EhsManagerService;
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
@RequestMapping("/ehs-managers")
@RequiredArgsConstructor
@Tag(name = "EHS Manager", description = "EHS Manager API")
public class EhsManagerController {

    private final EhsManagerService ehsManagerService;

    @GetMapping
    @Operation(summary = "List EHS managers", description = "Get all EHS managers with pagination")
    public ResponseEntity<ApiResponse<Page<EhsManagerResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EhsManagerResponse> managers = ehsManagerService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(managers));
    }

    @GetMapping("/list")
    @Operation(summary = "List all EHS managers", description = "Get all EHS managers as list")
    public ResponseEntity<ApiResponse<List<EhsManagerResponse>>> findAllList() {
        List<EhsManagerResponse> managers = ehsManagerService.findAllList();
        return ResponseEntity.ok(ApiResponse.success(managers));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Find by category", description = "Get EHS managers by category")
    public ResponseEntity<ApiResponse<List<EhsManagerResponse>>> findByCategory(@PathVariable String category) {
        List<EhsManagerResponse> managers = ehsManagerService.findByCategory(category);
        return ResponseEntity.ok(ApiResponse.success(managers));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get EHS manager by ID", description = "Get a specific EHS manager by ID")
    public ResponseEntity<ApiResponse<EhsManagerResponse>> findById(@PathVariable Long id) {
        EhsManagerResponse manager = ehsManagerService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(manager));
    }

    @PostMapping
    @Operation(summary = "Create EHS manager", description = "Create a new EHS manager")
    public ResponseEntity<ApiResponse<EhsManagerResponse>> create(
            @Valid @RequestBody EhsManagerRequest request) {
        EhsManagerResponse manager = ehsManagerService.create(request);
        return ResponseEntity.ok(ApiResponse.success("EHS manager created successfully", manager));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update EHS manager", description = "Update an existing EHS manager")
    public ResponseEntity<ApiResponse<EhsManagerResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody EhsManagerRequest request) {
        EhsManagerResponse manager = ehsManagerService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("EHS manager updated successfully", manager));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete EHS manager", description = "Soft delete an EHS manager")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        ehsManagerService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("EHS manager deleted successfully", null));
    }
}
