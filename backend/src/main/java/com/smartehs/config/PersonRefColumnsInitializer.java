package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 사람 필드(작성자/수정자/계획·완료승인자)를 JSON 1컬럼(PersonRef)으로 저장하기 위한 스키마.
 * - 각 역할의 JSON 컬럼(created_by 등)을 조건부 추가 (fresh/기존 DB 공통)
 * - 기존 flat 16컬럼이 있으면 거기서 1회 backfill (JSON이 NULL인 행만 — 멱등, 앱이 쓴 JSON 보존)
 * Flyway 비활성이라 스키마는 초기화기로 관리. 테이블 전환 시 TABLES 에 항목 추가.
 *
 * 역할 = JSON컬럼 / flat prefix:
 *   created_by, modified_by, plan_approver, completion_approver
 */
@Slf4j
@Order(50)
@Component
@RequiredArgsConstructor
public class PersonRefColumnsInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    /** {테이블, 역할 컬럼(=flat prefix) 목록} */
    private static final List<Object[]> TABLES = List.<Object[]>of(
        new Object[]{"tb_ehs_annual_plan", new String[]{"created_by", "modified_by", "plan_approver", "completion_approver"}}
        // Phase 2: 여기에 테이블 추가
    );

    @Override
    public void run(String... args) {
        int cols = 0, filled = 0;
        for (Object[] entry : TABLES) {
            String table = (String) entry[0];
            for (String role : (String[]) entry[1]) {
                try {
                    cols += addColumn(table, role);
                    filled += backfill(table, role);
                } catch (Exception e) {
                    log.warn("PersonRefColumns {}.{} 실패: {}", table, role, e.getMessage());
                }
            }
        }
        log.info("PersonRefColumnsInitializer: 컬럼 {}개 추가, {}행 backfill", cols, filled);
    }

    private int addColumn(String table, String jsonCol) {
        Integer exists = jdbcTemplate.queryForObject("SELECT COL_LENGTH(?, ?)", Integer.class, table, jsonCol);
        if (exists != null) return 0;
        jdbcTemplate.execute("ALTER TABLE " + table + " ADD " + jsonCol + " NVARCHAR(MAX) NULL");
        return 1;
    }

    /** flat 컬럼(prefix_user_id 등)이 존재하고 JSON 이 NULL 인 행만 backfill */
    private int backfill(String table, String prefix) {
        Integer flatExists = jdbcTemplate.queryForObject("SELECT COL_LENGTH(?, ?)", Integer.class, table, prefix + "_name");
        if (flatExists == null) return 0; // flat 컬럼 없으면(이미 drop 등) 스킵
        String sql =
            "UPDATE t SET " + prefix + " = (" +
            "  SELECT x." + prefix + "_user_id AS userId, x." + prefix + "_name AS [name], " +
            "         x." + prefix + "_team AS team, x." + prefix + "_position AS position " +
            "  FROM " + table + " x WHERE x.id = t.id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) " +
            "FROM " + table + " t " +
            "WHERE t." + prefix + " IS NULL AND (t." + prefix + "_user_id IS NOT NULL OR t." + prefix + "_name IS NOT NULL)";
        return jdbcTemplate.update(sql);
    }
}
