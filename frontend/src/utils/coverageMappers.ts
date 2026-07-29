import { CoverageArea, CoverageCity, CoverageGeneralData } from '@types';

export function mapCoverageAreasResponse(axiosResponse: { data?: any }): CoverageArea[] {
  const envelope = axiosResponse?.data;
  const list = envelope?.data ?? envelope?.Data ?? [];
  if (!Array.isArray(list)) return [];
  return list
    .map((row: any) => ({
      coverageAreaId: Number(row.coverageAreaId ?? row.CoverageAreaId ?? 0),
      name: String(row.name ?? row.Name ?? ''),
      arabicName: row.arabicName ?? row.ArabicName ?? null,
    }))
    .filter((a: CoverageArea) => a.coverageAreaId > 0);
}

export function mapGeneralDataAndCities(axiosResponse: { data?: any }): CoverageGeneralData {
  const body = axiosResponse?.data ?? {};
  const citiesRaw = body.cities ?? body.Cities ?? [];
  const cities: CoverageCity[] = Array.isArray(citiesRaw)
    ? citiesRaw
        .map((c: any) => ({
          citiesId: Number(c.citiesId ?? c.CitiesId ?? c.cityId ?? c.CityId ?? 0),
          cityName: String(c.cityName ?? c.CityName ?? ''),
        }))
        .filter((c: CoverageCity) => c.citiesId > 0)
    : [];

  return {
    vatPercentage: String(body.vatPercentage ?? body.VatPercentage ?? '0'),
    country: String(body.country ?? body.Country ?? ''),
    cities,
  };
}
