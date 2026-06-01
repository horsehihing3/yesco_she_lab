package com.smartehs.model;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyContact {
    private Long id;
    private String contactId;
    private String organization;
    private String contactName;
    private String phoneNumber;
    private String email;
    private String contactType;
    private Boolean isEmergency;
    private Integer sortOrder;
    private String notes;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
