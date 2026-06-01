package com.smartehs.service;

import com.smartehs.dto.request.CodeDetailRequest;
import com.smartehs.dto.request.CodeGroupRequest;
import com.smartehs.dto.response.CodeDetailResponse;
import com.smartehs.dto.response.CodeGroupResponse;
import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.CodeDetailMapper;
import com.smartehs.mapper.CodeGroupMapper;
import com.smartehs.model.CodeDetail;
import com.smartehs.model.CodeGroup;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CodeManageService {

    private final CodeGroupMapper codeGroupMapper;
    private final CodeDetailMapper codeDetailMapper;

    // ===== Code Group =====

    @Transactional(readOnly = true)
    public List<CodeGroupResponse> findAllGroups() {
        return codeGroupMapper.findAll().stream()
                .map(CodeGroupResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CodeGroupResponse> searchGroups(String keyword) {
        return codeGroupMapper.findByKeyword(keyword).stream()
                .map(CodeGroupResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CodeGroupResponse findGroupById(Long id) {
        CodeGroup group = codeGroupMapper.findById(id);
        if (group == null) {
            throw new ResourceNotFoundException("CodeGroup", "id", id);
        }
        return CodeGroupResponse.from(group);
    }

    @Transactional
    public CodeGroupResponse createGroup(CodeGroupRequest request) {
        CodeGroup group = CodeGroup.builder()
                .groupCode(request.getGroupCode())
                .groupName(request.getGroupName())
                .description(request.getDescription())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .build();

        codeGroupMapper.insert(group);
        return CodeGroupResponse.from(codeGroupMapper.findById(group.getId()));
    }

    @Transactional
    public CodeGroupResponse updateGroup(Long id, CodeGroupRequest request) {
        CodeGroup group = codeGroupMapper.findById(id);
        if (group == null) {
            throw new ResourceNotFoundException("CodeGroup", "id", id);
        }

        group.setGroupName(request.getGroupName());
        group.setDescription(request.getDescription());
        group.setIsActive(request.getIsActive() != null ? request.getIsActive() : group.getIsActive());
        group.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : group.getSortOrder());

        codeGroupMapper.update(group);
        return CodeGroupResponse.from(codeGroupMapper.findById(id));
    }

    @Transactional
    public void deleteGroup(Long id) {
        CodeGroup group = codeGroupMapper.findById(id);
        if (group == null) {
            throw new ResourceNotFoundException("CodeGroup", "id", id);
        }
        codeGroupMapper.delete(id);
    }

    // ===== Code Detail =====

    @Transactional(readOnly = true)
    public List<CodeDetailResponse> findDetailsByGroupCode(String groupCode) {
        return codeDetailMapper.findByGroupCode(groupCode).stream()
                .map(CodeDetailResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CodeDetailResponse> findDetailsByGroupId(Long groupId) {
        return codeDetailMapper.findByGroupId(groupId).stream()
                .map(CodeDetailResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CodeDetailResponse> searchDetails(Long groupId, String keyword) {
        return codeDetailMapper.findByGroupIdAndKeyword(groupId, keyword).stream()
                .map(CodeDetailResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CodeDetailResponse findDetailById(Long id) {
        CodeDetail detail = codeDetailMapper.findById(id);
        if (detail == null) {
            throw new ResourceNotFoundException("CodeDetail", "id", id);
        }
        return CodeDetailResponse.from(detail);
    }

    @Transactional
    public CodeDetailResponse createDetail(CodeDetailRequest request) {
        CodeDetail detail = CodeDetail.builder()
                .groupId(request.getGroupId())
                .code(request.getCode())
                .codeNameKo(request.getCodeNameKo())
                .codeNameEn(request.getCodeNameEn())
                .codeNameZh(request.getCodeNameZh())
                .descriptionKo(request.getDescriptionKo())
                .descriptionEn(request.getDescriptionEn())
                .descriptionZh(request.getDescriptionZh())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .build();

        codeDetailMapper.insert(detail);
        return CodeDetailResponse.from(codeDetailMapper.findById(detail.getId()));
    }

    @Transactional
    public CodeDetailResponse updateDetail(Long id, CodeDetailRequest request) {
        CodeDetail detail = codeDetailMapper.findById(id);
        if (detail == null) {
            throw new ResourceNotFoundException("CodeDetail", "id", id);
        }

        detail.setCodeNameKo(request.getCodeNameKo());
        detail.setCodeNameEn(request.getCodeNameEn());
        detail.setCodeNameZh(request.getCodeNameZh());
        detail.setDescriptionKo(request.getDescriptionKo());
        detail.setDescriptionEn(request.getDescriptionEn());
        detail.setDescriptionZh(request.getDescriptionZh());
        detail.setIsActive(request.getIsActive() != null ? request.getIsActive() : detail.getIsActive());
        detail.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : detail.getSortOrder());

        codeDetailMapper.update(detail);
        return CodeDetailResponse.from(codeDetailMapper.findById(id));
    }

    @Transactional
    public void deleteDetail(Long id) {
        CodeDetail detail = codeDetailMapper.findById(id);
        if (detail == null) {
            throw new ResourceNotFoundException("CodeDetail", "id", id);
        }
        codeDetailMapper.delete(id);
    }
}
