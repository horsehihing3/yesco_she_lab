package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.model.EmergencyContact;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.IdmUser;
import com.smartehs.service.EmergencyContactService;
import org.springframework.security.core.Authentication;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/emergency-contact")
@RequiredArgsConstructor
@Tag(name = "Emergency Contact", description = "비상 연락처 관리")
public class EmergencyContactController {

    private final EmergencyContactService emergencyContactService;
    private final IdmMapper idmMapper;

    @GetMapping
    @Operation(summary = "비상 연락처 전체 목록 조회")
    public ResponseEntity<ApiResponse<Page<EmergencyContact>>> findAll(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(emergencyContactService.findAll(pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "비상 연락처 상세 조회")
    public ResponseEntity<ApiResponse<EmergencyContact>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(emergencyContactService.findById(id)));
    }

    @GetMapping("/type/{contactType}")
    @Operation(summary = "유형별 비상 연락처 조회")
    public ResponseEntity<ApiResponse<Page<EmergencyContact>>> findByContactType(
            @PathVariable String contactType,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(emergencyContactService.findByContactType(contactType, pageable)));
    }

    @PostMapping
    @Operation(summary = "비상 연락처 등록")
    public ResponseEntity<ApiResponse<EmergencyContact>> create(@RequestBody EmergencyContact emergencyContact, Authentication authentication) {
        if (authentication != null) {
            IdmUser u = idmMapper.findByUid(authentication.getName());
            if (u != null) {
                emergencyContact.setCreatedByUserId(u.getUidNumber());
                emergencyContact.setCreatedByName(u.getUserName());
                emergencyContact.setCreatedByTeam(u.getGroupName());
                emergencyContact.setCreatedByPosition(u.getTitleName());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(emergencyContactService.create(emergencyContact)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "비상 연락처 수정")
    public ResponseEntity<ApiResponse<EmergencyContact>> update(@PathVariable Long id, @RequestBody EmergencyContact emergencyContact) {
        return ResponseEntity.ok(ApiResponse.success(emergencyContactService.update(id, emergencyContact)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "비상 연락처 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        emergencyContactService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
