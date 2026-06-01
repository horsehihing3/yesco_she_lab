package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PermitRegistry {
    private Long id;
    private String category;
    private String permitType;
    private String name;
    private String law;
    private String agency;
    private String permitNumber;
    private LocalDate issuedDate;
    private LocalDate expiryDate;
    private String cycle;
    private String facility;
    private String location;
    private String manager;
    private String notes;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
