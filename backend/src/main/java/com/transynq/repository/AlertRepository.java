package com.transynq.repository;

import com.transynq.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByAssetIdAndResolvedAtIsNullOrderByRecordedAtDesc(Long assetId);
    List<Alert> findByAssetIdOrderByRecordedAtDesc(Long assetId);
    Optional<Alert> findFirstByAssetIdAndParameterAndResolvedAtIsNullOrderByRecordedAtDesc(Long assetId, String parameter);
}
