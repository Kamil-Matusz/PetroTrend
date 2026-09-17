package com.petrotrend.PetroTrend.services;

import com.petrotrend.PetroTrend.dto.FuelPriceBatchRequest;
import com.petrotrend.PetroTrend.dto.FuelPriceBatchResponse;
import com.petrotrend.PetroTrend.dto.FuelPriceFilter;
import com.petrotrend.PetroTrend.dto.FuelPriceRequest;
import com.petrotrend.PetroTrend.entities.FuelPrice;
import com.petrotrend.PetroTrend.enums.Currency;
import com.petrotrend.PetroTrend.enums.FuelSymbol;
import com.petrotrend.PetroTrend.exceptions.DuplicateFuelPriceInBatchException;
import com.petrotrend.PetroTrend.exceptions.InvalidDateRangeException;
import com.petrotrend.PetroTrend.exceptions.InvalidSortPropertyException;
import com.petrotrend.PetroTrend.mappers.FuelPriceMapper;
import com.petrotrend.PetroTrend.repositories.FuelPriceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FuelPriceServiceTest {

    private static final FuelPriceFilter EMPTY_FILTER = new FuelPriceFilter(null, null, null, null);

    private static final LocalDate TODAY = LocalDate.of(2026, 9, 17);

    @Mock
    private FuelPriceRepository fuelPriceRepository;

    @Mock
    private FuelPriceMapper fuelPriceMapper;

    @InjectMocks
    private FuelPriceService fuelPriceService;

    @Captor
    private ArgumentCaptor<LocalDate> fromCaptor;

    @Captor
    private ArgumentCaptor<LocalDate> toCaptor;

    @Captor
    private ArgumentCaptor<FuelPrice> fuelPriceCaptor;

    @Test
    void latestPerFuelPassesRequestedSymbolsToTheRepository() {
        //given
        final Set<FuelSymbol> fuelSymbols = Set.of(FuelSymbol.ON, FuelSymbol.PB95);
        final List<FuelPrice> latest = List.of(new FuelPrice());
        when(fuelPriceRepository.findLatestPerFuel(fuelSymbols)).thenReturn(latest);
        when(fuelPriceMapper.convertToResponses(latest)).thenReturn(List.of());

        //when
        fuelPriceService.findLatestPerFuel(fuelSymbols);

        //then
        verify(fuelPriceRepository).findLatestPerFuel(fuelSymbols);
        verify(fuelPriceMapper).convertToResponses(latest);
    }

    @Test
    void currentMonthQueriesFirstAndLastDayOfCurrentMonth() {
        //given
        when(fuelPriceRepository.findInDateRange(any(), any()))
                .thenReturn(List.of());
        when(fuelPriceMapper.convertToResponses(List.of())).thenReturn(List.of());

        //when
        fuelPriceService.findCurrentMonth();

        //then
        verify(fuelPriceRepository).findInDateRange(fromCaptor.capture(), toCaptor.capture());
        final YearMonth expected = YearMonth.now();
        assertThat(fromCaptor.getValue()).isEqualTo(expected.atDay(1));
        assertThat(toCaptor.getValue()).isEqualTo(expected.atEndOfMonth());
    }

    @Test
    void invertedRangeOnRangeEndpointThrowsWithoutHittingRepository() {
        //given
        final LocalDate from = LocalDate.of(2026, 8, 31);
        final LocalDate to = LocalDate.of(2026, 8, 1);

        //when
        //then
        assertThatThrownBy(() -> fuelPriceService.findByDateRange(from, to))
                .isInstanceOf(InvalidDateRangeException.class);
        verify(fuelPriceRepository, never())
                .findInDateRange(any(), any());
    }

    @Test
    void invertedRangeOnSearchThrowsWithoutHittingRepository() {
        //given
        final FuelPriceFilter filter =
                new FuelPriceFilter(null, null, LocalDate.of(2026, 8, 31), LocalDate.of(2026, 8, 1));

        //when
        //then
        assertThatThrownBy(() -> fuelPriceService.search(filter, PageRequest.of(0, 20))).isInstanceOf(InvalidDateRangeException.class);
        verify(fuelPriceRepository, never()).search(any(), any());
    }

    @Test
    void searchAcceptsOpenEndedRange() {
        //given
        final FuelPriceFilter filter = new FuelPriceFilter(null, null, LocalDate.of(2026, 8, 31), null);
        final Pageable pageable = PageRequest.of(0, 20);
        when(fuelPriceRepository.search(filter, pageable)).thenReturn(Page.empty(pageable));

        //when
        final Page<?> result = fuelPriceService.search(filter, pageable);

        //then
        assertThat(result).isEmpty();
    }

    @Test
    void searchRejectsSortOnUnsupportedProperty() {
        //given
        final Pageable pageable = PageRequest.of(0, 20, Sort.by("source"));

        //when
        //then
        assertThatThrownBy(() -> fuelPriceService.search(EMPTY_FILTER, pageable))
                .isInstanceOf(InvalidSortPropertyException.class)
                .hasMessageContaining("source");
        verify(fuelPriceRepository, never()).search(any(), any());
    }

    @Test
    void searchAllowsSortOnDateAndPrice() {
        //given
        final Pageable pageable = PageRequest.of(0, 20, Sort.by("date").descending().and(Sort.by("price")));
        when(fuelPriceRepository.search(EMPTY_FILTER, pageable)).thenReturn(Page.empty(pageable));

        //when
        //then
        assertThatCode(() -> fuelPriceService.search(EMPTY_FILTER, pageable)).doesNotThrowAnyException();
    }

    @Test
    void searchMapsEntitiesToResponsesPreservingPageMetadata() {
        //given
        final Pageable pageable = PageRequest.of(1, 2);
        final FuelPrice entity = new FuelPrice();
        when(fuelPriceRepository.search(EMPTY_FILTER, pageable)).thenReturn(new PageImpl<>(List.of(entity, entity), pageable, 42));
        when(fuelPriceMapper.convertToResponse(entity)).thenReturn(null);

        //when
        final Page<?> result = fuelPriceService.search(EMPTY_FILTER, pageable);

        //then
        assertThat(result.getTotalElements()).isEqualTo(42);
        assertThat(result.getTotalPages()).isEqualTo(21);
        assertThat(result.getNumber()).isEqualTo(1);
        assertThat(result.getContent()).hasSize(2);
        verify(fuelPriceMapper, never()).convertToResponses(any());
    }

    @Test
    void deleteByDateRangeRemovesEveryPriceInTheWindow() {
        //given
        final LocalDate from = LocalDate.of(2025, 1, 1);
        final LocalDate to = LocalDate.of(2025, 12, 31);

        //when
        fuelPriceService.deleteByDateRange(from, to);

        //then
        verify(fuelPriceRepository).deleteInDateRange(from, to);
    }

    @Test
    void invertedRangeOnDeleteThrowsWithoutHittingRepository() {
        //given
        final LocalDate from = LocalDate.of(2025, 12, 31);
        final LocalDate to = LocalDate.of(2025, 1, 1);

        //when
        //then
        assertThatThrownBy(() -> fuelPriceService.deleteByDateRange(from, to)).isInstanceOf(InvalidDateRangeException.class);
        verify(fuelPriceRepository, never()).deleteInDateRange(any(), any());
    }

    @Test
    void createBatchInsertsFuelPricesThatDoNotExistYet() {
        //given
        final FuelPriceRequest diesel = request(FuelSymbol.ON, new BigDecimal("6.42"));
        final FuelPriceRequest petrol = request(FuelSymbol.PB95, new BigDecimal("5.89"));
        final FuelPrice entity = new FuelPrice();
        when(fuelPriceRepository.findByFuelSymbolAndCurrencyAndDate(any(), any(), any())).thenReturn(Optional.empty());
        when(fuelPriceMapper.convertToDto(any())).thenReturn(entity);
        when(fuelPriceRepository.save(entity)).thenReturn(entity);
        when(fuelPriceMapper.convertToResponse(entity)).thenReturn(null);

        //when
        final FuelPriceBatchResponse result = fuelPriceService.createBatch(new FuelPriceBatchRequest(List.of(diesel, petrol)));

        //then
        assertThat(result.created()).hasSize(2);
        assertThat(result.updated()).isEmpty();
        verify(fuelPriceRepository, times(2)).save(entity);
        verify(fuelPriceMapper, never()).convertToEntity(any(), any());
    }

    @Test
    void createBatchOverwritesExistingFuelPriceKeepingIdAndCreatedAt() {
        //given
        final FuelPriceRequest diesel = request(FuelSymbol.ON, new BigDecimal("6.49"));
        final FuelPrice existing = FuelPrice.builder()
                .id("existing-id")
                .fuelSymbol(FuelSymbol.ON)
                .currency(Currency.PLN)
                .price(new BigDecimal("6.42"))
                .date(TODAY)
                .createdAt(Instant.parse("2026-01-01T10:15:30Z"))
                .build();
        when(fuelPriceRepository.findByFuelSymbolAndCurrencyAndDate(FuelSymbol.ON, Currency.PLN, TODAY)).thenReturn(Optional.of(existing));
        when(fuelPriceRepository.save(existing)).thenReturn(existing);
        when(fuelPriceMapper.convertToResponse(existing)).thenReturn(null);

        //when
        final FuelPriceBatchResponse result = fuelPriceService.createBatch(new FuelPriceBatchRequest(List.of(diesel)));

        //then
        assertThat(result.created()).isEmpty();
        assertThat(result.updated()).hasSize(1);
        verify(fuelPriceMapper).convertToEntity(diesel, existing);
        verify(fuelPriceMapper, never()).convertToDto(any());
        verify(fuelPriceRepository).save(fuelPriceCaptor.capture());
        assertThat(fuelPriceCaptor.getValue().getId()).isEqualTo("existing-id");
        assertThat(fuelPriceCaptor.getValue().getCreatedAt()).isEqualTo(Instant.parse("2026-01-01T10:15:30Z"));
    }

    @Test
    void createBatchRejectsTwoEntriesForTheSameFuelCurrencyAndDate() {
        //given
        final FuelPriceRequest first = request(FuelSymbol.ON, new BigDecimal("6.42"));
        final FuelPriceRequest second = request(FuelSymbol.ON, new BigDecimal("6.49"));
        final FuelPriceBatchRequest batch = new FuelPriceBatchRequest(List.of(first, second));

        //when
        //then
        assertThatThrownBy(() -> fuelPriceService.createBatch(batch))
                .isInstanceOf(DuplicateFuelPriceInBatchException.class)
                .hasMessageContaining("ON");
        verify(fuelPriceRepository, never()).save(any());
    }

    private static FuelPriceRequest request(final FuelSymbol fuelSymbol, final BigDecimal price) {
        return new FuelPriceRequest(fuelSymbol, Currency.PLN, price, TODAY, "Valdi Rzeszów");
    }
}
