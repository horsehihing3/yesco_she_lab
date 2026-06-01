package com.smartehs.service;

import com.smartehs.dto.request.QnaPostRequest;
import com.smartehs.dto.response.QnaPostResponse;
import com.smartehs.model.QnaPost;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.QnaPostMapper;
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
public class QnaPostService {

    private final QnaPostMapper qnaPostMapper;

    @Transactional(readOnly = true)
    public Page<QnaPostResponse> findAll(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<QnaPostResponse> content = qnaPostMapper.findAllWithPaging(offset, limit).stream()
                .map(QnaPostResponse::from)
                .collect(Collectors.toList());
        int total = qnaPostMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<QnaPostResponse> search(String title, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<QnaPostResponse> content = qnaPostMapper.findByTitleContaining(title, offset, limit).stream()
                .map(QnaPostResponse::from)
                .collect(Collectors.toList());
        int total = qnaPostMapper.countByTitleContaining(title);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public Page<QnaPostResponse> findByCategory(String category, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<QnaPostResponse> content = qnaPostMapper.findByCategory(category, offset, limit).stream()
                .map(QnaPostResponse::from)
                .collect(Collectors.toList());
        int total = qnaPostMapper.countByCategory(category);
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional(readOnly = true)
    public QnaPostResponse findById(Long id) {
        QnaPost qnaPost = qnaPostMapper.findById(id);
        if (qnaPost == null) {
            throw new ResourceNotFoundException("QnaPost", "id", id);
        }
        return QnaPostResponse.from(qnaPost);
    }

    @Transactional
    public QnaPostResponse create(QnaPostRequest request) {
        QnaPost qnaPost = QnaPost.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .category(request.getCategory())
                .authorName(request.getAuthorName())
                .authorDept(request.getAuthorDept())
                .authorEmail(request.getAuthorEmail())
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : true)
                .views(0)
                .isAnswered(false)
                .build();

        qnaPostMapper.insert(qnaPost);
        log.info("Created Q&A post: {}", qnaPost.getId());
        return QnaPostResponse.from(qnaPost);
    }

    @Transactional
    public QnaPostResponse update(Long id, QnaPostRequest request) {
        QnaPost qnaPost = qnaPostMapper.findById(id);
        if (qnaPost == null) {
            throw new ResourceNotFoundException("QnaPost", "id", id);
        }

        qnaPost.setTitle(request.getTitle());
        qnaPost.setContent(request.getContent());
        qnaPost.setCategory(request.getCategory());
        if (request.getIsPublic() != null) {
            qnaPost.setIsPublic(request.getIsPublic());
        }

        qnaPostMapper.update(qnaPost);
        log.info("Updated Q&A post: {}", id);
        return QnaPostResponse.from(qnaPost);
    }

    @Transactional
    public QnaPostResponse addAnswer(Long id, String answer, String answerAuthorName, String answerAuthorDept) {
        QnaPost qnaPost = qnaPostMapper.findById(id);
        if (qnaPost == null) {
            throw new ResourceNotFoundException("QnaPost", "id", id);
        }

        qnaPost.setAnswer(answer);
        qnaPost.setAnswerAuthorName(answerAuthorName);
        qnaPost.setAnswerAuthorDept(answerAuthorDept);
        qnaPost.setIsAnswered(true);

        qnaPostMapper.updateAnswer(qnaPost);
        log.info("Added answer to Q&A post: {}", id);
        return QnaPostResponse.from(qnaPost);
    }

    @Transactional
    public void delete(Long id) {
        QnaPost qnaPost = qnaPostMapper.findById(id);
        if (qnaPost == null) {
            throw new ResourceNotFoundException("QnaPost", "id", id);
        }
        qnaPostMapper.delete(id);
        log.info("Deleted Q&A post with id: {}", id);
    }

    @Transactional
    public void incrementViews(Long id) {
        QnaPost qnaPost = qnaPostMapper.findById(id);
        if (qnaPost == null) {
            throw new ResourceNotFoundException("QnaPost", "id", id);
        }
        qnaPostMapper.incrementViews(id);
    }
}
