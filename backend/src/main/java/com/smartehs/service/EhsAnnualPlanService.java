package com.smartehs.service;

import com.smartehs.dto.request.EhsAnnualPlanRequest;
import com.smartehs.dto.response.EhsAnnualPlanResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.EhsAnnualPlanGoalMapper;
import com.smartehs.mapper.EhsAnnualPlanMapper;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.EhsAnnualPlan;
import com.smartehs.model.EhsAnnualPlanGoal;
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
public class EhsAnnualPlanService {

    private final EhsAnnualPlanMapper ehsAnnualPlanMapper;
    private final EhsAnnualPlanGoalMapper ehsAnnualPlanGoalMapper;
    private final IdmMapper idmMapper;

    private static final Set<String> ADMIN_ROLES = Set.of("SYSTEM_ADMIN", "EHS_ADMIN", "AUDIT_ADMIN");

    @Transactional(readOnly = true)
    public Page<EhsAnnualPlanResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EhsAnnualPlanResponse> content = ehsAnnualPlanMapper.findAllWithPaging(offset, limit).stream()
                .map(EhsAnnualPlanResponse::from)
                .collect(Collectors.toList());
        int total = ehsAnnualPlanMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<EhsAnnualPlanResponse> findByYear(int planYear, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EhsAnnualPlanResponse> content = ehsAnnualPlanMapper.findByYear(planYear, offset, limit).stream()
                .map(EhsAnnualPlanResponse::from)
                .collect(Collectors.toList());
        int total = ehsAnnualPlanMapper.countByYear(planYear);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public EhsAnnualPlanResponse findById(Long id) {
        EhsAnnualPlan plan = ehsAnnualPlanMapper.findById(id);
        if (plan == null) {
            throw new ResourceNotFoundException("EhsAnnualPlan", "id", id);
        }
        plan.setGoals(ehsAnnualPlanGoalMapper.findByPlanId(id));
        return EhsAnnualPlanResponse.from(plan);
    }

    @Transactional
    public EhsAnnualPlanResponse create(EhsAnnualPlanRequest request) {
        EhsAnnualPlan plan = EhsAnnualPlan.builder()
                .planYear(request.getPlanYear())
                .planName(request.getPlanName())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : "DRAFT")
                .priority(request.getPriority())
                .remarks(request.getRemarks())
                .writerUserId(request.getWriterUserId())
                .writerTeam(request.getWriterTeam())
                .writerPosition(request.getWriterPosition())
                .writerName(request.getWriterName())
                .modifiedByUserId(request.getWriterUserId())
                .modifiedByName(request.getWriterName())
                .modifiedByTeam(request.getWriterTeam())
                .modifiedByPosition(request.getWriterPosition())
                .planApproverUserId(request.getPlanApproverUserId())
                .planApproverTeam(request.getPlanApproverTeam())
                .planApproverPosition(request.getPlanApproverPosition())
                .planApproverName(request.getPlanApproverName())
                .completionApproverUserId(request.getCompletionApproverUserId())
                .completionApproverTeam(request.getCompletionApproverTeam())
                .completionApproverPosition(request.getCompletionApproverPosition())
                .completionApproverName(request.getCompletionApproverName())
                .build();

        ehsAnnualPlanMapper.insert(plan);
        saveGoals(plan.getId(), request.getGoals());
        log.info("Created EHS annual plan: {}", plan.getId());
        return findById(plan.getId());
    }

