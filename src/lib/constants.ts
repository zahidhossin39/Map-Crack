import { CategoryOption } from '@/types/business';

export const DEFAULT_CENTER = {
  lat: 40.7128,
  lng: -74.0060, // New York City
  address: 'New York, NY, USA',
};

export const RADIUS_OPTIONS = [
  { value: 250, label: '250m', shortLabel: '250m' },
  { value: 500, label: '500m', shortLabel: '500m' },
  { value: 750, label: '750m (Default)', shortLabel: '750m' },
  { value: 1500, label: '1.5 km', shortLabel: '1.5km' },
  { value: 3000, label: '3 km', shortLabel: '3km' },
  { value: 5000, label: '5 km', shortLabel: '5km' },
];

export const CATEGORIES: CategoryOption[] = [
  {
    key: 'all',
    label: 'All Categories',
    icon: 'Grid',
    types: [],
  },
  {
    key: 'restaurant',
    label: 'Restaurants & Dining',
    icon: 'Utensils',
    types: [
      'restaurant',
      'bakery',
      'bar',
      'meal_takeaway',
      'meal_delivery',
      'fast_food_restaurant',
      'pizza_restaurant',
      'american_restaurant',
      'italian_restaurant',
      'mexican_restaurant',
      'japanese_restaurant',
      'chinese_restaurant',
    ],
  },
  {
    key: 'cafe',
    label: 'Cafes & Bars',
    icon: 'Coffee',
    types: ['cafe', 'coffee_shop', 'bar', 'pub'],
  },
  {
    key: 'store',
    label: 'Retail & Shopping',
    icon: 'ShoppingBag',
    types: [
      'store',
      'clothing_store',
      'convenience_store',
      'department_store',
      'electronics_store',
      'furniture_store',
      'grocery_store',
      'hardware_store',
      'home_goods_store',
      'jewelry_store',
      'liquor_store',
      'pet_store',
      'shoe_store',
      'shopping_mall',
      'supermarket',
    ],
  },
  {
    key: 'services',
    label: 'Services & Trades',
    icon: 'Wrench',
    types: [
      'locksmith',
      'plumber',
      'electrician',
      'roofing_contractor',
      'painter',
      'moving_company',
      'laundry',
      'dry_cleaning',
      'real_estate_agency',
      'lawyer',
      'accounting',
      'insurance_agency',
      'travel_agency',
    ],
  },
  {
    key: 'health',
    label: 'Health & Medical',
    icon: 'HeartPulse',
    types: [
      'dentist',
      'doctor',
      'pharmacy',
      'physiotherapist',
      'hospital',
      'veterinary_care',
      'medical_lab',
    ],
  },
  {
    key: 'beauty',
    label: 'Beauty & Wellness',
    icon: 'Sparkles',
    types: ['beauty_salon', 'hair_care', 'hair_salon', 'spa', 'nail_salon', 'barber_shop', 'gym'],
  },
  {
    key: 'automotive',
    label: 'Automotive & Repair',
    icon: 'Car',
    types: ['car_repair', 'car_wash', 'car_dealer', 'auto_parts_store', 'gas_station'],
  },
  {
    key: 'lodging',
    label: 'Hotels & Lodging',
    icon: 'Hotel',
    types: ['hotel', 'motel', 'bed_and_breakfast', 'guest_house', 'lodging'],
  },
];
