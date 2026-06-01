package com.smartehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WaterWorkplaceRequest {
    private String workplaceName;
    private String region;
    private String manager;
    private String remark;
}
