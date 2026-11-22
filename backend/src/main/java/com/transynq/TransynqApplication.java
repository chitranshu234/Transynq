package com.transynq;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TransynqApplication {

    public static void main(String[] args) {
        SpringApplication.run(TransynqApplication.class, args);
    }
}
