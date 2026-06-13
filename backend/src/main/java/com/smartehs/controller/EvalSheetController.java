package com.smartehs.controller;

import com.smartehs.dto.response.ApiResponse;
import com.smartehs.mapper.EvalSheetItemMapper;
import com.smartehs.mapper.EvalSheetMetaMapper;
import com.smartehs.model.EvalSheetItem;
import com.smartehs.model.EvalSheetMeta;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/eval-sheet")
@RequiredArgsConstructor
@Tag(name = "Eval Sheet", description = "평가표 메타·항목")
public class EvalSheetController {

    private final EvalSheetItemMapper itemMapper;
    private final EvalSheetMetaMapper metaMapper;

    // ==================== Items ====================

    /** metaId 미지정 시 첫 번째 평가표 항목만 (구버전 호환) */
    @GetMapping("/items")
    public ResponseEntity<ApiResponse<List<EvalSheetItem>>> findAll(
            @RequestParam(value = "metaId", required = false) Long metaId) {
        if (metaId != null) {
            return ResponseEntity.ok(ApiResponse.success(itemMapper.findByMetaId(metaId)));
        }
        EvalSheetMeta first = metaMapper.findFirst();
        if (first == null) return ResponseEntity.ok(ApiResponse.success(List.of()));
        return ResponseEntity.ok(ApiResponse.success(itemMapper.findByMetaId(first.getId())));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<EvalSheetItem>> create(@RequestBody EvalSheetItem body) {
        if (body.getMetaId() == null) {
            EvalSheetMeta first = metaMapper.findFirst();
            if (first != null) body.setMetaId(first.getId());
        }
        if (body.getSortOrder() == null) {
            body.setSortOrder(itemMapper.nextSortOrder(body.getMetaId()));
        }
        if (body.getMaxScore() == null) {
            body.setMaxScore(BigDecimal.ZERO);
        }
        itemMapper.insert(body);
        return ResponseEntity.ok(ApiResponse.success(itemMapper.findById(body.getId())));
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<ApiResponse<EvalSheetItem>> update(
            @PathVariable Long id,
            @RequestBody EvalSheetItem body) {
        body.setId(id);
        itemMapper.update(body);
        return ResponseEntity.ok(ApiResponse.success(itemMapper.findById(id)));
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        itemMapper.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/save")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> saveAll(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        Map<String, Object> metaMap = (Map<String, Object>) body.get("meta");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("items");
        @SuppressWarnings("unchecked")
        List<Number> removedIds = (List<Number>) body.get("removedIds");

        // 신규 등록(meta.id == null) 이면 새 meta 생성, 아니면 해당 meta 업데이트.
        Long targetMetaId = null;
        if (metaMap != null) {
            Object midVal = metaMap.get("id");
            EvalSheetMeta payload = EvalSheetMeta.builder()
                    .title((String) metaMap.get("title"))
                    .description((String) metaMap.get("description"))
                    .build();
            if (midVal instanceof Number) {
                targetMetaId = ((Number) midVal).longValue();
                payload.setId(targetMetaId);
                metaMapper.update(payload);
            } else {
                metaMapper.insert(payload);
                targetMetaId = payload.getId();
            }
        }
        if (targetMetaId == null) {
            EvalSheetMeta first = metaMapper.findFirst();
            if (first == null) {
                EvalSheetMeta seed = EvalSheetMeta.builder().title("수급업체 평가표").description("").build();
                metaMapper.insert(seed);
                targetMetaId = seed.getId();
            } else {
                targetMetaId = first.getId();
            }
        }

        if (removedIds != null) {
            for (Number rid : removedIds) {
                if (rid != null) itemMapper.delete(rid.longValue());
            }
        }

        if (items != null) {
            int sortOrder = 0;
            for (Map<String, Object> raw : items) {
                sortOrder++;
                EvalSheetItem item = new EvalSheetItem();
                Object idVal = raw.get("id");
                if (idVal instanceof Number) item.setId(((Number) idVal).longValue());
                item.setMetaId(targetMetaId);
                item.setSortOrder(sortOrder);
                item.setCategory((String) raw.get("category"));
                item.setEvalItem((String) raw.get("evalItem"));
                item.setEvalContent((String) raw.get("evalContent"));
                Object ms = raw.get("maxScore");
                item.setMaxScore(ms == null ? BigDecimal.ZERO : new BigDecimal(ms.toString()));
                if (item.getId() != null) itemMapper.update(item);
                else itemMapper.insert(item);
            }
        }

        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "items", itemMapper.findByMetaId(targetMetaId),
                "meta", metaMapper.findById(targetMetaId)
        )));
    }

    @PatchMapping("/items/{id}/score")
    public ResponseEntity<ApiResponse<EvalSheetItem>> updateScore(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Object scoreVal = body.get("score");
        BigDecimal score = null;
        if (scoreVal != null) {
            String s = scoreVal.toString().trim();
            if (!s.isEmpty()) {
                try { score = new BigDecimal(s); }
                catch (NumberFormatException ignored) { /* keep null */ }
            }
        }
        itemMapper.updateScore(id, score);
        return ResponseEntity.ok(ApiResponse.success(itemMapper.findById(id)));
    }

    // ==================== Meta (제목/설명) ====================

    @GetMapping("/meta")
    public ResponseEntity<ApiResponse<EvalSheetMeta>> getMeta() {
        EvalSheetMeta meta = metaMapper.findFirst();
        if (meta == null) {
            meta = EvalSheetMeta.builder().title("수급업체 평가표").description("").build();
            metaMapper.insert(meta);
        }
        return ResponseEntity.ok(ApiResponse.success(meta));
    }

    @PutMapping("/meta")
    public ResponseEntity<ApiResponse<EvalSheetMeta>> updateMeta(@RequestBody EvalSheetMeta body) {
        EvalSheetMeta existing = metaMapper.findFirst();
        if (existing == null) {
            metaMapper.insert(body);
            return ResponseEntity.ok(ApiResponse.success(metaMapper.findFirst()));
        }
        body.setId(existing.getId());
        metaMapper.update(body);
        return ResponseEntity.ok(ApiResponse.success(metaMapper.findFirst()));
    }

    // ==================== 평가표 목록 / 복사 / 삭제 (multi-instance) ====================

    @GetMapping("/metas")
    public ResponseEntity<ApiResponse<List<EvalSheetMeta>>> findAllMetas() {
        return ResponseEntity.ok(ApiResponse.success(metaMapper.findAll()));
    }

    @GetMapping("/meta/{id}")
    public ResponseEntity<ApiResponse<EvalSheetMeta>> getMetaById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(metaMapper.findById(id)));
    }

    @PostMapping("/meta/{id}/copy")
    @Transactional
    public ResponseEntity<ApiResponse<EvalSheetMeta>> copyMeta(@PathVariable Long id) {
        EvalSheetMeta src = metaMapper.findById(id);
        if (src == null) {
            return ResponseEntity.ok(ApiResponse.success(null));
        }
        EvalSheetMeta dup = EvalSheetMeta.builder()
                .title("copy_ " + (src.getTitle() != null ? src.getTitle() : ""))
                .description(src.getDescription())
                .build();
        metaMapper.insert(dup);
        Long newId = dup.getId();
        List<EvalSheetItem> srcItems = itemMapper.findByMetaId(id);
        int order = 0;
        for (EvalSheetItem si : srcItems) {
            order++;
            EvalSheetItem ni = new EvalSheetItem();
            ni.setMetaId(newId);
            ni.setSortOrder(order);
            ni.setCategory(si.getCategory());
            ni.setEvalItem(si.getEvalItem());
            ni.setEvalContent(si.getEvalContent());
            ni.setMaxScore(si.getMaxScore() == null ? BigDecimal.ZERO : si.getMaxScore());
            itemMapper.insert(ni);
        }
        return ResponseEntity.ok(ApiResponse.success(metaMapper.findById(newId)));
    }

    @DeleteMapping("/meta/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteMeta(@PathVariable Long id) {
        itemMapper.deleteByMetaId(id);
        metaMapper.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
