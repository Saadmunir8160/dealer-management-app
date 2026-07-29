export interface CoverageArea {
  coverageAreaId: number;
  name: string;
  arabicName?: string | null;
}

export interface CoverageCity {
  citiesId: number;
  cityName: string;
}

export interface CoverageGeneralData {
  vatPercentage: string;
  country: string;
  cities: CoverageCity[];
}
