package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.mapper.OSHCommitteeAttendeeMapper;
import com.smartehs.mapper.OSHCommitteeMapper;
import com.smartehs.mapper.OshSignTokenMapper;
import com.smartehs.model.OSHCommittee;
import com.smartehs.model.OSHCommitteeAttendee;
import com.smartehs.model.OshSignToken;
import com.smartehs.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "OSH Sign", description = "OSH Committee 이메일 서명 링크 API (공개)")
public class OshSignController {

    private final OshSignTokenMapper tokenMapper;
    private final OSHCommitteeMapper committeeMapper;
    private final OSHCommitteeAttendeeMapper attendeeMapper;
    private final EmailService emailService;

    // 프론트 앱 기본 URL — 환경변수로 override 가능
    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:http://localhost:7500}")
    private String frontendUrl;

    // ===== 공개 엔드포인트 (SecurityConfig permitAll) =====

    @GetMapping("/osh-sign/{token}")
    @Operation(summary = "토큰으로 서명 정보 조회", description = "서명 링크 토큰 유효성 확인 및 참석자·위원회 정보 반환")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSignInfo(@PathVariable String token) {
        OshSignToken signToken = tokenMapper.findByToken(token);
        if (signToken == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("유효하지 않은 링크입니다."));
        }
        if (Boolean.TRUE.equals(signToken.getUsed())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("이미 서명이 완료된 링크입니다."));
        }
        if (signToken.getExpiresAt() != null && signToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("만료된 링크입니다."));
        }

        OSHCommittee committee = committeeMapper.findById(signToken.getCommitteeId());
        OSHCommitteeAttendee attendee = attendeeMapper.findById(signToken.getAttendeeId());

        Map<String, Object> result = new HashMap<>();
        result.put("attendeeId", signToken.getAttendeeId());
        result.put("attendeeName", signToken.getAttendeeName());
        result.put("committeeId", signToken.getCommitteeId());
        if (committee != null) {
            result.put("oshYear", committee.getOshYear());
            result.put("oshQuarter", committee.getOshQuarter());
            result.put("oshDate", committee.getOshDate());
            result.put("mainAgenda", committee.getMainAgenda());
        }
        if (attendee != null) {
            result.put("alreadySigned", Boolean.TRUE.equals(attendee.getIsSigned()));
            result.put("signatureImage", attendee.getSignatureImage());
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/osh-sign/{token}/signature")
    @Transactional
    @Operation(summary = "서명 저장 (공개)", description = "토큰으로 참석자 서명 이미지 저장")
    public ResponseEntity<ApiResponse<Void>> saveSignature(
            @PathVariable String token,
            @RequestBody Map<String, String> body) {

        OshSignToken signToken = tokenMapper.findByToken(token);
        if (signToken == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("유효하지 않은 링크입니다."));
        }
        if (Boolean.TRUE.equals(signToken.getUsed())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("이미 서명이 완료된 링크입니다."));
        }
        if (signToken.getExpiresAt() != null && signToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("만료된 링크입니다."));
        }

        String signatureImage = body.get("signatureImage");
        if (signatureImage == null || signatureImage.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("서명 이미지가 없습니다."));
        }

        OSHCommitteeAttendee attendee = attendeeMapper.findById(signToken.getAttendeeId());
        if (attendee != null) {
            attendee.setSignatureImage(signatureImage);
            attendee.setIsSigned(true);
            attendee.setSignatureDate(LocalDateTime.now());
            attendeeMapper.update(attendee);
        }

        tokenMapper.markUsed(token);
        log.info("서명 완료: attendeeId={}, name={}", signToken.getAttendeeId(), signToken.getAttendeeName());
        return ResponseEntity.ok(ApiResponse.success("서명이 저장됐습니다.", null));
    }

    // ===== 인증 필요 엔드포인트 =====

    @PostMapping("/osh-committees/{id}/send-sign-links")
    @Transactional
    @Operation(summary = "서명 링크 발송", description = "위원회 참석자들에게 이메일 서명 링크 발송")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendSignLinks(@PathVariable Long id) {
        OSHCommittee committee = committeeMapper.findById(id);
        if (committee == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("위원회를 찾을 수 없습니다."));
        }

        List<OSHCommitteeAttendee> attendees = attendeeMapper.findByOshId(committee.getOshId());
        if (attendees.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("참석자가 없습니다."));
        }

        String committeeTitle = committee.getOshYear() + "년 " + committee.getOshQuarter() + "분기 산업안전보건위원회";
        int sent = 0;
        int skipped = 0;

        for (OSHCommitteeAttendee attendee : attendees) {
            String mail = attendee.getAttendeeMail();
            if (mail == null || mail.isBlank() || mail.contains("@external") || mail.contains("@hankook.com")) {
                skipped++;
                continue;
            }

            // 토큰 생성 (48시간 유효)
            String tokenStr = UUID.randomUUID().toString();
            OshSignToken signToken = OshSignToken.builder()
                    .token(tokenStr)
                    .committeeId(committee.getId())
                    .attendeeId(attendee.getId())
                    .attendeeName(attendee.getAttendeeName())
                    .attendeeMail(mail)
                    .used(false)
                    .expiresAt(LocalDateTime.now().plusHours(48))
                    .build();
            tokenMapper.insert(signToken);

            String signUrl = frontendUrl + "/osh-sign/" + tokenStr;
            try {
                emailService.sendSignLink(mail, attendee.getAttendeeName(), signUrl, committeeTitle);
                sent++;
            } catch (Exception e) {
                log.error("이메일 발송 실패 ({}): {}", mail, e.getMessage());
                skipped++;
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("sent", sent);
        result.put("skipped", skipped);
        String msg = sent + "명에게 서명 링크를 발송했습니다." + (skipped > 0 ? " (" + skipped + "명 건너뜀)" : "");
        return ResponseEntity.ok(ApiResponse.success(msg, result));
    }
}
