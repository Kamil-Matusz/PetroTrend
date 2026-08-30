package com.petrotrend.PetroTrend;

import org.springframework.boot.SpringApplication;

public class TestPetroTrendApplication {

	public static void main(String[] args) {
		SpringApplication.from(PetroTrendApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
