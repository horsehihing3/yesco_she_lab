package com.smartehs.controller;

import com.smartehs.dto.request.TrainingCourseRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.TrainingCourseResponse;
import com.smartehs.mapper.UserMapper;
import com.smartehs.model.User;
import com.smartehs.service.TrainingCourseService;
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

@RestController
@RequestMapping("/training-course")
@RequiredArgsConstructor
@Tag(name = "Training Course", description = "교육과정 관리 API")
public class TrainingCourseController {

    private final TrainingCourseService service;
    private final UserMapper userMapper;

    @GetMapping
    @Operation(summary = "교육과정 목록")
    public ResponseEntity<ApiResponse<Page<TrainingCourseResponse>>> findAll(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.findAll(category, isActive, keyword, pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "교육과정 단건")
    public ResponseEntity<ApiResponse<TrainingCourseResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @PostMapping
    @Operation(summary = "교육과정 등록")
    public ResponseEntity<ApiResponse<TrainingCourseResponse>> create(
            @Valid @RequestBody TrainingCourseRequest request,
            Authentication authentication) {
        User currentUser = authentication != null ? userMapper.findByUsername(authentication.getName()) : null;
        return ResponseEntity.ok(ApiResponse.success("Training course created", service.create(request, currentUser)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "교육과정 수정")
    public ResponseEntity<ApiResponse<TrainingCourseResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody TrainingCourseRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Training course updated", service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "교육과정 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Training course deleted", null));
    }
}
