export interface CdekTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  jti: string;
}

export interface CdekError {
  code: string;
  message: string;
}

export interface CdekRequest {
  errors?: CdekError[];
  requests?: Array<{
    request_uuid: string;
    type: string;
    state: string;
    errors?: CdekError[];
  }>;
}

export interface TariffResult {
  delivery_sum: number;
  period_min: number;
  period_max: number;
  weight_calc: number;
  currency: string;
  errors?: CdekError[];
}

export interface TariffListResult {
  tariff_codes: Array<{
    tariff_code: number;
    tariff_name: string;
    tariff_description?: string;
    delivery_mode: number;
    delivery_sum: number;
    period_min: number;
    period_max: number;
    calendar_min?: number;
    calendar_max?: number;
  }>;
  errors?: CdekError[];
}

export interface CdekOrder {
  entity?: {
    uuid: string;
    cdek_number?: string;
    is_return: boolean;
    is_reverse: boolean;
    type: number;
    statuses?: CdekStatus[];
    delivery_detail?: {
      date: string;
      recipient_name?: string;
    };
  };
  requests?: CdekRequest["requests"];
  related_entities?: Array<{ uuid: string; type: string }>;
  errors?: CdekError[];
}

export interface CdekStatus {
  code: string;
  name: string;
  date_time: string;
  city: string;
}

export interface CdekCity {
  code: number;
  city: string;
  fias_guid?: string;
  country_code: string;
  region: string;
  sub_region?: string;
}

export interface CdekRegion {
  region: string;
  region_code?: number;
  country_code: string;
  country: string;
}

export interface CdekDeliveryPoint {
  code: string;
  name: string;
  location: {
    country_code: string;
    region_code: number;
    city_code: number;
    city: string;
    address: string;
    postal_code?: string;
    longitude: number;
    latitude: number;
  };
  type: string;
  owner_code: string;
  work_time: string;
  is_dressing_room: boolean;
  have_cashless: boolean;
  have_cash: boolean;
  nearest_station?: string;
  nearest_metro_station?: string;
}

export interface CdekIntake {
  entity?: {
    uuid: string;
    order_uuid: string;
    cdek_number?: string;
    intake_date: string;
    intake_time_from: string;
    intake_time_to: string;
    statuses?: CdekStatus[];
  };
  requests?: CdekRequest["requests"];
  errors?: CdekError[];
}

export interface CdekWebhook {
  entity?: {
    uuid: string;
    url: string;
    type: string;
  };
  requests?: CdekRequest["requests"];
  errors?: CdekError[];
}

export interface CdekPrintResponse {
  entity?: {
    uuid: string;
    url?: string;
    statuses?: Array<{
      code: string;
      name: string;
      date_time: string;
    }>;
  };
  requests?: CdekRequest["requests"];
  errors?: CdekError[];
}
