package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * tb_emergency_plan / tb_ehs_annual_plan 의 writer_* 데이터를 created_by_* 로 1회 복사.
 * 3bdb82c 커밋에서 mapper 필드를 변경했으나 데이터 복사 Initializer가 누락된 것을 보완.
 */
@Slf4j
@Order(107)
@Component
@RequiredArgsConstructor
public class EmergencyPlanCreatedByMigrationInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        migrateTable("tb_emergency_plan");
        migrateTable("tb_ehs_annual_plan");
    }

    private void migrateTable(String table) {
        try {
            if (!tableExists(table)) return;
            if (!columnExists(table, "writer_name")) return;
            if (!columnExists(table, "created_by_name")) return;

            int n = jdbcTemplate.update(
                "UPDATE " + table + " " +
                "   SET created_by_user_id = COALESCE(created_by_user_id, writer_user_id), " +
                "       created_by_name     = COALESCE(created_by_name, writer_name), " +
                "       created_by_team     = COALESCE(created_by_team, writer_team), " +
                "       created_by_position = COALESCE(created_by_position, writer_position) " +
                " WHERE writer_name IS NOT NULL " +
                "   AND (created_by_name IS NULL OR created_by_user_id IS NULL)"
            );
            if (n > 0) log.info("{}: writer_* → created_by_* 복사 {}건", table, n);
        } catch (Exception e) {
            log.warn("{} writer→createdBy 마이그레이션 실패: {}", table, e.getMessage());
        }
    }

    private boolean tableExists(String table) {
        Integer n = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM sys.tables WHERE name = ?", Integer.class, table);
        return n != null && n > 0;
    }

    private boolean columnExists(String table, String column) {
        Integer n = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID(?) AND name = ?",
            Integer.class, table, column);
        return n != null && n > 0;
    }
}
