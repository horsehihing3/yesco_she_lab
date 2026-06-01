package com.smartehs.service;

import com.smartehs.dto.request.RiskAssessmentFormRequest;
import com.smartehs.dto.response.RiskAssessmentFormResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.RiskAssessmentFormItemMapper;
import com.smartehs.mapper.RiskAssessmentFormMapper;
import com.smartehs.model.RiskAssessmentForm;
import com.smartehs.model.RiskAssessmentFormItem;
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
public class RiskAssessmentFormService {

    private final RiskAssessmentFormMapper formMapper;
    private final RiskAssessmentFormItemMapper itemMapper;

    @Transactional(readOnly = true)
    public Page<RiskAssessmentFormResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<RiskAssessmentFormResponse> content = formMapper.findAllWithPaging(offset, limit).stream()
                .map(form -> {
                    RiskAssessmentFormResponse resp = RiskAssessmentFormResponse.from(form);
                    resp.setItemCount(itemMapper.countByFormId(form.getId()));
                    return resp;
                })
                .collect(Collectors.toList());
        int total = formMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<RiskAssessmentFormResponse> search(String title, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<RiskAssessmentFormResponse> content = formMapper.findByTitleContaining(title, offset, limit).stream()
                .map(form -> {
                    RiskAssessmentFormResponse resp = RiskAssessmentFormResponse.from(form);
                    resp.setItemCount(itemMapper.countByFormId(form.getId()));
                    return resp;
                })
                .collect(Collectors.toList());
        int total = formMapper.countByTitleContaining(title);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public RiskAssessmentFormResponse findById(Long id) {
        RiskAssessmentForm form = formMapper.findById(id);
        if (form == null) {
            throw new ResourceNotFoundException("RiskAssessmentForm", "id", id);
        }
        List<RiskAssessmentFormItem> items = itemMapper.findByFormId(id);
        return RiskAssessmentFormResponse.from(form, items);
    }

    @Transactional(readOnly = true)
    public List<RiskAssessmentFormResponse> findAllForDropdown() {
        return formMapper.findAll().stream()
                .map(RiskAssessmentFormResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public RiskAssessmentFormResponse create(RiskAssessmentFormRequest request) {
        RiskAssessmentForm form = RiskAssessmentForm.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .regUser(request.getRegUser())
                .modUser(request.getRegUser())
                .build();
        formMapper.insert(form);

        if (request.getItems() != null) {
            for (var itemReq : request.getItems()) {
                RiskAssessmentFormItem item = RiskAssessmentFormItem.builder()
                        .formId(form.getId())
                        .riskIdx(itemReq.getRiskIdx())
                        .detailAction(itemReq.getDetailAction())
                        .risk4M(itemReq.getRisk4M())
                        .danger(itemReq.getDanger())
                        .expectedDisaster(itemReq.getExpectedDisaster())
                        .target(itemReq.getTarget())
                        .currentSafetyMeasures(itemReq.getCurrentSafetyMeasures())
                        .possibilityGrade(itemReq.getPossibilityGrade())
                        .resultGrade(itemReq.getResultGrade())
                        .reductionMeasures(itemReq.getReductionMeasures())
                        .improvementManager(itemReq.getImprovementManager())
                        .improvementDeadline(itemReq.getImprovementDeadline())
                        .improvedPossibilityGrade(itemReq.getImprovedPossibilityGrade())
                        .improvedResultGrade(itemReq.getImprovedResultGrade())
                        .relatedLaw(itemReq.getRelatedLaw())
                        .remark(itemReq.getRemark())
                        .reviewer(itemReq.getReviewer())
                        .approverName(itemReq.getApproverName())
                        .currentFrequency(itemReq.getCurrentFrequency())
                        .currentSeverity(itemReq.getCurrentSeverity())
                        .currentRisk(itemReq.getCurrentRisk())
                        .currentGrade(itemReq.getCurrentGrade())
                        .codeNumber(itemReq.getCodeNumber())
                        .improvedFrequency(itemReq.getImprovedFrequency())
                        .improvedSeverity(itemReq.getImprovedSeverity())
                        .improvedRisk(itemReq.getImprovedRisk())
                        .improvedGrade(itemReq.getImprovedGrade())
                        .build();
                itemMapper.insert(item);
            }
        }

        log.info("Created risk assessment form: id={}", form.getId());
        List<RiskAssessmentFormItem> items = itemMapper.findByFormId(form.getId());
        return RiskAssessmentFormResponse.from(form, items);
    }

    @Transactional
    public RiskAssessmentFormResponse update(Long id, RiskAssessmentFormRequest request) {
        RiskAssessmentForm form = formMapper.findById(id);
        if (form == null) {
            throw new ResourceNotFoundException("RiskAssessmentForm", "id", id);
        }

        form.setTitle(request.getTitle());
        form.setDescription(request.getDescription());
        form.setModUser(request.getRegUser());
        formMapper.update(form);

        // Replace all items
        itemMapper.deleteByFormId(id);
        if (request.getItems() != null) {
            for (var itemReq : request.getItems()) {
                RiskAssessmentFormItem item = RiskAssessmentFormItem.builder()
                        .formId(id)
                        .riskIdx(itemReq.getRiskIdx())
                        .detailAction(itemReq.getDetailAction())
                        .risk4M(itemReq.getRisk4M())
                        .danger(itemReq.getDanger())
                        .expectedDisaster(itemReq.getExpectedDisaster())
                        .target(itemReq.getTarget())
                        .currentSafetyMeasures(itemReq.getCurrentSafetyMeasures())
                        .possibilityGrade(itemReq.getPossibilityGrade())
                        .resultGrade(itemReq.getResultGrade())
                        .reductionMeasures(itemReq.getReductionMeasures())
                        .improvementManager(itemReq.getImprovementManager())
                        .improvementDeadline(itemReq.getImprovementDeadline())
                        .improvedPossibilityGrade(itemReq.getImprovedPossibilityGrade())
                        .improvedResultGrade(itemReq.getImprovedResultGrade())
                        .relatedLaw(itemReq.getRelatedLaw())
                        .remark(itemReq.getRemark())
                        .reviewer(itemReq.getReviewer())
                        .approverName(itemReq.getApproverName())
                        .currentFrequency(itemReq.getCurrentFrequency())
                        .currentSeverity(itemReq.getCurrentSeverity())
                        .currentRisk(itemReq.getCurrentRisk())
                        .currentGrade(itemReq.getCurrentGrade())
                        .codeNumber(itemReq.getCodeNumber())
                        .improvedFrequency(itemReq.getImprovedFrequency())
                        .improvedSeverity(itemReq.getImprovedSeverity())
                        .improvedRisk(itemReq.getImprovedRisk())
                        .improvedGrade(itemReq.getImprovedGrade())
                        .build();
                itemMapper.insert(item);
            }
        }

        log.info("Updated risk assessment form: id={}", id);
        List<RiskAssessmentFormItem> items = itemMapper.findByFormId(id);
        return RiskAssessmentFormResponse.from(form, items);
    }

    @Transactional
    public void delete(Long id) {
        RiskAssessmentForm form = formMapper.findById(id);
        if (form == null) {
            throw new ResourceNotFoundException("RiskAssessmentForm", "id", id);
        }
        // 양식은 평가 생성 시 스냅샷(form_title + 항목 복사)되므로
        // 기존 평가에 영향을 주지 않고 양식만 자유롭게 삭제 가능
        itemMapper.deleteByFormId(id);
        formMapper.delete(id);
        log.info("Deleted risk assessment form: id={}", id);
    }
}
