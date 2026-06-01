package com.smartehs.mapper;

import com.smartehs.model.QnaPost;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface QnaPostMapper {
    List<QnaPost> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);
    int countAll();
    QnaPost findById(@Param("id") Long id);
    List<QnaPost> findByTitleContaining(@Param("title") String title, @Param("offset") int offset, @Param("limit") int limit);
    int countByTitleContaining(@Param("title") String title);
    List<QnaPost> findByCategory(@Param("category") String category, @Param("offset") int offset, @Param("limit") int limit);
    int countByCategory(@Param("category") String category);
    void incrementViews(@Param("id") Long id);
    void insert(QnaPost qnaPost);
    void update(QnaPost qnaPost);
    void updateAnswer(QnaPost qnaPost);
    void delete(@Param("id") Long id);
}
