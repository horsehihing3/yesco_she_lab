package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PermitIdentification {
    private Long id;
    private String equipmentName;
    private String equipmentType;
    private String location;
    private LocalDate installDate;
    private String applicableCategories;
    private String applicablePermits;
    private String status;
    private String assessor;
    private LocalDate assessmentDate;
    private String linkedPermits;
    private String notes;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
