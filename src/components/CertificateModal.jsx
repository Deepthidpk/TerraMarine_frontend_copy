import React from 'react';
import { Award, Download, Printer, X, ShieldCheck } from 'lucide-react';

const CertificateModal = ({ certificate, onClose }) => {
  if (!certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(4, 12, 26, 0.9)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999999,
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '850px',
        width: '100%',
        maxHeight: '95vh',
        overflowY: 'auto',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
        color: '#0f172a',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Action Header bar (hidden during print) */}
        <div className="no-print" style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          background: '#051329',
          color: '#ffffff',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={22} color="#00e5ff" />
            <span style={{ fontWeight: '700', fontSize: '1rem', fontFamily: 'var(--font-display)' }}>
              TerraMarine Official Certificate
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handlePrint}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Printer size={16} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Certificate Body */}
        <div id="printable-certificate" style={{
          padding: '48px 56px',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '12px solid #082f49',
          outline: '3px solid #00e5ff',
          margin: '20px',
          borderRadius: '12px',
          textAlign: 'center',
          position: 'relative',
          boxSizing: 'border-box'
        }}>
          {/* Certificate Background Seal Watermark */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.04,
            pointerEvents: 'none'
          }}>
            <Award size={360} color="#0284c7" />
          </div>

          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.8rem' }}>🌊</span>
              <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: '#0369a1', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.05em' }}>
                TERRAMARINE
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              COASTAL & MARINE ECOSYSTEM RESTORATION PLATFORM
            </p>
          </div>

          <div style={{ margin: '30px 0 10px 0' }}>
            <h1 style={{ fontSize: '2.2rem', fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: '700', color: '#0f172a', margin: '0 0 12px 0' }}>
              Certificate of Appreciation
            </h1>
            <p style={{ fontSize: '0.95rem', color: '#475569', fontStyle: 'italic', margin: 0 }}>
              This is proudly presented to
            </p>
          </div>

          {/* Recipient Name */}
          <div style={{ margin: '20px 0', padding: '10px 0', borderBottom: '2px solid #0284c7', display: 'inline-block', minWidth: '320px' }}>
            <h2 style={{ fontSize: '2.1rem', fontWeight: '800', color: '#0369a1', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
              {certificate.volunteer_name || certificate.full_name || 'Valued Coastal Volunteer'}
            </h2>
          </div>

          {/* Description */}
          <div style={{ maxWidth: '640px', margin: '20px auto 36px auto', lineHeight: '1.7', color: '#334155', fontSize: '0.95rem' }}>
            In recognition of outstanding dedication, active participation, and valuable contributions to the coastal cleanup campaign drive:
            <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#0f172a', marginTop: '8px' }}>
              "{certificate.campaign_name}"
            </div>
            <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '4px' }}>
              Held at <strong>{certificate.location}</strong> on <strong>{new Date(certificate.campaign_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
            </div>
          </div>

          {/* Footer Badges & Signatures */}
          <div style={{
            display: 'flex',
            justify: 'space-between',
            alignItems: 'flex-end',
            marginTop: '40px',
            paddingTop: '20px',
            borderTop: '1px dashed #cbd5e1'
          }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: '700', fontSize: '0.85rem', marginBottom: '4px' }}>
                <ShieldCheck size={18} /> Verified Marine Record
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                ID: {certificate.certificate_id ? certificate.certificate_id.slice(0, 18) : 'CERT-TM-2026-VAL'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                Issued Date: {certificate.issued_date ? new Date(certificate.issued_date).toLocaleDateString() : new Date().toLocaleDateString()}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Brush Script MT', cursive, sans-serif", fontSize: '1.8rem', color: '#0369a1', marginBottom: '-6px' }}>
                TerraMarine Board
              </div>
              <div style={{ borderTop: '1px solid #0f172a', width: '160px', paddingTop: '4px', fontSize: '0.8rem', fontWeight: '700', color: '#0f172a' }}>
                Authorized Director
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                {certificate.organization_name || 'Coastal Protection Authority'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateModal;
