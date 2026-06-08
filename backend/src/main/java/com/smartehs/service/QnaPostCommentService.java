package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.mapper.QnaPostCommentMapper;
import com.smartehs.model.IdmUser;
import com.smartehs.model.QnaPostComment;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QnaPostCommentService {

    private final QnaPostCommentMapper commentMapper;
    private final IdmMapper idmMapper;

    @Transactional(readOnly = true)
    public List<QnaPostComment> findByQnaId(Long qnaId) {
        return commentMapper.findByQnaId(qnaId);
    }

    @Transactional
    public QnaPostComment create(Long qnaId, QnaPostComment input, String username) {
        QnaPostComment c = new QnaPostComment();
        c.setQnaId(qnaId);
        c.setParentId(input.getParentId());
        c.setContent(input.getContent());

        if (username != null && !"system".equals(username)) {
            IdmUser u = idmMapper.findByUid(username);
            if (u != null) {
                c.setAuthorName(u.getUserName() != null ? u.getUserName() : u.getUid());
                c.setAuthorDept(u.getGroupName() != null ? u.getGroupName() : u.getDeptCode());
                c.setAuthorEmail(u.getEmail());
            } else {
                c.setAuthorName(username);
            }
        }
        if (c.getAuthorName() == null) c.setAuthorName(input.getAuthorName());
        if (c.getAuthorName() == null) c.setAuthorName("anonymous");
        if (c.getAuthorDept() == null) c.setAuthorDept(input.getAuthorDept());
        if (c.getAuthorEmail() == null) c.setAuthorEmail(input.getAuthorEmail());

        c.setDeleted(false);
        commentMapper.insert(c);
        return commentMapper.findById(c.getId());
    }

    @Transactional
    public QnaPostComment update(Long id, QnaPostComment input) {
        QnaPostComment existing = commentMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("QnaPostComment", "id", id);
        existing.setContent(input.getContent());
        commentMapper.update(existing);
        return commentMapper.findById(id);
    }

    @Transactional
    public void delete(Long id) {
        QnaPostComment existing = commentMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("QnaPostComment", "id", id);
        if (existing.getParentId() == null) {
            commentMapper.softDeleteWithChildren(id);
        } else {
            commentMapper.softDelete(id);
        }
    }
}
