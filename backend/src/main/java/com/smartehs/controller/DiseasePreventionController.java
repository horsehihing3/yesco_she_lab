package com.smartehs.controller;

import com.smartehs.dto.request.DiseasePreventionRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.DiseasePreventionResponse;
import com.smartehs.service.DiseasePreventionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/disease-prevention")
@RequiredArgsConstructor
@Tag(name = "Disease Prevention", description = "직업병 예방 관리")
public class DiseasePreventionController {

    private final DiseasePreventionService diseasePreventionService;

    @GetMapping
    @Operation(summary = "직업병 예방 전체 목록 조회")
    public ResponseEntity<ApiResponse<Page<DiseasePreventionResponse>>> findAll(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(diseasePreventionService.findAll(pageable)));
    }

    @GetMapping("/search")
    @Operation(summary = "직업병 예방 검색")
    public ResponseEntity<ApiResponse<Page<DiseasePreventionResponse>>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String hazardType,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(diseasePreventionService.search(keyword, hazardType, pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "직업병 예방 상세 조회")
    public ResponseEntity<ApiResponse<DiseasePreventionResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(diseasePreventionService.findById(id)));
    }

    @PostMapping
    @Operation(summary = "직업병 예방 등록")
    public ResponseEntity<ApiResponse<DiseasePreventionResponse>> create(@Valid @RequestBody DiseasePreventionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(diseasePreventionService.create(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "직업병 예방 수정")
    public ResponseEntity<ApiResponse<DiseasePreventionResponse>> update(@PathVariable Long id, @Valid @RequestBody DiseasePreventionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(diseasePreventionService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "직업병 예방 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        diseasePreventionService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
