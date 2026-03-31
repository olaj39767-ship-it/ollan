'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Search, ZoomIn, ZoomOut, RotateCcw, X, FileText, Download, SlidersHorizontal, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';

interface Prescription {
  _id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  prescriptionUrl: string;
  originalName: string;
  mimeType: string;
  uploadedAt: string;
}

const AllPrescriptions: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const API_URL = 'https://ollanback.vercel.app/api/orders/prescriptions';

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      if (res.data.success) {
        const sorted = res.data.prescriptions.sort(
          (a: Prescription, b: Prescription) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
        setPrescriptions(sorted);
        setFilteredPrescriptions(sorted);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = prescriptions;

    if (startDate || endDate) {
      filtered = filtered.filter((p) => {
        const uploadDate = new Date(p.uploadedAt);
        const start = startDate ? new Date(startDate) : new Date('1970-01-01');
        const end = endDate ? new Date(endDate) : new Date();
        return uploadDate >= start && uploadDate <= end;
      });
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.email.toLowerCase().includes(term) ||
          p.phone.includes(term)
      );
    }

    setFilteredPrescriptions(filtered);
  }, [prescriptions, startDate, endDate, searchTerm]);

  const isImage = (mime: string) => mime.startsWith('image/');
  const isPDF = (mime: string) => mime === 'application/pdf';
  const resetZoom = () => setZoomLevel(1);
  const hasActiveFilters = startDate || endDate || searchTerm.trim();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="w-12 h-12 rounded-full border-4 border-red-100 border-t-red-600 animate-spin" />
          </div>
          <p className="text-sm font-medium text-gray-400 tracking-widest uppercase">Loading prescriptions</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <X size={28} className="text-red-500" />
          </div>
          <p className="text-gray-700 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        .rx-root * { box-sizing: border-box; }
        .rx-root { font-family: 'DM Sans', sans-serif; }

        .rx-card {
          background: #fff;
          border: 1.5px solid #f0f0f0;
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
        }
        .rx-card:hover {
          border-color: #e8b0b0;
          box-shadow: 0 12px 40px rgba(220, 38, 38, 0.10);
          transform: translateY(-3px);
        }

        .rx-badge {
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(6px);
          color: #fff;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.03em;
          padding: 4px 10px;
          border-radius: 20px;
        }

        .rx-input {
          border: 1.5px solid #ececec;
          border-radius: 12px;
          padding: 10px 16px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #111;
          background: #fff;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .rx-input:focus {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.08);
        }
        .rx-input::placeholder { color: #bbb; }

        .rx-btn-clear {
          font-size: 13px;
          font-weight: 500;
          color: #dc2626;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px 14px;
          border-radius: 10px;
          transition: background 0.15s;
        }
        .rx-btn-clear:hover { background: #fff1f1; }

        .rx-filter-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #555;
          background: #fff;
          border: 1.5px solid #ececec;
          border-radius: 12px;
          padding: 9px 16px;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .rx-filter-toggle:hover { border-color: #dc2626; color: #dc2626; }
        .rx-filter-toggle.active { border-color: #dc2626; color: #dc2626; background: #fff5f5; }

        .rx-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(10, 5, 5, 0.75);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; padding: 16px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }

        .rx-modal {
          background: #fff;
          border-radius: 28px;
          max-width: 900px;
          width: 100%;
          max-height: 95vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.25s ease;
          box-shadow: 0 40px 100px rgba(0,0,0,0.35);
        }

        .rx-zoom-bar {
          display: flex; align-items: center; gap: 4px;
          background: #fff;
          border: 1.5px solid #ececec;
          border-radius: 14px;
          padding: 6px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.10);
        }
        .rx-zoom-btn {
          width: 36px; height: 36px;
          border: none; background: none;
          border-radius: 10px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #444;
          transition: background 0.15s, color 0.15s;
        }
        .rx-zoom-btn:hover { background: #fff1f1; color: #dc2626; }

        .rx-tag {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 500; letter-spacing: 0.04em;
          padding: 3px 9px; border-radius: 8px;
          text-transform: uppercase;
        }
        .rx-tag-img { background: #f0fdf4; color: #16a34a; }
        .rx-tag-pdf { background: #fef2f2; color: #dc2626; }

        .rx-empty {
          text-align: center;
          padding: 80px 20px;
          color: #bbb;
        }
        .rx-empty-icon {
          width: 72px; height: 72px;
          background: #f9f9f9;
          border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
        }

        .rx-stat {
          background: #fff;
          border: 1.5px solid #f0f0f0;
          border-radius: 16px;
          padding: 16px 24px;
          display: flex; align-items: center; gap-12px;
          min-width: 130px;
        }
      `}</style>

      <div className="rx-root" style={{ minHeight: '100vh', background: '#fafafa', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{
                    width: 36, height: 36,
                    background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                    borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(220,38,38,0.3)'
                  }}>
                    <FileText size={18} color="#fff" />
                  </div>
                  <h1 style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: 30,
                    fontWeight: 400,
                    color: '#111',
                    margin: 0,
                    letterSpacing: '-0.02em'
                  }}>
                    Prescriptions
                  </h1>
                </div>
                <p style={{ fontSize: 14, color: '#999', margin: 0, paddingLeft: 46 }}>
                  {filteredPrescriptions.length} of {prescriptions.length} records
                </p>
              </div>

              {/* Stats strip */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{
                  background: '#fff',
                  border: '1.5px solid #f0f0f0',
                  borderRadius: 16,
                  padding: '14px 20px',
                  textAlign: 'center',
                  minWidth: 90,
                }}>
                  <div style={{ fontSize: 22, fontWeight: 600, color: '#111', fontFamily: "'DM Serif Display', serif" }}>
                    {prescriptions.length}
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</div>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                  border: '1.5px solid transparent',
                  borderRadius: 16,
                  padding: '14px 20px',
                  textAlign: 'center',
                  minWidth: 90,
                }}>
                  <div style={{ fontSize: 22, fontWeight: 600, color: '#fff', fontFamily: "'DM Serif Display', serif" }}>
                    {prescriptions.filter(p => isImage(p.mimeType)).length}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Images</div>
                </div>
                <div style={{
                  background: '#fff',
                  border: '1.5px solid #f0f0f0',
                  borderRadius: 16,
                  padding: '14px 20px',
                  textAlign: 'center',
                  minWidth: 90,
                }}>
                  <div style={{ fontSize: 22, fontWeight: 600, color: '#111', fontFamily: "'DM Serif Display', serif" }}>
                    {prescriptions.filter(p => isPDF(p.mimeType)).length}
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>PDFs</div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: '#f0f0f0', marginTop: 24 }} />
          </div>

          {/* Search + Filter Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 24 }}>
            {/* Search */}
            <div style={{ position: 'relative', flexGrow: 1, maxWidth: 360 }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#bbb' }}
              />
              <input
                type="text"
                placeholder="Search by name, email or phone…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rx-input"
                style={{ paddingLeft: 40, width: '100%' }}
              />
            </div>

            {/* Filter toggle */}
            <button
              className={`rx-filter-toggle ${filtersVisible ? 'active' : ''}`}
              onClick={() => setFiltersVisible(!filtersVisible)}
            >
              <SlidersHorizontal size={15} />
              Date Range
              {(startDate || endDate) && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#dc2626', display: 'inline-block', marginLeft: 2
                }} />
              )}
            </button>

            {hasActiveFilters && (
              <button
                className="rx-btn-clear"
                onClick={() => { setStartDate(''); setEndDate(''); setSearchTerm(''); }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Date filter panel */}
          {filtersVisible && (
            <div style={{
              background: '#fff',
              border: '1.5px solid #f0f0f0',
              borderRadius: 16,
              padding: '20px 24px',
              marginBottom: 24,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              alignItems: 'center',
              animation: 'slideUp 0.2s ease'
            }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                  From
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#ccc', pointerEvents: 'none' }} />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rx-input"
                    style={{ paddingLeft: 34 }}
                  />
                </div>
              </div>
              <ChevronRight size={16} style={{ color: '#ddd', marginTop: 20 }} />
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                  To
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#ccc', pointerEvents: 'none' }} />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rx-input"
                    style={{ paddingLeft: 34 }}
                  />
                </div>
              </div>
              {(startDate || endDate) && (
                <button
                  className="rx-btn-clear"
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  style={{ marginTop: 20 }}
                >
                  Clear dates
                </button>
              )}
            </div>
          )}

          {/* Grid */}
          {filteredPrescriptions.length === 0 ? (
            <div className="rx-empty">
              <div className="rx-empty-icon">
                <FileText size={30} style={{ color: '#ddd' }} />
              </div>
              <p style={{ fontWeight: 600, color: '#bbb', fontSize: 15 }}>No prescriptions found</p>
              <p style={{ fontSize: 13, color: '#ccc', marginTop: 4 }}>Try adjusting your filters</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 20
            }}>
              {filteredPrescriptions.map((pres) => (
                <div
                  key={pres._id}
                  className="rx-card"
                  onClick={() => { setSelectedPrescription(pres); setZoomLevel(1); }}
                >
                  {/* Thumbnail */}
                  <div style={{ height: 200, background: '#f9f9f9', position: 'relative', overflow: 'hidden' }}>
                    {isImage(pres.mimeType) ? (
                      <Image
                        src={pres.prescriptionUrl}
                        alt={pres.originalName}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    ) : isPDF(pres.mimeType) ? (
                      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <div style={{
                          width: 56, height: 56, borderRadius: 14,
                          background: '#fef2f2',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <FileText size={26} style={{ color: '#dc2626' }} />
                        </div>
                        <span style={{ fontSize: 12, color: '#bbb', fontWeight: 500 }}>PDF Document</span>
                      </div>
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={40} style={{ color: '#ddd' }} />
                      </div>
                    )}

                    {/* Top badges */}
                    <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className={`rx-tag ${isImage(pres.mimeType) ? 'rx-tag-img' : 'rx-tag-pdf'}`}>
                        {isImage(pres.mimeType) ? 'Image' : 'PDF'}
                      </span>
                      <span className="rx-badge">
                        {format(new Date(pres.uploadedAt), 'dd MMM yy')}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '16px 18px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <p style={{ fontWeight: 600, color: '#111', fontSize: 15, margin: 0, lineHeight: 1.3 }}>
                        {pres.name}
                      </p>
                      <ChevronRight size={16} style={{ color: '#ddd', flexShrink: 0 }} />
                    </div>
                    <p style={{ fontSize: 12, color: '#aaa', margin: '0 0 8px', lineHeight: 1.4 }}>{pres.email}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <p style={{ fontSize: 11, color: '#ccc', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }}>
                        {pres.originalName}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <p style={{ fontSize: 11, color: '#ccc', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }}>
                        {pres.phone}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedPrescription && (
        <div className="rx-modal-overlay" onClick={() => setSelectedPrescription(null)}>
          <div className="rx-modal" onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={{
              padding: '22px 28px',
              borderBottom: '1.5px solid #f5f5f5',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#fff',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: isImage(selectedPrescription.mimeType) ? '#f0fdf4' : '#fef2f2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FileText size={20} style={{ color: isImage(selectedPrescription.mimeType) ? '#16a34a' : '#dc2626' }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#111', fontWeight: 400 }}>
                    {selectedPrescription.name}
                  </h2>
                  <p style={{ margin: 0, fontSize: 12, color: '#aaa' }}>
                    {format(new Date(selectedPrescription.uploadedAt), 'dd MMMM yyyy, hh:mm a')}
                    {' · '}
                    <span style={{ color: '#bbb' }}>{selectedPrescription.email}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPrescription(null)}
                style={{
                  width: 36, height: 36,
                  border: '1.5px solid #ececec',
                  background: '#fff',
                  borderRadius: 10,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#888',
                  transition: 'background 0.15s, border-color 0.15s'
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff1f1'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#fca5a5'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#ececec'; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Preview area */}
            <div style={{
              flex: 1,
              background: '#f7f7f7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minHeight: 420, maxHeight: '60vh',
              overflow: 'auto', position: 'relative',
              padding: 24
            }}>
              {isImage(selectedPrescription.mimeType) ? (
                <div style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease' }}>
                  <Image
                    src={selectedPrescription.prescriptionUrl}
                    alt="Prescription"
                    width={700}
                    height={700}
                    style={{ maxHeight: '55vh', width: 'auto', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
                  />
                </div>
              ) : (
                <iframe
                  src={selectedPrescription.prescriptionUrl}
                  style={{ width: '100%', maxWidth: 800, height: '55vh', border: 'none', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}
                  title="PDF Preview"
                />
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1.5px solid #f5f5f5',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#fff', flexWrap: 'wrap', gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isImage(selectedPrescription.mimeType) && (
                  <div className="rx-zoom-bar">
                    <button className="rx-zoom-btn" onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.2))}>
                      <ZoomOut size={18} />
                    </button>
                    <span style={{ padding: '0 12px', fontSize: 13, fontWeight: 600, color: '#333', minWidth: 52, textAlign: 'center' }}>
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button className="rx-zoom-btn" onClick={() => setZoomLevel((prev) => Math.min(3, prev + 0.2))}>
                      <ZoomIn size={18} />
                    </button>
                    <div style={{ width: 1, height: 24, background: '#ececec', margin: '0 4px' }} />
                    <button className="rx-zoom-btn" onClick={resetZoom} title="Reset zoom">
                      <RotateCcw size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <a
                  href={selectedPrescription.prescriptionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '10px 20px',
                    background: '#fff',
                    border: '1.5px solid #ececec',
                    borderRadius: 12,
                    color: '#dc2626',
                    fontSize: 14, fontWeight: 500,
                    textDecoration: 'none',
                    transition: 'background 0.15s, border-color 0.15s',
                    fontFamily: "'DM Sans', sans-serif"
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#fff5f5'; (e.currentTarget as HTMLAnchorElement).style.borderColor = '#fca5a5'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#fff'; (e.currentTarget as HTMLAnchorElement).style.borderColor = '#ececec'; }}
                >
                  <Download size={16} />
                  Download
                </a>
                <button
                  onClick={() => setSelectedPrescription(null)}
                  style={{
                    padding: '10px 24px',
                    background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 14, fontWeight: 500,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(220,38,38,0.30)',
                    transition: 'opacity 0.15s',
                    fontFamily: "'DM Sans', sans-serif"
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AllPrescriptions;