package com.petrotrend.PetroTrend.controllers;

import com.petrotrend.PetroTrend.dto.FuelPriceRequest;
import com.petrotrend.PetroTrend.dto.FuelPriceResponse;
import com.petrotrend.PetroTrend.services.FuelPriceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/fuelPrices")
@RequiredArgsConstructor
public class FuelPriceController {

    private final FuelPriceService fuelPriceService;

    @GetMapping
    public List<FuelPriceResponse> findAllFuelPrices() {
        return fuelPriceService.findAll();
    }

    @GetMapping("/{id}")
    public FuelPriceResponse findFuelPriceById(@PathVariable final String id) {
        return fuelPriceService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FuelPriceResponse createFuelPrice(@Valid @RequestBody final FuelPriceRequest request) {
        return fuelPriceService.create(request);
    }

    @PutMapping("/{id}")
    public FuelPriceResponse updateFuelPrice(@PathVariable final String id, @Valid @RequestBody final FuelPriceRequest request) {
        return fuelPriceService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteFuelPrice(@PathVariable final String id) {
        fuelPriceService.delete(id);
    }
}
