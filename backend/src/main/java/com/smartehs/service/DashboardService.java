package com.smartehs.service;

import com.smartehs.dto.response.DashboardStatisticsResponse;
import com.smartehs.dto.response.DashboardStatisticsResponse.*;
import com.smartehs.dto.response.EhsAlertResponse;
import com.smartehs.dto.response.EhsPlanResponse;
import com.smartehs.dto.response.EhsMessageResponse;
import com.smartehs.mapper.EhsAlertMapper;
import com.smartehs.mapper.EhsMessageMapper;
import com.smartehs.mapper.NearMissMapper;
import com.smartehs.mapper.RiskAssessmentInfoFormMapper;
import com.smartehs.mapper.SafetyWorkListMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final SafetyWorkListMapper safetyWorkMapper;
    private final NearMissMapper nearMissMapper;
    private final RiskAssessmentInfoFormMapper riskAssessmentMapper;
    private final EhsAlertMapper ehsAlertMapper;
    private final EhsMessageMapper ehsMessageMapper;
    private final EhsPlanService ehsPlanService;

    @Transactional(readOnly = true)
    public DashboardStatisticsResponse getStatistics() {
        return DashboardStatisticsResponse.builder()
                .safetyWork(getSafetyWorkStatistics())
                .nearMiss(getNearMissStatistics())
                .riskAssessment(getRiskAssessmentStatistics())
                .build();
    }

    private SafetyWorkStatistics getSafetyWorkStatistics() {
        long draft = safetyWorkMapper.countByStatus("DRAFT");
        long submitted = safetyWorkMapper.countByStatus("SUBMITTED");
        long reviewed = safetyWorkMapper.countByStatus("REVIEWED");
        long approved = safetyWorkMapper.countByStatus("APPROVED") +
                       safetyWorkMapper.countByStatus("IN_PROGRESS");
        long completed = safetyWorkMapper.countByStatus("COMPLETED");
        long rejected = safetyWorkMapper.countByStatus("REJECTED");

        return SafetyWorkStatistics.builder()
                .draft(draft)
                .review(submitted)
                .reviewCompleted(reviewed)
                .approved(approved)
                .completed(completed)
                .rejected(rejected)
                .total(draft + submitted + reviewed + approved + completed + rejected)
                .build();
    }

    private NearMissStatistics getNearMissStatistics() {
        long pending = nearMissMapper.countByStatusAndDeletedFalse("PENDING");
        long inProgress = nearMissMapper.countByStatusAndDeletedFalse("IN_PROGRESS");
        long completed = nearMissMapper.countByStatusAndDeletedFalse("COMPLETED");
        long rejected = nearMissMapper.countByStatusAndDeletedFalse("REJECTED");
        long approvalRequest = nearMissMapper.countByStatusAndDeletedFalse("APPROVAL_REQUEST");

        return NearMissStatistics.builder()
                .pending(pending)
                .inProgress(inProgress)
                .completed(completed)
                .rejected(rejected)
                .approvalRequest(approvalRequest)
                .total(nearMissMapper.countByDeletedFalse())
                .build();
    }

    private RiskAssessmentStatistics getRiskAssessmentStatistics() {
        long draft = riskAssessmentMapper.countByStatusAndDeletedFalse("DRAFT");
        long submitted = riskAssessmentMapper.countByStatusAndDeletedFalse("SUBMITTED");
        long approved = riskAssessmentMapper.countByStatusAndDeletedFalse("APPROVED");
        long rejected = riskAssessmentMapper.countByStatusAndDeletedFalse("REJECTED");
        long approvalRequest = riskAssessmentMapper.countByStatusAndDeletedFalse("APPROVAL_REQUEST");

        return RiskAssessmentStatistics.builder()
                .draft(draft)
                .submitted(submitted)
                .approved(approved)
                .rejected(rejected)
                .approvalRequest(approvalRequest)
                .total(riskAssessmentMapper.countByDeletedFalse())
                .build();
    }

    @Transactional(readOnly = true)
    public List<EhsPlanResponse> getMonthlyPlans(int year, int month) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        return ehsPlanService.findOverlappingPlans(startDate, endDate);
    }

    @Transactional(readOnly = true)
    public List<EhsAlertResponse> getRecentAlerts(int limit) {
        return ehsAlertMapper.findAllWithPaging(0, limit).stream()
                .map(EhsAlertResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EhsMessageResponse> getRecentMessages(int limit) {
        return ehsMessageMapper.findAllWithPaging(0, limit).stream()
                .map(EhsMessageResponse::from)
                .collect(Collectors.toList());
    }
}
