package com.smartehs.mapper;

import com.smartehs.model.PsmWo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PsmWoMapper {
    List<PsmWo> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int count();
    PsmWo findById(@Param("id") Long id);
    int countByWoNoStartingWith(@Param("prefix") String prefix);
    void insert(PsmWo wo);
    void update(PsmWo wo);
    void softDelete(@Param("id") Long id);
}
