package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * T_IDM_USER — Mobile 컬럼 추가 및 테스트 계정 연락처/이메일 세팅
 */
@Slf4j
@Order(97)
@Component
@RequiredArgsConstructor
public class IdmUserMobileInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            // Mobile 컬럼 없으면 추가
            Integer n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('T_IDM_USER') AND name = 'Mobile'",
                Integer.class);
            if (n == null || n == 0) {
                jdbcTemplate.execute("ALTER TABLE T_IDM_USER ADD Mobile NVARCHAR(20) NULL");
                log.info("T_IDM_USER.Mobile 컬럼 추가 완료");
            }

            // 정경석 (UIDNumber=338817): 연락처 + 이메일
            jdbcTemplate.update(
                "UPDATE T_IDM_USER SET Mobile = N'010-2877-0210', Email = N'gs5655@daum.net' WHERE UIDNumber = 338817");
            // 홍길동 (UIDNumber=338818): 연락처
            jdbcTemplate.update(
                "UPDATE T_IDM_USER SET Mobile = N'010-2877-0210' WHERE UIDNumber = 338818");

            log.info("T_IDM_USER 정경석·홍길동 연락처 세팅 완료");
        } catch (Exception e) {
            log.warn("IdmUserMobileInitializer 실행 실패", e);
        }
    }
}
