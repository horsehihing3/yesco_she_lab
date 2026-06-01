package com.smartehs.model;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChemicalWarehouse {
    private Long id;
    private String warehouseCode;
    private String warehouseName;
    private String storageType;
    private String location;
    private Integer storedItemsCount;
    private String totalStock;
    private String temperature;
    private String humidity;
    private String status;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
