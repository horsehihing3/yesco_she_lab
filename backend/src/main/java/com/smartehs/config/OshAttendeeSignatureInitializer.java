package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * V194: tb_osh_committee_attendee — signature_image 컬럼 추가
 * (Flyway 비활성 환경용)
 */
@Slf4j
@Order(96)
@Component
@RequiredArgsConstructor
public class OshAttendeeSignatureInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.tables WHERE name = 'tb_osh_committee_attendee'", Integer.class);
            if (tableExists == null || tableExists == 0) return;

            Integer n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('tb_osh_committee_attendee') AND name = 'signature_image'",
                Integer.class);
            if (n != null && n > 0) return;

            jdbcTemplate.execute("ALTER TABLE tb_osh_committee_attendee ADD signature_image NVARCHAR(MAX) NULL");
            log.info("tb_osh_committee_attendee.signature_image 컬럼 추가 완료");
        } catch (Exception e) {
            log.warn("tb_osh_committee_attendee.signature_image 컬럼 추가 실패", e);
        }
    }
}
