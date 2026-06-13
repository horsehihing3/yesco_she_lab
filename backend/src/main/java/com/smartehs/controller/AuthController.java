package com.smartehs.controller;

import com.smartehs.dto.request.ImpersonateRequest;
import com.smartehs.dto.request.LoginRequest;
import com.smartehs.dto.response.ApiResponse;
import com.smartehs.dto.response.AuthResponse;
import com.smartehs.dto.response.UserInfoResponse;
import com.smartehs.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication API")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticate user and return JWT tokens")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/impersonate")
    @Operation(summary = "Impersonate user (account switch)",
            description = "슈퍼관리자(SYSTEM_ADMIN)가 비밀번호 없이 대상 계정의 토큰을 발급받아 전환한다. 호출자 권한은 서버에서 검증한다.")
    public ResponseEntity<ApiResponse<AuthResponse>> impersonate(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody ImpersonateRequest request) {
        String token = (authHeader != null && authHeader.startsWith("Bearer "))
                ? authHeader.substring(7) : null;
        AuthResponse response = authService.impersonate(token, request.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Account switched", response));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh token", description = "Get new access token using refresh token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@RequestBody String refreshToken) {
        AuthResponse response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Get currently authenticated user info")
    public ResponseEntity<ApiResponse<UserInfoResponse>> getCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Not authenticated"));
        }
        UserInfoResponse response = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
