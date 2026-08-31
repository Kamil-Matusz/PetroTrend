package com.petrotrend.PetroTrend.controllers;

import com.petrotrend.PetroTrend.dto.FuelPriceFilter;
import com.petrotrend.PetroTrend.dto.FuelPriceRequest;
import com.petrotrend.PetroTrend.dto.FuelPriceResponse;
import com.petrotrend.PetroTrend.services.FuelPriceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
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

    @GetMapping("/currentMonth")
    public List<FuelPriceResponse> findCurrentMonthFuelPrices() {
        return fuelPriceService.findCurrentMonth();
    }

    @GetMapping("/range")
    public List<FuelPriceResponse> findFuelPricesByDateRange(
                                                             @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) final LocalDate from,
                                                             @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) final LocalDate to) {
        return fuelPriceService.findByDateRange(from, to);
    }

    @GetMapping("/search")
    public PagedModel<FuelPriceResponse> searchFuelPrices(
                                                          @ParameterObject @ModelAttribute final FuelPriceFilter filter,
                                                          @ParameterObject @PageableDefault(size = 20, sort = "date", direction = Sort.Direction.DESC) final Pageable pageable) {
        return new PagedModel<>(fuelPriceService.search(filter, pageable));
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
