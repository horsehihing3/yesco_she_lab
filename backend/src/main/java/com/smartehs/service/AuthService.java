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
        IdmUser user = idmMapper.findByUid(username);
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }

        String newAccessToken = tokenProvider.generateToken(username);
        String newRefreshToken = tokenProvider.generateRefreshToken(username);

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
