package com.smartehs.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * BCrypt 해시 생성 유틸리티
 * 한 번 실행해서 해시를 얻은 후 FULL_RESET.sql에 복사
 */
public class PasswordHashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "doosan!!";
        String hash = encoder.encode(password);

        System.out.println("Password: " + password);
        System.out.println("BCrypt Hash: " + hash);
        System.out.println();
        System.out.println("Copy this to FULL_RESET.sql:");
        System.out.println("N'" + hash + "'");
    }
}
