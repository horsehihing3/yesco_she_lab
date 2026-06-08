package com.smartehs.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OshSignToken {
    private Long id;
    private String token;
    private Long committeeId;
    private Long attendeeId;
    private String attendeeName;
    private String attendeeMail;
    private Boolean used;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}
