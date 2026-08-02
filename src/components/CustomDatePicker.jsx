import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';

const ScrollColumn = ({ items, selectedValue, onSelect, width = '55px', labelFormatter }) => {
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
        return (
          <div
            key={item}
            onClick={() => onSelect(item)}
            style={{
              height: '28px',
              minHeight: '28px',
              width: '84%',
              maxWidth: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              fontSize: '0.85rem',
              fontFamily: 'inherit',
              fontWeight: isSelected ? '700' : '400',
              color: isSelected ? '#ffffff' : '#cbd5e1',
              backgroundColor: isSelected ? '#007bff' : 'transparent',
              borderRadius: '6px',
              transition: 'all 0.15s ease',
              boxShadow: isSelected ? '0 2px 6px rgba(0, 123, 255, 0.4)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {labelFormatter ? labelFormatter(item) : item}
          </div>
        );
      })}
    </div>
  );
};

const CustomDatePicker = ({ value, onChange, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const monthsList = [
    { num: '01', name: 'Jan' },
    { num: '02', name: 'Feb' },
    { num: '03', name: 'Mar' },
    { num: '04', name: 'Apr' },
    { num: '05', name: 'May' },
    { num: '06', name: 'Jun' },
    { num: '07', name: 'Jul' },
    { num: '08', name: 'Aug' },
    { num: '09', name: 'Sep' },
    { num: '10', name: 'Oct' },
    { num: '11', name: 'Nov' },
    { num: '12', name: 'Dec' }
  ];

  const parseDate = (val) => {
    const today = new Date();
    if (!val) {
      return {
        year: String(today.getFullYear()),
        month: String(today.getMonth() + 1).padStart(2, '0'),
        day: String(today.getDate()).padStart(2, '0')
      };
    }
    const [y, m, d] = val.split('-');
    return {
      year: y || String(today.getFullYear()),
      month: m ? m.padStart(2, '0') : '01',
      day: d ? d.padStart(2, '0') : '01'
    };
  };

  const initial = parseDate(value);
  const [selectedYear, setSelectedYear] = useState(initial.year);
  const [selectedMonth, setSelectedMonth] = useState(initial.month);
  const [selectedDay, setSelectedDay] = useState(initial.day);

  useEffect(() => {
    const updated = parseDate(value);
    setSelectedYear(updated.year);
    setSelectedMonth(updated.month);
    setSelectedDay(updated.day);
  }, [value]);

  // Compute days in current month & year
  const daysInMonth = new Date(parseInt(selectedYear, 10), parseInt(selectedMonth, 10), 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));

  const currentYear = new Date().getFullYear();
  const years = [String(currentYear), String(currentYear + 1)];

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

  const handleSelect = (y, m, d) => {
    const formatted = `${y}-${m}-${d}`;
    onChange(formatted);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <style>{`
        .custom-scroll-column::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Trigger Button */}
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
          <Calendar size={16} color="#00e5ff" />
          <span>{value || 'Select Date'}</span>
        </div>
        <ChevronDown size={16} color="#94a3b8" />
      </button>

      {/* POPUP VERTICAL SCROLL COLUMN DATE PICKER */}
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
            width: '215px',
            maxHeight: '265px',
            overflow: 'hidden'
          }}
        >
          {/* Scroll Columns */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'flex-start',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              padding: '2px 0'
            }}
          >
            {/* Day Column */}
            <ScrollColumn
              items={days}
              selectedValue={selectedDay}
              onSelect={(d) => {
                setSelectedDay(d);
                handleSelect(selectedYear, selectedMonth, d);
              }}
              width="45px"
            />

            <div style={{ width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)', height: '235px' }} />

            {/* Month Column */}
            <ScrollColumn
              items={monthsList.map(m => m.num)}
              selectedValue={selectedMonth}
              labelFormatter={(num) => monthsList.find(m => m.num === num)?.name || num}
              onSelect={(m) => {
                setSelectedMonth(m);
                // Adjust day if month has fewer days
                const maxD = new Date(parseInt(selectedYear, 10), parseInt(m, 10), 0).getDate();
                const validD = parseInt(selectedDay, 10) > maxD ? String(maxD).padStart(2, '0') : selectedDay;
                setSelectedDay(validD);
                handleSelect(selectedYear, m, validD);
              }}
              width="55px"
            />

            <div style={{ width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)', height: '235px' }} />

            {/* Year Column */}
            <ScrollColumn
              items={years}
              selectedValue={selectedYear}
              onSelect={(y) => {
                setSelectedYear(y);
                handleSelect(y, selectedMonth, selectedDay);
              }}
              width="55px"
            />
          </div>

          {/* Bottom Bar */}
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
            <span style={{ fontSize: '0.78rem', color: '#00e5ff', fontWeight: '700', paddingLeft: '4px' }}>
              {selectedYear}-{selectedMonth}-{selectedDay}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: '#007bff',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Check size={13} /> OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
