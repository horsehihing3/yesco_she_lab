package com.smartehs.controller;

import com.smartehs.dto.request.SafetyEducationAttendeeRequest;
import com.smartehs.dto.request.SafetyEducationRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.SafetyEducationAttendeeResponse;
import com.smartehs.dto.response.SafetyEducationResponse;
import com.smartehs.service.SafetyEducationService;
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
@RequestMapping("/safety-education")
@RequiredArgsConstructor
@Tag(name = "Safety Education", description = "안전보건교육 관리 API")
public class SafetyEducationController {

    private final SafetyEducationService educationService;

    @GetMapping
    @Operation(summary = "안전보건교육 목록 조회")
    public ResponseEntity<ApiResponse<Page<SafetyEducationResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SafetyEducationResponse> result = educationService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "안전보건교육 상세 조회 (참석자 포함)")
    public ResponseEntity<ApiResponse<SafetyEducationResponse>> findById(@PathVariable Long id) {
        SafetyEducationResponse result = educationService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/year/{year}")
    @Operation(summary = "연도별 안전보건교육 조회")
    public ResponseEntity<ApiResponse<Page<SafetyEducationResponse>>> findByYear(
            @PathVariable int year,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SafetyEducationResponse> result = educationService.findByYear(year, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/type/{type}")
    @Operation(summary = "교육유형별 안전보건교육 조회")
    public ResponseEntity<ApiResponse<Page<SafetyEducationResponse>>> findByType(
            @PathVariable String type,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SafetyEducationResponse> result = educationService.findByType(type, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/search")
    @Operation(summary = "안전보건교육 검색")
    public ResponseEntity<ApiResponse<Page<SafetyEducationResponse>>> search(
            @RequestParam String title,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SafetyEducationResponse> result = educationService.searchByTitle(title, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "안전보건교육 등록")
    public ResponseEntity<ApiResponse<SafetyEducationResponse>> create(
            @Valid @RequestBody SafetyEducationRequest request) {
        SafetyEducationResponse result = educationService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Safety education created successfully", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "안전보건교육 수정")
    public ResponseEntity<ApiResponse<SafetyEducationResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody SafetyEducationRequest request) {
        SafetyEducationResponse result = educationService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Safety education updated successfully", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "안전보건교육 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        educationService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Safety education deleted successfully", null));
    }

    // ----- Attendee Management -----

    @GetMapping("/{id}/attendees")
    @Operation(summary = "교육 참석자 목록 조회")
    public ResponseEntity<ApiResponse<List<SafetyEducationAttendeeResponse>>> findAttendees(@PathVariable Long id) {
        List<SafetyEducationAttendeeResponse> result = educationService.findAttendees(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/{id}/attendees")
    @Operation(summary = "교육 참석자 추가")
    public ResponseEntity<ApiResponse<SafetyEducationAttendeeResponse>> addAttendee(
            @PathVariable Long id,
            @RequestBody SafetyEducationAttendeeRequest request) {
        SafetyEducationAttendeeResponse result = educationService.addAttendee(id, request);
        return ResponseEntity.ok(ApiResponse.success("Attendee added successfully", result));
    }

    @PostMapping("/{id}/attendees/bulk")
    @Operation(summary = "교육 참석자 일괄 추가")
    public ResponseEntity<ApiResponse<List<SafetyEducationAttendeeResponse>>> addAttendeesBulk(
            @PathVariable Long id,
            @RequestBody List<SafetyEducationAttendeeRequest> requests) {
        List<SafetyEducationAttendeeResponse> result = educationService.addAttendeesBulk(id, requests);
        return ResponseEntity.ok(ApiResponse.success("Attendees added successfully", result));
    }

    @DeleteMapping("/{id}/attendees/{attendeeId}")
    @Operation(summary = "교육 참석자 제거")
    public ResponseEntity<ApiResponse<Void>> removeAttendee(@PathVariable Long id, @PathVariable Long attendeeId) {
        educationService.removeAttendee(id, attendeeId);
        return ResponseEntity.ok(ApiResponse.success("Attendee removed successfully", null));
    }

    @PatchMapping("/{id}/attendees/{attendeeId}/sign")
    @Operation(summary = "교육 참석자 서명")
    public ResponseEntity<ApiResponse<SafetyEducationAttendeeResponse>> signAttendee(
            @PathVariable Long id, @PathVariable Long attendeeId) {
        SafetyEducationAttendeeResponse result = educationService.signAttendee(id, attendeeId);
        return ResponseEntity.ok(ApiResponse.success("Attendee signed successfully", result));
    }
}
