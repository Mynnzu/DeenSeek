import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';

export interface PrayerTimeResult {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

export function getPrayerTimes(latitude: number, longitude: number): PrayerTimeResult {
  const coordinates = new Coordinates(latitude, longitude);
  const date = new Date();
  
  // Choose a calculation method. Default to Muslim World League as it's widely used.
  // In a more advanced version, we could detect this based on country.
  const params = CalculationMethod.MuslimWorldLeague();
  
  const prayerTimes = new PrayerTimes(coordinates, date, params);

  return {
    fajr: prayerTimes.fajr,
    sunrise: prayerTimes.sunrise,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha,
  };
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
