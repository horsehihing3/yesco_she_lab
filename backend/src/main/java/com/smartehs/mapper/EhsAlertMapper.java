package com.smartehs.mapper;

import com.smartehs.model.EhsAlert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EhsAlertMapper {

    List<EhsAlert> findAll();

    List<EhsAlert> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    EhsAlert findById(@Param("id") Long id);

    EhsAlert findByAlertId(@Param("alertId") String alertId);

    List<EhsAlert> findByTitleContaining(@Param("title") String title, @Param("offset") int offset, @Param("limit") int limit);

    int countByTitleContaining(@Param("title") String title);

    void incrementViews(@Param("id") Long id);

    void insert(EhsAlert ehsAlert);

    void update(EhsAlert ehsAlert);

    void delete(@Param("id") Long id);
}
