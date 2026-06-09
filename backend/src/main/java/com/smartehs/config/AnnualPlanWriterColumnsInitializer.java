package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * tb_ehs_annual_plan 에 writer_* 컬럼 추가.
 * V114/V215 가 Flyway 비활성 환경에서 적용되지 않을 경우를 위한 idempotent fix.
 */
@Slf4j
@Order(102)
@Component
@RequiredArgsConstructor
public class AnnualPlanWriterColumnsInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_ehs_annual_plan'", Integer.class);
            if (tableExists == null || tableExists == 0) return;

            for (String[] col : List.of(
                new String[]{"writer_user_id",     "BIGINT NULL"},
                new String[]{"writer_team",         "NVARCHAR(100) NULL"},
                new String[]{"writer_position",     "NVARCHAR(50) NULL"},
                new String[]{"writer_name",         "NVARCHAR(100) NULL"},
                new String[]{"modified_by_user_id", "BIGINT NULL"},
                new String[]{"modified_by_name",    "NVARCHAR(100) NULL"},
                new String[]{"modified_by_team",    "NVARCHAR(100) NULL"},
                new String[]{"modified_by_position","NVARCHAR(50) NULL"}
            )) {
                ensureColumn("tb_ehs_annual_plan", col[0], col[1]);
            }
        } catch (Exception e) {
            log.warn("연간 계획 writer 컬럼 초기화 실패", e);
        }
    }

    private boolean columnExists(String table, String column) {
        Integer n = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID(?) AND name = ?",
            Integer.class, table, column);
        return n != null && n > 0;
    }

    private void ensureColumn(String table, String column, String typeDef) {
        try {
            if (columnExists(table, column)) return;
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD " + column + " " + typeDef);
            log.info("스키마 보강: ALTER TABLE {} ADD {} {}", table, column, typeDef);
        } catch (Exception e) {
            log.warn("{}.{} 컬럼 추가 실패", table, column, e);
        }
    }
}
