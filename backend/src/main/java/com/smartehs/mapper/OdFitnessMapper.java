package com.smartehs.mapper;

import com.smartehs.model.OdFitness;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface OdFitnessMapper {
    List<OdFitness> findAll();
    OdFitness findById(@Param("id") Long id);
    void insert(OdFitness e);
    void update(OdFitness e);
    void softDelete(@Param("id") Long id);
}
