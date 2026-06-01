package com.smartehs;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SmartEhsApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartEhsApplication.class, args);
    }
}
