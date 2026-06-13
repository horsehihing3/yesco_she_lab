package com.smartehs.service;

import com.smartehs.dto.request.HealthCheckupPlanRequest;
import com.smartehs.dto.response.HealthCheckupPlanResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.HealthCheckupPlanMapper;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.HealthCheckupPlan;
import com.smartehs.model.PersonRef;
import com.smartehs.model.IdmUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class HealthCheckupPlanService {

    private final HealthCheckupPlanMapper mapper;
    private final IdmMapper idmMapper;

    private static final Set<String> ADMIN_ROLES = Set.of("SYSTEM_ADMIN");

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
    public HealthCheckupPlanResponse create(HealthCheckupPlanRequest req, IdmUser currentUser) {
        String writer = req.getWriter();
        if (writer == null || writer.isBlank()) writer = currentUser != null ? currentUser.getUserName() : null;
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
                .createdBy(currentUser != null ? currentUser.getUid() : null)
                .createdByName(currentUser != null ? currentUser.getUserName() : null)
                .createdByDept(currentUser != null ? (currentUser.getGroupName() != null ? currentUser.getGroupName() : currentUser.getDeptCode()) : null)
                .createdByTeam(currentUser != null ? currentUser.getGroupName() : null)
                .createdByPosition(currentUser != null ? currentUser.getTitleName() : null)
                .planApprover(PersonRef.of(req.getPlanApproverUserId(), req.getPlanApproverName(), req.getPlanApproverTeam(), req.getPlanApproverPosition()))
                .completionApprover(PersonRef.of(req.getCompletionApproverUserId(), req.getCompletionApproverName(), req.getCompletionApproverTeam(), req.getCompletionApproverPosition()))
                .writer(writer)
                .build();

        mapper.insert(plan);
        log.info("Created HealthCheckupPlan id={} type={}", plan.getId(), plan.getCheckupType());
        return HealthCheckupPlanResponse.from(plan);
    }

    @Transactional
    public HealthCheckupPlanResponse update(Long id, HealthCheckupPlanRequest req, IdmUser currentUser) {
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
        // status는 게이팅된 transition()으로만 변경 — 전체수정(PUT)에서는 기존 상태 보존(무검증 승인 우회 방지)
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
        if (currentUser != null) {
            plan.setModifiedByUserId(currentUser.getUidNumber());
            plan.setModifiedByName(currentUser.getUserName());
            plan.setModifiedByTeam(currentUser.getGroupName());
            plan.setModifiedByPosition(currentUser.getTitleName());
        }

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
        ensureCanApprove(existing, action, username);

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

    /** 승인 결정(approve/reject/complete)은 지정 승인자 또는 Admin만. submit 등 작성자 행위는 게이팅 안 함. */
    private void ensureCanApprove(HealthCheckupPlan plan, String action, String username) {
        if (!"approve".equals(action) && !"reject".equals(action) && !"complete".equals(action)) return;
        if (username == null || username.isEmpty() || "system".equals(username)) return;
        IdmUser u;
        try { u = idmMapper.findByUid(username); } catch (Exception e) { u = null; }
        if (u == null) throw new AccessDeniedException("승인 권한이 없습니다.");
        if (u.getUserRole() != null && ADMIN_ROLES.contains(u.getUserRole())) return;
        boolean planOk = matchesApprover(plan.getPlanApproverUserId(), plan.getPlanApproverName(), u);
        boolean compOk = matchesApprover(plan.getCompletionApproverUserId(), plan.getCompletionApproverName(), u);
        boolean ok = "approve".equals(action) ? planOk : "complete".equals(action) ? compOk : (planOk || compOk);
        if (!ok) throw new AccessDeniedException("지정된 승인자만 승인/반려할 수 있습니다.");
    }

    private static boolean matchesApprover(Long approverId, String approverName, IdmUser u) {
        if (approverId != null && approverId.equals(u.getUidNumber())) return true;
        if (approverName != null && u.getUserName() != null && approverName.equalsIgnoreCase(u.getUserName())) return true;
        return false;
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
