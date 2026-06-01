package com.smartehs.service;

import com.smartehs.exception.ResourceNotFoundException;
import com.smartehs.mapper.*;
import com.smartehs.model.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RadiationService {

    private final RadSourceMapper sourceMapper;
    private final RadWorkerMapper workerMapper;
    private final RadDoseMapper doseMapper;
    private final RadZoneMapper zoneMapper;
    private final RadMeasurementMapper measurementMapper;
    private final RadHealthMapper healthMapper;
    private final RadAccidentMapper accidentMapper;
    private final RadDrillMapper drillMapper;

    // ===== Source =====
    @Transactional(readOnly = true) public List<RadSource> findAllSources() { return sourceMapper.findAll(); }
    @Transactional public RadSource createSource(RadSource e) { e.setDeleted(false); sourceMapper.insert(e); return sourceMapper.findById(e.getId()); }
    @Transactional public RadSource updateSource(Long id, RadSource e) {
        if (sourceMapper.findById(id) == null) throw new ResourceNotFoundException("RadSource", "id", id);
        e.setId(id); sourceMapper.update(e); return sourceMapper.findById(id);
    }
    @Transactional public void deleteSource(Long id) { sourceMapper.softDelete(id); }

    // ===== Worker =====
    @Transactional(readOnly = true) public List<RadWorker> findAllWorkers() { return workerMapper.findAll(); }
    @Transactional public RadWorker createWorker(RadWorker e) { e.setDeleted(false); workerMapper.insert(e); return workerMapper.findById(e.getId()); }
    @Transactional public RadWorker updateWorker(Long id, RadWorker e) {
        if (workerMapper.findById(id) == null) throw new ResourceNotFoundException("RadWorker", "id", id);
        e.setId(id); workerMapper.update(e); return workerMapper.findById(id);
    }
    @Transactional public void deleteWorker(Long id) { workerMapper.softDelete(id); }

    // ===== Dose =====
    @Transactional(readOnly = true) public List<RadDose> findAllDoses() { return doseMapper.findAll(); }
    @Transactional public RadDose createDose(RadDose e) { e.setDeleted(false); doseMapper.insert(e); return doseMapper.findById(e.getId()); }
    @Transactional public RadDose updateDose(Long id, RadDose e) {
        if (doseMapper.findById(id) == null) throw new ResourceNotFoundException("RadDose", "id", id);
        e.setId(id); doseMapper.update(e); return doseMapper.findById(id);
    }
    @Transactional public void deleteDose(Long id) { doseMapper.softDelete(id); }

    // ===== Zone =====
    @Transactional(readOnly = true) public List<RadZone> findAllZones() { return zoneMapper.findAll(); }
    @Transactional public RadZone createZone(RadZone e) { e.setDeleted(false); zoneMapper.insert(e); return zoneMapper.findById(e.getId()); }
    @Transactional public RadZone updateZone(Long id, RadZone e) {
        if (zoneMapper.findById(id) == null) throw new ResourceNotFoundException("RadZone", "id", id);
        e.setId(id); zoneMapper.update(e); return zoneMapper.findById(id);
    }
    @Transactional public void deleteZone(Long id) { zoneMapper.softDelete(id); }

    // ===== Measurement =====
    @Transactional(readOnly = true) public List<RadMeasurement> findAllMeasurements() { return measurementMapper.findAll(); }
    @Transactional public RadMeasurement createMeasurement(RadMeasurement e) { e.setDeleted(false); measurementMapper.insert(e); return measurementMapper.findById(e.getId()); }
    @Transactional public RadMeasurement updateMeasurement(Long id, RadMeasurement e) {
        if (measurementMapper.findById(id) == null) throw new ResourceNotFoundException("RadMeasurement", "id", id);
        e.setId(id); measurementMapper.update(e); return measurementMapper.findById(id);
    }
    @Transactional public void deleteMeasurement(Long id) { measurementMapper.softDelete(id); }

    // ===== Health =====
    @Transactional(readOnly = true) public List<RadHealth> findAllHealths() { return healthMapper.findAll(); }
    @Transactional public RadHealth createHealth(RadHealth e) { e.setDeleted(false); healthMapper.insert(e); return healthMapper.findById(e.getId()); }
    @Transactional public RadHealth updateHealth(Long id, RadHealth e) {
        if (healthMapper.findById(id) == null) throw new ResourceNotFoundException("RadHealth", "id", id);
        e.setId(id); healthMapper.update(e); return healthMapper.findById(id);
    }
    @Transactional public void deleteHealth(Long id) { healthMapper.softDelete(id); }

    // ===== Accident =====
    @Transactional(readOnly = true) public List<RadAccident> findAllAccidents() { return accidentMapper.findAll(); }
    @Transactional public RadAccident createAccident(RadAccident e) { e.setDeleted(false); accidentMapper.insert(e); return accidentMapper.findById(e.getId()); }
    @Transactional public RadAccident updateAccident(Long id, RadAccident e) {
        if (accidentMapper.findById(id) == null) throw new ResourceNotFoundException("RadAccident", "id", id);
        e.setId(id); accidentMapper.update(e); return accidentMapper.findById(id);
    }
    @Transactional public void deleteAccident(Long id) { accidentMapper.softDelete(id); }

    // ===== Drill =====
    @Transactional(readOnly = true) public List<RadDrill> findAllDrills() { return drillMapper.findAll(); }
    @Transactional public RadDrill createDrill(RadDrill e) { e.setDeleted(false); drillMapper.insert(e); return drillMapper.findById(e.getId()); }
    @Transactional public RadDrill updateDrill(Long id, RadDrill e) {
        if (drillMapper.findById(id) == null) throw new ResourceNotFoundException("RadDrill", "id", id);
        e.setId(id); drillMapper.update(e); return drillMapper.findById(id);
    }
    @Transactional public void deleteDrill(Long id) { drillMapper.softDelete(id); }

    // ===== Stats =====
    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Map<String, Object> s = new HashMap<>();

        s.put("sourceTotal",   sourceMapper.countAll());
        s.put("sourceValid",   sourceMapper.countByStatus("유효"));
        s.put("sourceExpired", sourceMapper.countByStatus("만료"));
        s.put("sourceNear",    sourceMapper.countByExpireWithinDays(60));

        int workerTotal = workerMapper.countAll();
        int workerAlert = workerMapper.countByStatus("경보");
        s.put("workerTotal",  workerTotal);
        s.put("workerAlert",  workerAlert);
        s.put("workerNormal", Math.max(0, workerTotal - workerAlert));

        // 피폭선량 통계 — 전체 doses 기반으로 평균·최대·연한도 초과 산출
        List<RadDose> allDoses = doseMapper.findAll();
        double sum = 0; double max = 0; int overLimit = 0; int n = 0;
        for (RadDose d : allDoses) {
            if (d.getEffectiveDose() == null) continue;
            double ev = d.getEffectiveDose().doubleValue();
            sum += ev;
            if (ev > max) max = ev;
            if (ev >= 20.0) overLimit++;
            n++;
        }
        s.put("doseAvg",       n == 0 ? 0.0 : Math.round((sum / n) * 100.0) / 100.0);
        s.put("doseMax",       Math.round(max * 100.0) / 100.0);
        s.put("doseOverLimit", overLimit);

        s.put("zoneTotal",        zoneMapper.countByType("방사선관리구역")
                                 + zoneMapper.countByType("방사선작업구역")
                                 + zoneMapper.countByType("감시구역"));

        s.put("measureTotal",     measurementMapper.countAll());
        s.put("measureOverCount", measurementMapper.countByEvaluation("초과"));

        s.put("healthAbnormalCount", healthMapper.countByJudgment("C1")
                                    + healthMapper.countByJudgment("C2")
                                    + healthMapper.countByJudgment("D1")
                                    + healthMapper.countByJudgment("D2"));

        s.put("accidentTotal", accidentMapper.countAll());
        s.put("accidentOpen",  accidentMapper.countByStatus("조사중")
                              + accidentMapper.countByStatus("재발방지중"));
        return s;
    }
}
