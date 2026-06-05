package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * tb_button_rule 메뉴 경로 rename 마이그레이션
 * '안전교육 신청' → '교육 신청' 으로 통일
 */
@Slf4j
@Order(101)
@Component
@RequiredArgsConstructor
public class ButtonRuleMenuPathMigrationInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM tb_button_rule WHERE menu_path = N'EHS경영 › 교육훈련 › 안전교육 신청'",
                Integer.class);
            if (count != null && count > 0) {
                jdbcTemplate.update(
                    "UPDATE tb_button_rule SET menu_path = N'EHS경영 › 교육훈련 › 교육 신청' " +
                    "WHERE menu_path = N'EHS경영 › 교육훈련 › 안전교육 신청'");
                log.info("tb_button_rule 메뉴 경로 rename: '안전교육 신청' → '교육 신청' ({}건)", count);
            }
        } catch (Exception e) {
            log.warn("ButtonRuleMenuPathMigrationInitializer 실패 — 서버는 계속 기동", e);
        }
    }
}
