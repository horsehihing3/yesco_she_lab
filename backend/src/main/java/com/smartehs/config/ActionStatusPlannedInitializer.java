package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * ACTION_STATUS 코드그룹에 PLANNED 코드 보강.
 * Flyway 비활성 환경에서도 V147 와 동일 동작.
 */
@Slf4j
@Order(90)
@Component
@RequiredArgsConstructor
public class ActionStatusPlannedInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        addPlannedToGroup("ACTION_STATUS");
        addPlannedToGroup("CORRECTIVE_STATUS");
    }

    private void addPlannedToGroup(String groupCode) {
        try {
            Long groupId = jdbcTemplate.query(
                "SELECT id FROM tb_code_group WHERE group_code = ?",
                ps -> ps.setString(1, groupCode),
                rs -> rs.next() ? rs.getLong(1) : null);
            if (groupId == null) return;

            Integer existing = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM tb_code_detail WHERE group_id = ? AND code = 'PLANNED'",
                Integer.class, groupId);
            if (existing != null && existing > 0) return;

            jdbcTemplate.update(
                "INSERT INTO tb_code_detail (group_id, code, code_value, code_name_ko, code_name_en, code_name_zh, is_active, sort_order, created_at, modified_at) " +
                "VALUES (?, 'PLANNED', 'PLANNED', N'계획됨', 'Planned', N'已计划', 1, 0, GETDATE(), GETDATE())",
                groupId);
            log.info("{} 에 PLANNED 코드 추가 완료", groupCode);
        } catch (Exception e) {
            log.warn("{} PLANNED 코드 추가 실패", groupCode, e);
        }
    }
}
