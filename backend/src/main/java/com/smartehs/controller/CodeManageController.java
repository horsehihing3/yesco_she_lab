package com.smartehs.controller;

import com.smartehs.dto.request.CodeDetailRequest;
import com.smartehs.dto.request.CodeGroupRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.CodeDetailResponse;
import com.smartehs.dto.response.CodeGroupResponse;
import com.smartehs.service.CodeManageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/code-manage")
@RequiredArgsConstructor
@Tag(name = "Code Management", description = "Code Management API")
public class CodeManageController {

    private final CodeManageService codeManageService;

    // ===== Code Group APIs =====

    @GetMapping("/groups")
    @Operation(summary = "List all code groups")
    public ResponseEntity<ApiResponse<List<CodeGroupResponse>>> findAllGroups(
            @RequestParam(required = false) String keyword) {
        List<CodeGroupResponse> groups;
        if (keyword != null && !keyword.isBlank()) {
            groups = codeManageService.searchGroups(keyword);
        } else {
            groups = codeManageService.findAllGroups();
        }
        return ResponseEntity.ok(ApiResponse.success(groups));
    }

    @GetMapping("/groups/{id}")
    @Operation(summary = "Get code group by ID")
    public ResponseEntity<ApiResponse<CodeGroupResponse>> findGroupById(@PathVariable Long id) {
        CodeGroupResponse group = codeManageService.findGroupById(id);
        return ResponseEntity.ok(ApiResponse.success(group));
    }

    @PostMapping("/groups")
    @Operation(summary = "Create code group")
    public ResponseEntity<ApiResponse<CodeGroupResponse>> createGroup(
            @Valid @RequestBody CodeGroupRequest request) {
        CodeGroupResponse group = codeManageService.createGroup(request);
        return ResponseEntity.ok(ApiResponse.success("Code group created", group));
    }

    @PutMapping("/groups/{id}")
    @Operation(summary = "Update code group")
    public ResponseEntity<ApiResponse<CodeGroupResponse>> updateGroup(
            @PathVariable Long id,
            @Valid @RequestBody CodeGroupRequest request) {
        CodeGroupResponse group = codeManageService.updateGroup(id, request);
        return ResponseEntity.ok(ApiResponse.success("Code group updated", group));
    }

    @DeleteMapping("/groups/{id}")
    @Operation(summary = "Delete code group")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(@PathVariable Long id) {
        codeManageService.deleteGroup(id);
        return ResponseEntity.ok(ApiResponse.success("Code group deleted", null));
    }

    // ===== Code Detail APIs =====

    @GetMapping("/details")
    @Operation(summary = "List code details by group ID")
    public ResponseEntity<ApiResponse<List<CodeDetailResponse>>> findDetailsByGroupId(
            @RequestParam Long groupId,
            @RequestParam(required = false) String keyword) {
        List<CodeDetailResponse> details;
        if (keyword != null && !keyword.isBlank()) {
            details = codeManageService.searchDetails(groupId, keyword);
        } else {
            details = codeManageService.findDetailsByGroupId(groupId);
        }
        return ResponseEntity.ok(ApiResponse.success(details));
    }

    @GetMapping("/details/by-group/{groupCode}")
    @Operation(summary = "Get active code details by group code")
    public ResponseEntity<ApiResponse<List<CodeDetailResponse>>> findDetailsByGroupCode(
            @PathVariable String groupCode) {
        List<CodeDetailResponse> details = codeManageService.findDetailsByGroupCode(groupCode);
        return ResponseEntity.ok(ApiResponse.success(details));
    }

    @GetMapping("/details/{id}")
    @Operation(summary = "Get code detail by ID")
    public ResponseEntity<ApiResponse<CodeDetailResponse>> findDetailById(@PathVariable Long id) {
        CodeDetailResponse detail = codeManageService.findDetailById(id);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @PostMapping("/details")
    @Operation(summary = "Create code detail")
    public ResponseEntity<ApiResponse<CodeDetailResponse>> createDetail(
            @Valid @RequestBody CodeDetailRequest request) {
        CodeDetailResponse detail = codeManageService.createDetail(request);
        return ResponseEntity.ok(ApiResponse.success("Code detail created", detail));
    }

    @PutMapping("/details/{id}")
    @Operation(summary = "Update code detail")
    public ResponseEntity<ApiResponse<CodeDetailResponse>> updateDetail(
            @PathVariable Long id,
            @Valid @RequestBody CodeDetailRequest request) {
        CodeDetailResponse detail = codeManageService.updateDetail(id, request);
        return ResponseEntity.ok(ApiResponse.success("Code detail updated", detail));
    }

    @DeleteMapping("/details/{id}")
    @Operation(summary = "Delete code detail")
    public ResponseEntity<ApiResponse<Void>> deleteDetail(@PathVariable Long id) {
        codeManageService.deleteDetail(id);
        return ResponseEntity.ok(ApiResponse.success("Code detail deleted", null));
    }
}
