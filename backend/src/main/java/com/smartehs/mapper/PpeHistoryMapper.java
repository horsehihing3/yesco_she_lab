package com.smartehs.mapper;

import com.smartehs.model.PpeHistory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface PpeHistoryMapper {
    List<PpeHistory> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);
    int countByDeletedFalse();
    PpeHistory findByIdAndDeletedFalse(@Param("id") Long id);
    int countByHistoryIdStartingWith(@Param("prefix") String prefix);
    void insert(PpeHistory history);
    void update(PpeHistory history);
    void softDelete(@Param("id") Long id);
}
