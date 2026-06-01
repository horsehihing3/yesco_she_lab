package com.smartehs.model;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RadWorker {
    private Long id;
    private String employeeNo;
    private String name;
    private String dept;
    private String job;
    private String workerType;
    private String nrscNo;
    private String dosimeterType;
    private String dosimeterNo;
    private LocalDate registerDate;
    private LocalDate lastEduDate;
    private LocalDate nextEduDate;
    private String status;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
