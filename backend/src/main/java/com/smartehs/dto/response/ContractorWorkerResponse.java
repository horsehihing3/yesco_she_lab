package com.smartehs.dto.response;

import com.smartehs.model.ContractorWorker;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** ContractorWorker raw 엔티티 반환 대체 DTO. wire 100% 동일 유지. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractorWorkerResponse {
    private Long id;
    private Long planId;
    private String workerName;
    private String workerPhone;
    private String companyName;
    private String notes;
    private LocalDateTime createdAt;

    public static ContractorWorkerResponse from(ContractorWorker e) {
        return ContractorWorkerResponse.builder()
                .id(e.getId())
                .planId(e.getPlanId())
                .workerName(e.getWorkerName())
                .workerPhone(e.getWorkerPhone())
                .companyName(e.getCompanyName())
                .notes(e.getNotes())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
