package com.smartehs.service;

import com.smartehs.dto.request.LoginRequest;
import com.smartehs.dto.response.AuthResponse;
import com.smartehs.dto.response.UserInfoResponse;
import com.smartehs.model.IdmUser;
import com.smartehs.exception.BadRequestException;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final IdmMapper idmMapper;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    private static final String SUPER_ADMIN_ROLE = "SYSTEM_ADMIN";

    /**
     * 계정 전환(impersonation) — 비밀번호 없이 대상 계정의 토큰을 발급한다.
     * 운영 중 "특정 사용자 화면에서 버튼이 안 보인다" 류 민원을 슈퍼관리자가 그 사용자로 직접 재현·진단하기 위함.
     * 비밀번호는 해시 저장이라 슈퍼관리자도 알 수 없으므로 비번 검증 대신 호출자가 SYSTEM_ADMIN 인지 서버에서 검증한다.
     * 발급 토큰에는 원래 슈퍼관리자(imp)를 심어, 전환 상태에서 다른 계정으로 재전환/복귀해도 원관리자 권한으로 인가된다.
     */
    @Transactional
    public AuthResponse impersonate(String callerToken, String targetUsername) {
        if (callerToken == null || !tokenProvider.validateToken(callerToken)) {
            throw new AccessDeniedException("인증이 필요합니다.");
        }
        // 현재 토큰이 이미 전환 상태(imp 보유)면 원래 슈퍼관리자가 인가 주체.
        String impersonator = tokenProvider.getImpersonatorFromToken(callerToken);
        String adminUsername = impersonator != null ? impersonator : tokenProvider.getUsernameFromToken(callerToken);

        IdmUser admin = idmMapper.findByUid(adminUsername);
        if (admin == null || !SUPER_ADMIN_ROLE.equals(admin.getUserRole())) {
            throw new AccessDeniedException("슈퍼관리자만 계정 전환을 할 수 있습니다.");
        }

        IdmUser target = idmMapper.findByUid(targetUsername);
        if (target == null) {
            throw new ResourceNotFoundException("User not found: " + targetUsername);
        }

        // 원래 관리자 계정으로 복귀하는 경우는 imp 없는 일반 토큰 발급.
        boolean reverting = adminUsername.equals(target.getUid());
        String impClaim = reverting ? null : adminUsername;

        String accessToken = tokenProvider.generateToken(target.getUid(), impClaim);
        String refreshToken = tokenProvider.generateRefreshToken(target.getUid(), impClaim);

        log.warn("IMPERSONATION: admin={} -> target={}", adminUsername, target.getUid());

        return AuthResponse.of(
                accessToken,
                refreshToken,
                tokenProvider.getExpirationTime(),
                UserInfoResponse.fromIdmUser(target)
        );
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String accessToken = tokenProvider.generateToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(request.getUsername());

        IdmUser user = idmMapper.findByUid(request.getUsername());
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }

        log.info("User logged in: {}", user.getUid());

        return AuthResponse.of(
                accessToken,
                refreshToken,
                tokenProvider.getExpirationTime(),
                UserInfoResponse.fromIdmUser(user)
        );
    }

    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new BadRequestException("Invalid refresh token");
        }

        String username = tokenProvider.getUsernameFromToken(refreshToken);
        String impersonator = tokenProvider.getImpersonatorFromToken(refreshToken);
        IdmUser user = idmMapper.findByUid(username);
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }

        String newAccessToken = tokenProvider.generateToken(username, impersonator);
        String newRefreshToken = tokenProvider.generateRefreshToken(username, impersonator);

        return AuthResponse.of(
                newAccessToken,
                newRefreshToken,
                tokenProvider.getExpirationTime(),
                UserInfoResponse.fromIdmUser(user)
        );
    }

    @Transactional(readOnly = true)
    public UserInfoResponse getCurrentUser(String username) {
        IdmUser user = idmMapper.findByUid(username);
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }
        return UserInfoResponse.fromIdmUser(user);
    }
}
