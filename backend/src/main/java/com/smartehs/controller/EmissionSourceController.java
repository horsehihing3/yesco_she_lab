package com.smartehs.controller;

import com.smartehs.dto.request.EmissionSourceRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.EmissionSourceResponse;
import com.smartehs.service.EmissionSourceService;
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
@RequestMapping("/carbon/source")
@RequiredArgsConstructor
@Tag(name = "Emission Source", description = "배출원 관리 API")
public class EmissionSourceController {

    private final EmissionSourceService emissionSourceService;

    @GetMapping
    @Operation(summary = "배출원 목록 조회")
    public ResponseEntity<ApiResponse<Page<EmissionSourceResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(emissionSourceService.findAll(pageable)));
    }

    @GetMapping("/search")
    @Operation(summary = "배출원 검색")
    public ResponseEntity<ApiResponse<Page<EmissionSourceResponse>>> search(
            @RequestParam String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(emissionSourceService.search(keyword, pageable)));
    }

    @GetMapping("/active")
    @Operation(summary = "활성 배출원 목록 (페이징 없음)")
    public ResponseEntity<ApiResponse<List<EmissionSourceResponse>>> findAllActive() {
        return ResponseEntity.ok(ApiResponse.success(emissionSourceService.findAllActive()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "배출원 상세 조회")
    public ResponseEntity<ApiResponse<EmissionSourceResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(emissionSourceService.findById(id)));
    }

    @PostMapping
    @Operation(summary = "배출원 등록")
    public ResponseEntity<ApiResponse<EmissionSourceResponse>> create(
            @RequestBody EmissionSourceRequest request, Authentication authentication) {
        String regUser = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success("Created successfully", emissionSourceService.create(request, regUser)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "배출원 수정")
    public ResponseEntity<ApiResponse<EmissionSourceResponse>> update(
            @PathVariable Long id, @RequestBody EmissionSourceRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Updated successfully", emissionSourceService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "배출원 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        emissionSourceService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully", null));
    }
}
