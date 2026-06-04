package com.smartehs.controller;

import com.smartehs.dto.request.EhsMessageRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.EhsMessageResponse;
import com.smartehs.model.EhsMessageComment;
import com.smartehs.service.EhsMessageCommentService;
import com.smartehs.service.EhsMessageService;
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
@RequestMapping("/messages")
@RequiredArgsConstructor
@Tag(name = "EHS Message", description = "EHS Message API")
public class EhsMessageController {

    private final EhsMessageService messageService;
    private final EhsMessageCommentService commentService;

    @GetMapping
    @Operation(summary = "List messages", description = "Get all messages with pagination")
    public ResponseEntity<ApiResponse<Page<EhsMessageResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EhsMessageResponse> messages = messageService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @GetMapping("/search")
    @Operation(summary = "Search messages", description = "Search messages by title")
    public ResponseEntity<ApiResponse<Page<EhsMessageResponse>>> search(
            @RequestParam String title,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EhsMessageResponse> messages = messageService.search(title, pageable);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Find by category", description = "Get messages by category")
    public ResponseEntity<ApiResponse<Page<EhsMessageResponse>>> findByCategory(
            @PathVariable String category,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EhsMessageResponse> messages = messageService.findByCategory(category, pageable);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get message by ID", description = "Get a specific message by ID")
    public ResponseEntity<ApiResponse<EhsMessageResponse>> findById(@PathVariable Long id) {
        EhsMessageResponse message = messageService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @GetMapping("/uuid/{messageId}")
    @Operation(summary = "Get message by UUID", description = "Get a specific message by UUID")
    public ResponseEntity<ApiResponse<EhsMessageResponse>> findByMessageId(@PathVariable String messageId) {
        EhsMessageResponse message = messageService.findByMessageId(messageId);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @PostMapping
    @Operation(summary = "Create message", description = "Create a new EHS message")
    public ResponseEntity<ApiResponse<EhsMessageResponse>> create(
            @Valid @RequestBody EhsMessageRequest request) {
        EhsMessageResponse message = messageService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Message created successfully", message));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update message", description = "Update an existing message")
    public ResponseEntity<ApiResponse<EhsMessageResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody EhsMessageRequest request) {
        EhsMessageResponse message = messageService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Message updated successfully", message));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete message", description = "Delete a message")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        messageService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Message deleted successfully", null));
    }

    @PostMapping("/{id}/increment-view")
    @Operation(summary = "Increment view count", description = "Increment the view count of a message")
    public ResponseEntity<ApiResponse<Void>> incrementViews(@PathVariable Long id) {
        messageService.incrementViews(id);
        return ResponseEntity.ok(ApiResponse.success("View count incremented", null));
    }

    // ===== Comments =====

    @GetMapping("/{id}/comments")
    @Operation(summary = "List comments")
    public ResponseEntity<ApiResponse<List<EhsMessageComment>>> listComments(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(commentService.findByMessageId(id)));
    }

    @PostMapping("/{id}/comments")
    @Operation(summary = "Create comment / reply")
    public ResponseEntity<ApiResponse<EhsMessageComment>> createComment(
            @PathVariable Long id,
            @RequestBody EhsMessageComment body,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success(commentService.create(id, body, username)));
    }

    @PutMapping("/comments/{commentId}")
    @Operation(summary = "Update comment")
    public ResponseEntity<ApiResponse<EhsMessageComment>> updateComment(
            @PathVariable Long commentId,
            @RequestBody EhsMessageComment body) {
        return ResponseEntity.ok(ApiResponse.success(commentService.update(commentId, body)));
    }

    @DeleteMapping("/comments/{commentId}")
    @Operation(summary = "Delete comment")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable Long commentId) {
        commentService.delete(commentId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
