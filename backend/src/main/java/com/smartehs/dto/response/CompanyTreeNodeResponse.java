package com.smartehs.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CompanyTreeNodeResponse {
    private String nodeId;
    private String type; // COMPANY, GROUP, USER
    private String label;

    // USER 노드 전용
    private Long userId;
    private String username;
    private String email;
    private String name;
    private String nameEn;
    private String nameZh;
    private String department;
    private String position;
    private String company;
    private String phone;

    private List<CompanyTreeNodeResponse> children;
}
