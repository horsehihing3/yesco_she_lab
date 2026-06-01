package com.smartehs.mapper;

import com.smartehs.model.EhsAlertComment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface EhsAlertCommentMapper {
    /** 알림에 달린 모든 댓글 (대댓글 포함) — created_at ASC, parent_id null 우선 정렬은 서비스에서 트리화 */
    List<EhsAlertComment> findByAlertId(@Param("alertId") Long alertId);
    EhsAlertComment findById(@Param("id") Long id);
    int countByAlertId(@Param("alertId") Long alertId);
    void insert(EhsAlertComment c);
    void update(EhsAlertComment c);
    /** 단일 댓글 soft delete */
    void softDelete(@Param("id") Long id);
    /** 부모 댓글 삭제 시 그 답글까지 일괄 soft delete */
    void softDeleteWithChildren(@Param("id") Long id);
    /** 알림 삭제 시 모든 댓글 일괄 soft delete */
    void softDeleteByAlertId(@Param("alertId") Long alertId);
}
