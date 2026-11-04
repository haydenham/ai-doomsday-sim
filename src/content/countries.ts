import type { Country } from '../sim/types';

// x/y on a 1000x500 equirectangular canvas (x = (lon+180)/360*1000, y = (90-lat)/180*500).
const c = (id: string, name: string, lon: number, lat: number, bloc: Country['bloc'], stance: number): Country => ({
  id, name, x: ((lon + 180) / 360) * 1000, y: ((90 - lat) / 180) * 500, bloc, stance, inDeal: false, halted: false,
});

export const COUNTRIES: Country[] = [
  c('us', 'United States', -98, 39, 'us', 1),
  c('ca', 'Canada', -100, 57, 'us', 0.9),
  c('mx', 'Mexico', -102, 23, 'row', 0.4),
  c('br', 'Brazil', -50, -10, 'row', 0),
  c('ar', 'Argentina', -64, -34, 'row', 0.1),
  c('uk', 'United Kingdom', -2, 54, 'us', 0.9),
  c('eu', 'European Union', 10, 50, 'us', 0.7),
  c('no', 'Nordics', 18, 63, 'us', 0.8),
  c('tr', 'Turkey', 35, 39, 'row', 0),
  c('ru', 'Russia', 60, 60, 'cn', -0.7),
  c('sa', 'Gulf States', 47, 24, 'row', 0.2),
  c('ng', 'Nigeria', 8, 9, 'row', 0),
  c('za', 'South Africa', 25, -29, 'row', 0),
  c('in', 'India', 79, 22, 'row', 0.2),
  c('cn', 'China', 104, 35, 'cn', -1),
  c('tw', 'Taiwan', 121, 23.7, 'us', 0.8),
  c('kr', 'South Korea', 128, 36, 'us', 0.8),
  c('jp', 'Japan', 138, 37, 'us', 0.9),
  c('id', 'Indonesia', 117, -2, 'row', -0.1),
  c('au', 'Australia', 134, -25, 'us', 0.8),
];
