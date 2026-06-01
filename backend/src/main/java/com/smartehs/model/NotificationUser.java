package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationUser {
    private Long id;
    private String title;
    private String users;
    private String code;
    private String mailAddress;
    private LocalDateTime createdAt;
}
