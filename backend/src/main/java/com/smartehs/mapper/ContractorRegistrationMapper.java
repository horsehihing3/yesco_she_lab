package com.smartehs.mapper;

import com.smartehs.model.ContractorRegistration;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ContractorRegistrationMapper {

    List<ContractorRegistration> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);

    int countByDeletedFalse();

    List<ContractorRegistration> search(@Param("keyword") String keyword,
                                        @Param("regStatus") String regStatus,
                                        @Param("offset") int offset,
                                        @Param("limit") int limit);

    int countSearch(@Param("keyword") String keyword,
                    @Param("regStatus") String regStatus);

    ContractorRegistration findById(@Param("id") Long id);

    ContractorRegistration findByRegNo(@Param("regNo") String regNo);

    int countByRegNoStartingWith(@Param("prefix") String prefix);

    void insert(ContractorRegistration reg);

    void update(ContractorRegistration reg);

    void updateRegStatus(@Param("id") Long id, @Param("regStatus") String regStatus);

    void softDelete(@Param("id") Long id);
}
