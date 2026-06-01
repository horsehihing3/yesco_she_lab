package com.smartehs.service;

import com.smartehs.dto.request.EhsMessageRequest;
import com.smartehs.dto.response.EhsMessageResponse;
import com.smartehs.model.EhsMessage;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.EhsMessageMapper;
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
public class EhsMessageService {

    private final EhsMessageMapper messageMapper;
    private final TranslationService translationService;

    @Transactional(readOnly = true)
    public Page<EhsMessageResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EhsMessageResponse> content = messageMapper.findAllWithPaging(offset, limit).stream()
                .map(EhsMessageResponse::fromLocalized)
                .collect(Collectors.toList());
        int total = messageMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<EhsMessageResponse> search(String title, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EhsMessageResponse> content = messageMapper.findByTitleContaining(title, offset, limit).stream()
                .map(EhsMessageResponse::fromLocalized)
                .collect(Collectors.toList());
        int total = messageMapper.countByTitleContaining(title);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<EhsMessageResponse> findByCategory(String category, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<EhsMessageResponse> content = messageMapper.findByCategory(category, offset, limit).stream()
                .map(EhsMessageResponse::fromLocalized)
                .collect(Collectors.toList());
        int total = messageMapper.countByCategory(category);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public EhsMessageResponse findById(Long id) {
        EhsMessage message = messageMapper.findById(id);
        if (message == null) {
            throw new ResourceNotFoundException("EhsMessage", "id", id);
        }
        return EhsMessageResponse.fromLocalized(message);
    }

    @Transactional(readOnly = true)
    public EhsMessageResponse findByMessageId(String messageId) {
        EhsMessage message = messageMapper.findByMessageId(messageId);
        if (message == null) {
            throw new ResourceNotFoundException("EhsMessage", "messageId", messageId);
        }
        return EhsMessageResponse.fromLocalized(message);
    }

    @Transactional
    public EhsMessageResponse create(EhsMessageRequest request) {
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

        EhsMessage message = EhsMessage.builder()
                .messageId(UUID.randomUUID().toString())
                .title(titleKo)
                .titleEn(titleEn)
                .titleZh(titleZh)
                .category(request.getCategory())
                .subCategory(request.getSubCategory())
                .recipient(request.getRecipient())
                .recipientGroup(request.getRecipientGroup())
                .referrer(request.getReferrer())
                .detail(detailKo)
                .detailEn(detailEn)
                .detailZh(detailZh)
                .authorName(request.getAuthorName())
                .authorRole(request.getAuthorRole())
                .authorEmail(request.getAuthorEmail())
                .authorDept(request.getAuthorDept())
                .authorCompany(request.getAuthorCompany())
                .sendDate(request.getSendDate())
                .entireOrNot(request.getEntireOrNot() != null ? request.getEntireOrNot() : true)
                .views(0)
                .build();

        messageMapper.insert(message);
        log.info("Created EHS message: {}", message.getMessageId());
        return EhsMessageResponse.from(message);
    }

    @Transactional
    public EhsMessageResponse update(Long id, EhsMessageRequest request) {
        EhsMessage message = messageMapper.findById(id);
        if (message == null) {
            throw new ResourceNotFoundException("EhsMessage", "id", id);
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

        message.setTitle(titleKo);
        message.setTitleEn(titleEn);
        message.setTitleZh(titleZh);
        message.setCategory(request.getCategory());
        message.setSubCategory(request.getSubCategory());
        message.setRecipient(request.getRecipient());
        message.setRecipientGroup(request.getRecipientGroup());
        message.setReferrer(request.getReferrer());
        message.setDetail(detailKo);
        message.setDetailEn(detailEn);
        message.setDetailZh(detailZh);
        message.setAuthorName(request.getAuthorName());
        message.setAuthorRole(request.getAuthorRole());
        message.setAuthorEmail(request.getAuthorEmail());
        message.setAuthorDept(request.getAuthorDept());
        message.setAuthorCompany(request.getAuthorCompany());
        if (request.getSendDate() != null) {
            message.setSendDate(request.getSendDate());
        }
        if (request.getEntireOrNot() != null) {
            message.setEntireOrNot(request.getEntireOrNot());
        }

        messageMapper.update(message);
        log.info("Updated EHS message: {}", message.getMessageId());
        return EhsMessageResponse.from(message);
    }

    @Transactional
    public void delete(Long id) {
        EhsMessage message = messageMapper.findById(id);
        if (message == null) {
            throw new ResourceNotFoundException("EhsMessage", "id", id);
        }
        messageMapper.delete(id);
        log.info("Deleted EHS message with id: {}", id);
    }

    @Transactional
    public void incrementViews(Long id) {
        EhsMessage message = messageMapper.findById(id);
        if (message == null) {
            throw new ResourceNotFoundException("EhsMessage", "id", id);
        }
        messageMapper.incrementViews(id);
    }
}
