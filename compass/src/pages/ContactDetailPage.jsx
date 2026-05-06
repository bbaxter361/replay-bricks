// Contact detail and edit page
// Full CRUD with business card scanning capability

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Camera, Upload, X, Phone, Mail, Tag, User } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { createWorker } from 'tesseract.js';

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
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const fileInputRef = useRef(null);

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
        });
      } else {
        navigate('/contacts');
      }
    }
  }, [id, isNew, getContact, navigate]);

  // Handle form changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Add tag
  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Handle save
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

  // Handle delete
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${formData.name}?`)) {
      deleteContact(id);
      navigate('/contacts');
    }
  };

  // ===== Business Card Scanner =====
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      setImagePreview(evt.target.result);
      scanBusinessCard(evt.target.result);
    };
    reader.readAsDataURL(file);
  };

  const scanBusinessCard = async (imageData) => {
    setScanning(true);
    setOcrResult(null);

    try {
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            // Progress update could go here
          }
        }
      });

      const { data } = await worker.recognize(imageData);
      const text = data.text;
      await worker.terminate();

      // Parse OCR text for business card fields
      const extracted = parseBusinessCard(text);
      setOcrResult(extracted);

      // Auto-fill form
      setFormData(prev => ({
        ...prev,
        name: extracted.name || prev.name,
        phone: extracted.phone || prev.phone,
        email: extracted.email || prev.email,
      }));

    } catch (err) {
      console.error('OCR failed:', err);
      alert('Failed to scan the business card. Please try again or enter the details manually.');
    } finally {
      setScanning(false);
    }
  };

  // Parse business card text
  function parseBusinessCard(text) {
    const result = { name: '', phone: '', email: '', company: '', title: '' };

    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    // Find email
    const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/i);
    if (emailMatch) result.email = emailMatch[0];

    // Find phone
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

    // Try to find name (usually first line, not an email/phone/company)
    for (const line of lines) {
      if (
        line.length > 2 &&
        line.length < 40 &&
        !line.includes('@') &&
        !line.match(/\d{3,}/) &&
        !line.match(/^(www|http|tel|fax)/i) &&
        line.split(' ').length >= 2 &&
        line.split(' ').length <= 4
      ) {
        // Check if it looks like a person's name (no common company suffixes)
        const companySuffixes = ['inc', 'llc', 'ltd', 'corp', 'co', 'company', 'consulting', 'solutions', 'group', 'associates', 'services'];
        const words = line.toLowerCase().split(' ');
        const hasCompanySuffix = words.some(w => companySuffixes.includes(w));

        if (words.length >= 2 && !hasCompanySuffix) {
          result.name = line;
          break;
        }
      }
    }

    // Find company (after name, before address lines)
    const nameIndex = result.name ? lines.indexOf(result.name) : -1;
    if (nameIndex >= 0) {
      // Next non-empty line after name might be company
      for (let i = nameIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (
          line.length > 2 &&
          !line.includes('@') &&
          !line.match(/\d{3,}/) &&
          !line.match(/^(www|http|tel|fax)/i) &&
          line.length < 50
        ) {
          result.company = line;
          break;
        }
      }
    }

    // Try to find title (often after name, before company)
    if (result.name && result.company) {
      const nameIdx = lines.indexOf(result.name);
      const companyIdx = lines.indexOf(result.company);
      if (companyIdx - nameIdx === 2) {
        result.title = lines[nameIdx + 1];
      }
    }

    // Also try to find title from lines that look like job titles
    const titlePatterns = /(director|manager|president|CEO|CFO|CTO|VP|senior|lead|head|chief|officer|specialist|consultant|coordinator|administrator|supervisor|nurse|doctor|Dr\.)/i;
    for (const line of lines) {
      if (
        line !== result.name &&
        line !== result.company &&
        line.length > 3 &&
        line.length < 40 &&
        titlePatterns.test(line)
      ) {
        result.title = line;
        break;
      }
    }

    return result;
  }

  // Clear scanned image
  const clearScan = () => {
    setImagePreview(null);
    setOcrResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/contacts')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-600 mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Contacts
      </button>

      <div className="bg-white rounded-xl border border-teal-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-teal-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg ${
              formData.relationship === 'resident' ? 'bg-gradient-to-br from-teal-400 to-teal-500' :
              formData.relationship === 'family' ? 'bg-gradient-to-br from-amber-400 to-amber-500' :
              formData.relationship === 'doctor' ? 'bg-gradient-to-br from-purple-400 to-purple-500' :
              'bg-gradient-to-br from-sage-400 to-sage-500'
            }`}>
              {formData.name ? formData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {isNew ? 'New Contact' : formData.name || 'Loading...'}
              </h1>
              <p className="text-sm text-gray-500 capitalize">{formData.relationship}</p>
            </div>
          </div>

          {!isNew && (
            <button
              onClick={handleDelete}
              className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete contact"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {/* Business Card Scanner (for new contacts) */}
        {isNew && (
          <div className="px-6 py-4 border-b border-teal-50 bg-cream/30">
            <div className="flex items-center gap-2 mb-3">
              <Camera size={16} className="text-teal-500" />
              <h3 className="text-sm font-medium text-gray-700">Business Card Scanner</h3>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={scanning}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors disabled:opacity-50"
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
              {imagePreview && (
                <button onClick={clearScan} className="text-xs text-gray-400 hover:text-red-400">
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
                  className="max-h-32 rounded-lg border border-teal-100 shadow-sm"
                />
                {scanning && (
                  <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                    <div className="text-white text-xs font-medium animate-pulse">Scanning...</div>
                  </div>
                )}
              </div>
            )}

            {/* OCR Result */}
            {ocrResult && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-amber-100">
                <p className="text-xs text-gray-400 mb-1">Extracted Information:</p>
                <div className="text-sm text-gray-600 space-y-0.5">
                  {ocrResult.name && <p>📇 Name: <strong>{ocrResult.name}</strong></p>}
                  {ocrResult.company && <p>🏢 Company: <strong>{ocrResult.company}</strong></p>}
                  {ocrResult.title && <p>👔 Title: <strong>{ocrResult.title}</strong></p>}
                  {ocrResult.phone && <p>📞 Phone: <strong>{ocrResult.phone}</strong></p>}
                  {ocrResult.email && <p>📧 Email: <strong>{ocrResult.email}</strong></p>}
                </div>
                <p className="text-xs text-gray-400 mt-1">Fields have been auto-filled below. You can edit them.</p>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User size={14} className="inline mr-1 text-gray-400" />
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="e.g., Jane Smith"
              className="w-full px-3 py-2.5 border border-teal-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 bg-cream/50"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone size={14} className="inline mr-1 text-gray-400" />
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => handleChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2.5 border border-teal-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 bg-cream/50"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail size={14} className="inline mr-1 text-gray-400" />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
              placeholder="email@example.com"
              className="w-full px-3 py-2.5 border border-teal-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 bg-cream/50"
            />
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: 'resident', label: 'Resident', color: 'teal' },
                { value: 'family', label: 'Family', color: 'amber' },
                { value: 'doctor', label: 'Doctor', color: 'purple' },
                { value: 'staff', label: 'Staff', color: 'sage' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('relationship', option.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all capitalize ${
                    formData.relationship === option.value
                      ? `bg-${option.color}-50 border-${option.color}-300 text-${option.color}-600 ring-2 ring-${option.color}-200`
                      : 'bg-white border-teal-100 text-gray-600 hover:bg-cream'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={e => handleChange('notes', e.target.value)}
              placeholder="Important information about this person..."
              rows={4}
              className="w-full px-3 py-2.5 border border-teal-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 bg-cream/50 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Tag size={14} className="inline mr-1 text-gray-400" />
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add a tag and press Enter"
                className="flex-1 px-3 py-2 border border-teal-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 bg-cream/50"
              />
              <button onClick={addTag} className="px-3 py-2 text-sm text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100">
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {formData.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-cream text-teal-600 rounded-full text-xs font-medium">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-400">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-teal-50 flex gap-3">
          <button
            onClick={() => navigate('/contacts')}
            className="flex-1 px-4 py-2.5 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
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
