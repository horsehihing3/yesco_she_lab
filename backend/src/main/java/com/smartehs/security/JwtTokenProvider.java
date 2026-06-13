package com.smartehs.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    private SecretKey key;

    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return generateToken(userDetails.getUsername());
    }

    public String generateToken(String username) {
        return generateToken(username, null);
    }

    /** 계정 전환(impersonation)용: imp 클레임에 원래 슈퍼관리자 username 을 심는다(없으면 일반 토큰). */
    public String generateToken(String username, String impersonator) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);

        JwtBuilder builder = Jwts.builder()
                .subject(username)
                .issuedAt(now)
                .expiration(expiryDate);
        if (impersonator != null && !impersonator.isBlank()) {
            builder.claim("imp", impersonator);
        }
        return builder.signWith(key).compact();
    }

    public String generateRefreshToken(String username) {
        return generateRefreshToken(username, null);
    }

    public String generateRefreshToken(String username, String impersonator) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshExpiration);

        JwtBuilder builder = Jwts.builder()
                .subject(username)
                .issuedAt(now)
                .expiration(expiryDate);
        if (impersonator != null && !impersonator.isBlank()) {
            builder.claim("imp", impersonator);
        }
        return builder.signWith(key).compact();
    }

    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject();
    }

    /** 계정 전환 토큰의 원래 슈퍼관리자(impersonator) username. 일반 토큰이면 null. */
    public String getImpersonatorFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        Object imp = claims.get("imp");
        return imp != null ? imp.toString() : null;
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (MalformedJwtException ex) {
            log.error("Invalid JWT token");
        } catch (ExpiredJwtException ex) {
            log.error("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            log.error("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            log.error("JWT claims string is empty");
        }
        return false;
    }

    public long getExpirationTime() {
        return jwtExpiration;
    }
}
