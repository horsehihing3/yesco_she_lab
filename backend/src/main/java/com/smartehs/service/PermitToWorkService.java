package com.smartehs.service;

import com.smartehs.dto.request.PermitToWorkRequest;
import com.smartehs.dto.response.PermitToWorkResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ApprovalMapper;
import com.smartehs.mapper.PermitToWorkMapper;
import com.smartehs.model.Approval;
import com.smartehs.model.PermitToWork;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PermitToWorkService {

    private final PermitToWorkMapper mapper;
    private final ApprovalMapper approvalMapper;
    private final ChecklistSnapshotService checklistSnapshotService;

    @Transactional(readOnly = true)
    public Page<PermitToWorkResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<PermitToWorkResponse> content = mapper.findByDeletedFalse(offset, limit).stream()
                .map(PermitToWorkResponse::from).collect(Collectors.toList());
        int total = mapper.countByDeletedFalse();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public PermitToWorkResponse findById(Long id) {
        PermitToWork permit = mapper.findByIdAndDeletedFalse(id);
        if (permit == null) throw new ResourceNotFoundException("PermitToWork", "id", id);
        return PermitToWorkResponse.from(permit);
    }

    @Transactional(readOnly = true)
    public Page<PermitToWorkResponse> findByStatus(String status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<PermitToWorkResponse> content = mapper.findByStatusAndDeletedFalse(status, offset, limit).stream()
                .map(PermitToWorkResponse::from).collect(Collectors.toList());
        int total = mapper.countByStatusAndDeletedFalse(status);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<PermitToWorkResponse> findByType(String permitType, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<PermitToWorkResponse> content = mapper.findByPermitTypeAndDeletedFalse(permitType, offset, limit).stream()
                .map(PermitToWorkResponse::from).collect(Collectors.toList());
        int total = mapper.countByPermitTypeAndDeletedFalse(permitType);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<PermitToWorkResponse> searchByTitle(String title, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<PermitToWorkResponse> content = mapper.searchByTitleAndDeletedFalse(title, offset, limit).stream()
                .map(PermitToWorkResponse::from).collect(Collectors.toList());
        int total = mapper.countBySearchTitleAndDeletedFalse(title);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<PermitToWorkResponse> findByRequesterId(String requesterId, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<PermitToWorkResponse> content = mapper.findByRequesterIdAndDeletedFalse(requesterId, offset, limit).stream()
                .map(PermitToWorkResponse::from).collect(Collectors.toList());
        int total = mapper.countByRequesterIdAndDeletedFalse(requesterId);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional
    public PermitToWorkResponse create(PermitToWorkRequest request) {
        String newId = generatePermitId();
        PermitToWork permit = PermitToWork.builder()
                .permitId(newId)
                .permitType(request.getPermitType())
                .riskLevel(request.getRiskLevel())
                .status(request.getStatus() != null ? request.getStatus() : "DRAFT")
                .title(request.getTitle())
                .description(request.getDescription())
                .workLocation(request.getWorkLocation())
                .workStartDate(request.getWorkStartDate())
                .workEndDate(request.getWorkEndDate())
                .requesterName(request.getRequesterName())
                .requesterDept(request.getRequesterDept())
                .requesterId(request.getRequesterId())
                .approverName(request.getApproverName())
                .approverDept(request.getApproverDept())
                .approverId(request.getApproverId())
                .safetyMeasures(request.getSafetyMeasures())
                .requiredPpe(request.getRequiredPpe())
                .hazardFactors(request.getHazardFactors())
                .emergencyContact(request.getEmergencyContact())
                .workersCount(request.getWorkersCount() != null ? request.getWorkersCount() : 0)
                .notes(request.getNotes())
                .checklistTemplateId(request.getChecklistTemplateId())
                .planApproverUserId(request.getPlanApproverUserId())
                .planApproverTeam(request.getPlanApproverTeam())
                .planApproverPosition(request.getPlanApproverPosition())
                .planApproverName(request.getPlanApproverName())
                .completionApproverUserId(request.getCompletionApproverUserId())
                .completionApproverTeam(request.getCompletionApproverTeam())
                .completionApproverPosition(request.getCompletionApproverPosition())
                .completionApproverName(request.getCompletionApproverName())
                .createdByUserId(request.getCreatedByUserId())
                .createdByName(request.getCreatedByName())
                .createdByTeam(request.getCreatedByTeam())
                .createdByPosition(request.getCreatedByPosition())
                .deleted(false)
                .build();
        mapper.insert(permit);
        Long snapshotId = checklistSnapshotService.snapshotIfNeeded(
                permit.getChecklistTemplateId(), ChecklistSnapshotService.OWNER_PERMIT, permit.getId());
        if (snapshotId != null && !snapshotId.equals(permit.getChecklistTemplateId())) {
            permit.setChecklistTemplateId(snapshotId);
            mapper.update(permit);
        }
        log.info("Created permit to work: {}", newId);

        // 승인 테이블에 자동 등록
        Approval approval = Approval.builder()
                .approvalId("APR-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy")) + "-" + String.format("%03d", approvalMapper.countAll() + 1))
                .type("PERMIT_TO_WORK")
                .title("[작업허가] " + request.getTitle())
                .content(newId + " | " + (request.getDescription() != null ? request.getDescription() : ""))
                .applicantName(request.getRequesterName() != null ? request.getRequesterName() : "")
                .applicantDept(request.getRequesterDept() != null ? request.getRequesterDept() : "")
                .applicantEmail("")
                .requestDate(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")))
                .status("PENDING")
                .build();
        approvalMapper.insert(approval);
        log.info("Created approval for permit: {} -> {}", newId, approval.getApprovalId());

        return findById(permit.getId());
    }

    @Transactional
    public PermitToWorkResponse update(Long id, PermitToWorkRequest request) {
        PermitToWork permit = mapper.findByIdAndDeletedFalse(id);
        if (permit == null) throw new ResourceNotFoundException("PermitToWork", "id", id);

        permit.setPermitType(request.getPermitType());
        permit.setRiskLevel(request.getRiskLevel());
        permit.setStatus(request.getStatus());
        permit.setTitle(request.getTitle());
        permit.setDescription(request.getDescription());
        permit.setWorkLocation(request.getWorkLocation());
        permit.setWorkStartDate(request.getWorkStartDate());
        permit.setWorkEndDate(request.getWorkEndDate());
        permit.setRequesterName(request.getRequesterName());
        permit.setRequesterDept(request.getRequesterDept());
        permit.setRequesterId(request.getRequesterId());
        permit.setApproverName(request.getApproverName());
        permit.setApproverDept(request.getApproverDept());
        permit.setApproverId(request.getApproverId());
        permit.setSafetyMeasures(request.getSafetyMeasures());
        permit.setRequiredPpe(request.getRequiredPpe());
        permit.setHazardFactors(request.getHazardFactors());
        permit.setEmergencyContact(request.getEmergencyContact());
        permit.setWorkersCount(request.getWorkersCount());
        permit.setRejectionReason(request.getRejectionReason());
        permit.setNotes(request.getNotes());
        permit.setPlanApproverUserId(request.getPlanApproverUserId());
        permit.setPlanApproverTeam(request.getPlanApproverTeam());
        permit.setPlanApproverPosition(request.getPlanApproverPosition());
        permit.setPlanApproverName(request.getPlanApproverName());
        permit.setCompletionApproverUserId(request.getCompletionApproverUserId());
        permit.setCompletionApproverTeam(request.getCompletionApproverTeam());
        permit.setCompletionApproverPosition(request.getCompletionApproverPosition());
        permit.setCompletionApproverName(request.getCompletionApproverName());
        Long snapshotId = checklistSnapshotService.snapshotIfNeeded(
                request.getChecklistTemplateId(), ChecklistSnapshotService.OWNER_PERMIT, id);
        permit.setChecklistTemplateId(snapshotId);
        mapper.update(permit);
        log.info("Updated permit to work: {}", permit.getPermitId());
        return findById(id);
    }

    @Transactional
    public PermitToWorkResponse updateStatus(Long id, String status) {
        PermitToWork permit = mapper.findByIdAndDeletedFalse(id);
        if (permit == null) throw new ResourceNotFoundException("PermitToWork", "id", id);
        mapper.updateStatus(id, status);
        log.info("Updated permit status: {} -> {}", permit.getPermitId(), status);
        return findById(id);
    }

    /**
     * 결재 흐름 전이 — 계획/완료 결재 분리 패턴.
     * action: submit, approve, reject, completionSubmit, complete
     */
    @Transactional
    public PermitToWorkResponse transition(Long id, String action, String rejectReason, String actor) {
        PermitToWork permit = mapper.findByIdAndDeletedFalse(id);
        if (permit == null) throw new ResourceNotFoundException("PermitToWork", "id", id);

        String current = permit.getStatus() == null ? "DRAFT" : permit.getStatus();
        String next;
        switch (action) {
            case "submit":
                if (!("DRAFT".equals(current) || "REJECTED".equals(current))) {
                    throw new IllegalArgumentException("계획 결재 상신은 DRAFT/REJECTED 상태에서만 가능합니다.");
                }
                next = "PENDING_APPROVAL";
                break;
            case "approve":
                // PENDING_APPROVAL / REQUESTED 모두 승인 가능 (legacy 데이터 호환)
                if (!"PENDING_APPROVAL".equals(current) && !"REQUESTED".equals(current)) {
                    throw new IllegalArgumentException("계획 결재 승인은 결재 진행 중 상태에서만 가능합니다.");
                }
                next = "APPROVED";
                break;
            case "reject":
                if (rejectReason == null || rejectReason.trim().isEmpty()) {
                    throw new IllegalArgumentException("반려 사유는 필수 입력입니다.");
                }
                if (!"PENDING_APPROVAL".equals(current) && !"REQUESTED".equals(current) && !"COMPLETION_PENDING".equals(current)) {
                    throw new IllegalArgumentException("반려는 결재 진행 중 상태에서만 가능합니다.");
                }
                next = "REJECTED";
                break;
            case "completionSubmit":
                if (!"APPROVED".equals(current)) {
                    throw new IllegalArgumentException("완료 결재 상신은 APPROVED 상태에서만 가능합니다.");
                }
                next = "COMPLETION_PENDING";
                break;
            case "complete":
                if (!"COMPLETION_PENDING".equals(current)) {
                    throw new IllegalArgumentException("완료 결재 승인은 COMPLETION_PENDING 상태에서만 가능합니다.");
                }
                next = "DONE";
                break;
            default:
                throw new IllegalArgumentException("알 수 없는 액션: " + action);
        }

        mapper.transitionStatus(id, next, action, actor, rejectReason);
        log.info("PTW transition: {} [{}] {} -> {} by {}", permit.getPermitId(), action, current, next, actor);
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        PermitToWork permit = mapper.findByIdAndDeletedFalse(id);
        if (permit == null) throw new ResourceNotFoundException("PermitToWork", "id", id);
        mapper.softDelete(id);
        checklistSnapshotService.deleteOwnerSnapshot(ChecklistSnapshotService.OWNER_PERMIT, id);
        log.info("Soft deleted permit to work: {}", id);
    }

    @Transactional(readOnly = true)
    public Page<PermitToWorkResponse> findByIsExternal(boolean isExternal, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<PermitToWork> content = mapper.findByIsExternal(isExternal, offset, limit);
        int total = mapper.countByIsExternal(isExternal);
        return new PageImpl<>(content.stream().map(PermitToWorkResponse::from).collect(Collectors.toList()), pageable, total);
    }

    private String generatePermitId() {
        String prefix = "PTW-" + LocalDate.now().getYear() + "-";
        int count = mapper.countByPermitIdStartingWith(prefix);
        return String.format("%s%03d", prefix, count + 1);
    }
}
