package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.CompanyTreeNodeResponse;
import com.smartehs.dto.response.UserInfoResponse;
import com.smartehs.model.IdmUser;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.service.IdmService;
import com.smartehs.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "User Management API")
public class UserController {

    private final UserService userService;
    private final IdmService idmService;
    private final IdmMapper idmMapper;

    @GetMapping
    @Operation(summary = "List all users", description = "Get all active IDM users with password")
    public ResponseEntity<ApiResponse<List<UserInfoResponse>>> findAll() {
        List<IdmUser> idmUsers = idmMapper.findAllWithPassword();
        List<UserInfoResponse> users = idmUsers.stream()
                .map(UserInfoResponse::fromIdmUser)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/paged")
    @Operation(summary = "List users with pagination", description = "Get users with pagination")
    public ResponseEntity<ApiResponse<Page<UserInfoResponse>>> findAllPaged(
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<UserInfoResponse> users = userService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID", description = "Get a specific user by ID")
    public ResponseEntity<ApiResponse<UserInfoResponse>> findById(@PathVariable Long id) {
        UserInfoResponse user = userService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @GetMapping("/username/{username}")
    @Operation(summary = "Get user by username", description = "Get a specific user by username")
    public ResponseEntity<ApiResponse<UserInfoResponse>> findByUsername(@PathVariable String username) {
        IdmUser user = idmMapper.findByUid(username);
        if (user != null) {
            return ResponseEntity.ok(ApiResponse.success(UserInfoResponse.fromIdmUser(user)));
        }
        UserInfoResponse response = userService.findByUsername(username);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/email/{email}")
    @Operation(summary = "Get user by email", description = "Get a specific user by email")
    public ResponseEntity<ApiResponse<UserInfoResponse>> findByEmail(@PathVariable String email) {
        UserInfoResponse user = userService.findByEmail(email);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PutMapping("/{uid}/role")
    @Operation(summary = "Update user role", description = "Update a user's role by UID")
    public ResponseEntity<ApiResponse<Void>> updateRole(
            @PathVariable String uid,
            @RequestBody Map<String, String> body) {
        String role = body.get("role");
        idmMapper.updateUserRole(uid, role);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/grouped-by-department")
    @Operation(summary = "Get users grouped by department", description = "Get all users grouped by department for tree selection")
    public ResponseEntity<ApiResponse<Map<String, List<UserInfoResponse>>>> findAllGroupedByDepartment() {
        Map<String, List<UserInfoResponse>> groupedUsers = userService.findAllGroupedByDepartment();
        return ResponseEntity.ok(ApiResponse.success(groupedUsers));
    }

    @GetMapping("/company-tree")
    @Operation(summary = "Get company tree", description = "Get IDM company/department/user tree")
    public ResponseEntity<ApiResponse<List<CompanyTreeNodeResponse>>> getCompanyTree() {
        List<CompanyTreeNodeResponse> tree = idmService.getCompanyTree();
        return ResponseEntity.ok(ApiResponse.success(tree));
    }
}
