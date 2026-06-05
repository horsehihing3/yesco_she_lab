package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * V190: tb_near_miss_list — 사고 대응 필드 4종 추가 (emergency_type, response_status, is_drill, severity)
 */
@Slf4j
@Order(98)
@Component
@RequiredArgsConstructor
public class NearMissEmergencyFieldsInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            addColumnIfMissing("emergency_type",   "NVARCHAR(30) NULL");
            addColumnIfMissing("response_status",  "NVARCHAR(30) NULL");
            addColumnIfMissing("is_drill",          "BIT NULL CONSTRAINT DF_tb_near_miss_list_is_drill DEFAULT 0");
            addColumnIfMissing("severity",          "NVARCHAR(30) NULL");

            jdbcTemplate.execute(
                "UPDATE tb_near_miss_list " +
                "SET emergency_type  = CASE " +
                "  WHEN occ_title LIKE N'%화재%' THEN 'FIRE' " +
                "  WHEN occ_title LIKE N'%폭발%' THEN 'EXPLOSION' " +
                "  WHEN occ_title LIKE N'%가스%' THEN 'GAS_LEAK' " +
                "  WHEN occ_title LIKE N'%화학%' THEN 'CHEM_LEAK' " +
                "  WHEN occ_title LIKE N'%지진%' THEN 'EARTHQUAKE' " +
                "  WHEN occ_title LIKE N'%정전%' THEN 'POWER_OUT' " +
                "  ELSE 'CASUALTY' END, " +
                "    response_status = CASE status " +
                "  WHEN 'PENDING'     THEN 'ISSUED' " +
                "  WHEN 'IN_PROGRESS' THEN 'RESPONDING' " +
                "  WHEN 'COMPLETED'   THEN 'CLOSED' " +
                "  ELSE 'ISSUED' END, " +
                "    is_drill = 0, " +
                "    severity = CASE " +
                "  WHEN intensity >= 4 THEN 'SEVERE' " +
                "  WHEN intensity = 3  THEN 'MODERATE' " +
                "  ELSE 'MINOR' END " +
                "WHERE emergency_type IS NULL OR response_status IS NULL OR severity IS NULL"
            );
            log.info("NearMissEmergencyFieldsInitializer 완료");
        } catch (Exception e) {
            log.warn("NearMissEmergencyFieldsInitializer 실패", e);
        }
    }

    private void addColumnIfMissing(String col, String definition) {
        Integer n = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS " +
            "WHERE TABLE_NAME = 'tb_near_miss_list' AND COLUMN_NAME = ?",
            Integer.class, col);
        if (n == null || n == 0) {
            jdbcTemplate.execute("ALTER TABLE tb_near_miss_list ADD " + col + " " + definition);
            log.info("tb_near_miss_list.{} 컬럼 추가", col);
        }
    }
}
