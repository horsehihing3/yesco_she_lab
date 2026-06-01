package com.smartehs.controller;

import com.smartehs.dto.request.EhsAlertRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.EhsAlertResponse;
import com.smartehs.model.EhsAlertComment;
import com.smartehs.service.EhsAlertCommentService;
import com.smartehs.service.EhsAlertService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
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
@RequestMapping("/alerts")
@RequiredArgsConstructor
@Tag(name = "EHS Alert", description = "EHS Alert API")
public class EhsAlertController {

    private final EhsAlertService alertService;
    private final EhsAlertCommentService commentService;

    @GetMapping
    @Operation(summary = "List alerts", description = "Get all alerts with pagination")
    public ResponseEntity<ApiResponse<Page<EhsAlertResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EhsAlertResponse> alerts = alertService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(alerts));
    }

    @GetMapping("/search")
    @Operation(summary = "Search alerts", description = "Search alerts by title")
    public ResponseEntity<ApiResponse<Page<EhsAlertResponse>>> search(
            @RequestParam String title,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EhsAlertResponse> alerts = alertService.search(title, pageable);
        return ResponseEntity.ok(ApiResponse.success(alerts));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get alert by ID", description = "Get a specific alert by ID")
    public ResponseEntity<ApiResponse<EhsAlertResponse>> findById(@PathVariable Long id) {
        EhsAlertResponse alert = alertService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(alert));
    }

    @GetMapping("/uuid/{alertId}")
    @Operation(summary = "Get alert by UUID", description = "Get a specific alert by UUID")
    public ResponseEntity<ApiResponse<EhsAlertResponse>> findByAlertId(@PathVariable String alertId) {
        EhsAlertResponse alert = alertService.findByAlertId(alertId);
        return ResponseEntity.ok(ApiResponse.success(alert));
    }

    @PostMapping
    @Operation(summary = "Create alert", description = "Create a new EHS alert")
    public ResponseEntity<ApiResponse<EhsAlertResponse>> create(
            @Valid @RequestBody EhsAlertRequest request) {
        EhsAlertResponse alert = alertService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Alert created successfully", alert));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update alert", description = "Update an existing alert")
    public ResponseEntity<ApiResponse<EhsAlertResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody EhsAlertRequest request) {
        EhsAlertResponse alert = alertService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Alert updated successfully", alert));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete alert", description = "Delete an alert")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        alertService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Alert deleted successfully", null));
    }

    @PostMapping("/{id}/increment-view")
    @Operation(summary = "Increment view count", description = "Increment the view count of an alert")
    public ResponseEntity<ApiResponse<Void>> incrementViews(@PathVariable Long id) {
        alertService.incrementViews(id);
        return ResponseEntity.ok(ApiResponse.success("View count incremented", null));
    }

    // ===== Comments =====

    @GetMapping("/{id}/comments")
    @Operation(summary = "List comments", description = "Get all comments (and replies) for an alert")
    public ResponseEntity<ApiResponse<List<EhsAlertComment>>> listComments(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(commentService.findByAlertId(id)));
    }

    @PostMapping("/{id}/comments")
    @Operation(summary = "Create comment / reply", description = "Create a new comment or reply (set parentId for reply)")
    public ResponseEntity<ApiResponse<EhsAlertComment>> createComment(
            @PathVariable Long id,
            @RequestBody EhsAlertComment body,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success(commentService.create(id, body, username)));
    }

    @PutMapping("/comments/{commentId}")
    @Operation(summary = "Update comment", description = "Update an existing comment")
    public ResponseEntity<ApiResponse<EhsAlertComment>> updateComment(
            @PathVariable Long commentId,
            @RequestBody EhsAlertComment body) {
        return ResponseEntity.ok(ApiResponse.success(commentService.update(commentId, body)));
    }

    @DeleteMapping("/comments/{commentId}")
    @Operation(summary = "Delete comment", description = "Soft-delete comment (replies are deleted if parent)")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable Long commentId) {
        commentService.delete(commentId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
