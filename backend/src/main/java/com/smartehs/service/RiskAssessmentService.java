package com.smartehs.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartehs.dto.request.RiskActivityProcessRequest;
import com.smartehs.dto.request.RiskAssessmentDetailRequest;
import com.smartehs.dto.request.RiskAssessmentRequest;
import com.smartehs.dto.request.RiskRegisterRequest;
import com.smartehs.dto.response.RiskActivityProcessResponse;
import com.smartehs.dto.response.RiskAssessmentDetailResponse;
import com.smartehs.dto.response.RiskAssessmentResponse;
import com.smartehs.dto.response.RiskRegisterResponse;
import com.smartehs.mapper.RiskActivityProcessMapper;
import com.smartehs.mapper.RiskAssessmentDetailMapper;
import com.smartehs.mapper.RiskAssessmentFormMapper;
import com.smartehs.mapper.RiskAssessmentMapper;
import com.smartehs.mapper.RiskRegisterMapper;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.model.RiskActivityProcess;
import com.smartehs.model.PersonRef;
import com.smartehs.model.IdmUser;
import com.smartehs.model.RiskAssessment;
import com.smartehs.model.RiskAssessmentDetail;
import com.smartehs.model.RiskAssessmentForm;
import com.smartehs.model.RiskAssessmentLog;
import com.smartehs.model.RiskRegister;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RiskAssessmentService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private static final Set<String> ADMIN_ROLES = Set.of("SYSTEM_ADMIN");

    private final RiskAssessmentMapper riskAssessmentMapper;
    private final RiskActivityProcessMapper activityProcessMapper;
    private final RiskAssessmentDetailMapper assessmentDetailMapper;
    private final IdmMapper idmMapper;
    private final RiskAssessmentFormMapper formMapper;
    private final RiskRegisterMapper riskRegisterMapper;
    private final RiskAssessmentLogService logService;

    // 선택된 form 의 title 을 스냅샷으로 복사 (이후 양식 삭제/이름변경 영향 없음)
    private String resolveFormTitle(Long formId) {
        if (formId == null) return null;
        RiskAssessmentForm f = formMapper.findById(formId);
        return f != null ? f.getTitle() : null;
    }

    // ==================== Risk Assessment ====================

    public Page<RiskAssessmentResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();

        List<RiskAssessment> list = riskAssessmentMapper.findAll(offset, limit);
        int total = riskAssessmentMapper.countAll();

        List<RiskAssessmentResponse> content = list.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return new PageImpl<>(content, pageable, total);
    }

    public Page<RiskAssessmentResponse> findBySite(String site, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();

        List<RiskAssessment> list = riskAssessmentMapper.findBySite(site, offset, limit);
        int total = riskAssessmentMapper.countBySite(site);

        List<RiskAssessmentResponse> content = list.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return new PageImpl<>(content, pageable, total);
    }

    public Page<RiskAssessmentResponse> findByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();

        List<RiskAssessment> list = riskAssessmentMapper.findByStatus(status, offset, limit);
        int total = riskAssessmentMapper.countByStatus(status);

        List<RiskAssessmentResponse> content = list.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return new PageImpl<>(content, pageable, total);
    }

    public Page<RiskAssessmentResponse> findAllOfficeOnly(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<RiskAssessment> list = riskAssessmentMapper.findAllOfficeOnly(offset, limit);
        int total = riskAssessmentMapper.countAllOfficeOnly();
        List<RiskAssessmentResponse> content = list.stream().map(this::toResponse).collect(Collectors.toList());
        return new PageImpl<>(content, pageable, total);
    }

    public Page<RiskAssessmentResponse> findBySiteOfficeOnly(String site, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<RiskAssessment> list = riskAssessmentMapper.findBySiteOfficeOnly(site, offset, limit);
        int total = riskAssessmentMapper.countBySiteOfficeOnly(site);
        List<RiskAssessmentResponse> content = list.stream().map(this::toResponse).collect(Collectors.toList());
        return new PageImpl<>(content, pageable, total);
    }

    public Page<RiskAssessmentResponse> findByStatusOfficeOnly(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<RiskAssessment> list = riskAssessmentMapper.findByStatusOfficeOnly(status, offset, limit);
        int total = riskAssessmentMapper.countByStatusOfficeOnly(status);
        List<RiskAssessmentResponse> content = list.stream().map(this::toResponse).collect(Collectors.toList());
        return new PageImpl<>(content, pageable, total);
    }

    public RiskAssessmentResponse findById(Long id) {
        RiskAssessment assessment = riskAssessmentMapper.findById(id);
        if (assessment == null) {
            throw new ResourceNotFoundException("Risk Assessment not found with id: " + id);
        }
        return toResponseWithDetails(assessment);
    }

    public RiskAssessmentResponse findByRiskId(String riskId) {
        RiskAssessment assessment = riskAssessmentMapper.findByRiskId(riskId);
        if (assessment == null) {
            throw new ResourceNotFoundException("Risk Assessment not found with riskId: " + riskId);
        }
        return toResponseWithDetails(assessment);
    }

    @Transactional
    public RiskAssessmentResponse create(RiskAssessmentRequest request) {
        RiskAssessment assessment = RiskAssessment.builder()
                .riskId(UUID.randomUUID().toString())
                .formId(request.getFormId())
                .formTitle(resolveFormTitle(request.getFormId()))
                .title(request.getTitle())
                .site(request.getSite())
                .authorUserId(request.getAuthorUserId())
                .authorName(request.getAuthorName())
                .authorTeam(request.getAuthorTeam())
                .authorPosition(request.getAuthorPosition())
                .authorDept(request.getAuthorDept())
                .authorMail(request.getAuthorMail())
                .approverName(request.getApproverName())
                .approverMail(request.getApproverMail())
                .planApprover(PersonRef.of(request.getPlanApproverUserId(), request.getPlanApproverName(), request.getPlanApproverTeam(), request.getPlanApproverPosition()))
                .completionApprover(PersonRef.of(request.getCompletionApproverUserId(), request.getCompletionApproverName(), request.getCompletionApproverTeam(), request.getCompletionApproverPosition()))
                .status("draft")
                .riskRegisterCount(0)
                .officeCount(0)
                .fieldCount(0)
                .allowResubmit(true)
                .officeChecklistId(request.getOfficeChecklistId())
                .sanupChecklistId(request.getSanupChecklistId())
                .jungdaeChecklistId(request.getJungdaeChecklistId())
                .build();

        riskAssessmentMapper.insert(assessment);
        return toResponse(assessment);
    }

    @Transactional
    public RiskAssessmentResponse update(Long id, RiskAssessmentRequest request) {
        return update(id, request, null);
    }

    @Transactional
    public RiskAssessmentResponse update(Long id, RiskAssessmentRequest request, String changedBy) {
        RiskAssessment assessment = riskAssessmentMapper.findById(id);
        if (assessment == null) {
            throw new ResourceNotFoundException("Risk Assessment not found with id: " + id);
        }

        RiskAssessment before = cloneForDiff(assessment);

        // 양식이 바뀌면 이름도 새로 스냅샷; 동일하면 기존 제목 유지 (양식이 이후 삭제되어도 영향 없음)
        Long prevFormId = assessment.getFormId();
        Long newFormId = request.getFormId();
        assessment.setFormId(newFormId);
        if (newFormId != null && !newFormId.equals(prevFormId)) {
            assessment.setFormTitle(resolveFormTitle(newFormId));
        } else if (newFormId == null) {
            assessment.setFormTitle(null);
        }
        assessment.setTitle(request.getTitle());
        assessment.setSite(request.getSite());
        assessment.setAuthorName(request.getAuthorName());
        assessment.setAuthorDept(request.getAuthorDept());
        assessment.setAuthorMail(request.getAuthorMail());
        assessment.setApproverName(request.getApproverName());
        assessment.setApproverMail(request.getApproverMail());
        assessment.setPlanApproverUserId(request.getPlanApproverUserId());
        assessment.setPlanApproverTeam(request.getPlanApproverTeam());
        assessment.setPlanApproverPosition(request.getPlanApproverPosition());
        assessment.setPlanApproverName(request.getPlanApproverName());
        assessment.setCompletionApproverUserId(request.getCompletionApproverUserId());
        assessment.setCompletionApproverTeam(request.getCompletionApproverTeam());
        assessment.setCompletionApproverPosition(request.getCompletionApproverPosition());
        assessment.setCompletionApproverName(request.getCompletionApproverName());
        assessment.setOfficeChecklistId(request.getOfficeChecklistId());
        assessment.setSanupChecklistId(request.getSanupChecklistId());
        assessment.setJungdaeChecklistId(request.getJungdaeChecklistId());

        riskAssessmentMapper.update(assessment);

        List<Map<String, Object>> diffs = computeFieldChanges(before, assessment);
        if (!diffs.isEmpty()) {
            logService.logFieldUpdate(id, assessment.getRiskId(), changedBy,
                    buildDiffSummary(diffs), toJson(diffs));
        }
        return toResponse(assessment);
    }

    @Transactional
    public RiskAssessmentResponse updateStatus(Long id, String status, String rejectReason, Boolean allowResubmit) {
        return updateStatus(id, status, rejectReason, allowResubmit, null);
    }

    @Transactional
    public RiskAssessmentResponse updateStatus(Long id, String status, String rejectReason, Boolean allowResubmit, String changedBy) {
        RiskAssessment assessment = riskAssessmentMapper.findById(id);
        if (assessment == null) {
            throw new ResourceNotFoundException("Risk Assessment not found with id: " + id);
        }

        String oldStatus = assessment.getStatus();
        riskAssessmentMapper.updateStatus(id, status, rejectReason, allowResubmit);

        assessment.setStatus(status);
        assessment.setRejectReason(rejectReason);
        assessment.setAllowResubmit(allowResubmit);
        if ("completed".equals(status)) {
            assessment.setCompletedDate(LocalDateTime.now());
        }

        if (!Objects.equals(oldStatus, status)) {
            logService.logStatusChange(id, assessment.getRiskId(), changedBy, oldStatus, status, rejectReason);
        }

        return toResponse(assessment);
    }

    /**
     * 결재 흐름 전이.
     * action:
     *   submit          (draft|rejected → submitted)              계획 결재 상신
     *   approve         (submitted → approved)                    계획 승인 — plan stage stamp
     *   reject          (submitted → rejected)                    계획 반려
     *   completionSubmit(approved → completion_submitted)         완료 결재 상신
     *   complete        (completion_submitted → completed)        완료 승인 — completion stage stamp
     */
    @Transactional
    public RiskAssessmentResponse transition(Long id, String action, String rejectReason, String username) {
        RiskAssessment assessment = riskAssessmentMapper.findById(id);
        if (assessment == null) {
            throw new ResourceNotFoundException("Risk Assessment not found with id: " + id);
        }
        ensureCanApprove(assessment, action, username);

        // 반려 사유 필수 검증 (계획·완료 결재 반려 양쪽 모두)
        if ("reject".equals(action) && (rejectReason == null || rejectReason.trim().isEmpty())) {
            throw new IllegalArgumentException("반려 사유는 필수 입력입니다.");
        }

        String nextStatus;
        boolean approved;
        String stage;
        switch (action) {
            case "submit":           nextStatus = "submitted";              approved = false; stage = "";           break;
            case "approve":          nextStatus = "approved";               approved = true;  stage = "PLAN";        break;
            case "reject":           nextStatus = "rejected";               approved = false; stage = "";           break;
            case "completionSubmit": nextStatus = "completion_submitted";   approved = false; stage = "";           break;
            case "complete":         nextStatus = "completed";              approved = true;  stage = "COMPLETION";  break;
            default: throw new IllegalArgumentException("Unknown action: " + action);
        }

        String oldStatus = assessment.getStatus();
        riskAssessmentMapper.transition(id, nextStatus, approved, username, stage, rejectReason);

        assessment.setStatus(nextStatus);
        if ("completed".equals(nextStatus)) {
            assessment.setCompletedDate(LocalDateTime.now());
        }
        if ("rejected".equals(nextStatus)) {
            assessment.setRejectReason(rejectReason);
        }

        if (!Objects.equals(oldStatus, nextStatus)) {
            logService.logStatusChange(id, assessment.getRiskId(), username, oldStatus, nextStatus, rejectReason);
        }

        return toResponse(assessment);
    }

    /** 승인 결정(approve/reject/complete)은 지정 승인자 또는 Admin만. submit/completionSubmit 등 작성자 행위는 게이팅 안 함. */
    private void ensureCanApprove(RiskAssessment plan, String action, String username) {
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

    private RiskAssessment cloneForDiff(RiskAssessment src) {
        return RiskAssessment.builder()
                .title(src.getTitle())
                .site(src.getSite())
                .authorName(src.getAuthorName())
                .authorDept(src.getAuthorDept())
                .authorMail(src.getAuthorMail())
                .approverName(src.getApproverName())
                .approverMail(src.getApproverMail())
                .formId(src.getFormId())
                .formTitle(src.getFormTitle())
                .build();
    }

    private List<Map<String, Object>> computeFieldChanges(RiskAssessment before, RiskAssessment after) {
        List<Map<String, Object>> diffs = new ArrayList<>();
        addIfChanged(diffs, "title", before.getTitle(), after.getTitle());
        addIfChanged(diffs, "site", before.getSite(), after.getSite());
        addIfChanged(diffs, "authorName", before.getAuthorName(), after.getAuthorName());
        addIfChanged(diffs, "authorDept", before.getAuthorDept(), after.getAuthorDept());
        addIfChanged(diffs, "authorMail", before.getAuthorMail(), after.getAuthorMail());
        addIfChanged(diffs, "approverName", before.getApproverName(), after.getApproverName());
        addIfChanged(diffs, "approverMail", before.getApproverMail(), after.getApproverMail());
        addIfChanged(diffs, "formTitle", before.getFormTitle(), after.getFormTitle());
        return diffs;
    }

    private void addIfChanged(List<Map<String, Object>> diffs, String field, Object before, Object after) {
        Object normBefore = normalizeBlank(before);
        Object normAfter = normalizeBlank(after);
        if (Objects.equals(normBefore, normAfter)) return;
        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("field", field);
        entry.put("before", normBefore == null ? null : normBefore.toString());
        entry.put("after", normAfter == null ? null : normAfter.toString());
        diffs.add(entry);
    }

    private Object normalizeBlank(Object v) {
        if (v == null) return null;
        if (v instanceof String) {
            String s = ((String) v).trim();
            return s.isEmpty() ? null : s;
        }
        return v;
    }

    private String buildDiffSummary(List<Map<String, Object>> diffs) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < diffs.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(diffs.get(i).get("field"));
        }
        return sb.toString();
    }

    private String toJson(Object value) {
        try {
            return OBJECT_MAPPER.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize risk assessment diff", e);
            return null;
        }
    }

    @Transactional
    public void delete(Long id) {
        RiskAssessment assessment = riskAssessmentMapper.findById(id);
        if (assessment == null) {
            throw new ResourceNotFoundException("Risk Assessment not found with id: " + id);
        }

        String riskId = assessment.getRiskId();
        riskRegisterMapper.deleteByRiskId(riskId);
        assessmentDetailMapper.deleteByRiskId(riskId);
        activityProcessMapper.deleteByRiskId(riskId);
        riskAssessmentMapper.delete(id);
    }

    // ==================== Activity Process (Step 1) ====================

    public List<RiskActivityProcessResponse> findActivityProcessesByRiskId(String riskId) {
        return activityProcessMapper.findByRiskId(riskId)
                .stream()
                .map(this::toProcessResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public RiskActivityProcessResponse createActivityProcess(String riskId, RiskActivityProcessRequest request) {
        RiskActivityProcess process = RiskActivityProcess.builder()
                .riskId(riskId)
                .majorCategoryIdx(request.getMajorCategoryIdx())
                .majorCategory(request.getMajorCategory())
                .detailAction(request.getDetailAction())
                .evaluationDate(request.getEvaluationDate())
                .evaluator(request.getEvaluator())
                .isTarget(request.getIsTarget())
                .build();

        activityProcessMapper.insert(process);
        updateCategoryCounts(riskId);
        return toProcessResponse(process);
    }

    @Transactional
    public RiskActivityProcessResponse updateActivityProcess(Long id, RiskActivityProcessRequest request) {
        RiskActivityProcess process = activityProcessMapper.findById(id);
        if (process == null) {
            throw new ResourceNotFoundException("Activity Process not found with id: " + id);
        }

        process.setMajorCategoryIdx(request.getMajorCategoryIdx());
        process.setMajorCategory(request.getMajorCategory());
        process.setDetailAction(request.getDetailAction());
        process.setEvaluationDate(request.getEvaluationDate());
        process.setEvaluator(request.getEvaluator());
        process.setIsTarget(request.getIsTarget());

        activityProcessMapper.update(process);
        return toProcessResponse(process);
    }

    @Transactional
    public void deleteActivityProcess(Long id) {
        RiskActivityProcess process = activityProcessMapper.findById(id);
        if (process == null) {
            throw new ResourceNotFoundException("Activity Process not found with id: " + id);
        }
        String riskId = process.getRiskId();
        activityProcessMapper.delete(id);
        updateCategoryCounts(riskId);
    }

    private void updateCategoryCounts(String riskId) {
        int officeCount = activityProcessMapper.countByRiskIdAndMajorCategoryIdx(riskId, 1);
        int fieldCount = activityProcessMapper.countByRiskIdAndMajorCategoryIdx(riskId, 2);

        riskAssessmentMapper.updateCounts(riskId, officeCount, fieldCount);
    }

    // ==================== Assessment Detail (Step 2) ====================

    public List<RiskAssessmentDetailResponse> findAssessmentDetailsByRiskId(String riskId) {
        return assessmentDetailMapper.findByRiskId(riskId)
                .stream()
                .map(this::toDetailResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public RiskAssessmentDetailResponse createAssessmentDetail(String riskId, RiskAssessmentDetailRequest request) {
        int riskScore = request.getPossibilityGrade() * request.getResultGrade();
        String riskGrade = calculateGrade(riskScore);

        Integer improvedScore = null;
        String improvedGrade = null;
        if (request.getImprovedPossibilityGrade() != null && request.getImprovedResultGrade() != null) {
            improvedScore = request.getImprovedPossibilityGrade() * request.getImprovedResultGrade();
            improvedGrade = calculateGrade(improvedScore);
        }

        RiskAssessmentDetail detail = RiskAssessmentDetail.builder()
                .riskId(riskId)
                .activityProcessId(request.getActivityProcessId())
                .riskIdx(request.getRiskIdx())
                .majorCategory(request.getMajorCategory())
                .detailAction(request.getDetailAction())
                .risk4M(request.getRisk4M())
                .danger(request.getDanger())
                .expectedDisaster(request.getExpectedDisaster())
                .target(request.getTarget())
                .currentSafetyMeasures(request.getCurrentSafetyMeasures())
                .possibilityGrade(request.getPossibilityGrade())
                .resultGrade(request.getResultGrade())
                .riskScore(riskScore)
                .riskGrade(riskGrade)
                .isRegistered(request.getIsRegistered())
                .reductionMeasures(request.getReductionMeasures())
                .improvedPossibilityGrade(request.getImprovedPossibilityGrade())
                .improvedResultGrade(request.getImprovedResultGrade())
                .improvedRiskScore(improvedScore)
                .improvedRiskGrade(improvedGrade)
                .build();

        assessmentDetailMapper.insert(detail);
        return toDetailResponse(detail);
    }

    @Transactional
    public RiskAssessmentDetailResponse updateAssessmentDetail(Long id, RiskAssessmentDetailRequest request) {
        RiskAssessmentDetail detail = assessmentDetailMapper.findById(id);
        if (detail == null) {
            throw new ResourceNotFoundException("Assessment Detail not found with id: " + id);
        }

        int riskScore = request.getPossibilityGrade() * request.getResultGrade();
        String riskGrade = calculateGrade(riskScore);

        Integer improvedScore = null;
        String improvedGrade = null;
        if (request.getImprovedPossibilityGrade() != null && request.getImprovedResultGrade() != null) {
            improvedScore = request.getImprovedPossibilityGrade() * request.getImprovedResultGrade();
            improvedGrade = calculateGrade(improvedScore);
        }

        detail.setActivityProcessId(request.getActivityProcessId());
        detail.setRiskIdx(request.getRiskIdx());
        detail.setMajorCategory(request.getMajorCategory());
        detail.setDetailAction(request.getDetailAction());
        detail.setRisk4M(request.getRisk4M());
        detail.setDanger(request.getDanger());
        detail.setExpectedDisaster(request.getExpectedDisaster());
        detail.setTarget(request.getTarget());
        detail.setCurrentSafetyMeasures(request.getCurrentSafetyMeasures());
        detail.setPossibilityGrade(request.getPossibilityGrade());
        detail.setResultGrade(request.getResultGrade());
        detail.setRiskScore(riskScore);
        detail.setRiskGrade(riskGrade);
        detail.setIsRegistered(request.getIsRegistered());
        detail.setReductionMeasures(request.getReductionMeasures());
        detail.setImprovedPossibilityGrade(request.getImprovedPossibilityGrade());
        detail.setImprovedResultGrade(request.getImprovedResultGrade());
        detail.setImprovedRiskScore(improvedScore);
        detail.setImprovedRiskGrade(improvedGrade);

        assessmentDetailMapper.update(detail);
        return toDetailResponse(detail);
    }

    @Transactional
    public void deleteAssessmentDetail(Long id) {
        RiskAssessmentDetail detail = assessmentDetailMapper.findById(id);
        if (detail == null) {
            throw new ResourceNotFoundException("Assessment Detail not found with id: " + id);
        }
        assessmentDetailMapper.delete(id);
    }

    private String calculateGrade(int score) {
        if (score >= 15) return "매우높음(VH)";
        if (score >= 9) return "높음(H)";
        if (score >= 4) return "중간(M)";
        return "낮음(L)";
    }

    // ==================== Risk Register (Step 3) ====================

    public List<RiskRegisterResponse> findRiskRegistersByRiskId(String riskId) {
        return riskRegisterMapper.findByRiskId(riskId)
                .stream()
                .map(this::toRegisterResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public RiskRegisterResponse createRiskRegister(String riskId, RiskRegisterRequest request) {
        RiskRegister register = RiskRegister.builder()
                .riskId(riskId)
                .registerNum(request.getRegisterNum())
                .categoryNum(request.getCategoryNum())
                .detailAction(request.getDetailAction())
                .danger(request.getDanger())
                .expectedDisaster(request.getExpectedDisaster())
                .target(request.getTarget())
                .currSafetyMeasures(request.getCurrSafetyMeasures())
                .riskGrade(request.getRiskGrade())
                .managePlan(request.getManagePlan())
                .approval(request.getApproval())
                .approvalMail(request.getApprovalMail())
                .relatedInstructions(request.getRelatedInstructions())
                .build();

        riskRegisterMapper.insert(register);
        updateRiskRegisterCount(riskId);
        return toRegisterResponse(register);
    }

    @Transactional
    public RiskRegisterResponse updateRiskRegister(Long id, RiskRegisterRequest request) {
        RiskRegister register = riskRegisterMapper.findById(id);
        if (register == null) {
            throw new ResourceNotFoundException("Risk Register not found with id: " + id);
        }

        register.setRegisterNum(request.getRegisterNum());
        register.setCategoryNum(request.getCategoryNum());
        register.setDetailAction(request.getDetailAction());
        register.setDanger(request.getDanger());
        register.setExpectedDisaster(request.getExpectedDisaster());
        register.setTarget(request.getTarget());
        register.setCurrSafetyMeasures(request.getCurrSafetyMeasures());
        register.setRiskGrade(request.getRiskGrade());
        register.setManagePlan(request.getManagePlan());
        register.setApproval(request.getApproval());
        register.setApprovalMail(request.getApprovalMail());
        register.setRelatedInstructions(request.getRelatedInstructions());

        riskRegisterMapper.update(register);
        return toRegisterResponse(register);
    }

    @Transactional
    public void deleteRiskRegister(Long id) {
        RiskRegister register = riskRegisterMapper.findById(id);
        if (register == null) {
            throw new ResourceNotFoundException("Risk Register not found with id: " + id);
        }
        String riskId = register.getRiskId();
        riskRegisterMapper.delete(id);
        updateRiskRegisterCount(riskId);
    }

    private void updateRiskRegisterCount(String riskId) {
        int count = riskRegisterMapper.countByRiskId(riskId);
        riskAssessmentMapper.updateRiskRegisterCount(riskId, count);
    }

    // ==================== Batch Operations ====================

    @Transactional
    public void saveActivityProcessesBatch(String riskId, List<RiskActivityProcessRequest> requests) {
        saveActivityProcessesBatch(riskId, requests, null);
    }

    @Transactional
    public void saveActivityProcessesBatch(String riskId, List<RiskActivityProcessRequest> requests, String changedBy) {
        activityProcessMapper.deleteByRiskId(riskId);

        for (RiskActivityProcessRequest request : requests) {
            RiskActivityProcess process = RiskActivityProcess.builder()
                    .riskId(riskId)
                    .majorCategoryIdx(request.getMajorCategoryIdx())
                    .majorCategory(request.getMajorCategory())
                        .detailAction(request.getDetailAction())
                    .evaluationDate(request.getEvaluationDate())
                    .evaluator(request.getEvaluator())
                    .isTarget(request.getIsTarget())
                    .build();
            activityProcessMapper.insert(process);
        }

        updateCategoryCounts(riskId);

        RiskAssessment assessment = riskAssessmentMapper.findByRiskId(riskId);
        if (assessment != null) {
            logService.logActivityProcessSave(assessment.getId(), riskId, changedBy, requests == null ? 0 : requests.size());
        }
    }

    @Transactional
    public void saveAssessmentDetailsBatch(String riskId, List<RiskAssessmentDetailRequest> requests) {
        saveAssessmentDetailsBatch(riskId, requests, null);
    }

    @Transactional
    public void saveAssessmentDetailsBatch(String riskId, List<RiskAssessmentDetailRequest> requests, String changedBy) {
        assessmentDetailMapper.deleteByRiskId(riskId);

        for (RiskAssessmentDetailRequest request : requests) {
            Integer riskScore = null;
            String riskGrade = null;
            if (request.getPossibilityGrade() != null && request.getResultGrade() != null) {
                riskScore = request.getPossibilityGrade() * request.getResultGrade();
                riskGrade = calculateGrade(riskScore);
            }

            Integer improvedScore = null;
            String improvedGrade = null;
            if (request.getImprovedPossibilityGrade() != null && request.getImprovedResultGrade() != null) {
                improvedScore = request.getImprovedPossibilityGrade() * request.getImprovedResultGrade();
                improvedGrade = calculateGrade(improvedScore);
            }

            RiskAssessmentDetail detail = RiskAssessmentDetail.builder()
                    .riskId(riskId)
                    .activityProcessId(request.getActivityProcessId())
                    .riskIdx(request.getRiskIdx())
                    .majorCategory(request.getMajorCategory())
                    .detailAction(request.getDetailAction())
                    .risk4M(request.getRisk4M())
                    .danger(request.getDanger())
                    .expectedDisaster(request.getExpectedDisaster())
                    .target(request.getTarget())
                    .currentSafetyMeasures(request.getCurrentSafetyMeasures())
                    .possibilityGrade(request.getPossibilityGrade())
                    .resultGrade(request.getResultGrade())
                    .riskScore(riskScore)
                    .riskGrade(riskGrade)
                    .isRegistered(request.getIsRegistered())
                    .reductionMeasures(request.getReductionMeasures())
                    .improvedPossibilityGrade(request.getImprovedPossibilityGrade())
                    .improvedResultGrade(request.getImprovedResultGrade())
                    .improvedRiskScore(improvedScore)
                    .improvedRiskGrade(improvedGrade)
                    .build();
            assessmentDetailMapper.insert(detail);
        }

        RiskAssessment assessment = riskAssessmentMapper.findByRiskId(riskId);
        if (assessment != null) {
            logService.logChecklistSave(assessment.getId(), riskId, changedBy, requests == null ? 0 : requests.size());
        }
    }

    @Transactional
    public void generateRiskRegistersFromDetails(String riskId) {
        riskRegisterMapper.deleteByRiskId(riskId);

        List<RiskAssessmentDetail> registeredDetails = assessmentDetailMapper.findByRiskIdAndIsRegistered(riskId);

        int registerNum = 1;
        for (RiskAssessmentDetail detail : registeredDetails) {
            RiskRegister register = RiskRegister.builder()
                    .riskId(riskId)
                    .registerNum(registerNum++)
                    .detailAction(detail.getDetailAction())
                    .danger(detail.getDanger())
                    .expectedDisaster(detail.getExpectedDisaster())
                    .target(detail.getTarget())
                    .currSafetyMeasures(detail.getCurrentSafetyMeasures())
                    .riskGrade(detail.getRiskGrade())
                    .managePlan(detail.getReductionMeasures())
                    .build();
            riskRegisterMapper.insert(register);
        }

        updateRiskRegisterCount(riskId);
    }

    // ==================== Response Mappers ====================

    private RiskAssessmentResponse toResponse(RiskAssessment entity) {
        return RiskAssessmentResponse.fromLocalized(entity);
    }

    private RiskAssessmentResponse toResponseWithDetails(RiskAssessment entity) {
        // formId 가 있는데 formTitle 이 비어있다면 양식에서 즉시 백필 (과거 저장 누락 케이스 보정)
        if (entity.getFormId() != null
                && (entity.getFormTitle() == null || entity.getFormTitle().trim().isEmpty())) {
            String resolved = resolveFormTitle(entity.getFormId());
            if (resolved != null) entity.setFormTitle(resolved);
        }
        RiskAssessmentResponse response = RiskAssessmentResponse.fromLocalized(entity);

        List<RiskActivityProcessResponse> processes = activityProcessMapper.findByRiskId(entity.getRiskId())
                .stream()
                .map(this::toProcessResponse)
                .collect(Collectors.toList());

        List<RiskAssessmentDetailResponse> details = assessmentDetailMapper.findByRiskId(entity.getRiskId())
                .stream()
                .map(this::toDetailResponse)
                .collect(Collectors.toList());

        List<RiskRegisterResponse> registers = riskRegisterMapper.findByRiskId(entity.getRiskId())
                .stream()
                .map(this::toRegisterResponse)
                .collect(Collectors.toList());

        response.setActivityProcesses(processes);
        response.setAssessmentDetails(details);
        response.setRiskRegisters(registers);

        return response;
    }

    private RiskActivityProcessResponse toProcessResponse(RiskActivityProcess entity) {
        return RiskActivityProcessResponse.builder()
                .id(entity.getId())
                .riskId(entity.getRiskId())
                .majorCategoryIdx(entity.getMajorCategoryIdx())
                .majorCategory(entity.getMajorCategory())
                .detailAction(entity.getDetailAction())
                .evaluationDate(entity.getEvaluationDate())
                .evaluator(entity.getEvaluator())
                .isTarget(entity.getIsTarget())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private RiskAssessmentDetailResponse toDetailResponse(RiskAssessmentDetail entity) {
        return RiskAssessmentDetailResponse.builder()
                .id(entity.getId())
                .riskId(entity.getRiskId())
                .activityProcessId(entity.getActivityProcessId())
                .riskIdx(entity.getRiskIdx())
                .majorCategory(entity.getMajorCategory())
                .detailAction(entity.getDetailAction())
                .risk4M(entity.getRisk4M())
                .danger(entity.getDanger())
                .expectedDisaster(entity.getExpectedDisaster())
                .target(entity.getTarget())
                .currentSafetyMeasures(entity.getCurrentSafetyMeasures())
                .possibilityGrade(entity.getPossibilityGrade())
                .resultGrade(entity.getResultGrade())
                .riskScore(entity.getRiskScore())
                .riskGrade(entity.getRiskGrade())
                .isRegistered(entity.getIsRegistered())
                .reductionMeasures(entity.getReductionMeasures())
                .improvedPossibilityGrade(entity.getImprovedPossibilityGrade())
                .improvedResultGrade(entity.getImprovedResultGrade())
                .improvedRiskScore(entity.getImprovedRiskScore())
                .improvedRiskGrade(entity.getImprovedRiskGrade())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private RiskRegisterResponse toRegisterResponse(RiskRegister entity) {
        return RiskRegisterResponse.builder()
                .id(entity.getId())
                .riskId(entity.getRiskId())
                .registerNum(entity.getRegisterNum())
                .categoryNum(entity.getCategoryNum())
                .detailAction(entity.getDetailAction())
                .danger(entity.getDanger())
                .expectedDisaster(entity.getExpectedDisaster())
                .target(entity.getTarget())
                .currSafetyMeasures(entity.getCurrSafetyMeasures())
                .riskGrade(entity.getRiskGrade())
                .managePlan(entity.getManagePlan())
                .approval(entity.getApproval())
                .approvalMail(entity.getApprovalMail())
                .relatedInstructions(entity.getRelatedInstructions())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
