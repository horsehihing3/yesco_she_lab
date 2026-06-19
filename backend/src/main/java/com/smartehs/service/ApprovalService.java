package com.smartehs.service;

import com.smartehs.dto.request.ApprovalRequest;
import com.smartehs.dto.response.ApprovalResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.ApprovalMapper;
import com.smartehs.mapper.PermitToWorkMapper;
// PpeRequest 연동은 보호구·장비 재구성 후 신규 도메인(tb_ppe_issue)으로 다시 연결 예정
import com.smartehs.mapper.SafetyEducationMapper;
import com.smartehs.mapper.ChemicalMapper;
import com.smartehs.model.Approval;
// import com.smartehs.model.PpeRequest;  // 보호구·장비 재구성 후 신규 도메인으로 재연결 예정
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final ApprovalMapper approvalMapper;
    // private final PpeRequestMapper ppeRequestMapper;  // 보호구·장비 재구성 후 신규 도메인으로 재연결 예정
    private final PermitToWorkMapper permitToWorkMapper;
    private final SafetyEducationMapper safetyEducationMapper;
    private final ChemicalMapper chemicalMapper;

    @Transactional(readOnly = true)
    public Page<ApprovalResponse> findAll(String status, String keyword, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();

        List<Approval> approvals;
        int total;

        boolean hasStatus = status != null && !status.isEmpty();
        boolean hasKeyword = keyword != null && !keyword.isEmpty();

        if (hasStatus && hasKeyword) {
            approvals = approvalMapper.findByStatusAndSearch(status, keyword, offset, limit);
            total = approvalMapper.countByStatusAndSearch(status, keyword);
        } else if (hasStatus) {
            approvals = approvalMapper.findByStatus(status, offset, limit);
            total = approvalMapper.countByStatus(status);
        } else if (hasKeyword) {
            approvals = approvalMapper.search(keyword, offset, limit);
            total = approvalMapper.countBySearch(keyword);
        } else {
            approvals = approvalMapper.findAllWithPaging(offset, limit);
            total = approvalMapper.countAll();
        }

        List<ApprovalResponse> content = approvals.stream()
                .map(ApprovalResponse::from)
                .collect(Collectors.toList());

        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public ApprovalResponse findById(Long id) {
        Approval approval = approvalMapper.findById(id);
        if (approval == null) {
            throw new ResourceNotFoundException("Approval", "id", id);
        }
        return ApprovalResponse.from(approval);
    }

    @Transactional
    public ApprovalResponse create(ApprovalRequest request) {
        String approvalId = generateApprovalId();

        Approval approval = Approval.builder()
                .approvalId(approvalId)
                .type(request.getType())
                .title(request.getTitle())
                .content(request.getContent())
                .applicantName(request.getApplicantName())
                .applicantDept(request.getApplicantDept())
                .applicantEmail(request.getApplicantEmail())
                .requestDate(request.getRequestDate())
                .status(request.getStatus() != null ? request.getStatus() : "PENDING")
                .approverName(request.getApproverName())
                .approvalDate(request.getApprovalDate())
                .rejectReason(request.getRejectReason())
                .build();

        approvalMapper.insert(approval);
        log.info("Created approval: {}", approvalId);
        return ApprovalResponse.from(approval);
    }

    @Transactional
    public ApprovalResponse update(Long id, ApprovalRequest request) {
        Approval approval = approvalMapper.findById(id);
        if (approval == null) {
            throw new ResourceNotFoundException("Approval", "id", id);
        }

        approval.setType(request.getType());
        approval.setTitle(request.getTitle());
        approval.setContent(request.getContent());
        approval.setApplicantName(request.getApplicantName());
        approval.setApplicantDept(request.getApplicantDept());
        approval.setApplicantEmail(request.getApplicantEmail());
        approval.setRequestDate(request.getRequestDate());
        if (request.getStatus() != null) {
            approval.setStatus(request.getStatus());
        }
        approval.setApproverName(request.getApproverName());
        approval.setApprovalDate(request.getApprovalDate());
        approval.setRejectReason(request.getRejectReason());

        approvalMapper.update(approval);
        log.info("Updated approval: {}", approval.getApprovalId());

        // PPE_REQUEST 연동은 보호구·장비 재구성 후 신규 tb_ppe_issue 도메인으로 다시 연결 예정

        // PERMIT_TO_WORK 타입이면 작업허가 상태도 연동
        if ("PERMIT_TO_WORK".equals(approval.getType()) && approval.getContent() != null && request.getStatus() != null) {
            String permitId = approval.getContent().split("\\|")[0].trim();
            syncPermitStatus(permitId, request.getStatus());
        }

        // TRAINING 타입이면 교육 상태도 연동
        if ("TRAINING".equals(approval.getType()) && approval.getContent() != null && request.getStatus() != null) {
            String educationId = approval.getContent().split("\\|")[0].trim();
            syncTrainingStatus(educationId, request.getStatus());
        }

        // CHEMICAL 타입이면 화학물질 상태 연동
        if ("CHEMICAL".equals(approval.getType()) && approval.getContent() != null && request.getStatus() != null) {
            syncChemicalStatus(approval.getContent(), request.getStatus());
        }

        return ApprovalResponse.from(approval);
    }

    @Transactional
    public void delete(Long id) {
        Approval approval = approvalMapper.findById(id);
        if (approval == null) {
            throw new ResourceNotFoundException("Approval", "id", id);
        }
        approvalMapper.delete(id);
        log.info("Deleted approval with id: {}", id);
    }

    private String generateApprovalId() {
        String prefix = "APR-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy"));
        int count = approvalMapper.countAll() + 1;
        return String.format("%s-%03d", prefix, count);
    }

    // syncPpeRequestStatus 메서드는 보호구·장비 재구성 후 신규 tb_ppe_issue 도메인으로 다시 구현 예정

    private void syncTrainingStatus(String educationId, String approvalStatus) {
        try {
            var education = safetyEducationMapper.findByEducationIdAndDeletedFalse(educationId);
            if (education == null) return;

            String educationStatus;
            switch (approvalStatus) {
                case "REJECTED": educationStatus = "CANCELLED"; break;
                case "COMPLETED": educationStatus = "COMPLETED"; break;
                default: return; // APPROVED 시에는 교육 상태 변경 없음 (PLANNED 유지)
            }
            safetyEducationMapper.updateStatus(education.getId(), educationStatus);
            log.info("Synced education {} status to {}", educationId, educationStatus);
        } catch (Exception e) {
            log.warn("Failed to sync education status: {}", e.getMessage());
        }
    }

    private void syncChemicalStatus(String content, String approvalStatus) {
        try {
            String chemicalIdStr = content.split("\\|")[0].trim();
            var chemicals = chemicalMapper.findByDeletedFalse(0, 1000);
            var target = chemicals.stream()
                    .filter(c -> c.getChemicalId().equals(chemicalIdStr))
                    .findFirst().orElse(null);
            if (target == null) return;

            switch (approvalStatus) {
                case "APPROVED":
                    target.setStatus("IN_USE");
                    chemicalMapper.update(target);
                    log.info("Synced chemical {} status to IN_USE (approved)", chemicalIdStr);
                    break;
                case "REJECTED":
                    target.setStatus("PENDING_DISPOSAL");
                    chemicalMapper.update(target);
                    log.info("Synced chemical {} status to PENDING_DISPOSAL (rejected)", chemicalIdStr);
                    break;
                default:
                    break;
            }
        } catch (Exception e) {
            log.warn("Failed to sync chemical status: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Page<ApprovalResponse> findMyPending(String approverEmail, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();

        // For now, return all PENDING approvals (frontend will filter by user context)
        List<Approval> approvals = approvalMapper.findByStatus("PENDING", offset, limit);
        int total = approvalMapper.countByStatus("PENDING");

        List<ApprovalResponse> content = approvals.stream()
                .map(ApprovalResponse::from)
                .collect(Collectors.toList());

        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<ApprovalResponse> findMyDrafted(String applicantEmail, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();

        List<Approval> approvals = approvalMapper.findByApplicantEmail(applicantEmail, offset, limit);
        int total = approvalMapper.countByApplicantEmail(applicantEmail);

        List<ApprovalResponse> content = approvals.stream()
                .map(ApprovalResponse::from)
                .collect(Collectors.toList());

        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<ApprovalResponse> findMyHistory(String email, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();

        List<Approval> approvals = approvalMapper.findHistory(email, offset, limit);
        int total = approvalMapper.countHistory(email);

        List<ApprovalResponse> content = approvals.stream()
                .map(ApprovalResponse::from)
                .collect(Collectors.toList());

        return new PageImpl<>(content, pageable, total);
    }

    private void syncPermitStatus(String permitIdStr, String approvalStatus) {
        try {
            var permits = permitToWorkMapper.findByDeletedFalse(0, 1000);
            var target = permits.stream()
                    .filter(p -> p.getPermitId().equals(permitIdStr))
                    .findFirst().orElse(null);
            if (target == null) return;

            String permitStatus;
            switch (approvalStatus) {
                case "APPROVED": permitStatus = "APPROVED"; break;
                case "REJECTED": permitStatus = "REJECTED"; break;
                default: return;
            }
            permitToWorkMapper.updateStatus(target.getId(), permitStatus);
            log.info("Synced permit {} status to {}", permitIdStr, permitStatus);
        } catch (Exception e) {
            log.warn("Failed to sync permit status: {}", e.getMessage());
        }
    }
}
