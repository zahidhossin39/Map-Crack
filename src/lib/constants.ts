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
    key: 'barbershop',
    label: 'Barbershop',
    types: ['barber_shop', 'hair_salon'],
  },
  {
    key: 'hair_salon',
    label: 'Hair salon',
    types: ['hair_salon', 'beauty_salon'],
  },
  {
    key: 'nail_salon',
    label: 'Nail salon',
    types: ['nail_salon'],
  },
  {
    key: 'spa',
    label: 'Spa',
    types: ['spa'],
  },
  {
    key: 'plumbing',
    label: 'Plumbing',
    types: ['plumber'],
  },
  {
    key: 'electrician',
    label: 'Electrician',
    types: ['electrician'],
  },
  {
    key: 'landscaping',
    label: 'Landscaping',
    types: ['landscape_architect', 'gardener'],
  },
  {
    key: 'roofing',
    label: 'Roofing',
    types: ['roofing_contractor'],
  },
  {
    key: 'painting',
    label: 'Painting',
    types: ['painter'],
  },
  {
    key: 'general_contractor',
    label: 'General contractor',
    types: ['general_contractor'],
  },
  {
    key: 'auto_repair',
    label: 'Auto repair',
    types: ['car_repair'],
  },
  {
    key: 'car_wash',
    label: 'Car wash',
    types: ['car_wash'],
  },
  {
    key: 'restaurant',
    label: 'Restaurant',
    types: ['restaurant', 'meal_takeaway', 'meal_delivery'],
  },
  {
    key: 'cafe',
    label: 'Cafe',
    types: ['cafe', 'coffee_shop'],
  },
  {
    key: 'bakery',
    label: 'Bakery',
    types: ['bakery'],
  },
  {
    key: 'bar',
    label: 'Bar',
    types: ['bar', 'pub'],
  },
  {
    key: 'gym',
    label: 'Gym',
    types: ['gym', 'fitness_center'],
  },
  {
    key: 'dentist',
    label: 'Dentist',
    types: ['dentist', 'dental_clinic'],
  },
  {
    key: 'veterinary',
    label: 'Veterinary',
    types: ['veterinary_care'],
  },
  {
    key: 'florist',
    label: 'Florist',
    types: ['florist'],
  },
  {
    key: 'pet_store',
    label: 'Pet store',
    types: ['pet_store'],
  },
  {
    key: 'real_estate',
    label: 'Real estate',
    types: ['real_estate_agency'],
  },
  {
    key: 'insurance',
    label: 'Insurance',
    types: ['insurance_agency'],
  },
  {
    key: 'law_firm',
    label: 'Law firm',
    types: ['lawyer'],
  },
];
