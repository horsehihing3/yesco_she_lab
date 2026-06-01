package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 위험성 평가 — rejected 상태인데 reject_reason 이 비어 있는 항목에 더미 사유 백필.
 * V152 와 동일 동작.
 */
@Slf4j
@Order(82)
@Component
@RequiredArgsConstructor
public class RiskAssessmentRejectReasonDummyInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_risk_assessment'", Integer.class);
            if (tableExists == null || tableExists == 0) return;

            Integer colExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('tb_risk_assessment') AND name = 'reject_reason'",
                Integer.class);
            if (colExists == null || colExists == 0) return;

            int n = jdbcTemplate.update(
                "UPDATE tb_risk_assessment " +
                "   SET reject_reason = N'유해위험요인 누락 / 감소대책 구체성 부족으로 반려합니다. 보완 후 재상신해주세요.', " +
                "       modified_at = GETDATE() " +
                " WHERE status = 'rejected' " +
                "   AND (reject_reason IS NULL OR reject_reason = N'')");
            if (n > 0) log.info("RiskAssessment reject_reason 더미 백필: {}건", n);
        } catch (Exception e) {
            log.warn("RiskAssessment reject_reason 더미 백필 실패", e);
        }
    }
}
