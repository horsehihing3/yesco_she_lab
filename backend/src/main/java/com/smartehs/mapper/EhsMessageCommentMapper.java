package com.smartehs.mapper;

import com.smartehs.model.EhsMessageComment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface EhsMessageCommentMapper {
    List<EhsMessageComment> findByMessageId(@Param("messageId") Long messageId);
    EhsMessageComment findById(@Param("id") Long id);
    int countByMessageId(@Param("messageId") Long messageId);
    void insert(EhsMessageComment c);
    void update(EhsMessageComment c);
    void softDelete(@Param("id") Long id);
    void softDeleteWithChildren(@Param("id") Long id);
    void softDeleteByMessageId(@Param("messageId") Long messageId);
}
