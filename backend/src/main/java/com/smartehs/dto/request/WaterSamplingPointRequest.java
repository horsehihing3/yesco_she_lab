package com.smartehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WaterSamplingPointRequest {
    private Long workplaceId;
    private String pointName;
    private String location;
    private String remark;
}
