package com.smartehs.mapper;

import com.smartehs.model.NearMiss;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface NearMissMapper {

    List<NearMiss> findAll();

    List<NearMiss> findAllWithPaging(@Param("offset") int offset, @Param("limit") int limit);

    int countAll();

    NearMiss findById(@Param("id") Long id);

    NearMiss findByIdAndDeletedFalse(@Param("id") Long id);

    NearMiss findByNearMissIdAndDeletedFalse(@Param("nearMissId") String nearMissId);

    List<NearMiss> findByDeletedFalse(@Param("offset") int offset, @Param("limit") int limit);

    int countByDeletedFalse();

    List<NearMiss> findByOccTitleContainingAndDeletedFalse(@Param("occTitle") String occTitle, @Param("offset") int offset, @Param("limit") int limit);

    int countByOccTitleContainingAndDeletedFalse(@Param("occTitle") String occTitle);

    List<NearMiss> findByStatusAndDeletedFalse(@Param("status") String status, @Param("offset") int offset, @Param("limit") int limit);

    int countByStatusAndDeletedFalse(@Param("status") String status);

    List<NearMiss> findByWorkPlaceIdAndDeletedFalse(@Param("workPlaceId") Long workPlaceId, @Param("offset") int offset, @Param("limit") int limit);

    int countByWorkPlaceIdAndDeletedFalse(@Param("workPlaceId") Long workPlaceId);

    List<NearMiss> findByIncidentTypeAndDeletedFalse(@Param("incidentType") String incidentType, @Param("offset") int offset, @Param("limit") int limit);

    int countByIncidentTypeAndDeletedFalse(@Param("incidentType") String incidentType);

    int countByNearMissIdStartingWith(@Param("prefix") String prefix);

    void insert(NearMiss nearMiss);

    void update(NearMiss nearMiss);

    void delete(@Param("id") Long id);

    void softDelete(@Param("id") Long id);
}
