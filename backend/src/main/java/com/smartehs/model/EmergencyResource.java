package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyResource {
    private Long id;
    private String resourceId;
    private String resourceName;
    private String resourceType;
    private Integer quantity;
    private Integer availableQty;
    private String location;
    private LocalDate disposalDate;
    private String status;
    private String notes;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
