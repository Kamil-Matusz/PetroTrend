package com.petrotrend.PetroTrend.repositories;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.data.mongodb.uri=mongodb://localhost:27017/petrotrend-wiring",
        "spring.data.mongodb.auto-index-creation=false"
})
class FuelPriceRepositoryWiringTest {

    @Autowired
    private FuelPriceRepository fuelPriceRepository;

    @Test
    void customFragmentIsWiredIntoTheRepositoryProxy() {
        //given
        //when
        //then
        assertThat(fuelPriceRepository).isInstanceOf(FuelPriceRepositoryCustom.class);
    }
}
