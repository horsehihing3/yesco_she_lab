package com.smartehs.config;

import com.smartehs.mapper.UserMapper;
import com.smartehs.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("=== SmartEHS Application Started ===");

        String correctPassword = "doosan!!";
        User user = userMapper.findByUsername("doosan");

        if (user != null && !passwordEncoder.matches(correctPassword, user.getPassword())) {
            String newHash = passwordEncoder.encode(correctPassword);
            user.setPassword(newHash);
            userMapper.update(user);
            log.info("=== Password synced for doosan ===");
        }
    }
}
