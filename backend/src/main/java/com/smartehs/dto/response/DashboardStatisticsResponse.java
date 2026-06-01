package com.smartehs.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatisticsResponse {

    private SafetyWorkStatistics safetyWork;
    private NearMissStatistics nearMiss;
    private RiskAssessmentStatistics riskAssessment;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SafetyWorkStatistics {
        private long draft;           // 작성
        private long review;          // 검토
        private long reviewCompleted; // 검토완료
        private long approved;        // 승인(작업중)
        private long completed;       // 작업완료
        private long rejected;        // 반려
        private long total;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NearMissStatistics {
        private long pending;         // 요청완료
        private long inProgress;      // 조치중
        private long completed;       // 조치완료
        private long rejected;        // 반려
        private long approvalRequest; // 승인요청(관리자)
        private long total;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RiskAssessmentStatistics {
        private long draft;           // 작성중
        private long submitted;       // 제출완료
        private long approved;        // 승인
        private long rejected;        // 반려
        private long approvalRequest; // 승인요청(관리자)
        private long total;
    }
}
