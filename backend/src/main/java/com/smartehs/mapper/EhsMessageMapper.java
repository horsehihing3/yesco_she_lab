package com.smartehs.mapper;

import com.smartehs.model.EhsMessage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EhsMessageMapper {

    List<EhsMessage> findAll();

    List<EhsMessage> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    EhsMessage findById(@Param("id") Long id);

    EhsMessage findByMessageId(@Param("messageId") String messageId);

    List<EhsMessage> findByTitleContaining(@Param("title") String title, @Param("offset") int offset, @Param("limit") int limit);

    int countByTitleContaining(@Param("title") String title);

    List<EhsMessage> findByCategory(@Param("category") String category, @Param("offset") int offset, @Param("limit") int limit);

    int countByCategory(@Param("category") String category);

    void incrementViews(@Param("id") Long id);

    void insert(EhsMessage ehsMessage);

    void update(EhsMessage ehsMessage);

    void delete(@Param("id") Long id);
}
