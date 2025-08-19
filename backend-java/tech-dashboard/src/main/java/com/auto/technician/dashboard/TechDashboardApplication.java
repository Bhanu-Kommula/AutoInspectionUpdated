package com.auto.technician.dashboard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.reactive.function.client.WebClient;

@SpringBootApplication
@EnableFeignClients
@EnableDiscoveryClient
@EnableScheduling
public class TechDashboardApplication {

	public static void main(String[] args) {
		SpringApplication.run(TechDashboardApplication.class, args);
		System.out.println("🔧 Tech Dashboard Service Started Successfully! 🚀");
	}

	/**
	 * WebClient bean for inter-service communication
	 */
	@Bean
	public WebClient webClient() {
		return WebClient.builder().build();
	}
}
