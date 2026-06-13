package com.smartehs.dto.response;

import com.smartehs.model.RadWorker;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** RadWorker raw 엔티티 반환 대체 DTO. wire 100% 동일 유지. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RadWorkerResponse {
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

    public static RadWorkerResponse from(RadWorker e) {
        return RadWorkerResponse.builder()
                .id(e.getId())
                .employeeNo(e.getEmployeeNo())
                .name(e.getName())
                .dept(e.getDept())
                .job(e.getJob())
                .workerType(e.getWorkerType())
                .nrscNo(e.getNrscNo())
                .dosimeterType(e.getDosimeterType())
                .dosimeterNo(e.getDosimeterNo())
                .registerDate(e.getRegisterDate())
                .lastEduDate(e.getLastEduDate())
                .nextEduDate(e.getNextEduDate())
                .status(e.getStatus())
                .deleted(e.getDeleted())
                .createdAt(e.getCreatedAt())
                .modifiedAt(e.getModifiedAt())
                .build();
    }
}
