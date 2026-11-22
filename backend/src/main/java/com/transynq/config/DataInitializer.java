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
            seedIfMissing(assetRepository, "TR-101",
                    "Main Power Transformer (100 MVA)", "Substation A, Bay 3");
            seedIfMissing(assetRepository, "TR-202",
                    "Distribution Transformer (25 MVA)", "Substation B, Bay 1");
            seedIfMissing(assetRepository, "SG-301",
                    "11 kV Switchgear Panel", "Substation A, Bay 7");
        };
    }

    private void seedIfMissing(AssetRepository repo, String code, String name, String location) {
        if (!repo.existsByCode(code)) {
            repo.save(new Asset(code, name, location, "NORMAL", "HEALTHY"));
            log.info("Seeded asset {} successfully.", code);
        }
    }
}
