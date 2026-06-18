package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * HR 동기화 스키마 보강 — 기존 SchemaInitializer(CommandLineRunner) 패턴.
 * 모두 "가산적(추가)"이며 멱등하다. 기존 테이블/컬럼 DROP·ALTER·DELETE 없음
 * (공유 컴포인 본가 DB 무영향).
 *
 * <p>1) tb_hr_sync_log 신규 생성(없으면).
 * <p>2) T_IDM_USER / T_IDM_GROUP 에 SyncSource 컬럼 추가(없으면).
 *    - 기존 컬럼(ObjectCategory 등)은 HR 업무분류라 출처 구분에 부적합 → 전용 컬럼 신설.
 *    - 신규 행 기본 'SHE'(자체등록 보호). HR 동기화 INSERT는 명시적으로 'SAP'.
 *    - ⚠ 기존 행은 UPDATE 금지 방침에 따라 backfill 하지 않음(NULL로 남음 — 가드에서 'SAP' 아님 = 보호).
 *      실제 예스코 새 DB에선 SAP 적재분이 INSERT 시 'SAP'로 들어가 정합.
 */
@Slf4j
@Order(50)
@Component
@RequiredArgsConstructor
public class HrSyncSchemaInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    /** 신규 사용자 UIDNumber 발번용 시퀀스명. */
    private static final String UID_SEQUENCE = "seq_idm_user_uid";

    @Override
    public void run(String... args) {
        createSyncLogTable();
        ensureColumn("T_IDM_USER", "SyncSource", "NVARCHAR(10) NULL DEFAULT 'SHE'");
        ensureColumn("T_IDM_GROUP", "SyncSource", "NVARCHAR(10) NULL DEFAULT 'SHE'");
        // 직위명/직책명 직접 적재용(방안A). DutyCode 컬럼은 기존 T_IDM_USER에 존재 → 이름 컬럼만 신설.
        ensureColumn("T_IDM_USER", "TitleName", "NVARCHAR(100) NULL");
        ensureColumn("T_IDM_USER", "DutyName", "NVARCHAR(100) NULL");
        createUidSequence();
    }

    /**
     * UIDNumber 발번 시퀀스 생성(멱등). 신규 SAP 사용자 INSERT 시 {@code NEXT VALUE FOR} 로 발번.
     * <p>★ 시작값 = 현재 MAX(UIDNumber)+1 (기존 T_IDM_USER 값과 충돌 방지 — 1부터 시작 금지).
     * 가산적 DDL이며 이미 존재하면 skip.
     */
    private void createUidSequence() {
        try {
            Integer exists = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM sys.sequences WHERE name = ?", Integer.class, UID_SEQUENCE);
            if (exists != null && exists > 0) return;

            long start = 1L;   // T_IDM_USER 부재 환경 방어(실사용 경로 아님)
            Integer tbl = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM sys.tables WHERE name = 'T_IDM_USER'", Integer.class);
            if (tbl != null && tbl > 0) {
                Long maxUid = jdbcTemplate.queryForObject(
                        "SELECT ISNULL(MAX(UIDNumber), 0) FROM T_IDM_USER", Long.class);
                start = (maxUid == null ? 0L : maxUid) + 1L;
            }
            // start 는 내부 산정 정수값(주입 위험 없음). UIDNumber 가 int 이므로 시퀀스도 AS INT.
            jdbcTemplate.execute(
                    "CREATE SEQUENCE " + UID_SEQUENCE + " AS INT START WITH " + start + " INCREMENT BY 1");
            log.info("UIDNumber 발번 시퀀스 생성: {} START WITH {}", UID_SEQUENCE, start);
        } catch (Exception e) {
            log.error("{} 시퀀스 초기화 실패", UID_SEQUENCE, e);
        }
    }

    private void createSyncLogTable() {
        try {
            Integer exists = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_hr_sync_log'", Integer.class);
            if (exists != null && exists > 0) return;

            log.info("tb_hr_sync_log 테이블이 존재하지 않아 생성합니다.");
            jdbcTemplate.execute(
                    "CREATE TABLE tb_hr_sync_log (" +
                    "    id             INT IDENTITY(1,1) PRIMARY KEY," +
                    "    executed_at    DATETIME2     NOT NULL DEFAULT GETDATE()," +
                    "    target         NVARCHAR(20)  NOT NULL," +        // DEPT / USER
                    "    received_count INT           NOT NULL DEFAULT 0," +
                    "    success        BIT           NOT NULL," +
                    "    message        NVARCHAR(2000) NULL" +
                    ")");
            log.info("tb_hr_sync_log 테이블 생성 완료.");
        } catch (Exception e) {
            log.error("tb_hr_sync_log 테이블 초기화 실패", e);
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
            // 대상 테이블 부재 시 조용히 패스(환경별 IDM 테이블 유무 차이 방어)
            Integer t = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM sys.tables WHERE name = ?", Integer.class, table);
            if (t == null || t == 0) {
                log.warn("{} 테이블이 없어 {} 컬럼 추가를 건너뜁니다.", table, column);
                return;
            }
            if (columnExists(table, column)) return;
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD " + column + " " + typeDef);
            log.info("스키마 보강: ALTER TABLE {} ADD {} {}", table, column, typeDef);
        } catch (Exception e) {
            log.warn("{}.{} 컬럼 추가 실패", table, column, e);
        }
    }
}
