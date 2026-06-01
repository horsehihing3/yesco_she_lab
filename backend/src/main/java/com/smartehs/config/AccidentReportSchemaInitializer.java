package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * tb_accident_report 테이블이 없으면 앱 시작 시 자동 생성한다.
 * Flyway가 비활성화된 환경에서 수동 SQL 실행 없이 동작하도록 하기 위한 구성.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AccidentReportSchemaInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            Integer exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_accident_report'",
                Integer.class);

            if (exists == null || exists == 0) {
                log.info("tb_accident_report 테이블이 존재하지 않아 생성합니다.");
                jdbcTemplate.execute(
                    "CREATE TABLE tb_accident_report (" +
                    "    id                  BIGINT IDENTITY(1,1) PRIMARY KEY," +
                    "    case_description    NVARCHAR(1000) NULL," +
                    "    disaster_type       NVARCHAR(50)   NULL," +
                    "    is_near_miss        BIT NOT NULL DEFAULT 0," +
                    "    is_fatal            BIT NOT NULL DEFAULT 0," +
                    "    leave_over_month    BIT NOT NULL DEFAULT 0," +
                    "    leave_under_month   BIT NOT NULL DEFAULT 0," +
                    "    freq_none           BIT NOT NULL DEFAULT 0," +
                    "    occurrence_cycle    NVARCHAR(200)  NULL," +
                    "    related_process     NVARCHAR(500)  NULL," +
                    "    sort_order          INT NOT NULL DEFAULT 0," +
                    "    created_at          DATETIME2 NOT NULL DEFAULT GETDATE()," +
                    "    modified_at         DATETIME2 NOT NULL DEFAULT GETDATE()" +
                    ")");
                log.info("tb_accident_report 테이블 생성 완료.");
            }
        } catch (Exception e) {
            log.error("tb_accident_report 테이블 초기화 실패", e);
        }
    }
}
