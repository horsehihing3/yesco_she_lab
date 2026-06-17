package com.smartehs.controller;

import com.smartehs.dto.request.EhsManagerRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.EhsManagerResponse;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.IdmUser;
import com.smartehs.service.EhsManagerService;
import org.springframework.security.core.Authentication;
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
@Tag(name = "SHE Manager", description = "SHE Manager API")
public class EhsManagerController {

    private final EhsManagerService ehsManagerService;
    private final IdmMapper idmMapper;

    @GetMapping
    @Operation(summary = "List SHE managers", description = "Get all SHE managers with pagination")
    public ResponseEntity<ApiResponse<Page<EhsManagerResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EhsManagerResponse> managers = ehsManagerService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(managers));
    }

    @GetMapping("/list")
    @Operation(summary = "List all SHE managers", description = "Get all SHE managers as list")
    public ResponseEntity<ApiResponse<List<EhsManagerResponse>>> findAllList() {
        List<EhsManagerResponse> managers = ehsManagerService.findAllList();
        return ResponseEntity.ok(ApiResponse.success(managers));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Find by category", description = "Get SHE managers by category")
    public ResponseEntity<ApiResponse<List<EhsManagerResponse>>> findByCategory(@PathVariable String category) {
        List<EhsManagerResponse> managers = ehsManagerService.findByCategory(category);
        return ResponseEntity.ok(ApiResponse.success(managers));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get SHE manager by ID", description = "Get a specific SHE manager by ID")
    public ResponseEntity<ApiResponse<EhsManagerResponse>> findById(@PathVariable Long id) {
        EhsManagerResponse manager = ehsManagerService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(manager));
    }

    @PostMapping
    @Operation(summary = "Create SHE manager", description = "Create a new SHE manager")
    public ResponseEntity<ApiResponse<EhsManagerResponse>> create(
            @Valid @RequestBody EhsManagerRequest request, Authentication authentication) {
        IdmUser u = authentication != null ? idmMapper.findByUid(authentication.getName()) : null;
        EhsManagerResponse manager = ehsManagerService.create(request, u);
        return ResponseEntity.ok(ApiResponse.success("SHE manager created successfully", manager));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update SHE manager", description = "Update an existing SHE manager")
    public ResponseEntity<ApiResponse<EhsManagerResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody EhsManagerRequest request) {
        EhsManagerResponse manager = ehsManagerService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("SHE manager updated successfully", manager));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete SHE manager", description = "Soft delete an SHE manager")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        ehsManagerService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("SHE manager deleted successfully", null));
    }
}
