package com.smartehs.controller;

import com.smartehs.dto.request.QnaPostRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.QnaPostResponse;
import com.smartehs.model.QnaPostComment;
import com.smartehs.service.QnaPostCommentService;
import com.smartehs.service.QnaPostService;
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
import java.util.Map;

@RestController
@RequestMapping("/qna")
@RequiredArgsConstructor
@Tag(name = "Q&A", description = "Q&A 게시판 API")
public class QnaPostController {

    private final QnaPostService qnaPostService;
    private final QnaPostCommentService commentService;

    @GetMapping
    @Operation(summary = "List Q&A posts", description = "Get all Q&A posts with pagination")
    public ResponseEntity<ApiResponse<Page<QnaPostResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<QnaPostResponse> posts = qnaPostService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(posts));
    }

    @GetMapping("/search")
    @Operation(summary = "Search Q&A posts", description = "Search Q&A posts by title")
    public ResponseEntity<ApiResponse<Page<QnaPostResponse>>> search(
            @RequestParam String title,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<QnaPostResponse> posts = qnaPostService.search(title, pageable);
        return ResponseEntity.ok(ApiResponse.success(posts));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Find by category", description = "Get Q&A posts by category")
    public ResponseEntity<ApiResponse<Page<QnaPostResponse>>> findByCategory(
            @PathVariable String category,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<QnaPostResponse> posts = qnaPostService.findByCategory(category, pageable);
        return ResponseEntity.ok(ApiResponse.success(posts));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Q&A post by ID", description = "Get a specific Q&A post by ID")
    public ResponseEntity<ApiResponse<QnaPostResponse>> findById(@PathVariable Long id) {
        QnaPostResponse post = qnaPostService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(post));
    }

    @PostMapping
    @Operation(summary = "Create Q&A post", description = "Create a new Q&A post")
    public ResponseEntity<ApiResponse<QnaPostResponse>> create(
            @Valid @RequestBody QnaPostRequest request) {
        QnaPostResponse post = qnaPostService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Q&A post created successfully", post));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update Q&A post", description = "Update an existing Q&A post")
    public ResponseEntity<ApiResponse<QnaPostResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody QnaPostRequest request) {
        QnaPostResponse post = qnaPostService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Q&A post updated successfully", post));
    }

    @PutMapping("/{id}/answer")
    @Operation(summary = "Add answer", description = "Add or update an answer to a Q&A post")
    public ResponseEntity<ApiResponse<QnaPostResponse>> addAnswer(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        QnaPostResponse post = qnaPostService.addAnswer(
                id,
                request.get("answer"),
                request.get("answerAuthorName"),
                request.get("answerAuthorDept")
        );
        return ResponseEntity.ok(ApiResponse.success("Answer added successfully", post));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Q&A post", description = "Delete a Q&A post")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        qnaPostService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Q&A post deleted successfully", null));
    }

    @PostMapping("/{id}/increment-view")
    @Operation(summary = "Increment view count", description = "Increment the view count of a Q&A post")
    public ResponseEntity<ApiResponse<Void>> incrementViews(@PathVariable Long id) {
        qnaPostService.incrementViews(id);
        return ResponseEntity.ok(ApiResponse.success("View count incremented", null));
    }

    // ===== Comments =====

    @GetMapping("/{id}/comments")
    @Operation(summary = "List comments")
    public ResponseEntity<ApiResponse<List<QnaPostComment>>> listComments(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(commentService.findByQnaId(id)));
    }

    @PostMapping("/{id}/comments")
    @Operation(summary = "Create comment / reply")
    public ResponseEntity<ApiResponse<QnaPostComment>> createComment(
            @PathVariable Long id,
            @RequestBody QnaPostComment body,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(ApiResponse.success(commentService.create(id, body, username)));
    }

    @PutMapping("/comments/{commentId}")
    @Operation(summary = "Update comment")
    public ResponseEntity<ApiResponse<QnaPostComment>> updateComment(
            @PathVariable Long commentId,
            @RequestBody QnaPostComment body) {
        return ResponseEntity.ok(ApiResponse.success(commentService.update(commentId, body)));
    }

    @DeleteMapping("/comments/{commentId}")
    @Operation(summary = "Delete comment")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable Long commentId) {
        commentService.delete(commentId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
