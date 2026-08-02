import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChevronDown, Check, X } from 'lucide-react';

// Sub-component for single scrollable column
const ScrollColumn = ({ items, selectedValue, onSelect, width = '55px', isItemDisabled }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      const idx = items.indexOf(selectedValue);
      if (idx !== -1) {
        const selectedEl = containerRef.current.children[idx];
        if (selectedEl) {
          selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  }, [selectedValue, items]);

  return (
    <div
      ref={containerRef}
      className="custom-scroll-column"
      style={{
        height: '220px',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '6px 2px',
        width: width,
        gap: '3px'
      }}
    >
      {items.map((item) => {
        const isSelected = item === selectedValue;
        const isDisabled = isItemDisabled ? isItemDisabled(item) : false;
        return (
          <div
            key={item}
            onClick={() => {
              if (!isDisabled) onSelect(item);
            }}
            style={{
              height: '28px',
              minHeight: '28px',
              width: '82%',
              maxWidth: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              userSelect: 'none',
              fontSize: '0.86rem',
              fontFamily: 'inherit',
              fontWeight: isSelected ? '700' : '400',
              color: isDisabled ? '#475569' : isSelected ? '#ffffff' : '#cbd5e1',
              backgroundColor: isSelected ? (isDisabled ? '#334155' : '#007bff') : 'transparent',
              borderRadius: '6px',
              opacity: isDisabled ? 0.35 : 1,
              transition: 'all 0.15s ease',
              boxShadow: isSelected && !isDisabled ? '0 2px 6px rgba(0, 123, 255, 0.4)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (!isSelected && !isDisabled) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected && !isDisabled) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {item}
          </div>
        );
      })}
    </div>
  );
};

const CustomTimePicker = ({ value, onChange, error, selectedDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Helper to parse time string (e.g. "09:30 AM" or "14:00")
  const parseTime = (val) => {
    if (!val) return { hour: '10', minute: '01', period: 'AM' };
    if (val.includes('AM') || val.includes('PM')) {
      const parts = val.split(' ');
      const [h, m] = parts[0].split(':');
      return { hour: h.padStart(2, '0'), minute: m.padStart(2, '0'), period: parts[1] };
    }
    const [h24, m] = val.split(':');
    let hNum = parseInt(h24, 10);
    let period = 'AM';
    if (hNum >= 12) {
      period = 'PM';
      if (hNum > 12) hNum -= 12;
    }
    if (hNum === 0) hNum = 12;
    return { hour: String(hNum).padStart(2, '0'), minute: m.padStart(2, '0'), period };
  };

  const initial = parseTime(value);
  const [selectedHour, setSelectedHour] = useState(initial.hour);
  const [selectedMinute, setSelectedMinute] = useState(initial.minute);
  const [selectedPeriod, setSelectedPeriod] = useState(initial.period);

  useEffect(() => {
    const updated = parseTime(value);
    setSelectedHour(updated.hour);
    setSelectedMinute(updated.minute);
    setSelectedPeriod(updated.period);
  }, [value]);

  // Hours: 01 to 12
  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  // Minutes: 00 to 59
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = !selectedDate || selectedDate === todayStr;

  // Convert hour/minute/period to 24-hour total minutes
  const toTotalMinutes = (hStr, mStr, pStr) => {
    let hour24 = parseInt(hStr, 10);
    if (pStr === 'PM' && hour24 < 12) hour24 += 12;
    if (pStr === 'AM' && hour24 === 12) hour24 = 0;
    return hour24 * 60 + parseInt(mStr, 10);
  };

  const getCurrentMinutes = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  // Check if a period (AM/PM) has any future times today
  const isPeriodDisabled = (p) => {
    if (!isToday) return false;
    const nowMins = getCurrentMinutes();
    const endOfPeriodMins = p === 'AM' ? 11 * 60 + 59 : 23 * 60 + 59;
    return endOfPeriodMins < nowMins;
  };

  // Check if an hour in the selectedPeriod has any future minutes today
  const isHourDisabled = (h) => {
    if (!isToday) return false;
    const nowMins = getCurrentMinutes();
    const maxMinsInHour = toTotalMinutes(h, '59', selectedPeriod);
    return maxMinsInHour < nowMins;
  };

  // Check if a minute for selectedHour and selectedPeriod is in the past today
  const isMinuteDisabled = (m) => {
    if (!isToday) return false;
    const nowMins = getCurrentMinutes();
    const timeMins = toTotalMinutes(selectedHour, m, selectedPeriod);
    return timeMins < nowMins;
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHourSelect = (h) => {
    setSelectedHour(h);
    const formatted = `${h}:${selectedMinute} ${selectedPeriod}`;
    onChange(formatted);
  };

  const handleMinuteSelect = (m) => {
    setSelectedMinute(m);
    const formatted = `${selectedHour}:${m} ${selectedPeriod}`;
    onChange(formatted);
  };

  const handlePeriodSelect = (p) => {
    setSelectedPeriod(p);
    const formatted = `${selectedHour}:${selectedMinute} ${p}`;
    onChange(formatted);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Scrollbar hide styling */}
      <style>{`
        .custom-scroll-column::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Selector Trigger Input Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="form-control"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          background: 'rgba(8, 20, 42, 0.85)',
          color: value ? '#ffffff' : 'rgba(148, 163, 184, 0.45)',
          border: error ? '1px solid #ff4d4d' : '1px solid rgba(0, 229, 255, 0.25)',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: '600',
          width: '100%'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} color="#00e5ff" />
          <span>{value || 'Select Time'}</span>
        </div>
        <ChevronDown size={16} color="#94a3b8" />
      </button>

      {/* POPUP VERTICAL SCROLL COLUMN PICKER */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '6px',
            zIndex: 999999,
            background: 'linear-gradient(180deg, #0b1528 0%, #060d1a 100%)',
            border: '1px solid rgba(0, 229, 255, 0.35)',
            borderRadius: '12px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(16px)',
            padding: '8px',
            width: '195px',
            maxHeight: '250px',
            overflow: 'hidden'
          }}
        >
          {/* Scrollable Columns Container matching exact aspect ratio & length */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              padding: '2px 0'
            }}
          >
            {/* Hours Column */}
            <ScrollColumn
              items={hours}
              selectedValue={selectedHour}
              onSelect={handleHourSelect}
              isItemDisabled={isHourDisabled}
              width="55px"
            />

            {/* Vertical Divider */}
            <div style={{ width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)', height: '220px' }} />

            {/* Minutes Column */}
            <ScrollColumn
              items={minutes}
              selectedValue={selectedMinute}
              onSelect={handleMinuteSelect}
              isItemDisabled={isMinuteDisabled}
              width="55px"
            />

            {/* Vertical Divider */}
            <div style={{ width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)', height: '220px' }} />

            {/* AM/PM Column */}
            <ScrollColumn
              items={['AM', 'PM']}
              selectedValue={selectedPeriod}
              onSelect={handlePeriodSelect}
              isItemDisabled={isPeriodDisabled}
              width="50px"
            />
          </div>

          {/* Bottom Confirmation Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '6px',
              paddingTop: '6px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <span style={{ fontSize: '0.76rem', color: '#00e5ff', fontWeight: '700', paddingLeft: '4px' }}>
              {selectedHour}:{selectedMinute} {selectedPeriod}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: '#007bff',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '3px 9px',
                fontSize: '0.72rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Check size={12} /> OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomTimePicker;

