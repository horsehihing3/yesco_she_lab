package com.smartehs.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageSendList {
    private Long id;
    private String title;
    private String groupName;
    private LocalDateTime createdAt;
}
