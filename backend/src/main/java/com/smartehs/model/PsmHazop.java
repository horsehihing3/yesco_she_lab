package com.smartehs.model;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PsmHazop {
    private Long id;
    private String hazopNo;
    private String nodeName;
    private String pidDrawingNo;
    private LocalDate reviewDate;
    private String designIntent;
    private String teamLeader;
    private String secretary;
    private String status;          // IN_PROGRESS / REVIEWING / COMPLETED
    private Long createdByUserId;
    private String createdByName;
    private Long modifiedByUserId;
    private String modifiedByName;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    private List<PsmHazopItem> items;
}