    @Transactional
    public EhsAnnualPlanResponse update(Long id, EhsAnnualPlanRequest request) {
        EhsAnnualPlan plan = ehsAnnualPlanMapper.findById(id);
        if (plan == null) {
            throw new ResourceNotFoundException("EhsAnnualPlan", "id", id);
        }

        plan.setPlanYear(request.getPlanYear());
        plan.setPlanName(request.getPlanName());
        plan.setDescription(request.getDescription());
        plan.setStatus(request.getStatus());
        plan.setPriority(request.getPriority());
        plan.setRemarks(request.getRemarks());
        plan.setWriterUserId(request.getWriterUserId());
        plan.setWriterTeam(request.getWriterTeam());
        plan.setWriterPosition(request.getWriterPosition());
        plan.setWriterName(request.getWriterName());
        plan.setModifiedByUserId(request.getModifiedByUserId());
        plan.setModifiedByName(request.getModifiedByName());
        plan.setModifiedByTeam(request.getModifiedByTeam());
        plan.setModifiedByPosition(request.getModifiedByPosition());
        plan.setPlanApproverUserId(request.getPlanApproverUserId());
        plan.setPlanApproverTeam(request.getPlanApproverTeam());
        plan.setPlanApproverPosition(request.getPlanApproverPosition());
        plan.setPlanApproverName(request.getPlanApproverName());
        plan.setCompletionApproverUserId(request.getCompletionApproverUserId());
        plan.setCompletionApproverTeam(request.getCompletionApproverTeam());
        plan.setCompletionApproverPosition(request.getCompletionApproverPosition());
        plan.setCompletionApproverName(request.getCompletionApproverName());

        ehsAnnualPlanMapper.update(plan);
        saveGoals(id, request.getGoals());
        log.info("Updated EHS annual plan: {}", id);
        return findById(id);
    }

    private void saveGoals(Long planId, List<EhsAnnualPlanRequest.GoalRow> rows) {
        ehsAnnualPlanGoalMapper.deleteByPlanId(planId);
        if (rows == null || rows.isEmpty()) return;
        int order = 0;
        for (EhsAnnualPlanRequest.GoalRow r : rows) {
            EhsAnnualPlanGoal g = EhsAnnualPlanGoal.builder()
                    .planId(planId)
                    .goalText(r.getGoalText())
                    .subGoal(r.getSubGoal())
                    .task(r.getTask())
                    .kpi(r.getKpi())
                    .prevResult(r.getPrevResult())
                    .targetValue(r.getTargetValue())
                    .ownerUserId(r.getOwnerUserId())
                    .ownerTeam(r.getOwnerTeam())
                    .ownerName(r.getOwnerName())
                    .q1(Boolean.TRUE.equals(r.getQ1()))
                    .q2(Boolean.TRUE.equals(r.getQ2()))
                    .q3(Boolean.TRUE.equals(r.getQ3()))
                    .q4(Boolean.TRUE.equals(r.getQ4()))
                    .q1Status(Boolean.TRUE.equals(r.getQ1()) ? r.getQ1Status() : null)
                    .q2Status(Boolean.TRUE.equals(r.getQ2()) ? r.getQ2Status() : null)
                    .q3Status(Boolean.TRUE.equals(r.getQ3()) ? r.getQ3Status() : null)
                    .q4Status(Boolean.TRUE.equals(r.getQ4()) ? r.getQ4Status() : null)
                    .sortOrder(r.getSortOrder() != null ? r.getSortOrder() : order)
                    .build();
            ehsAnnualPlanGoalMapper.insert(g);
            order += 10;
        }
    }

    @Transactional
    public void delete(Long id) {
        delete(id, null);
    }

    /**
     * 권한 체크: 작성자(writerUserId 일치) 또는 admin 만 삭제 가능.
     * username 이 null/system 이면 권한 검증 생략 (백오피스/스케줄러 호출용).
     */
    @Transactional
    public void delete(Long id, String username) {
        EhsAnnualPlan plan = ehsAnnualPlanMapper.findById(id);
        if (plan == null) {
            throw new ResourceNotFoundException("EhsAnnualPlan", "id", id);
        }
        if (username != null && !username.isEmpty() && !"system".equals(username)) {
            IdmUser u;
            try { u = idmMapper.findByUid(username); } catch (Exception e) { u = null; }
            if (u == null) {
                throw new AccessDeniedException("삭제 권한이 없습니다.");
            }
            boolean isAdmin = u.getUserRole() != null && ADMIN_ROLES.contains(u.getUserRole());
            boolean isWriter = plan.getWriterUserId() != null && plan.getWriterUserId().equals(u.getUidNumber());
            if (!isAdmin && !isWriter) {
                throw new AccessDeniedException("작성자 또는 관리자만 삭제할 수 있습니다.");
            }
        }
        ehsAnnualPlanGoalMapper.deleteByPlanId(id);
        ehsAnnualPlanMapper.delete(id);
        log.info("Deleted EHS annual plan with id: {} by {}", id, username);
    }

