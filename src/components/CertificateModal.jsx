import React, { useState } from 'react';
import { Award, Download, Printer, X, ShieldCheck, Calendar, Clock, MapPin, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

const CertificateModal = ({ certificate, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  if (!certificate) return null;

  // Format Helper Functions
  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const parts = timeStr.split(':');
      const h = parseInt(parts[0], 10);
      const m = parts[1] !== undefined ? parts[1].slice(0, 2) : '00';
      if (isNaN(h)) return timeStr;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime) return '4 Hours (Standard Session)';
    try {
      const startParts = startTime.split(':').map(Number);
      const startMinutes = startParts[0] * 60 + (startParts[1] || 0);

      if (!endTime) {
        return `${formatTime(startTime)} (Full Shift)`;
      }

      const endParts = endTime.split(':').map(Number);
      let diffMinutes = (endParts[0] * 60 + (endParts[1] || 0)) - startMinutes;
      if (diffMinutes <= 0) diffMinutes += 24 * 60;

      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;

      if (hours > 0 && minutes > 0) {
        return `${hours} hr ${minutes} min`;
      } else if (hours > 0) {
        return `${hours} ${hours === 1 ? 'Hour' : 'Hours'}`;
      } else {
        return `${minutes} Minutes`;
      }
    } catch (e) {
      return '4 Hours';
    }
  };

  const volunteerName = certificate.volunteer_name || certificate.full_name || 'Valued Coastal Volunteer';
  const campaignName = certificate.campaign_name || 'Coastal Cleanup Initiative';
  const locationName = certificate.location || 'Coastal Marine Zone';
  const organizerName = certificate.organization_name || certificate.creator_name || 'TerraMarine Coastal Restoration Authority';
  const campaignDateFormatted = formatDate(certificate.campaign_date);
  const issuedDateFormatted = formatDate(certificate.issued_date);
  const durationText = calculateDuration(certificate.start_time, certificate.end_time);
  const timeSchedule = certificate.start_time
    ? `${formatTime(certificate.start_time)}${certificate.end_time ? ' – ' + formatTime(certificate.end_time) : ''}`
    : 'Full Day Drive';

  const rawCertId = certificate.certificate_id || 'CERT-TM-2026-VAL';
  const displayCertId = rawCertId.length > 24
    ? `TM-${rawCertId.replace(/-/g, '').slice(0, 10).toUpperCase()}`
    : `TM-${rawCertId.toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    const certElement = document.getElementById('printable-certificate');
    if (!certElement) {
      window.print();
      return;
    }

    try {
      setIsDownloading(true);

      // Ensure all web fonts are loaded
      if (document.fonts) {
        await document.fonts.ready;
      }

      const canvas = await html2canvas(certElement, {
        scale: 3, // Ultra-sharp 300dpi square PNG
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const pngUrl = canvas.toDataURL('image/png', 1.0);
      const a = document.createElement('a');
      a.href = pngUrl;
      const cleanCampName = campaignName.replace(/[^a-zA-Z0-9]/g, '_');
      const cleanVolName = volunteerName.replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `TerraMarine_Certificate_${cleanCampName}_${cleanVolName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to generate PNG certificate:', err);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(3, 10, 22, 0.94)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999999,
      padding: '16px',
      overflowY: 'auto',
      boxSizing: 'border-box'
    }}>
      {/* Styles to isolate printing strictly to the square certificate */}
      <style>{`
        @media print {
          @page { size: landscape; margin: 0; }
          html, body { background: #ffffff !important; margin: 0 !important; padding: 0 !important; }
          body * { visibility: hidden !important; }
          #printable-certificate, #printable-certificate * { visibility: visible !important; }
          #printable-certificate {
            position: absolute !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 720px !important;
            height: 720px !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Top Floating Control Bar (OUTSIDE the Certificate) */}
      <div className="no-print" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        maxWidth: '720px',
        marginBottom: '12px',
        background: 'rgba(8, 20, 42, 0.85)',
        border: '1px solid rgba(0, 229, 255, 0.3)',
        borderRadius: '12px',
        padding: '10px 18px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={20} color="#00e5ff" />
          <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#ffffff' }}>
            Official Certificate Preview
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '0.82rem',
              cursor: isDownloading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.2s ease',
              opacity: isDownloading ? 0.8 : 1
            }}
          >
            {isDownloading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Generating PNG...
              </>
            ) : (
              <>
                <Download size={15} /> Download as PNG
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
            }}
          >
            <Printer size={15} /> Print / Save PDF
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '7px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PURE SQUARE CERTIFICATE (720px x 720px - NO ACTION BUTTONS INSIDE) */}
      {/* ========================================================================= */}
      <div
        id="printable-certificate"
        style={{
          width: '720px',
          height: '720px',
          minWidth: '720px',
          minHeight: '720px',
          maxWidth: '720px',
          maxHeight: '720px',
          boxSizing: 'border-box',
          position: 'relative',
          background: 'radial-gradient(circle at 50% 40%, #ffffff 0%, #fbf9f4 65%, #f4f0e6 100%)',
          padding: '20px',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.7), 0 0 35px rgba(0, 229, 255, 0.15)',
          borderRadius: '8px',
          fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: '#0f172a',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Double-layer Regal Border Frame */}
        <div style={{
          border: '5px solid #062046',
          outline: '2px solid #c59b27',
          outlineOffset: '-5px',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          position: 'relative',
          padding: '24px 30px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          textAlign: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.95)'
        }}>
          {/* Ornate Corner Accents */}
          <div style={{ position: 'absolute', top: '6px', left: '6px', width: '28px', height: '28px', borderTop: '3px solid #c59b27', borderLeft: '3px solid #c59b27', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: '2px', left: '2px', width: '7px', height: '7px', background: '#c59b27' }}></div>
          </div>
          <div style={{ position: 'absolute', top: '6px', right: '6px', width: '28px', height: '28px', borderTop: '3px solid #c59b27', borderRight: '3px solid #c59b27', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: '2px', right: '2px', width: '7px', height: '7px', background: '#c59b27' }}></div>
          </div>
          <div style={{ position: 'absolute', bottom: '6px', left: '6px', width: '28px', height: '28px', borderBottom: '3px solid #c59b27', borderLeft: '3px solid #c59b27', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', bottom: '2px', left: '2px', width: '7px', height: '7px', background: '#c59b27' }}></div>
          </div>
          <div style={{ position: 'absolute', bottom: '6px', right: '6px', width: '28px', height: '28px', borderBottom: '3px solid #c59b27', borderRight: '3px solid #c59b27', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '7px', height: '7px', background: '#c59b27' }}></div>
          </div>

          {/* Background Watermark Crest */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.035,
            pointerEvents: 'none',
            zIndex: 0
          }}>
            <svg width="340" height="340" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="46" stroke="#062046" strokeWidth="2" strokeDasharray="4 2"/>
              <circle cx="50" cy="50" r="38" stroke="#c59b27" strokeWidth="1.5"/>
              <path d="M50 15 L53 38 L76 38 L57 52 L64 75 L50 61 L36 75 L43 52 L24 38 L47 38 Z" fill="#062046" />
              <path d="M20 70 Q 35 60 50 70 T 80 70" stroke="#00e5ff" strokeWidth="3" fill="none" />
            </svg>
          </div>

          {/* 1. TOP HEADER SECTION */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{ height: '1px', width: '45px', background: 'linear-gradient(90deg, transparent, #c59b27)' }}></div>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #062046 0%, #0369a1 100%)',
                border: '2px solid #d4af37',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 8px rgba(6,32,70,0.2)'
              }}>
                <span style={{ fontSize: '20px' }}>🌊</span>
              </div>
              <div style={{ height: '1px', width: '45px', background: 'linear-gradient(90deg, #c59b27, transparent)' }}></div>
            </div>

            <div style={{
              fontSize: '1.15rem',
              fontWeight: '900',
              color: '#062046',
              fontFamily: "'Cinzel', Georgia, serif",
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              margin: '2px 0 0 0'
            }}>
              TERRAMARINE
            </div>
            <div style={{
              fontSize: '0.62rem',
              fontWeight: '800',
              color: '#854d0e',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginTop: '1px'
            }}>
              COASTAL & MARINE ECOSYSTEM RESTORATION PLATFORM
            </div>
          </div>

          {/* 2. TITLE & RECIPIENT PRESENTATION */}
          <div style={{ position: 'relative', zIndex: 1, margin: '2px 0' }}>
            <div style={{
              fontSize: '0.68rem',
              fontWeight: '700',
              color: '#0284c7',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '2px'
            }}>
              OFFICIAL CITATION & MERIT CREDENTIAL
            </div>
            <h1 style={{
              fontSize: '1.75rem',
              fontFamily: "'Cinzel', Georgia, serif",
              fontWeight: '900',
              color: '#0a1e3b',
              margin: '0 0 2px 0',
              letterSpacing: '0.03em'
            }}>
              Certificate of Appreciation
            </h1>
            <p style={{
              fontSize: '0.82rem',
              color: '#475569',
              fontStyle: 'italic',
              margin: 0,
              fontFamily: "Georgia, serif"
            }}>
              This credential of honor is proudly presented to
            </p>

            {/* Recipient Name Box */}
            <div style={{
              margin: '6px auto 4px auto',
              display: 'inline-block',
              position: 'relative',
              padding: '2px 20px'
            }}>
              <h2 style={{
                fontSize: '1.9rem',
                fontWeight: '800',
                color: '#03417a',
                margin: 0,
                fontFamily: "'Cinzel', Georgia, serif",
                letterSpacing: '0.03em',
                textTransform: 'uppercase'
              }}>
                {volunteerName}
              </h2>
              {/* Decorative underline */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '4px'
              }}>
                <div style={{ height: '1.5px', width: '80px', background: 'linear-gradient(90deg, transparent, #c59b27)' }}></div>
                <div style={{ width: '6px', height: '6px', background: '#c59b27', transform: 'rotate(45deg)' }}></div>
                <div style={{ height: '1.5px', width: '80px', background: 'linear-gradient(90deg, #c59b27, transparent)' }}></div>
              </div>
            </div>

            <div style={{
              maxWidth: '560px',
              margin: '4px auto 0 auto',
              lineHeight: '1.45',
              color: '#334155',
              fontSize: '0.78rem'
            }}>
              In grateful recognition of exemplary volunteerism, environmental leadership, and active frontline participation in the marine cleanup drive:
            </div>
          </div>

          {/* 3. CAMPAIGN DETAILS & DURATION CARD */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.05) 0%, rgba(217, 119, 6, 0.04) 100%)',
            border: '1px solid #cbd5e1',
            borderLeft: '4px solid #0284c7',
            borderRight: '4px solid #0284c7',
            borderRadius: '6px',
            padding: '10px 14px',
            maxWidth: '580px',
            margin: '0 auto',
            boxSizing: 'border-box'
          }}>
            <div style={{
              fontSize: '1.1rem',
              fontWeight: '800',
              color: '#062046',
              fontFamily: "'Cinzel', Georgia, serif",
              letterSpacing: '0.02em',
              marginBottom: '2px'
            }}>
              "{campaignName}"
            </div>

            {certificate.description && (
              <div style={{
                fontSize: '0.72rem',
                color: '#475569',
                fontStyle: 'italic',
                marginBottom: '6px',
                lineHeight: '1.3'
              }}>
                {certificate.description.length > 90
                  ? `${certificate.description.slice(0, 90)}...`
                  : certificate.description}
              </div>
            )}

            {/* 3-Column Info Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              marginTop: '6px',
              paddingTop: '6px',
              borderTop: '1px dashed rgba(203, 213, 225, 0.8)',
              textAlign: 'left'
            }}>
              {/* Location */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                <MapPin size={13} color="#0284c7" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                    Drive Location
                  </div>
                  <div style={{ fontSize: '0.74rem', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                    {locationName}
                  </div>
                </div>
              </div>

              {/* Campaign Date */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                <Calendar size={13} color="#0284c7" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                    Campaign Date
                  </div>
                  <div style={{ fontSize: '0.74rem', fontWeight: '700', color: '#0f172a' }}>
                    {campaignDateFormatted}
                  </div>
                </div>
              </div>

              {/* Operational Duration */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                <Clock size={13} color="#059669" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: '700', color: '#059669', textTransform: 'uppercase' }}>
                    Campaign Duration
                  </div>
                  <div style={{ fontSize: '0.74rem', fontWeight: '800', color: '#065f46' }}>
                    {durationText}
                  </div>
                  <div style={{ fontSize: '0.64rem', color: '#64748b' }}>
                    {timeSchedule}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. FOOTER: VERIFICATION, GOLD SEAL & SIGNATURES */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingTop: '10px',
            borderTop: '1.5px solid #e2e8f0',
            gap: '12px'
          }}>
            {/* Left: Security QR & ID */}
            <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 30%' }}>
              <div style={{
                width: '46px',
                height: '46px',
                border: '1px solid #062046',
                borderRadius: '3px',
                padding: '2px',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg width="38" height="38" viewBox="0 0 33 33" fill="#062046">
                  <rect x="0" y="0" width="10" height="10" fill="#062046"/>
                  <rect x="2" y="2" width="6" height="6" fill="#ffffff"/>
                  <rect x="3.5" y="3.5" width="3" height="3" fill="#062046"/>
                  <rect x="23" y="0" width="10" height="10" fill="#062046"/>
                  <rect x="25" y="2" width="6" height="6" fill="#ffffff"/>
                  <rect x="26.5" y="3.5" width="3" height="3" fill="#062046"/>
                  <rect x="0" y="23" width="10" height="10" fill="#062046"/>
                  <rect x="2" y="25" width="6" height="6" fill="#ffffff"/>
                  <rect x="3.5" y="26.5" width="3" height="3" fill="#062046"/>
                  <rect x="13" y="2" width="3" height="3" fill="#062046"/>
                  <rect x="17" y="5" width="3" height="3" fill="#062046"/>
                  <rect x="13" y="13" width="7" height="7" fill="#062046"/>
                  <rect x="15" y="15" width="3" height="3" fill="#ffffff"/>
                  <rect x="2" y="13" width="4" height="4" fill="#062046"/>
                  <rect x="27" y="14" width="4" height="4" fill="#062046"/>
                  <rect x="13" y="24" width="4" height="4" fill="#062046"/>
                  <rect x="23" y="23" width="3" height="3" fill="#062046"/>
                  <rect x="27" y="27" width="4" height="4" fill="#062046"/>
                </svg>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#059669', fontWeight: '800', fontSize: '0.66rem', textTransform: 'uppercase' }}>
                  <ShieldCheck size={11} /> Verified Credential
                </div>
                <div style={{ fontSize: '0.65rem', color: '#1e293b', fontWeight: '700', fontFamily: 'monospace' }}>
                  ID: {displayCertId}
                </div>
                <div style={{ fontSize: '0.6rem', color: '#64748b' }}>
                  Issued: {issuedDateFormatted}
                </div>
              </div>
            </div>

            {/* Center: Golden Embossed Seal */}
            <div style={{ textAlign: 'center', flex: '0 0 auto' }}>
              <div style={{
                width: '62px',
                height: '62px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #fef08a 0%, #d4af37 45%, #b45309 100%)',
                border: '2px double #ffffff',
                boxShadow: '0 3px 8px rgba(180, 83, 9, 0.4), inset 0 2px 3px rgba(255,255,255,0.7)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#451a03'
              }}>
                <span style={{ fontSize: '14px', lineHeight: '1' }}>★</span>
                <span style={{ fontSize: '0.48rem', fontWeight: '900', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: '1' }}>
                  VALIDATED
                </span>
                <span style={{ fontSize: '0.42rem', fontWeight: '800' }}>SEAL OF MERIT</span>
                <span style={{ fontSize: '0.46rem', fontWeight: '900' }}>2026</span>
              </div>
            </div>

            {/* Right: Dual Signatures */}
            <div style={{ display: 'flex', gap: '16px', textAlign: 'center', flex: '1 1 auto', justifyContent: 'flex-end' }}>
              <div style={{ minWidth: '100px' }}>
                <div style={{
                  fontFamily: "'Great Vibes', 'Brush Script MT', cursive",
                  fontSize: '1.4rem',
                  color: '#03417a',
                  lineHeight: '1',
                  marginBottom: '-2px',
                  height: '24px'
                }}>
                  Dr. K. Nair
                </div>
                <div style={{ borderTop: '1px solid #062046', paddingTop: '3px', fontSize: '0.66rem', fontWeight: '800', color: '#062046' }}>
                  Marine Ecosystem Lead
                </div>
                <div style={{ fontSize: '0.58rem', color: '#64748b' }}>
                  TerraMarine Board
                </div>
              </div>

              <div style={{ minWidth: '100px' }}>
                <div style={{
                  fontFamily: "'Great Vibes', 'Brush Script MT', cursive",
                  fontSize: '1.4rem',
                  color: '#03417a',
                  lineHeight: '1',
                  marginBottom: '-2px',
                  height: '24px'
                }}>
                  M. Varma
                </div>
                <div style={{ borderTop: '1px solid #062046', paddingTop: '3px', fontSize: '0.66rem', fontWeight: '800', color: '#062046' }}>
                  Authorized Director
                </div>
                <div style={{
                  fontSize: '0.58rem',
                  color: '#64748b',
                  maxWidth: '110px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {organizerName}
                </div>
              </div>
            </div>
          </div>

          {/* Microtext Bottom Line */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            marginTop: '6px',
            paddingTop: '4px',
            borderTop: '1px dotted #cbd5e1',
            fontSize: '0.54rem',
            color: '#94a3b8',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>SECURE CODE: {displayCertId}</span>
            <span>VERIFIED AT TERRAMARINE.ORG/VERIFY</span>
            <span>COASTAL CONSERVATION ALLIANCE</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CertificateModal;
