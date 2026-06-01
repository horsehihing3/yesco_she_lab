package com.smartehs.controller;

import com.smartehs.dto.request.TrainingApplicationRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.TrainingApplicationResponse;
import com.smartehs.mapper.UserMapper;
import com.smartehs.model.User;
import com.smartehs.service.TrainingApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/training-application")
@RequiredArgsConstructor
@Tag(name = "Training Application", description = "교육신청 관리 API")
public class TrainingApplicationController {

    private final TrainingApplicationService service;
    private final UserMapper userMapper;

    @GetMapping
    @Operation(summary = "교육신청 목록")
    public ResponseEntity<ApiResponse<Page<TrainingApplicationResponse>>> findAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dept,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String courseName,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(status, dept, courseId, username, keyword, name, courseName, pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "교육신청 단건")
    public ResponseEntity<ApiResponse<TrainingApplicationResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @PostMapping
    @Operation(summary = "교육신청 등록")
    public ResponseEntity<ApiResponse<TrainingApplicationResponse>> create(
            @Valid @RequestBody TrainingApplicationRequest request,
            Authentication authentication) {
        User currentUser = authentication != null ? userMapper.findByUsername(authentication.getName()) : null;
        return ResponseEntity.ok(ApiResponse.success("Created", service.create(request, currentUser)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "교육신청 수정")
    public ResponseEntity<ApiResponse<TrainingApplicationResponse>> update(
            @PathVariable Long id, @Valid @RequestBody TrainingApplicationRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Updated", service.update(id, request)));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "교육신청 상태 변경 (PENDING/APPROVED/COMPLETED/REJECTED/CANCELLED)")
    public ResponseEntity<ApiResponse<TrainingApplicationResponse>> changeStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String rejectReason,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate completionDate,
            Authentication authentication) {
        String approvedBy = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(ApiResponse.success("Status changed", service.changeStatus(id, status, approvedBy, rejectReason, completionDate)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "교육신청 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted", null));
    }
}
