package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAccessList {
    private Long id;
    private String userName;
    private String userMail;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
}
