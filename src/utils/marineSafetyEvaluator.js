/**
 * Marine Safety Evaluator for TerraMarine Frontend
 * Deterministic rule-based classification engine matching official IMD data
 */

export const SEMANTIC_COLORS = {
  GREEN: '#22c55e',
  YELLOW: '#f59e0b',
  RED: '#ef4444',
  UNAVAILABLE: '#94a3b8'
};

export const SEMANTIC_GLOWS = {
  GREEN: '0 0 16px rgba(34, 197, 94, 0.85)',
  YELLOW: '0 0 16px rgba(245, 158, 11, 0.85)',
  RED: '0 0 18px rgba(239, 68, 68, 0.95)',
  UNAVAILABLE: '0 0 10px rgba(148, 163, 184, 0.4)'
};

/**
 * Format timestamp to 12-hour format e.g. "05:29 PM"
 */
export function formatTimeIST(dateInput) {
  if (!dateInput) return 'Live';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return 'Live';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format a Date object to a user-friendly string
 */
export function formatValidUntil(dateObj) {
  if (!dateObj || isNaN(dateObj.getTime())) return 'Next bulletin update';
  const options = {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour12: true
  };
  return dateObj.toLocaleDateString('en-IN', options);
}

/**
 * Parse bulletin validity and determine expiration status
 */
export function parseBulletinValidity(bulletin, currentTime = new Date()) {
  if (!bulletin) {
    return {
      isValid: false,
      isExpired: true,
      validUntil: null,
      formattedValidUntil: 'Information Unavailable',
      sourceTime: null
    };
  }

  const now = currentTime instanceof Date ? currentTime : new Date(currentTime);
  let validUntilDate = null;
  const validFromStr = String(bulletin.validFrom || bulletin.valid_from || '').trim();
  const warningStr = String(bulletin.warning || '').trim();
  const updateTimeStr = String(bulletin.updateTime || bulletin.source_update_time || '').trim();
  const obsDateStr = String(bulletin.observationDate || bulletin.observation_date || '').trim();
  const retrievedAtStr = String(bulletin.retrievedAt || bulletin.retrieved_at || '').trim();
  const validityHours = parseInt(bulletin.validityHours || bulletin.validity_hours || 12, 10) || 12;

  // 1. Try to parse "to HH UTC of YYYY-MM-DD" or "to HH UTC of DD-MM-YYYY" from validFrom
  const utcToMatch = validFromStr.match(/to\s+(\d{1,2})\s*UTC\s*of\s*(\d{4}-\d{2}-\d{2})/i) ||
                     validFromStr.match(/to\s+(\d{1,2})\s*UTC\s*of\s*(\d{2}-\d{2}-\d{4})/i);
  if (utcToMatch) {
    const hours = parseInt(utcToMatch[1], 10);
    let datePart = utcToMatch[2];
    if (datePart.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const parts = datePart.split('-');
      datePart = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const d = new Date(`${datePart}T00:00:00.000Z`);
    if (!isNaN(d.getTime())) {
      d.setUTCHours(hours);
      validUntilDate = d;
    }
  }

  // 2. Try to parse "till HH:MM hours on DD-MM-YYYY" or "till HH:MM IST of DD-MM-YYYY" from warning
  if (!validUntilDate) {
    const tillMatch = warningStr.match(/till\s+(\d{1,2}):(\d{2})\s*(?:hours|ist)?\s*(?:on|of)\s*(\d{2}-\d{2}-\d{4})/i) ||
                      warningStr.match(/till\s+(\d{1,2}):(\d{2})\s*(?:hours|ist)?\s*(?:on|of)\s*(\d{4}-\d{2}-\d{2})/i);
    if (tillMatch) {
      const hours = parseInt(tillMatch[1], 10);
      const mins = parseInt(tillMatch[2], 10);
      let datePart = tillMatch[3];
      if (datePart.match(/^\d{2}-\d{2}-\d{4}$/)) {
        const parts = datePart.split('-');
        datePart = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      const d = new Date(`${datePart}T${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00.000+05:30`);
      if (!isNaN(d.getTime())) {
        validUntilDate = d;
      }
    }
  }

  // 3. Fallback: Parse from updateTime / obsDate / retrievedAt + validityHours (+ grace period)
  if (!validUntilDate) {
    let baseDate = null;
    if (updateTimeStr) {
      const istMatch = updateTimeStr.match(/(\d{1,2}):(\d{2})\s*IST\s*of\s*(\d{4}-\d{2}-\d{2})/i) ||
                       updateTimeStr.match(/(\d{1,2}):(\d{2})\s*IST\s*of\s*(\d{2}-\d{2}-\d{4})/i);
      if (istMatch) {
        const h = parseInt(istMatch[1], 10);
        const m = parseInt(istMatch[2], 10);
        let dt = istMatch[3];
        if (dt.match(/^\d{2}-\d{2}-\d{4}$/)) {
          const parts = dt.split('-');
          dt = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        baseDate = new Date(`${dt}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000+05:30`);
      } else {
        const parsed = new Date(updateTimeStr);
        if (!isNaN(parsed.getTime())) baseDate = parsed;
      }
    }

    if (!baseDate && obsDateStr) {
      baseDate = new Date(`${obsDateStr}T00:00:00.000+05:30`);
    }

    if (!baseDate && retrievedAtStr) {
      const parsed = new Date(retrievedAtStr);
      if (!isNaN(parsed.getTime())) baseDate = parsed;
    }

    if (baseDate && !isNaN(baseDate.getTime())) {
      validUntilDate = new Date(baseDate.getTime() + (validityHours + 12) * 60 * 60 * 1000);
    }
  }

  // Operational Grace Window:
  // IMD bulletins operate in 12-24h publication cycles. A bulletin remains the governing
  // operational forecast for up to 18 hours after its nominal validity window or 30 hours from issue.
  let isExpired = false;
  if (validUntilDate) {
    const operationalLimit = new Date(validUntilDate.getTime() + 18 * 60 * 60 * 1000);
    isExpired = now.getTime() > operationalLimit.getTime();
  } else {
    isExpired = true;
  }
  const isValid = Boolean(validUntilDate && !isExpired);

  return {
    isValid,
    isExpired,
    validUntil: validUntilDate ? validUntilDate.toISOString() : null,
    formattedValidUntil: validUntilDate ? formatValidUntil(validUntilDate) : 'Valid for current cycle',
    sourceTime: updateTimeStr || obsDateStr || retrievedAtStr || null
  };
}

/**
 * Checks if a specific warning/advisory applies to the fisherman's location
 */
export function isWarningApplicableToLocation(warningText, location = {}, coverage = {}) {
  if (!warningText) return false;
  const w = String(warningText).trim().toUpperCase();
  if (!w || w === 'NIL' || w === 'NIL.' || w === 'NIL AT ALL PORTS' || w === 'NONE' || w === 'NO WARNING') {
    return false;
  }

  const district = String(location.district || '').trim().toUpperCase();
  const coastalArea = String(location.coastalArea || location.coastal_area || '').trim().toUpperCase();
  const municipality = String(location.municipality || '').trim().toUpperCase();
  const state = String(location.state || coverage.state || 'KERALA').trim().toUpperCase();
  const region = String(coverage.region || '').trim().toUpperCase();

  // 1. Lakshadweep isolation
  const lakshadweepIslands = ['AGATTI', 'AMINI', 'ANDROTH', 'KAVARATTI', 'KAVARATHI', 'MINICOY', 'KALPENI', 'CHETLAT', 'BITRA', 'KILTAN', 'KADMAT', 'LAKSHADWEEP'];
  const mentionsLakshadweep = lakshadweepIslands.some(isl => w.includes(isl));
  
  const isKeralaUser = state.includes('KERALA') || district.includes('MALAPPURAM') || district.includes('KOZHIKODE') || district.includes('KANNUR') || district.includes('KASARAGOD') || district.includes('ERNAKULAM');
  const mentionsKeralaDirectly = w.includes('KERALA') || w.includes('MALAPPURAM') || w.includes('KASARAGOD') || w.includes('KANNUR') || w.includes('KOZHIKODE') || w.includes('KOZHIKKODE') || w.includes('PONNANI');

  if (isKeralaUser && mentionsLakshadweep && !mentionsKeralaDirectly) {
    return false;
  }

  // 2. North Kerala vs South Kerala isolation
  const isNorthKerala = region.includes('NORTH KERALA') || ['MALAPPURAM', 'KASARAGOD', 'KASARGOD', 'KANNUR', 'KOZHIKODE', 'KOZHIKKODE', 'THRISSUR'].some(d => district.includes(d));
  const southKeralaPlaces = ['THIRUVANANTHAPURAM', 'TRIVANDRUM', 'VIZHINJAM', 'KOLLAM', 'QUILON', 'ALAPPUZHA', 'ALLEPPEY', 'SOUTH KERALA COAST', 'SOUTH COAST OF KERALA'];
  const northKeralaPlaces = ['MALAPPURAM', 'PONNANI', 'KASARAGOD', 'KASARGOD', 'KANNUR', 'KOZHIKODE', 'KOZHIKKODE', 'BEYPORE', 'NORTH KERALA COAST', 'NORTH COAST OF KERALA'];

  const hasGenericKeralaCoast = (w.includes('KERALA COAST') && !w.includes('SOUTH KERALA COAST') && !w.includes('NORTH KERALA COAST')) ||
                                w.includes('ALL OF KERALA') ||
                                w.includes('ENTIRE KERALA') ||
                                w.includes('ALL COASTS OF KERALA');

  const mentionsSouthOnly = southKeralaPlaces.some(p => w.includes(p)) && !northKeralaPlaces.some(p => w.includes(p)) && !hasGenericKeralaCoast;
  if (isNorthKerala && mentionsSouthOnly) {
    return false;
  }

  const isSouthKerala = region.includes('SOUTH KERALA') || ['ERNAKULAM', 'ALAPPUZHA', 'KOLLAM', 'THIRUVANANTHAPURAM'].some(d => district.includes(d));
  const mentionsNorthOnly = northKeralaPlaces.some(p => w.includes(p)) && !southKeralaPlaces.some(p => w.includes(p)) && !hasGenericKeralaCoast;
  if (isSouthKerala && mentionsNorthOnly) {
    return false;
  }

  if (district && w.includes(district)) return true;
  if (coastalArea && w.includes(coastalArea)) return true;
  if (municipality && w.includes(municipality)) return true;
  if (region && w.includes(region)) return true;
  if (state && w.includes(state)) return true;

  return true;
}

/**
 * Calculates Marine Alert
 */
export function calculateMarineAlert({ coastalBulletin, seaBulletin, portWarning, cycloneWarning = null, location = {}, coverage = {}, currentTime = new Date() }) {
  // 0. High priority: Check active Cyclone Wind Warning covering the fisherman's location
  if (cycloneWarning && cycloneWarning.active) {
    if (cycloneWarning.level === 'RED') {
      return {
        level: 'RED',
        label: 'DO NOT GO TO SEA',
        badgeColor: '#ef4444',
        reason: cycloneWarning.warningText || `Official IMD Cyclone Warning: ${cycloneWarning.category}.`,
        subtext: 'Dangerous cyclone wind hazard active over your coastal zone.',
        source: 'India Meteorological Department (IMD)',
        validUntil: null,
        formattedValidUntil: 'Active Official Warning',
        details: {
          seaCondition: 'Very Rough / High',
          wind: `${cycloneWarning.windSpeedKnots}+ Knots`,
          portSignal: 'Cyclone Warning Signal'
        }
      };
    }
  }

  const coastalValidity = coastalBulletin ? parseBulletinValidity(coastalBulletin, currentTime) : { isValid: false };
  const seaValidity = seaBulletin ? parseBulletinValidity(seaBulletin, currentTime) : { isValid: false };

  const validCoastal = coastalBulletin && coastalValidity.isValid ? coastalBulletin : null;
  const validSea = seaBulletin && seaValidity.isValid ? seaBulletin : null;

  if (!validCoastal && !validSea) {
    return {
      level: 'UNAVAILABLE',
      label: 'DATA UNAVAILABLE',
      badgeColor: '#94a3b8',
      reason: 'Current official marine information could not be verified.',
      subtext: 'No valid official IMD marine bulletin found for your registered area.',
      source: 'India Meteorological Department (IMD)',
      validUntil: null,
      formattedValidUntil: 'Unavailable',
      isExpired: Boolean(coastalValidity.isExpired || seaValidity.isExpired)
    };
  }

  const primaryBulletin = validCoastal || validSea;
  const validity = validCoastal ? coastalValidity : seaValidity;

  const seaCondStr = String(primaryBulletin.seaCondition || primaryBulletin.sea_condition || validSea?.seaCondition || validSea?.sea_condition || validCoastal?.seaCondition || '').trim().toLowerCase();
  const windStr = String(primaryBulletin.wind || validSea?.wind || validCoastal?.wind || '').trim().toLowerCase();
  const coastalWarn = String(validCoastal?.warning || '').trim();
  const seaWarn = String(validSea?.warning || '').trim();
  const portWarn = String(portWarning?.warning || portWarning?.signal || '').trim();

  const isCoastalWarnApplicable = isWarningApplicableToLocation(coastalWarn, location, coverage);
  const isSeaWarnApplicable = isWarningApplicableToLocation(seaWarn, location, coverage);
  const isPortWarnApplicable = isWarningApplicableToLocation(portWarn, location, coverage);

  const activeMarineWarnings = [];
  if (isCoastalWarnApplicable && coastalWarn && coastalWarn.toUpperCase() !== 'NIL') activeMarineWarnings.push(coastalWarn);
  if (isSeaWarnApplicable && seaWarn && seaWarn.toUpperCase() !== 'NIL') activeMarineWarnings.push(seaWarn);
  if (isPortWarnApplicable && portWarn && portWarn.toUpperCase() !== 'NIL') activeMarineWarnings.push(portWarn);

  const combinedWarnText = activeMarineWarnings.join(' ').toLowerCase();

  const windMatch = windStr.match(/(\d+)\s*(?:to|-)\s*(\d+)\s*knots?/i);
  const maxWindSpeed = windMatch ? parseInt(windMatch[2], 10) : 0;
  const gustMatch = windStr.match(/gusting\s*(?:to|-)?\s*(\d+)\s*knots?/i);
  const gustSpeed = gustMatch ? parseInt(gustMatch[1], 10) : 0;

  // RED
  const isRedWarning = combinedWarnText.includes('do not venture') ||
                       combinedWarnText.includes('fishermen are advised not to venture') ||
                       combinedWarnText.includes('gale') ||
                       combinedWarnText.includes('cyclonic') ||
                       combinedWarnText.includes('cyclone') ||
                       combinedWarnText.includes('very rough') ||
                       combinedWarnText.includes('high seas') ||
                       combinedWarnText.includes('phenomenal') ||
                       combinedWarnText.includes('dangerous sea') ||
                       combinedWarnText.includes('storm surge warning') ||
                       combinedWarnText.includes('great danger') ||
                       combinedWarnText.includes('red alert');

  const isRedSeaCondition = (seaCondStr.includes('rough') && !seaCondStr.includes('slight to moderate') && !seaCondStr.includes('moderate to rough')) ||
                            seaCondStr.includes('very rough') ||
                            seaCondStr.includes('high') ||
                            seaCondStr.includes('very high') ||
                            seaCondStr.includes('phenomenal');

  const isRedWind = maxWindSpeed > 25 || gustSpeed > 30 || windStr.includes('gale') || windStr.includes('squall force');

  const isRedPort = portWarn.toLowerCase().includes('signal iii') ||
                    portWarn.toLowerCase().includes('signal iv') ||
                    portWarn.toLowerCase().includes('signal v') ||
                    portWarn.toLowerCase().includes('signal vi') ||
                    portWarn.toLowerCase().includes('signal vii') ||
                    portWarn.toLowerCase().includes('signal viii') ||
                    portWarn.toLowerCase().includes('danger');

  if (isRedWarning || isRedSeaCondition || isRedWind || isRedPort) {
    let redReason = 'Official IMD warning indicates dangerous sea conditions.';
    if (isRedWarning && activeMarineWarnings.length > 0) {
      redReason = activeMarineWarnings[0];
    } else if (isRedSeaCondition) {
      redReason = `Dangerous sea condition reported by IMD (${primaryBulletin.seaCondition || primaryBulletin.sea_condition || 'Rough'}).`;
    } else if (isRedWind) {
      redReason = `High marine wind hazard reported by IMD (${primaryBulletin.wind}).`;
    }

    return {
      level: 'RED',
      label: 'DO NOT GO TO SEA',
      badgeColor: '#ef4444',
      reason: redReason,
      subtext: 'High hazard official IMD marine warning active for your zone.',
      source: 'India Meteorological Department (IMD)',
      validUntil: validity.validUntil,
      formattedValidUntil: validity.formattedValidUntil,
      details: {
        seaCondition: primaryBulletin.seaCondition || primaryBulletin.sea_condition || 'N/A',
        wind: primaryBulletin.wind || 'N/A',
        portSignal: primaryBulletin.portSignal || portWarning?.signal || 'NIL'
      }
    };
  }

  // YELLOW
  const isYellowWarning = combinedWarnText.includes('swell surge') ||
                          combinedWarnText.includes('wave alert') ||
                          combinedWarnText.includes('caution') ||
                          combinedWarnText.includes('vigilance') ||
                          combinedWarnText.includes('advisory') ||
                          combinedWarnText.includes('moderate hazard');

  const isYellowSeaCondition = seaCondStr.includes('moderate') ||
                               seaCondStr.includes('slight to moderate') ||
                               seaCondStr.includes('moderate to rough');

  const isYellowWind = (maxWindSpeed >= 15 && maxWindSpeed <= 25) || gustSpeed >= 20;
  const isYellowPort = portWarn && portWarn.toUpperCase() !== 'NIL' && !isRedPort;

  if (isYellowWarning || isYellowSeaCondition || isYellowWind || isYellowPort) {
    let yellowReason = 'Moderate sea conditions reported by IMD.';
    if (isYellowWarning && activeMarineWarnings.length > 0) {
      yellowReason = activeMarineWarnings[0];
    } else if (isYellowSeaCondition) {
      yellowReason = `Moderate sea conditions reported by IMD (${primaryBulletin.seaCondition || primaryBulletin.sea_condition || 'Moderate'}).`;
    } else if (isYellowWind) {
      yellowReason = `Moderate marine wind reported by IMD (${primaryBulletin.wind}).`;
    }

    return {
      level: 'YELLOW',
      label: 'CAUTION',
      badgeColor: '#f59e0b',
      reason: yellowReason,
      subtext: 'Moderate marine conditions reported. Exercise caution at sea.',
      source: 'India Meteorological Department (IMD)',
      validUntil: validity.validUntil,
      formattedValidUntil: validity.formattedValidUntil,
      details: {
        seaCondition: primaryBulletin.seaCondition || primaryBulletin.sea_condition || 'N/A',
        wind: primaryBulletin.wind || 'N/A',
        portSignal: primaryBulletin.portSignal || portWarning?.signal || 'NIL'
      }
    };
  }

  // GREEN
  return {
    level: 'GREEN',
    label: 'SAFE TO GO TO SEA',
    badgeColor: '#22c55e',
    reason: 'No significant official marine hazard detected for your registered area.',
    subtext: 'No significant official marine hazard detected for your registered area.',
    source: 'India Meteorological Department (IMD)',
    validUntil: validity.validUntil,
    formattedValidUntil: validity.formattedValidUntil,
    details: {
      seaCondition: primaryBulletin.seaCondition || primaryBulletin.sea_condition || 'Calm / Slight',
      wind: primaryBulletin.wind || 'Light',
      portSignal: primaryBulletin.portSignal || 'NIL'
    }
  };
}

/**
 * Calculates Weather Alert
 */
export function calculateWeatherAlert({ coastalBulletin, seaBulletin, cycloneWarning = null, location = {}, coverage = {}, currentTime = new Date() }) {
  // 0. High priority: Check active Cyclone Wind Warning covering the fisherman's location
  if (cycloneWarning && cycloneWarning.active) {
    if (cycloneWarning.level === 'RED') {
      return {
        level: 'RED',
        label: 'DO NOT GO TO SEA',
        badgeColor: '#ef4444',
        reason: cycloneWarning.warningText || `Official IMD Cyclone Warning: ${cycloneWarning.category}.`,
        subtext: 'Severe cyclonic storm hazard active over your coastal zone.',
        source: 'India Meteorological Department (IMD)',
        validUntil: null,
        formattedValidUntil: 'Active Official Warning',
        details: {
          weather: cycloneWarning.category || 'Cyclonic Storm',
          visibility: 'Very Poor'
        }
      };
    }
  }

  const coastalValidity = coastalBulletin ? parseBulletinValidity(coastalBulletin, currentTime) : { isValid: false };
  const seaValidity = seaBulletin ? parseBulletinValidity(seaBulletin, currentTime) : { isValid: false };

  const validCoastal = coastalBulletin && coastalValidity.isValid ? coastalBulletin : null;
  const validSea = seaBulletin && seaValidity.isValid ? seaBulletin : null;

  if (!validCoastal && !validSea) {
    return {
      level: 'UNAVAILABLE',
      label: 'DATA UNAVAILABLE',
      badgeColor: '#94a3b8',
      reason: 'Current official weather information could not be verified.',
      subtext: 'No valid official IMD weather forecast available for your registered area.',
      source: 'India Meteorological Department (IMD)',
      validUntil: null,
      formattedValidUntil: 'Unavailable',
      isExpired: Boolean(coastalValidity.isExpired || seaValidity.isExpired)
    };
  }

  const primaryBulletin = validCoastal || validSea;
  const validity = validCoastal ? coastalValidity : seaValidity;

  const weatherStr = String(primaryBulletin.weather || validSea?.weather || validCoastal?.weather || '').trim().toLowerCase();
  const visibilityStr = String(primaryBulletin.visibility || validSea?.visibility || validCoastal?.visibility || '').trim().toLowerCase();
  const coastalWarn = String(validCoastal?.warning || '').trim();
  const seaWarn = String(validSea?.warning || '').trim();

  const isCoastalWarnApplicable = isWarningApplicableToLocation(coastalWarn, location, coverage);
  const isSeaWarnApplicable = isWarningApplicableToLocation(seaWarn, location, coverage);

  const activeWeatherWarnings = [];
  if (isCoastalWarnApplicable && coastalWarn && coastalWarn.toUpperCase() !== 'NIL') activeWeatherWarnings.push(coastalWarn);
  if (isSeaWarnApplicable && seaWarn && seaWarn.toUpperCase() !== 'NIL') activeWeatherWarnings.push(seaWarn);

  const combinedWarnText = activeWeatherWarnings.join(' ').toLowerCase();

  // RED
  const isRedWeatherWarning = combinedWarnText.includes('severe thunderstorm') ||
                              combinedWarnText.includes('violent squall') ||
                              combinedWarnText.includes('cyclone') ||
                              combinedWarnText.includes('cyclonic weather') ||
                              combinedWarnText.includes('depression') ||
                              combinedWarnText.includes('extremely heavy rain') ||
                              combinedWarnText.includes('very heavy rain and squall') ||
                              combinedWarnText.includes('severe weather warning');

  const isRedWeather = weatherStr.includes('violent thunderstorm') ||
                       weatherStr.includes('severe squall') ||
                       weatherStr.includes('cyclonic storm') ||
                       weatherStr.includes('extremely heavy');

  const isRedVisibility = visibilityStr.includes('very poor') && (weatherStr.includes('storm') || weatherStr.includes('heavy'));

  if (isRedWeatherWarning || isRedWeather || isRedVisibility) {
    let redReason = 'Official IMD warning indicates severe weather conditions.';
    if (isRedWeatherWarning && activeWeatherWarnings.length > 0) {
      redReason = activeWeatherWarnings[0];
    } else if (isRedWeather) {
      redReason = `Severe weather reported by IMD: ${primaryBulletin.weather}.`;
    } else if (isRedVisibility) {
      redReason = 'Very poor visibility due to severe weather storm reported by IMD.';
    }

    return {
      level: 'RED',
      label: 'DO NOT GO TO SEA',
      badgeColor: '#ef4444',
      reason: redReason,
      subtext: 'Severe official weather hazard affecting your fishing zone.',
      source: 'India Meteorological Department (IMD)',
      validUntil: validity.validUntil,
      formattedValidUntil: validity.formattedValidUntil,
      details: {
        weather: primaryBulletin.weather || 'N/A',
        visibility: primaryBulletin.visibility || 'N/A'
      }
    };
  }

  // YELLOW
  const isYellowWeather = weatherStr.includes('thunder') ||
                          weatherStr.includes('squall') ||
                          weatherStr.includes('rain') ||
                          weatherStr.includes('shower') ||
                          weatherStr.includes('scattered rain') ||
                          weatherStr.includes('widespread rain') ||
                          weatherStr.includes('fairly widespread');

  const isYellowVisibility = visibilityStr.includes('poor') ||
                             visibilityStr.includes('moderate becoming poor') ||
                             visibilityStr.includes('moderate');

  if (isYellowWeather || isYellowVisibility) {
    let yellowReason = 'Thunderstorm / rain conditions reported by IMD.';
    if (weatherStr.includes('thunder') || weatherStr.includes('squall')) {
      yellowReason = `Thunderstorm / squall conditions reported by IMD (${primaryBulletin.weather}).`;
    } else if (weatherStr.includes('rain') || weatherStr.includes('shower')) {
      yellowReason = `Rain / shower conditions reported by IMD (${primaryBulletin.weather}).`;
    } else if (isYellowVisibility) {
      yellowReason = `Reduced visibility reported by IMD (${primaryBulletin.visibility}).`;
    }

    return {
      level: 'YELLOW',
      label: 'CAUTION',
      badgeColor: '#f59e0b',
      reason: yellowReason,
      subtext: 'Rain or thunderstorm conditions present. Proceed with caution.',
      source: 'India Meteorological Department (IMD)',
      validUntil: validity.validUntil,
      formattedValidUntil: validity.formattedValidUntil,
      details: {
        weather: primaryBulletin.weather || 'N/A',
        visibility: primaryBulletin.visibility || 'N/A'
      }
    };
  }

  // GREEN
  return {
    level: 'GREEN',
    label: 'SAFE TO GO TO SEA',
    badgeColor: '#22c55e',
    reason: 'No significant official weather hazard detected for your registered area.',
    subtext: 'No significant official weather hazard detected for your registered area.',
    source: 'India Meteorological Department (IMD)',
    validUntil: validity.validUntil,
    formattedValidUntil: validity.formattedValidUntil,
    details: {
      weather: primaryBulletin.weather || 'Clear Skies / Fair',
      visibility: primaryBulletin.visibility || 'Good Visibility'
    }
  };
}

/**
 * Calculates Overall Safety Status
 */
export function calculateOverallSafety(marineAlert, weatherAlert) {
  const mLevel = marineAlert?.level || 'UNAVAILABLE';
  const wLevel = weatherAlert?.level || 'UNAVAILABLE';

  if (mLevel === 'RED' || wLevel === 'RED') {
    return {
      level: 'RED',
      title: 'DO NOT GO TO SEA',
      badgeColor: '#ef4444',
      message: 'Dangerous official conditions detected. Fishermen are strongly advised not to venture out to sea.'
    };
  }

  if (mLevel === 'YELLOW' || wLevel === 'YELLOW') {
    return {
      level: 'YELLOW',
      title: 'PROCEED WITH CAUTION',
      badgeColor: '#f59e0b',
      message: 'Advisory or moderate conditions reported by IMD. Exercise vigilance and safety precautions.'
    };
  }

  if (mLevel === 'GREEN' && wLevel === 'GREEN') {
    return {
      level: 'GREEN',
      title: 'NO SIGNIFICANT OFFICIAL HAZARD',
      badgeColor: '#22c55e',
      message: 'Safe conditions reported by IMD for your registered fishing zone.'
    };
  }

  return {
    level: 'UNAVAILABLE',
    title: 'INFORMATION UNAVAILABLE',
    badgeColor: '#94a3b8',
    message: 'Current official marine/weather information could not be verified. Check official VHF/coastal broadcasts.'
  };
}
