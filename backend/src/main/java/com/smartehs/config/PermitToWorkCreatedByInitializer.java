package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * tb_permit_to_work 에 created_by_* 및 modified_by 컬럼 추가.
 * Flyway 비활성 환경에서 idempotent 스키마 보강.
 */
@Slf4j
@Order(104)
@Component
@RequiredArgsConstructor
public class PermitToWorkCreatedByInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_permit_to_work'", Integer.class);
            if (tableExists == null || tableExists == 0) return;

            for (String[] col : List.of(
                new String[]{"created_by_user_id", "BIGINT NULL"},
                new String[]{"created_by_name",    "NVARCHAR(100) NULL"},
                new String[]{"created_by_team",    "NVARCHAR(100) NULL"},
                new String[]{"created_by_position","NVARCHAR(50) NULL"},
                new String[]{"modified_by",        "NVARCHAR(100) NULL"}
            )) {
                ensureColumn("tb_permit_to_work", col[0], col[1]);
            }
        } catch (Exception e) {
            log.warn("PTW created_by 컬럼 초기화 실패", e);
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
