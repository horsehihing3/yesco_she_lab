package com.smartehs.mapper;

import com.smartehs.model.PsmPtw;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PsmPtwMapper {
    List<PsmPtw> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int count();
    int countByStatus(@Param("status") String status);
    PsmPtw findById(@Param("id") Long id);
    int countByPtwNoStartingWith(@Param("prefix") String prefix);
    void insert(PsmPtw p);
    void update(PsmPtw p);
    void softDelete(@Param("id") Long id);
}
