package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * tb_risk_assessment.status 소문자 → 대문자 일괄 전환 (멱등).
 * 다른 도메인(AuditPlan, ContractorPlan 등)은 이미 대문자 사용 중이므로 표준 통일.
 * - 이미 대문자인 행은 WHERE 조건에서 제외되어 no-op.
 */
@Slf4j
@Order(200)
@Component
@RequiredArgsConstructor
public class RiskAssessmentStatusUppercaseInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            int n = jdbcTemplate.update(
                "UPDATE tb_risk_assessment SET status = " +
                "  CASE status" +
                "    WHEN 'draft'                THEN 'DRAFT'" +
                "    WHEN 'submitted'            THEN 'SUBMITTED'" +
                "    WHEN 'approved'             THEN 'APPROVED'" +
                "    WHEN 'rejected'             THEN 'REJECTED'" +
                "    WHEN 'completed'            THEN 'COMPLETED'" +
                "    WHEN 'completion_submitted' THEN 'COMPLETION_SUBMITTED'" +
                "    ELSE status" +
                "  END " +
                "WHERE status IN ('draft','submitted','approved','rejected','completed','completion_submitted')"
            );
            if (n > 0) log.info("RiskAssessmentStatusUppercaseInitializer: {}건 대문자 전환", n);
        } catch (Exception e) {
            log.warn("RiskAssessmentStatusUppercaseInitializer 실패: {}", e.getMessage());
        }
    }
}
