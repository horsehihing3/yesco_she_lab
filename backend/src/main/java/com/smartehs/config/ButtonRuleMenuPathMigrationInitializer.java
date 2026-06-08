package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * tb_button_rule 버튼/메뉴 경로 rename 마이그레이션
 * - '안전교육 신청' → '교육 신청'
 * - 위험성 평가 LIST '신규 등록' → 'New'
 */
@Slf4j
@Order(101)
@Component
@RequiredArgsConstructor
public class ButtonRuleMenuPathMigrationInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        migrate(
            "SELECT COUNT(*) FROM tb_button_rule WHERE menu_path = N'EHS경영 › 교육훈련 › 안전교육 신청'",
            "UPDATE tb_button_rule SET menu_path = N'EHS경영 › 교육훈련 › 교육 신청' WHERE menu_path = N'EHS경영 › 교육훈련 › 안전교육 신청'",
            "menu_path rename: '안전교육 신청' → '교육 신청'"
        );
        migrate(
            "SELECT COUNT(*) FROM tb_button_rule WHERE menu_path = N'안전 관리 › 위험성 평가' AND button_name = N'신규 등록'",
            "UPDATE tb_button_rule SET button_name = N'New' WHERE menu_path = N'안전 관리 › 위험성 평가' AND button_name = N'신규 등록'",
            "위험성 평가 LIST 버튼 rename: '신규 등록' → 'New'"
        );
    }

    private void migrate(String countSql, String updateSql, String label) {
        try {
            Integer count = jdbcTemplate.queryForObject(countSql, Integer.class);
            if (count != null && count > 0) {
                jdbcTemplate.update(updateSql);
                log.info("tb_button_rule {}: {}건", label, count);
            }
        } catch (Exception e) {
            log.warn("ButtonRuleMigration 실패 ({}): {}", label, e.getMessage());
        }
    }
}
