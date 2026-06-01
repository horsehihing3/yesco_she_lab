package com.smartehs.service;

import com.smartehs.dto.request.EhsPlanRequest;
import com.smartehs.dto.response.EhsPlanResponse;
import com.smartehs.model.EhsPlan;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.EhsPlanMapper;
import com.smartehs.util.LanguageContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EhsPlanService {

    private final EhsPlanMapper planMapper;
    private final TranslationService translationService;

    @Transactional(readOnly = true)
    public Page<EhsPlanResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EhsPlanResponse> content = planMapper.findAllWithPaging(offset, limit).stream()
                .map(EhsPlanResponse::fromLocalized)
                .collect(Collectors.toList());
        int total = planMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<EhsPlanResponse> search(String title, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EhsPlanResponse> content = planMapper.findByTitleContaining(title, offset, limit).stream()
                .map(EhsPlanResponse::fromLocalized)
                .collect(Collectors.toList());
        int total = planMapper.countByTitleContaining(title);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<EhsPlanResponse> findByCategory(String category, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EhsPlanResponse> content = planMapper.findByPlanCategory(category, offset, limit).stream()
                .map(EhsPlanResponse::fromLocalized)
                .collect(Collectors.toList());
        int total = planMapper.countByPlanCategory(category);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public List<EhsPlanResponse> findByDateRange(LocalDate startDate, LocalDate endDate) {
        return planMapper.findByDateRange(startDate, endDate).stream()
                .map(EhsPlanResponse::fromLocalized)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EhsPlanResponse> findOverlappingPlans(LocalDate startDate, LocalDate endDate) {
        return planMapper.findOverlappingPlans(startDate, endDate).stream()
                .map(EhsPlanResponse::fromLocalized)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EhsPlanResponse findById(Long id) {
        EhsPlan plan = planMapper.findById(id);
        if (plan == null) {
            throw new ResourceNotFoundException("EhsPlan", "id", id);
        }
        return EhsPlanResponse.fromLocalized(plan);
    }

    @Transactional
    public EhsPlanResponse create(EhsPlanRequest request) {
        String sourceLang = LanguageContext.getLanguage();

        String titleKo, titleEn, titleZh;
        String detailKo, detailEn, detailZh;

        switch (sourceLang) {
            case "en":
                titleEn = request.getTitle();
                titleKo = translationService.translate(request.getTitle(), "en", "ko");
                titleZh = translationService.translate(request.getTitle(), "en", "zh-CN");
                detailEn = request.getPlanDetail();
                detailKo = translationService.translate(request.getPlanDetail(), "en", "ko");
                detailZh = translationService.translate(request.getPlanDetail(), "en", "zh-CN");
                break;
            case "zh":
                titleZh = request.getTitle();
                titleKo = translationService.translate(request.getTitle(), "zh-CN", "ko");
                titleEn = translationService.translate(request.getTitle(), "zh-CN", "en");
                detailZh = request.getPlanDetail();
                detailKo = translationService.translate(request.getPlanDetail(), "zh-CN", "ko");
                detailEn = translationService.translate(request.getPlanDetail(), "zh-CN", "en");
                break;
            default:
                titleKo = request.getTitle();
                titleEn = translationService.translate(request.getTitle(), "ko", "en");
                titleZh = translationService.translate(request.getTitle(), "ko", "zh-CN");
                detailKo = request.getPlanDetail();
                detailEn = translationService.translate(request.getPlanDetail(), "ko", "en");
                detailZh = translationService.translate(request.getPlanDetail(), "ko", "zh-CN");
                break;
        }

        EhsPlan plan = EhsPlan.builder()
                .title(titleKo)
                .titleEn(titleEn)
                .titleZh(titleZh)
                .planDetail(detailKo)
                .planDetailEn(detailEn)
                .planDetailZh(detailZh)
                .planCompany(request.getPlanCompany())
                .planCategory(request.getPlanCategory())
                .planDate(request.getPlanDate())
                .planEndDate(request.getPlanEndDate())
                .isAutoRegistration(request.getIsAutoRegistration() != null ? request.getIsAutoRegistration() : false)
                .authorEmail(request.getAuthorEmail())
                .recipients(request.getRecipients())
                .build();

        planMapper.insert(plan);
        log.info("Created EHS plan: {}", plan.getId());
        return EhsPlanResponse.fromLocalized(plan);
    }

    @Transactional
    public EhsPlanResponse update(Long id, EhsPlanRequest request) {
        EhsPlan plan = planMapper.findById(id);
        if (plan == null) {
            throw new ResourceNotFoundException("EhsPlan", "id", id);
        }

        String sourceLang = LanguageContext.getLanguage();

        String titleKo, titleEn, titleZh;
        String detailKo, detailEn, detailZh;

        switch (sourceLang) {
            case "en":
                titleEn = request.getTitle();
                titleKo = translationService.translate(request.getTitle(), "en", "ko");
                titleZh = translationService.translate(request.getTitle(), "en", "zh-CN");
                detailEn = request.getPlanDetail();
                detailKo = translationService.translate(request.getPlanDetail(), "en", "ko");
                detailZh = translationService.translate(request.getPlanDetail(), "en", "zh-CN");
                break;
            case "zh":
                titleZh = request.getTitle();
                titleKo = translationService.translate(request.getTitle(), "zh-CN", "ko");
                titleEn = translationService.translate(request.getTitle(), "zh-CN", "en");
                detailZh = request.getPlanDetail();
                detailKo = translationService.translate(request.getPlanDetail(), "zh-CN", "ko");
                detailEn = translationService.translate(request.getPlanDetail(), "zh-CN", "en");
                break;
            default:
                titleKo = request.getTitle();
                titleEn = translationService.translate(request.getTitle(), "ko", "en");
                titleZh = translationService.translate(request.getTitle(), "ko", "zh-CN");
                detailKo = request.getPlanDetail();
                detailEn = translationService.translate(request.getPlanDetail(), "ko", "en");
                detailZh = translationService.translate(request.getPlanDetail(), "ko", "zh-CN");
                break;
        }

        plan.setTitle(titleKo);
        plan.setTitleEn(titleEn);
        plan.setTitleZh(titleZh);
        plan.setPlanDetail(detailKo);
        plan.setPlanDetailEn(detailEn);
        plan.setPlanDetailZh(detailZh);
        plan.setPlanCompany(request.getPlanCompany());
        plan.setPlanCategory(request.getPlanCategory());
        plan.setPlanDate(request.getPlanDate());
        plan.setPlanEndDate(request.getPlanEndDate());
        if (request.getIsAutoRegistration() != null) {
            plan.setIsAutoRegistration(request.getIsAutoRegistration());
        }
        plan.setAuthorEmail(request.getAuthorEmail());
        plan.setRecipients(request.getRecipients());

        planMapper.update(plan);
        log.info("Updated EHS plan: {}", plan.getId());
        return EhsPlanResponse.fromLocalized(plan);
    }

    @Transactional
    public void delete(Long id) {
        EhsPlan plan = planMapper.findById(id);
        if (plan == null) {
            throw new ResourceNotFoundException("EhsPlan", "id", id);
        }
        planMapper.delete(id);
        log.info("Deleted EHS plan with id: {}", id);
    }
}
