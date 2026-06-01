package com.smartehs.service;

import com.smartehs.dto.request.HealthCheckupPlanRequest;
import com.smartehs.dto.response.HealthCheckupPlanResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.HealthCheckupPlanMapper;
import com.smartehs.model.HealthCheckupPlan;
import com.smartehs.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class HealthCheckupPlanService {

    private final HealthCheckupPlanMapper mapper;

    @Transactional(readOnly = true)
    public Page<HealthCheckupPlanResponse> findAll(String checkupType, Integer planYear, String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<HealthCheckupPlanResponse> content = mapper.findAllWithPaging(checkupType, planYear, status, offset, limit).stream()
                .map(HealthCheckupPlanResponse::from)
                .collect(Collectors.toList());
        int total = mapper.countAll(checkupType, planYear, status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public HealthCheckupPlanResponse findById(Long id) {
        HealthCheckupPlan plan = mapper.findById(id);
        if (plan == null) {
            throw new ResourceNotFoundException("HealthCheckupPlan", "id", id);
        }
        return HealthCheckupPlanResponse.from(plan);
    }

    @Transactional
    public HealthCheckupPlanResponse create(HealthCheckupPlanRequest req, User currentUser) {
        String writer = req.getWriter();
        if (writer == null || writer.isBlank()) writer = currentUser != null ? currentUser.getName() : null;
        HealthCheckupPlan plan = HealthCheckupPlan.builder()
                .planYear(req.getPlanYear())
                .checkupType(req.getCheckupType())
                .planName(req.getPlanName())
                .targetDept(req.getTargetDept())
                .targetCount(req.getTargetCount() != null ? req.getTargetCount() : 0)
                .completedCount(0)
                .hazardFactors(req.getHazardFactors())
                .hospital(req.getHospital())
                .planStartDate(req.getPlanStartDate())
                .planEndDate(req.getPlanEndDate())
                .status(req.getStatus() != null ? req.getStatus() : "PLANNED")
                .notes(req.getNotes())
                .createdBy(currentUser != null ? currentUser.getUsername() : null)
                .createdByName(currentUser != null ? currentUser.getName() : null)
                .createdByDept(currentUser != null ? currentUser.getDepartment() : null)
                .planApproverUserId(req.getPlanApproverUserId())
                .planApproverTeam(req.getPlanApproverTeam())
                .planApproverPosition(req.getPlanApproverPosition())
                .planApproverName(req.getPlanApproverName())
                .completionApproverUserId(req.getCompletionApproverUserId())
                .completionApproverTeam(req.getCompletionApproverTeam())
                .completionApproverPosition(req.getCompletionApproverPosition())
                .completionApproverName(req.getCompletionApproverName())
                .writer(writer)
                .build();

        mapper.insert(plan);
        log.info("Created HealthCheckupPlan id={} type={}", plan.getId(), plan.getCheckupType());
        return HealthCheckupPlanResponse.from(plan);
    }

    @Transactional
    public HealthCheckupPlanResponse update(Long id, HealthCheckupPlanRequest req) {
        HealthCheckupPlan plan = mapper.findById(id);
        if (plan == null) {
            throw new ResourceNotFoundException("HealthCheckupPlan", "id", id);
        }

        plan.setPlanYear(req.getPlanYear());
        plan.setCheckupType(req.getCheckupType());
        plan.setPlanName(req.getPlanName());
        plan.setTargetDept(req.getTargetDept());
        plan.setTargetCount(req.getTargetCount() != null ? req.getTargetCount() : 0);
        plan.setHazardFactors(req.getHazardFactors());
        plan.setHospital(req.getHospital());
        plan.setPlanStartDate(req.getPlanStartDate());
        plan.setPlanEndDate(req.getPlanEndDate());
        plan.setStatus(req.getStatus());
        plan.setNotes(req.getNotes());
        plan.setPlanApproverUserId(req.getPlanApproverUserId());
        plan.setPlanApproverTeam(req.getPlanApproverTeam());
        plan.setPlanApproverPosition(req.getPlanApproverPosition());
        plan.setPlanApproverName(req.getPlanApproverName());
        plan.setCompletionApproverUserId(req.getCompletionApproverUserId());
        plan.setCompletionApproverTeam(req.getCompletionApproverTeam());
        plan.setCompletionApproverPosition(req.getCompletionApproverPosition());
        plan.setCompletionApproverName(req.getCompletionApproverName());
        plan.setWriter(req.getWriter());

        mapper.update(plan);
        log.info("Updated HealthCheckupPlan id={}", id);
        return HealthCheckupPlanResponse.from(plan);
    }

    /**
     * 결재 전이.
     *   submit  (PLANNED|REJECTED → PENDING_APPROVAL)
     *   approve (PENDING_APPROVAL → IN_PROGRESS)
     *   reject  (PENDING_APPROVAL → REJECTED)
     *   complete (IN_PROGRESS → COMPLETED)
     */
    @Transactional
    public HealthCheckupPlanResponse transition(Long id, String action, String username, String rejectReason) {
        HealthCheckupPlan existing = mapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("HealthCheckupPlan", "id", id);

        String nextStatus;
        boolean approved;
        String stage;
        switch (action) {
            case "submit":
                nextStatus = "PENDING_APPROVAL"; approved = false; stage = "";
                break;
            case "approve":
                nextStatus = "IN_PROGRESS"; approved = true; stage = "PLAN";
                break;
            case "reject":
                if (rejectReason == null || rejectReason.trim().isEmpty()) {
                    throw new IllegalArgumentException("반려 사유는 필수 입력입니다.");
                }
                nextStatus = "REJECTED"; approved = false; stage = "";
                break;
            case "complete":
                nextStatus = "COMPLETED"; approved = true; stage = "COMPLETION";
                break;
            default:
                throw new IllegalArgumentException("Unknown action: " + action);
        }
        mapper.transition(id, nextStatus, approved, username, stage, rejectReason);
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        HealthCheckupPlan plan = mapper.findById(id);
        if (plan == null) {
            throw new ResourceNotFoundException("HealthCheckupPlan", "id", id);
        }
        mapper.delete(id);
        log.info("Deleted HealthCheckupPlan id={}", id);
    }
}
