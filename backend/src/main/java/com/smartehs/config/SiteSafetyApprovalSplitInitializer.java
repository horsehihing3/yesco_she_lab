package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * tb_site_safety_plan 완료 결재 타임스탬프 컬럼 보강 (completion_approved_at / completion_approved_by).
 *
 * 다른 결재 도메인(연간계획·감사·협력사·비상·작업허가·위험성평가)은 *ApprovalSplitInitializer 로
 * 이 두 컬럼을 보유하나 SiteSafety 만 누락 → transition(stage='COMPLETION') 시
 * completionApprovedAt 가 항상 null 이던 결함을 해소한다.
 *
 * Flyway 비활성 환경용 멱등 ALTER ADD.
 * - 백필 없음: 과거 approved_at 은 PLAN 승인시각이라 완료시각 소스로 부적합(오기록 방지).
 * - completion_approver_*(지정 승인자 flat)는 별개 컬럼이며 본 초기화기 범위가 아니다.
 *   (PersonRef JSON 통합 대상인 *_approver_* flat 과 달리, _approved_at/by 타임스탬프는 존속 필요)
 */
@Slf4j
@Order(72)
@Component
@RequiredArgsConstructor
public class SiteSafetyApprovalSplitInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_site_safety_plan'", Integer.class);
            if (tableExists == null || tableExists == 0) return;

            for (String[] col : List.of(
                new String[]{"completion_approved_at", "DATETIME2 NULL"},
                new String[]{"completion_approved_by", "NVARCHAR(100) NULL"}
            )) {
                ensureColumn("tb_site_safety_plan", col[0], col[1]);
            }
        } catch (Exception e) {
            log.warn("SiteSafety 완료 결재 타임스탬프 컬럼 보강 실패", e);
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
