package com.smartehs.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChemicalWarehouseRequest {
    @NotBlank private String warehouseName;
    private String storageType;
    private String location;
    private Integer storedItemsCount;
    private String totalStock;
    private String temperature;
    private String humidity;
    private String status;
}
