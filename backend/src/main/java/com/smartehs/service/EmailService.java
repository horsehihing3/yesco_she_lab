package com.smartehs.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    public void sendSignLink(String toEmail, String toName, String signUrl, String committeeTitle) {
        if (fromAddress == null || fromAddress.isBlank()) {
            log.warn("MAIL_USERNAME 미설정 — 이메일 발송 건너뜀 (to={}, url={})", toEmail, signUrl);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("[Smart SHE] 산업안전보건위원회 서명 요청");

            String html = buildHtml(toName, committeeTitle, signUrl);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("서명 링크 이메일 발송 완료: {}", toEmail);
        } catch (Exception e) {
            log.error("이메일 발송 실패 (to={}): {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("이메일 발송 실패: " + e.getMessage());
        }
    }

    private String buildHtml(String name, String title, String url) {
        return "<!DOCTYPE html><html><body style='font-family:sans-serif;'>" +
               "<div style='max-width:600px;margin:0 auto;padding:24px;'>" +
               "<h2 style='color:#1976d2;'>산업안전보건위원회 서명 요청</h2>" +
               "<p>안녕하세요, <b>" + escapeHtml(name) + "</b>님.</p>" +
               "<p>아래 안건에 대한 참석 서명을 요청드립니다.</p>" +
               "<p style='background:#f5f5f5;padding:12px;border-radius:4px;'><b>" + escapeHtml(title) + "</b></p>" +
               "<p>아래 버튼을 클릭하여 서명해 주세요.</p>" +
               "<a href='" + url + "' style='display:inline-block;background:#1976d2;color:#fff;padding:12px 24px;" +
               "border-radius:4px;text-decoration:none;font-size:16px;'>서명하기</a>" +
               "<p style='margin-top:24px;color:#888;font-size:12px;'>이 링크는 48시간 동안 유효합니다.<br>" +
               "본인이 요청하지 않은 경우 이 이메일을 무시하세요.</p>" +
               "</div></body></html>";
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
