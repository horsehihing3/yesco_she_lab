package com.smartehs.mapper;

import com.smartehs.model.PsmMoc;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PsmMocMapper {
    List<PsmMoc> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int count();
    PsmMoc findById(@Param("id") Long id);
    int countByStatus(@Param("status") String status);
    int countByMocNoStartingWith(@Param("prefix") String prefix);
    void insert(PsmMoc m);
    void update(PsmMoc m);
    void softDelete(@Param("id") Long id);
}
