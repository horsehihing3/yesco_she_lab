package com.smartehs.mapper;

import com.smartehs.model.DpHearing;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface DpHearingMapper {
    List<DpHearing> findAll();
    DpHearing findById(@Param("id") Long id);
    int countAll();
    int countByStatus(@Param("status") String status);
    void insert(DpHearing e);
    void update(DpHearing e);
    void softDelete(@Param("id") Long id);
}
