package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.EhsAlertCommentMapper;
import com.smartehs.model.EhsAlertComment;
import com.smartehs.model.IdmUser;
import com.smartehs.mapper.IdmMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EhsAlertCommentService {

    private final EhsAlertCommentMapper commentMapper;
    private final IdmMapper idmMapper;

    @Transactional(readOnly = true)
    public List<EhsAlertComment> findByAlertId(Long alertId) {
        return commentMapper.findByAlertId(alertId);
    }

    @Transactional
    public EhsAlertComment create(Long alertId, EhsAlertComment input, String username) {
        EhsAlertComment c = new EhsAlertComment();
        c.setAlertId(alertId);
        c.setParentId(input.getParentId());
        c.setContent(input.getContent());

        // 인증된 사용자 정보 우선, fallback 으로 요청 본문 사용
        if (username != null && !"system".equals(username)) {
            IdmUser u = idmMapper.findByUid(username);
            if (u != null) {
                c.setAuthorName(u.getUserName() != null ? u.getUserName() : u.getUid());
                c.setAuthorDept(u.getGroupName() != null ? u.getGroupName() : u.getDeptCode());
                c.setAuthorEmail(u.getEmail());
            }
        }
        if (c.getAuthorName() == null) c.setAuthorName(input.getAuthorName());
        if (c.getAuthorDept() == null) c.setAuthorDept(input.getAuthorDept());
        if (c.getAuthorEmail() == null) c.setAuthorEmail(input.getAuthorEmail());

        c.setDeleted(false);
        commentMapper.insert(c);
        return commentMapper.findById(c.getId());
    }

    @Transactional
    public EhsAlertComment update(Long id, EhsAlertComment input) {
        EhsAlertComment existing = commentMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("EhsAlertComment", "id", id);
        existing.setContent(input.getContent());
        commentMapper.update(existing);
        return commentMapper.findById(id);
    }

    /** 부모 댓글 삭제 시 답글까지 일괄 soft delete */
    @Transactional
    public void delete(Long id) {
        EhsAlertComment existing = commentMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("EhsAlertComment", "id", id);
        if (existing.getParentId() == null) {
            commentMapper.softDeleteWithChildren(id);
        } else {
            commentMapper.softDelete(id);
        }
    }
}
