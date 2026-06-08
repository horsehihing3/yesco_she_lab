package com.smartehs.service;

import com.smartehs.dto.request.EhsAlertRequest;
import com.smartehs.dto.response.EhsAlertResponse;
import com.smartehs.model.EhsAlert;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.EhsAlertMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EhsAlertService {

    private final EhsAlertMapper alertMapper;
    private final TranslationService translationService;

    @Transactional(readOnly = true)
    public Page<EhsAlertResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EhsAlertResponse> content = alertMapper.findAllWithPaging(offset, limit).stream()
                .map(EhsAlertResponse::fromLocalized)
                .collect(Collectors.toList());
        int total = alertMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<EhsAlertResponse> search(String title, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EhsAlertResponse> content = alertMapper.findByTitleContaining(title, offset, limit).stream()
                .map(EhsAlertResponse::fromLocalized)
                .collect(Collectors.toList());
        int total = alertMapper.countByTitleContaining(title);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public EhsAlertResponse findById(Long id) {
        EhsAlert alert = alertMapper.findById(id);
        if (alert == null) {
            throw new ResourceNotFoundException("EhsAlert", "id", id);
        }
        return EhsAlertResponse.fromLocalized(alert);
    }

    @Transactional(readOnly = true)
    public EhsAlertResponse findByAlertId(String alertId) {
        EhsAlert alert = alertMapper.findByAlertId(alertId);
        if (alert == null) {
            throw new ResourceNotFoundException("EhsAlert", "alertId", alertId);
        }
        return EhsAlertResponse.fromLocalized(alert);
    }

    @Transactional
    public EhsAlertResponse create(EhsAlertRequest request) {
        String sourceLang = request.getSourceLang() != null ? request.getSourceLang() : "ko";

        // Translate title and detail based on source language
        String titleKo, titleEn, titleZh;
        String detailKo, detailEn, detailZh;

        switch (sourceLang) {
            case "en":
                // Source is English
                titleEn = request.getTitle();
                titleKo = translationService.translate(request.getTitle(), "en", "ko");
                titleZh = translationService.translate(request.getTitle(), "en", "zh-CN");
                detailEn = request.getDetail();
                detailKo = translationService.translate(request.getDetail(), "en", "ko");
                detailZh = translationService.translate(request.getDetail(), "en", "zh-CN");
                break;
            case "zh":
                // Source is Chinese
                titleZh = request.getTitle();
                titleKo = translationService.translate(request.getTitle(), "zh-CN", "ko");
                titleEn = translationService.translate(request.getTitle(), "zh-CN", "en");
                detailZh = request.getDetail();
                detailKo = translationService.translate(request.getDetail(), "zh-CN", "ko");
                detailEn = translationService.translate(request.getDetail(), "zh-CN", "en");
                break;
            default:
                // Source is Korean (default)
                titleKo = request.getTitle();
                titleEn = translationService.translate(request.getTitle(), "ko", "en");
                titleZh = translationService.translate(request.getTitle(), "ko", "zh-CN");
                detailKo = request.getDetail();
                detailEn = translationService.translate(request.getDetail(), "ko", "en");
                detailZh = translationService.translate(request.getDetail(), "ko", "zh-CN");
                break;
        }

        EhsAlert alert = EhsAlert.builder()
                .alertId(UUID.randomUUID().toString())
                .title(titleKo)
                .titleEn(titleEn)
                .titleZh(titleZh)
                .detail(detailKo)
                .detailEn(detailEn)
                .detailZh(detailZh)
                .authorName(request.getAuthorName())
                .authorDept(request.getAuthorDept())
                .authorPosition(request.getAuthorPosition())
                .authorEmail(request.getAuthorEmail())
                .authorCompany(request.getAuthorCompany())
                .isAutoRegistration(request.getIsAutoRegistration() != null ? request.getIsAutoRegistration() : false)
                .views(0)
                .build();

        alertMapper.insert(alert);
        log.info("Created EHS alert: {}", alert.getAlertId());
        return EhsAlertResponse.from(alert);
    }

    @Transactional
    public EhsAlertResponse update(Long id, EhsAlertRequest request) {
        EhsAlert alert = alertMapper.findById(id);
        if (alert == null) {
            throw new ResourceNotFoundException("EhsAlert", "id", id);
        }

        String sourceLang = request.getSourceLang() != null ? request.getSourceLang() : "ko";

        // Translate title and detail based on source language
        String titleKo, titleEn, titleZh;
        String detailKo, detailEn, detailZh;

        switch (sourceLang) {
            case "en":
                titleEn = request.getTitle();
                titleKo = translationService.translate(request.getTitle(), "en", "ko");
                titleZh = translationService.translate(request.getTitle(), "en", "zh-CN");
                detailEn = request.getDetail();
                detailKo = translationService.translate(request.getDetail(), "en", "ko");
                detailZh = translationService.translate(request.getDetail(), "en", "zh-CN");
                break;
            case "zh":
                titleZh = request.getTitle();
                titleKo = translationService.translate(request.getTitle(), "zh-CN", "ko");
                titleEn = translationService.translate(request.getTitle(), "zh-CN", "en");
                detailZh = request.getDetail();
                detailKo = translationService.translate(request.getDetail(), "zh-CN", "ko");
                detailEn = translationService.translate(request.getDetail(), "zh-CN", "en");
                break;
            default:
                titleKo = request.getTitle();
                titleEn = translationService.translate(request.getTitle(), "ko", "en");
                titleZh = translationService.translate(request.getTitle(), "ko", "zh-CN");
                detailKo = request.getDetail();
                detailEn = translationService.translate(request.getDetail(), "ko", "en");
                detailZh = translationService.translate(request.getDetail(), "ko", "zh-CN");
                break;
        }

        alert.setTitle(titleKo);
        alert.setTitleEn(titleEn);
        alert.setTitleZh(titleZh);
        alert.setDetail(detailKo);
        alert.setDetailEn(detailEn);
        alert.setDetailZh(detailZh);
        alert.setAuthorName(request.getAuthorName());
        alert.setAuthorDept(request.getAuthorDept());
        alert.setAuthorPosition(request.getAuthorPosition());
        alert.setAuthorEmail(request.getAuthorEmail());
        alert.setAuthorCompany(request.getAuthorCompany());
        if (request.getIsAutoRegistration() != null) {
            alert.setIsAutoRegistration(request.getIsAutoRegistration());
        }

        alertMapper.update(alert);
        log.info("Updated EHS alert: {}", alert.getAlertId());
        return EhsAlertResponse.from(alert);
    }

    @Transactional
    public void delete(Long id) {
        EhsAlert alert = alertMapper.findById(id);
        if (alert == null) {
            throw new ResourceNotFoundException("EhsAlert", "id", id);
        }
        alertMapper.delete(id);
        log.info("Deleted EHS alert with id: {}", id);
    }

    @Transactional
    public void incrementViews(Long id) {
        EhsAlert alert = alertMapper.findById(id);
        if (alert == null) {
            throw new ResourceNotFoundException("EhsAlert", "id", id);
        }
        alertMapper.incrementViews(id);
    }
}
