package com.smartehs.mapper;

import com.smartehs.model.DiseasePrevention;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface DiseasePreventionMapper {

    List<DiseasePrevention> findAll(@Param("offset") int offset, @Param("limit") int limit);

    int count();

    DiseasePrevention findById(@Param("id") Long id);

    List<DiseasePrevention> search(@Param("keyword") String keyword, @Param("hazardType") String hazardType,
                                   @Param("offset") int offset, @Param("limit") int limit);

    int countSearch(@Param("keyword") String keyword, @Param("hazardType") String hazardType);

    int countByCaseIdStartingWith(@Param("prefix") String prefix);

    void insert(DiseasePrevention diseasePrevention);

    void update(DiseasePrevention diseasePrevention);

    void softDelete(@Param("id") Long id);
}
