package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.EhsMessageCommentMapper;
import com.smartehs.mapper.IdmMapper;
import com.smartehs.model.EhsMessageComment;
import com.smartehs.model.IdmUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EhsMessageCommentService {

    private final EhsMessageCommentMapper commentMapper;
    private final IdmMapper idmMapper;

    @Transactional(readOnly = true)
    public List<EhsMessageComment> findByMessageId(Long messageId) {
        return commentMapper.findByMessageId(messageId);
    }

    @Transactional
    public EhsMessageComment create(Long messageId, EhsMessageComment input, String username) {
        EhsMessageComment c = new EhsMessageComment();
        c.setMessageId(messageId);
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
    public EhsMessageComment update(Long id, EhsMessageComment input) {
        EhsMessageComment existing = commentMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("EhsMessageComment", "id", id);
        existing.setContent(input.getContent());
        commentMapper.update(existing);
        return commentMapper.findById(id);
    }

    @Transactional
    public void delete(Long id) {
        EhsMessageComment existing = commentMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("EhsMessageComment", "id", id);
        if (existing.getParentId() == null) {
            commentMapper.softDeleteWithChildren(id);
        } else {
            commentMapper.softDelete(id);
        }
    }
}
