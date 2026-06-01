package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PpeRequestDto {
    private Long equipmentId;
    @NotBlank private String itemName;
    private String itemCategory;
    private String itemModel;
    @NotNull private Integer quantity;
    private String reason;
    private String requesterName;
    private String requesterDept;
    private String requesterId;
    private String notes;
}
