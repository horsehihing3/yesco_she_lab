package com.smartehs.mapper;

import com.smartehs.model.RegulationCheck;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface RegulationCheckMapper {

    List<RegulationCheck> findAll(@Param("offset") int offset, @Param("limit") int limit);
    int count();

    RegulationCheck findById(@Param("id") Long id);

    int countByCheckIdStartingWith(@Param("prefix") String prefix);

    void insert(RegulationCheck regulationCheck);
    void update(RegulationCheck regulationCheck);
    void softDelete(@Param("id") Long id);

    List<RegulationCheck> search(@Param("keyword") String keyword,
                                                     @Param("offset") int offset,
                                                     @Param("limit") int limit);
    int countSearch(@Param("keyword") String keyword);
}
