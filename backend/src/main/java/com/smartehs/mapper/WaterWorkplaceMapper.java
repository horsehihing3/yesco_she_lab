package com.smartehs.mapper;

import com.smartehs.model.WaterWorkplace;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface WaterWorkplaceMapper {

    List<WaterWorkplace> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    WaterWorkplace findById(@Param("id") Long id);

    List<WaterWorkplace> findByNameContaining(@Param("keyword") String keyword, @Param("offset") int offset, @Param("limit") int limit);

    int countByNameContaining(@Param("keyword") String keyword);

    void insert(WaterWorkplace waterWorkplace);

    void update(WaterWorkplace waterWorkplace);

    void delete(@Param("id") Long id);
}
