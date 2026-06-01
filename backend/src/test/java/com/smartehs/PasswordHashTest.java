package com.smartehs;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashTest {

    @Test
    void generateHash() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode("doosan!!");
        System.out.println("==============================================");
        System.out.println("BCrypt hash for 'doosan!!':");
        System.out.println(hash);
        System.out.println("==============================================");
    }
}
