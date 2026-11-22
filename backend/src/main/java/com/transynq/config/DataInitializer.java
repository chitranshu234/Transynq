package com.transynq.config;

import com.transynq.entity.Asset;
import com.transynq.repository.AssetRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    public CommandLineRunner initDatabase(AssetRepository assetRepository) {
        return args -> {
            if (!assetRepository.existsByCode("TR-101")) {
                Asset tr101 = new Asset(
                        "TR-101",
                        "Substation A - Main Power Transformer (100 MVA)",
                        "Substation A, Bay 3",
                        "NORMAL",
                        "HEALTHY"
                );
                assetRepository.save(tr101);
                log.info("Seeded primary asset TR-101 successfully.");
            }
        };
    }
}
