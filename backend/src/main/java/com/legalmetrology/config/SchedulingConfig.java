package com.legalmetrology.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Enables the background jobs that maintain certificate status and expiry reminders.
 */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
