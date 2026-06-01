package com.smartehs.mapper;

import com.smartehs.model.FileMetadata;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FileMetadataMapper {

    List<FileMetadata> findAll();

    FileMetadata findById(@Param("id") Long id);

    List<FileMetadata> findByEntityTypeAndEntityId(@Param("entityType") String entityType, @Param("entityId") String entityId);

    List<FileMetadata> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(@Param("entityType") String entityType, @Param("entityId") String entityId);

    void insert(FileMetadata fileMetadata);

    void update(FileMetadata fileMetadata);

    void delete(@Param("id") Long id);

    void deleteByEntityTypeAndEntityId(@Param("entityType") String entityType, @Param("entityId") String entityId);

    List<FileMetadata> findByParentFileId(@Param("parentFileId") Long parentFileId);

    FileMetadata findByParentFileIdAndLanguage(@Param("parentFileId") Long parentFileId, @Param("language") String language);

    void updateTranslationStatus(@Param("id") Long id, @Param("translationStatus") String translationStatus);

    void updateDisplayOrder(@Param("id") Long id, @Param("displayOrder") Integer displayOrder);
}
