package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.ContractorRegistration;
import com.smartehs.service.ContractorRegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.IdmUser;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/contractor-registrations")
@RequiredArgsConstructor
@Tag(name = "Contractor Registration", description = "협력 업체 등록")
public class ContractorRegistrationController {

    private final ContractorRegistrationService service;
    private final IdmMapper idmMapper;

    @GetMapping
    @Operation(summary = "협력 업체 등록 목록 조회 (검색 + 상태 필터)")
    public ResponseEntity<ApiResponse<Page<ContractorRegistration>>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String regStatus,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.search(keyword, regStatus, pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "협력 업체 등록 상세 조회")
    public ResponseEntity<ApiResponse<ContractorRegistration>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @PostMapping
    @Operation(summary = "협력 업체 등록 생성")
    public ResponseEntity<ApiResponse<ContractorRegistration>> create(
            @RequestBody ContractorRegistration reg,
            Authentication authentication) {
        if (authentication != null) reg.setModifiedBy(authentication.getName());
        if (authentication != null) {
            IdmUser u = idmMapper.findByUid(authentication.getName());
            if (u != null) {
                reg.setCreatedByUserId(u.getUidNumber());
                reg.setCreatedByName(u.getUserName());
                reg.setCreatedByTeam(u.getGroupName());
                reg.setCreatedByPosition(u.getTitleName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(service.create(reg)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "협력 업체 등록 수정")
    public ResponseEntity<ApiResponse<ContractorRegistration>> update(
            @PathVariable Long id,
            @RequestBody ContractorRegistration reg,
            Authentication authentication) {
        if (authentication != null) reg.setModifiedBy(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(service.update(id, reg)));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "등록 상태 변경 (APPROVED/REVIEW/HOLD)")
    public ResponseEntity<ApiResponse<ContractorRegistration>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String regStatus = body.get("regStatus");
        return ResponseEntity.ok(ApiResponse.success(service.updateRegStatus(id, regStatus)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "협력 업체 등록 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