    @Transactional(readOnly = true)
    public List<EhsAnnualPlanResponse> findApprovedByYear(int planYear) {
        return ehsAnnualPlanMapper.findApprovedByYear(planYear).stream()
                .map(p -> {
                    p.setGoals(ehsAnnualPlanGoalMapper.findByPlanId(p.getId()));
                    return EhsAnnualPlanResponse.from(p);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public EhsAnnualPlanResponse transition(Long id, String action, String username, String rejectReason) {
        EhsAnnualPlan plan = ehsAnnualPlanMapper.findById(id);
        if (plan == null) {
            throw new ResourceNotFoundException("EhsAnnualPlan", "id", id);
        }

        String nextStatus;
        boolean approved;
        String stage; // "PLAN" or "COMPLETION" or "" (no stamp)
        switch (action) {
            case "submit":
                nextStatus = "PENDING_APPROVAL"; approved = false; stage = "";
                break;
            case "approve":
                ensureCanApprove(plan, username, "PLAN");
                nextStatus = "APPROVED"; approved = true; stage = "PLAN";
                break;
            case "reject":
                if (rejectReason == null || rejectReason.trim().isEmpty()) {
                    throw new IllegalArgumentException("반려 사유는 필수 입력입니다.");
                }
                // 완료 결재 반려: COMPLETION_PENDING → APPROVED (작성 단계로 되돌림)
                if ("COMPLETION_PENDING".equals(plan.getStatus())) {
                    ensureCanApprove(plan, username, "COMPLETION");
                    nextStatus = "APPROVED"; approved = true; stage = "";
                } else {
                    // 계획 결재 반려: PENDING_APPROVAL → DRAFT
                    ensureCanApprove(plan, username, "PLAN");
                    nextStatus = "DRAFT"; approved = false; stage = "";
                }
                break;
            case "completionSubmit":
                // 완료 결재 상신 — APPROVED → COMPLETION_PENDING (작성자/admin 누구나)
                if (!"APPROVED".equals(plan.getStatus())) {
                    throw new IllegalArgumentException("완료 결재 상신은 APPROVED 상태에서만 가능합니다.");
                }
                nextStatus = "COMPLETION_PENDING"; approved = true; stage = "";
                break;
            case "complete":
                ensureCanApprove(plan, username, "COMPLETION");
                if (!"COMPLETION_PENDING".equals(plan.getStatus())) {
                    throw new IllegalArgumentException("완료 승인은 COMPLETION_PENDING 상태에서만 가능합니다.");
                }
                nextStatus = "DONE"; approved = true; stage = "COMPLETION";
                break;
            default:
                throw new IllegalArgumentException("Unknown transition action: " + action);
        }

        ehsAnnualPlanMapper.transition(id, nextStatus, approved, username, stage, rejectReason);
        return findById(id);
    }

    /** Backward-compat overload */
    @Transactional
    public EhsAnnualPlanResponse transition(Long id, String action, String username) {
        return transition(id, action, username, null);
    }

    /**
     * 결재 권한 체크: 지정된 승인자(이름 일치) 또는 admin 권한자만 가능.
     * stage="PLAN" → planApproverName, "COMPLETION" → completionApproverName
     */
    private void ensureCanApprove(EhsAnnualPlan plan, String username, String stage) {
        if (username == null || username.isEmpty() || "system".equals(username)) {
            return; // system call (no auth context) — allow
        }
        IdmUser u;
        try { u = idmMapper.findByUid(username); } catch (Exception e) { u = null; }
        if (u == null) {
            throw new AccessDeniedException("승인 권한이 없습니다.");
        }
        // admin role bypass
        if (u.getUserRole() != null && ADMIN_ROLES.contains(u.getUserRole())) return;

        String required = "PLAN".equals(stage) ? plan.getPlanApproverName() : plan.getCompletionApproverName();
        Long requiredId = "PLAN".equals(stage) ? plan.getPlanApproverUserId() : plan.getCompletionApproverUserId();
        if (requiredId != null && requiredId.equals(u.getUidNumber())) return;
        if (required != null && required.equalsIgnoreCase(u.getUserName())) return;
        throw new AccessDeniedException(
            "PLAN".equals(stage) ? "지정된 계획 승인자만 승인/반려할 수 있습니다." : "지정된 완료 승인자만 작업 완료 처리할 수 있습니다.");
    }
}
