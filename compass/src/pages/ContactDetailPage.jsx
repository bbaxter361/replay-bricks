// Contact detail and edit page - full dark theme
// Full CRUD with business card scanning capability

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Upload, X, Phone, Mail, Tag, User, Camera, Sparkles } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { API, apiFetch } from '../api';

const relationshipColors = {
  resident: { bg: 'bg-teal-600/20', text: 'text-teal-300', dot: 'bg-teal-500', gradient: 'from-teal-400 to-teal-500' },
  family: { bg: 'bg-amber-900/30', text: 'text-amber-400', dot: 'bg-amber-500', gradient: 'from-amber-400 to-amber-500' },
  doctor: { bg: 'bg-purple-900/30', text: 'text-purple-400', dot: 'bg-purple-500', gradient: 'from-purple-400 to-purple-500' },
  staff: { bg: 'bg-sage-900/30', text: 'text-sage-400', dot: 'bg-sage-500', gradient: 'from-sage-400 to-sage-500' },
};

export default function ContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getContact, updateContact, deleteContact, addContact } = useStore();
  const isNew = id === 'new';

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: 'resident',
    notes: '',
    tags: [],
    company: '',
    title: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanMethod, setScanMethod] = useState('ocr'); // 'ocr' | 'spring'
  const [imagePreview, setImagePreview] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const fileInputRef = useRef(null);

  // Load existing contact
  useEffect(() => {
    if (!isNew) {
      const contact = getContact(id);
      if (contact) {
        setFormData({
          name: contact.name || '',
          phone: contact.phone || '',
          email: contact.email || '',
          relationship: contact.relationship || 'resident',
          notes: contact.notes || '',
          tags: contact.tags || [],
          company: contact.company || '',
          title: contact.title || '',
        });
      } else {
        navigate('/contacts');
      }
    }
  }, [id, isNew, getContact, navigate]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Please enter a name.');
      return;
    }
    setSaving(true);
    if (isNew) {
      addContact(formData);
    } else {
      updateContact(id, formData);
    }
    setTimeout(() => {
      setSaving(false);
      navigate('/contacts');
    }, 300);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${formData.name}?`)) {
      deleteContact(id);
      navigate('/contacts');
    }
  };

  // ── Business Card Scanner ──

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setImagePreview(evt.target.result);
      if (scanMethod === 'spring') {
        scanWithSpring(evt.target.result, file);
      } else {
        scanWithOcr(evt.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Client-side OCR with Tesseract.js (offline)
  const scanWithOcr = async (imageData) => {
    setScanning(true);
    setOcrResult(null);
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const { data } = await worker.recognize(imageData);
      await worker.terminate();
      const extracted = parseBusinessCard(data.text);
      setOcrResult(extracted);
      setFormData(prev => ({
        ...prev,
        name: extracted.name || prev.name,
        phone: extracted.phone || prev.phone,
        email: extracted.email || prev.email,
        company: extracted.company || prev.company,
        title: extracted.title || prev.title,
      }));
    } catch (err) {
      console.error('OCR failed:', err);
      alert('Failed to scan the business card. Try "Use Spring AI" for better results.');
    } finally {
      setScanning(false);
    }
  };

  // Server-side AI scanning via Spring (more accurate)
  const scanWithSpring = async (imageData, file) => {
    setScanning(true);
    setOcrResult(null);
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const { data: ocrData } = await worker.recognize(imageData);
      await worker.terminate();

      const res = await apiFetch(API.chat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "I've uploaded a business card or driver's license. Please extract the person's name, phone number, email, company name, and job title if present. Return ONLY a JSON object with fields: name, phone, email, company, title. No other text.",
          docText: ocrData.text || '',
          fileName: file?.name || 'contact image',
          history: []
        })
      });
      const data = await res.json();
      const reply = data.response || '';

      // Try to parse JSON from Spring's response
      const jsonMatch = reply.match(/\{[\s\S]*"name"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const extracted = {
          name: parsed.name || '',
          phone: parsed.phone || '',
          email: parsed.email || '',
          company: parsed.company || '',
          title: parsed.title || '',
        };
        setOcrResult(extracted);
        setFormData(prev => ({
          ...prev,
          name: extracted.name || prev.name,
          phone: extracted.phone || prev.phone,
          email: extracted.email || prev.email,
          company: extracted.company || prev.company,
          title: extracted.title || prev.title,
        }));
      } else {
        // Fallback: try to extract from raw text
        setOcrResult(null);
        setScanning(false);
        alert('Spring could not parse this card. Try "Client-side OCR" instead.');
        return;
      }
    } catch (err) {
      console.error('Spring scan failed:', err);
      alert('Spring scan failed. Try "Client-side OCR" instead.');
    } finally {
      setScanning(false);
    }
  };

  // Parse business card text (client-side fallback)
  function parseBusinessCard(text) {
    const result = { name: '', phone: '', email: '', company: '', title: '' };
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/i);
    if (emailMatch) result.email = emailMatch[0];

    const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) {
      const cleaned = phoneMatch[0].replace(/[-.\s]/g, '');
      if (cleaned.length >= 10) {
        const area = cleaned.slice(-10, -7);
        const mid = cleaned.slice(-7, -4);
        const last = cleaned.slice(-4);
        const countryCode = cleaned.length > 10 ? cleaned.slice(0, cleaned.length - 10) : '';
        result.phone = `${countryCode ? `+${countryCode} ` : ''}(${area}) ${mid}-${last}`;
      }
    }

    for (const line of lines) {
      if (line.length > 2 && line.length < 40 && !line.includes('@') &&
        !line.match(/\d{3,}/) && !line.match(/^(www|http|tel|fax)/i) &&
        line.split(' ').length >= 2 && line.split(' ').length <= 4) {
        const companySuffixes = ['inc', 'llc', 'ltd', 'corp', 'co', 'company', 'consulting', 'solutions', 'group', 'associates', 'services'];
        const words = line.toLowerCase().split(' ');
        const hasCompanySuffix = words.some(w => companySuffixes.includes(w));
        if (words.length >= 2 && !hasCompanySuffix) {
          result.name = line;
          break;
        }
      }
    }

    const nameIndex = result.name ? lines.indexOf(result.name) : -1;
    if (nameIndex >= 0) {
      for (let i = nameIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.length > 2 && !line.includes('@') && !line.match(/\d{3,}/) && !line.match(/^(www|http|tel|fax)/i) && line.length < 50) {
          result.company = line;
          break;
        }
      }
    }

    const titlePatterns = /(director|manager|president|CEO|CFO|CTO|VP|senior|lead|head|chief|officer|specialist|consultant|coordinator|administrator|supervisor|nurse|doctor|Dr\.)/i;
    for (const line of lines) {
      if (line !== result.name && line !== result.company && line.length > 3 && line.length < 40 && titlePatterns.test(line)) {
        result.title = line;
        break;
      }
    }
    return result;
  }

  const clearScan = () => {
    setImagePreview(null);
    setOcrResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const colors = relationshipColors[formData.relationship] || relationshipColors.staff;
  const initials = formData.name ? formData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/contacts')}
        className="flex items-center gap-1.5 text-sm text-dark-muted hover:text-teal-400 mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Contacts
      </button>

      <div className="bg-dark-card rounded-xl border border-dark-border shadow-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg bg-gradient-to-br ${colors.gradient}`}>
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-bold text-dark-text">
                {isNew ? 'New Contact' : formData.name || 'Loading...'}
              </h1>
              <p className="text-sm text-dark-muted capitalize">{formData.relationship}</p>
            </div>
          </div>
          {!isNew && (
            <button
              onClick={handleDelete}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-colors"
              title="Delete contact"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {/* Business Card Scanner (for new contacts) */}
        {isNew && (
          <div className="px-6 py-4 border-b border-dark-border bg-dark-bg/50">
            <div className="flex items-center gap-2 mb-3">
              <Camera size={16} className="text-teal-400" />
              <h3 className="text-sm font-medium text-dark-text">Business Card Scanner</h3>
            </div>

            {/* Scan method toggle */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setScanMethod('ocr')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${scanMethod === 'ocr' ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30' : 'bg-dark-hover text-dark-muted border border-dark-border'}`}
              >
                Client-side OCR
              </button>
              <button
                onClick={() => setScanMethod('spring')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${scanMethod === 'spring' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'bg-dark-hover text-dark-muted border border-dark-border'}`}
              >
                <Sparkles size={12} />
                Use Spring AI (Better)
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={scanning}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-teal-300 bg-teal-600/20 border border-teal-500/30 rounded-lg hover:bg-teal-600/30 transition-colors disabled:opacity-50"
              >
                <Upload size={16} />
                {scanning ? 'Scanning...' : 'Upload Card Image'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {scanning && (
                <span className="text-xs text-purple-400 animate-pulse flex items-center gap-1">
                  <Sparkles size={12} />
                  {scanMethod === 'spring' ? 'Spring is reading...' : 'Running OCR...'}
                </span>
              )}
              {imagePreview && !scanning && (
                <button onClick={clearScan} className="text-xs text-dark-muted hover:text-red-400">
                  Clear
                </button>
              )}
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-3 relative inline-block">
                <img
                  src={imagePreview}
                  alt="Business card"
                  className="max-h-32 rounded-lg border border-dark-border shadow-sm"
                />
                {scanning && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <div className="text-white text-xs font-medium animate-pulse flex items-center gap-1">
                      <Sparkles size={14} className="animate-spin" />
                      {scanMethod === 'spring' ? 'Spring is analyzing...' : 'Scanning...'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* OCR/Spring Result */}
            {ocrResult && !scanning && (
              <div className="mt-3 p-3 bg-dark-bg rounded-lg border border-teal-600/20">
                <p className="text-xs text-dark-muted mb-1 flex items-center gap-1">
                  <Sparkles size={10} className="text-teal-400" />
                  Extracted by {scanMethod === 'spring' ? 'Spring AI' : 'OCR'}:
                </p>
                <div className="text-sm text-dark-text space-y-0.5">
                  {ocrResult.name && <p>📇 Name: <strong className="text-teal-300">{ocrResult.name}</strong></p>}
                  {ocrResult.company && <p>🏢 Company: <strong className="text-teal-300">{ocrResult.company}</strong></p>}
                  {ocrResult.title && <p>👔 Title: <strong className="text-teal-300">{ocrResult.title}</strong></p>}
                  {ocrResult.phone && <p>📞 Phone: <strong className="text-teal-300">{ocrResult.phone}</strong></p>}
                  {ocrResult.email && <p>📧 Email: <strong className="text-teal-300">{ocrResult.email}</strong></p>}
                </div>
                <p className="text-[10px] text-dark-muted mt-1">Fields have been auto-filled below. Edit as needed.</p>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-dark-text mb-1">
              <User size={14} className="inline mr-1 text-dark-muted" />
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="e.g., Jane Smith"
              className="w-full px-3 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-sm text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-dark-text mb-1">
                <Phone size={14} className="inline mr-1 text-dark-muted" />
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-3 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-sm text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-dark-text mb-1">
                <Mail size={14} className="inline mr-1 text-dark-muted" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-sm text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-500"
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-dark-text mb-1">🏢 Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={e => handleChange('company', e.target.value)}
                placeholder="Company name"
                className="w-full px-3 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-sm text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-500"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-dark-text mb-1">👔 Job Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => handleChange('title', e.target.value)}
                placeholder="Job title"
                className="w-full px-3 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-sm text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-sm font-medium text-dark-text mb-2">Relationship</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: 'resident', label: 'Resident', ...relationshipColors.resident },
                { value: 'family', label: 'Family', ...relationshipColors.family },
                { value: 'doctor', label: 'Doctor', ...relationshipColors.doctor },
                { value: 'staff', label: 'Staff', ...relationshipColors.staff },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('relationship', option.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all capitalize ${
                    formData.relationship === option.value
                      ? `${option.bg} ${option.text} border-current`
                      : 'bg-dark-hover border-dark-border text-dark-muted hover:text-dark-text'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-dark-text mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={e => handleChange('notes', e.target.value)}
              placeholder="Important information about this person..."
              rows={4}
              className="w-full px-3 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-sm text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-500 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-dark-text mb-1">
              <Tag size={14} className="inline mr-1 text-dark-muted" />
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add a tag and press Enter"
                className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-500"
              />
              <button onClick={addTag} className="px-3 py-2 text-sm text-teal-300 bg-teal-600/20 border border-teal-500/30 rounded-lg hover:bg-teal-600/30 transition-colors">
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {formData.tags.map(tag => (
                  <span key={tag} className={`inline-flex items-center gap-1 px-2.5 py-1 ${colors.bg} ${colors.text} rounded-full text-xs font-medium`}>
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-400 ml-0.5">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-dark-border flex gap-3">
          <button
            onClick={() => navigate('/contacts')}
            className="flex-1 px-4 py-2.5 text-sm text-dark-muted bg-dark-hover border border-dark-border rounded-lg hover:text-dark-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 text-sm text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save size={16} />
            {saving ? 'Saving...' : (isNew ? 'Create Contact' : 'Save Changes')}
          </button>
        </div>
      </div>
    </div>
  );
}
