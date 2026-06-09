package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * PSM 테이블 생성 Initializer.
 * Flyway 비활성 환경에서 V204/V205/V206/V216 SQL을 실행하여
 * tb_psm_data, tb_psm_moc, tb_psm_hazop, tb_psm_wo, tb_psm_incident, tb_psm_ptw 를 생성.
 */
@Slf4j
@Order(103)
@Component
@RequiredArgsConstructor
public class PsmTablesInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            if (!tableExists("tb_psm_data")) {
                log.info("PSM 테이블 생성 시작 (V204~V206)");
                executeSqlFile("db/V204__create_psm_tables.sql");
                executeSqlFile("db/V205__create_psm_wo_incident.sql");
                executeSqlFile("db/V206__create_psm_ptw.sql");
                log.info("PSM 테이블 생성 완료");
            }
            ensureTeamPositionColumns();
        } catch (Exception e) {
            log.warn("PSM 테이블 초기화 실패", e);
        }
    }

    private boolean tableExists(String tableName) {
        Integer n = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM sys.tables WHERE name = ?", Integer.class, tableName);
        return n != null && n > 0;
    }

    private void executeSqlFile(String resourcePath) {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(resourcePath)) {
            if (is == null) { log.warn("SQL 파일 없음: {}", resourcePath); return; }
            String sql = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            // GO는 SSMS 배치 구분자 — JDBC 실행을 위해 배치 단위로 분리
            String[] batches = sql.split("(?im)^\\s*GO\\s*$");
            for (String batch : batches) {
                String trimmed = batch.trim();
                if (trimmed.isEmpty()) continue;
                boolean allComments = trimmed.lines()
                    .allMatch(l -> l.isBlank() || l.stripLeading().startsWith("--"));
                if (allComments) continue;
                try {
                    jdbcTemplate.execute(trimmed);
                } catch (Exception e) {
                    log.debug("SQL 배치 오류 (무시): {}", e.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("SQL 파일 실행 오류: {}", resourcePath, e);
        }
    }

    // V216: team/position 컬럼 — 테이블 생성 이후에도 idempotent하게 보장
    private void ensureTeamPositionColumns() {
        String[] tables = {
            "tb_psm_data", "tb_psm_moc", "tb_psm_hazop",
            "tb_psm_incident", "tb_psm_ptw", "tb_psm_wo"
        };
        for (String table : tables) {
            if (!tableExists(table)) continue;
            ensureColumn(table, "created_by_team",     "NVARCHAR(100) NULL");
            ensureColumn(table, "created_by_position", "NVARCHAR(50)  NULL");
            ensureColumn(table, "modified_by_team",    "NVARCHAR(100) NULL");
            ensureColumn(table, "modified_by_position","NVARCHAR(50)  NULL");
        }
    }

    private void ensureColumn(String table, String column, String typeDef) {
        try {
            Integer n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID(?) AND name = ?",
                Integer.class, table, column);
            if (n == null || n == 0) {
                jdbcTemplate.execute("ALTER TABLE " + table + " ADD " + column + " " + typeDef);
                log.info("컬럼 추가: {}.{}", table, column);
            }
        } catch (Exception e) {
            log.debug("{}.{} 컬럼 처리 실패: {}", table, column, e.getMessage());
        }
    }
}
