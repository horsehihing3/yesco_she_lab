package com.smartehs.mapper;

import com.smartehs.model.QnaPostComment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface QnaPostCommentMapper {
    List<QnaPostComment> findByQnaId(@Param("qnaId") Long qnaId);
    QnaPostComment findById(@Param("id") Long id);
    int countByQnaId(@Param("qnaId") Long qnaId);
    void insert(QnaPostComment c);
    void update(QnaPostComment c);
    void softDelete(@Param("id") Long id);
    void softDeleteWithChildren(@Param("id") Long id);
    void softDeleteByQnaId(@Param("qnaId") Long qnaId);
}
