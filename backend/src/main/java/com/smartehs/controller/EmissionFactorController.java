package com.smartehs.controller;

import com.smartehs.dto.request.EmissionFactorRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.EmissionFactorResponse;
import com.smartehs.service.EmissionFactorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/carbon/factor")
@RequiredArgsConstructor
@Tag(name = "Emission Factor", description = "배출계수 관리 API")
public class EmissionFactorController {

    private final EmissionFactorService emissionFactorService;

    @GetMapping
    @Operation(summary = "배출계수 목록 조회")
    public ResponseEntity<ApiResponse<Page<EmissionFactorResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(emissionFactorService.findAll(pageable)));
    }

    @GetMapping("/search")
    @Operation(summary = "배출계수 검색")
    public ResponseEntity<ApiResponse<Page<EmissionFactorResponse>>> search(
            @RequestParam String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(emissionFactorService.search(keyword, pageable)));
    }

    @GetMapping("/all")
    @Operation(summary = "배출계수 전체 목록 (페이징 없음)")
    public ResponseEntity<ApiResponse<List<EmissionFactorResponse>>> findAllList() {
        return ResponseEntity.ok(ApiResponse.success(emissionFactorService.findAllList()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "배출계수 상세 조회")
    public ResponseEntity<ApiResponse<EmissionFactorResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(emissionFactorService.findById(id)));
    }

    @PostMapping
    @Operation(summary = "배출계수 등록")
    public ResponseEntity<ApiResponse<EmissionFactorResponse>> create(
            @RequestBody EmissionFactorRequest request, Authentication authentication) {
        String regUser = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success("Created successfully", emissionFactorService.create(request, regUser)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "배출계수 수정")
    public ResponseEntity<ApiResponse<EmissionFactorResponse>> update(
            @PathVariable Long id, @RequestBody EmissionFactorRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Updated successfully", emissionFactorService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "배출계수 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        emissionFactorService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully", null));
    }
}
