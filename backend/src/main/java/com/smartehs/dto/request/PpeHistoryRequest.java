package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PpeHistoryRequest {
    @NotBlank
    private String actionType;
    @NotBlank
    private String itemName;
    @NotNull
    private Integer quantity;
    private String recipientName;
    private String recipientDept;
    private String handlerName;
    private LocalDateTime actionDate;
    private String notes;
}
