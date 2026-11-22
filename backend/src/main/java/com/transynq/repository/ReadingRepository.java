package com.transynq.repository;

import com.transynq.entity.Reading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReadingRepository extends JpaRepository<Reading, Long> {
    List<Reading> findByAssetIdAndRecordedAtAfterOrderByRecordedAtDesc(Long assetId, Instant after);
    Optional<Reading> findFirstByAssetIdOrderByRecordedAtDesc(Long assetId);
}
