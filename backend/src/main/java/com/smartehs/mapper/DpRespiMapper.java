package com.smartehs.mapper;

import com.smartehs.model.DpRespi;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface DpRespiMapper {
    List<DpRespi> findAll();
    DpRespi findById(@Param("id") Long id);
    int countAll();
    int countByStatus(@Param("status") String status);
    void insert(DpRespi e);
    void update(DpRespi e);
    void softDelete(@Param("id") Long id);
}
