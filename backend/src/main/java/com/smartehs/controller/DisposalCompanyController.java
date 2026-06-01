package com.smartehs.controller;

import com.smartehs.dto.request.DisposalCompanyRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.DisposalCompanyResponse;
import com.smartehs.service.DisposalCompanyService;
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
@RequestMapping("/environment/disposal-company")
@RequiredArgsConstructor
@Tag(name = "Disposal Company", description = "처리업체 관리 API")
public class DisposalCompanyController {

    private final DisposalCompanyService disposalCompanyService;

    @GetMapping
    @Operation(summary = "처리업체 목록 조회")
    public ResponseEntity<ApiResponse<Page<DisposalCompanyResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(disposalCompanyService.findAll(pageable)));
    }

    @GetMapping("/search")
    @Operation(summary = "처리업체 검색")
    public ResponseEntity<ApiResponse<Page<DisposalCompanyResponse>>> search(
            @RequestParam String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(disposalCompanyService.search(keyword, pageable)));
    }

    @GetMapping("/active")
    @Operation(summary = "활성 처리업체 목록")
    public ResponseEntity<ApiResponse<List<DisposalCompanyResponse>>> findAllActive() {
        return ResponseEntity.ok(ApiResponse.success(disposalCompanyService.findAllActive()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "처리업체 상세 조회")
    public ResponseEntity<ApiResponse<DisposalCompanyResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(disposalCompanyService.findById(id)));
    }

    @PostMapping
    @Operation(summary = "처리업체 등록")
    public ResponseEntity<ApiResponse<DisposalCompanyResponse>> create(
            @RequestBody DisposalCompanyRequest request, Authentication authentication) {
        String regUser = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success("Created successfully", disposalCompanyService.create(request, regUser)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "처리업체 수정")
    public ResponseEntity<ApiResponse<DisposalCompanyResponse>> update(
            @PathVariable Long id, @RequestBody DisposalCompanyRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Updated successfully", disposalCompanyService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "처리업체 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        disposalCompanyService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully", null));
    }
}
