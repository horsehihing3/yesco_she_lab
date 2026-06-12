package com.smartehs.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Order(99)
@Component
@RequiredArgsConstructor
public class DevAccountInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    private static final String DEV_UID      = "com4in_dev";
    private static final String DEV_PASSWORD = "com4in!!";

    @Override
    public void run(String... args) {
        try {
            Integer exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM T_IDM_USER WHERE UID = ?",
                Integer.class, DEV_UID);

            if (exists != null && exists > 0) {
                jdbcTemplate.update(
                    "UPDATE T_IDM_USER SET Password = ?, UserRole = 'SYSTEM_ADMIN', UserStatus = '10' WHERE UID = ?",
                    passwordEncoder.encode(DEV_PASSWORD), DEV_UID);
                log.info("com4in_dev 계정 업데이트 완료");
                return;
            }

            Long uidNumber = jdbcTemplate.queryForObject(
                "SELECT ISNULL(MAX(UIDNumber), 900000) + 1 FROM T_IDM_USER", Long.class);

            String hash = passwordEncoder.encode(DEV_PASSWORD);

            // com4in 행을 복사하되 식별자·인증 필드만 교체 (명시적 컬럼 리스트로 순서 무관)
            int inserted = jdbcTemplate.update(
                "INSERT INTO T_IDM_USER " +
                "  (UIDNumber, UID, UserName, CompanyCode, DeptCode, Email, " +
                "   UserStatus, ObjectCategory, Password, UserRole, ObjectGUID, UpdatedTime, TitleCode, Mobile) " +
                "SELECT ?, ?, N'com4in_dev', CompanyCode, DeptCode, Email, " +
                "       '10', ObjectCategory, ?, 'SYSTEM_ADMIN', NEWID(), GETDATE(), TitleCode, Mobile " +
                "FROM T_IDM_USER WHERE UID = 'com4in'",
                uidNumber, DEV_UID, hash);

            if (inserted == 0) {
                // com4in 행이 없는 경우 최소 필드로 생성
                jdbcTemplate.update(
                    "INSERT INTO T_IDM_USER " +
                    "  (UIDNumber, UID, UserName, Password, UserRole, UserStatus, ObjectGUID, UpdatedTime) " +
                    "VALUES (?, ?, N'com4in_dev', ?, 'SYSTEM_ADMIN', '10', NEWID(), GETDATE())",
                    uidNumber, DEV_UID, hash);
            }

            log.info("com4in_dev 개발용 계정 생성 완료 (UIDNumber={})", uidNumber);
        } catch (Exception e) {
            log.warn("DevAccountInitializer 실행 실패: {}", e.getMessage());
        }
    }
}
