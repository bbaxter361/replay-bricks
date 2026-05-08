// Calendar page with month/week/day views
// Uses react-big-calendar with custom styling
// Supports PDF export and CSV/iCal download

import { useState, useRef, useCallback, useMemo } from 'react';
import { Calendar as BigCalendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  X,
  Music,
  Palette,
  Dumbbell,
  Gamepad2,
  MapPin,
  Stethoscope,
  Sparkles,
  Printer,
  FileText,
  ExternalLink
} from 'lucide-react';
import { useStore } from '../stores/useStore';
import { API, apiFetch } from '../api';
import { v4 as uuidv4 } from 'uuid';
import jsPDF from 'jspdf';

const localizer = momentLocalizer(moment);

const activityTypes = [
  { value: 'music', label: 'Music', icon: Music, color: '#D4A855', bg: '#fdf8ed' },
  { value: 'art', label: 'Art', icon: Palette, color: '#9B8EC4', bg: '#f4f0fa' },
  { value: 'exercise', label: 'Exercise', icon: Dumbbell, color: '#8CB08C', bg: '#f0f8f0' },
  { value: 'games', label: 'Games', icon: Gamepad2, color: '#E88D67', bg: '#fdf0e8' },
  { value: 'outings', label: 'Outings', icon: MapPin, color: '#4A90A2', bg: '#e8f4f8' },
  { value: 'therapy', label: 'Therapy', icon: Stethoscope, color: '#C47EB4', bg: '#f8eef6' },
  { value: 'custom', label: 'Custom', icon: Sparkles, color: '#8B9DC4', bg: '#eef1f8' },
];

function getTypeConfig(type) {
  return activityTypes.find(t => t.value === type) || activityTypes[6];
}

export default function CalendarPage() {
  const { events, addEvent, updateEvent, deleteEvent, contacts } = useStore();
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [wingFilter, setWingFilter] = useState('all');
  const calendarRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    start: '',
    end: '',
    description: '',
    residents: [],
    type: 'music',
    wing: 'both',
  });
  const [residentInput, setResidentInput] = useState('');

  // Convert stored events to BigCalendar format
  const calendarEvents = useMemo(() =>
    events
      .filter(event => wingFilter === 'all' || event.wing === wingFilter || event.wing === 'both')
      .map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
        title: event.title,
      })),
    [events, wingFilter]
  );

  // Event style getter
  const eventPropGetter = useCallback((event) => {
    const cfg = getTypeConfig(event.type);
    // When viewing Both, color by wing instead of activity type
    if (wingFilter === 'all') {
      if (event.wing === 'assisted') {
        return {
          style: {
            backgroundColor: '#93C5FD', // light blue-300
            borderRadius: '6px',
            border: 'none',
            padding: '2px 6px',
            fontSize: '12px',
            fontWeight: '500',
            color: '#1e3a5f',
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
          }
        };
      }
      if (event.wing === 'memory') {
        return {
          style: {
            backgroundColor: '#C4B5FD', // light violet-300
            borderRadius: '6px',
            border: 'none',
            padding: '2px 6px',
            fontSize: '12px',
            fontWeight: '500',
            color: '#3b2f6e',
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
          }
        };
      }
      // both — use activity type color as-is
    }
    // When filtered to a specific wing, use activity type colors
    return {
      style: {
        backgroundColor: cfg.color,
        borderRadius: '6px',
        border: 'none',
        padding: '2px 6px',
        fontSize: '12px',
        fontWeight: '500',
        color: '#fff',
        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
      }
    };
  }, [wingFilter]);

  // Handle slot selection (click on date)
  const handleSelectSlot = useCallback((slotInfo) => {
    setSelectedDate(new Date(slotInfo.start));
    setFormData({
      title: '',
      start: moment(slotInfo.start).format('YYYY-MM-DDTHH:mm'),
      end: moment(slotInfo.start).add(1, 'hour').format('YYYY-MM-DDTHH:mm'),
      description: '',
      residents: [],
      type: 'music',
      wing: 'both',
    });
    setShowAddModal(true);
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
  }, []);

  // Add event handler
  const handleAddEvent = (e) => {
    e.preventDefault();
    addEvent({
      title: formData.title,
      start: new Date(formData.start).toISOString(),
      end: new Date(formData.end).toISOString(),
      description: formData.description,
      residents: formData.residents,
      type: formData.type,
      color: getTypeConfig(formData.type).color,
      wing: formData.wing,
    });
    setShowAddModal(false);
  };

  // Delete event handler
  const handleDeleteEvent = (e) => {
    if (selectedEvent) {
      deleteEvent(selectedEvent.id);
      setShowDetailModal(false);
    }
  };

  // Add resident to form
  const addResident = () => {
    const name = residentInput.trim();
    if (name && !formData.residents.includes(name)) {
      setFormData(prev => ({ ...prev, residents: [...prev.residents, name] }));
      setResidentInput('');
    }
  };

  // Remove resident from form
  const removeResident = (name) => {
    setFormData(prev => ({
      ...prev,
      residents: prev.residents.filter(r => r !== name)
    }));
  };

  // Navigate handlers
  const goToToday = () => setDate(new Date());
  const goBack = () => setDate(moment(date).subtract(1, view === Views.MONTH ? 'months' : view === Views.WEEK ? 'weeks' : 'days').toDate());
  const goForward = () => setDate(moment(date).add(1, view === Views.MONTH ? 'months' : view === Views.WEEK ? 'weeks' : 'days').toDate());

  // ===== EXPORT FUNCTIONS =====

  // PDF Export (standard landscape)
  const exportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(124, 92, 204);
    doc.text('Compass - Calendar Export', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const dateRange = view === Views.MONTH
      ? moment(date).format('MMMM YYYY')
      : `${moment(date).startOf(view === Views.WEEK ? 'week' : 'day').format('MMM D')} - ${moment(date).endOf(view === Views.WEEK ? 'week' : 'day').format('MMM D, YYYY')}`;
    doc.text(dateRange, pageWidth / 2, 28, { align: 'center' });

    let y = 38;

    // Filter events for current view AND wing
    const viewStart = view === Views.MONTH
      ? moment(date).startOf('month')
      : view === Views.WEEK
        ? moment(date).startOf('week')
        : moment(date).startOf('day');

    const viewEnd = view === Views.MONTH
      ? moment(date).endOf('month')
      : view === Views.WEEK
        ? moment(date).endOf('week')
        : moment(date).endOf('day');

    const filteredEvents = events
      .filter(e => {
        const d = moment(e.start);
        return d.isBetween(viewStart, viewEnd, 'day', '[]') &&
          (wingFilter === 'all' || e.wing === wingFilter || e.wing === 'both');
      })
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    if (filteredEvents.length === 0) {
      doc.setFontSize(12);
      doc.setTextColor(150, 150, 150);
      doc.text('No events in this period', pageWidth / 2, y + 20, { align: 'center' });
    } else {
      filteredEvents.forEach((event, i) => {
        if (y > pageHeight - 30) {
          doc.addPage();
          y = 20;
        }

        const cfg = getTypeConfig(event.type);
        const dayStr = moment(event.start).format('ddd, MMM D');
        const timeStr = `${moment(event.start).format('h:mm A')} - ${moment(event.end).format('h:mm A')}`;

        // Color bar
        doc.setFillColor(parseInt(cfg.color.slice(1,3), 16), parseInt(cfg.color.slice(3,5), 16), parseInt(cfg.color.slice(5,7), 16));
        doc.rect(15, y, 3, 12, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        doc.text(event.title, 22, y + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`${dayStr} | ${timeStr}`, 22, y + 12);

        if (event.description) {
          doc.setFontSize(8);
          doc.setTextColor(130, 130, 130);
          doc.text(event.description.substring(0, 80), 22, y + 17);
          y += 22;
        } else {
          y += 17;
        }
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(`Generated by Compass on ${moment().format('MMMM D, YYYY [at] h:mm A')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    doc.save(`compass-calendar-${moment(date).format('YYYY-MM')}.pdf`);
  };

  // CSV Export
  const exportCSV = () => {
    const header = 'Title,Start,End,Type,Description,Residents,Wing\n';
    const rows = events.map(e => {
      const residents = (e.residents || []).join('; ');
      return `"${e.title}","${e.start}","${e.end}","${e.type}","${(e.description || '').replace(/\"/g, '""')}","${residents}","${e.wing || 'both'}"`;
    }).join('\n');
    const csv = header + rows;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `compass-calendar-${moment(date).format('YYYY-MM')}.csv`;
    link.click();
  };

  // iCal Export
  const exportICal = () => {
    let ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Compass//Memory Care Activities//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    events.forEach(e => {
      const startStr = moment(e.start).utc().format('YYYYMMDDTHHmmss');
      const endStr = moment(e.end).utc().format('YYYYMMDDTHHmmss');
      const uid = e.id || uuidv4();
      const nowStr = moment().utc().format('YYYYMMDDTHHmmss');

      ical = ical.concat([
        'BEGIN:VEVENT',
        `UID:${uid}@compass-app`,
        `DTSTAMP:${nowStr}Z`,
        `DTSTART:${startStr}Z`,
        `DTEND:${endStr}Z`,
        `SUMMARY:${e.title}`,
        `DESCRIPTION:${(e.description || '').replace(/\n/g, '\\n')}`,
        'END:VEVENT',
      ]);
    });

    ical.push('END:VCALENDAR');

    const blob = new Blob([ical.join('\r\n')], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `compass-calendar-${moment(date).format('YYYY-MM')}.ics`;
    link.click();
  };

  // Canva Autofill Export
  const [canvaLoading, setCanvaLoading] = useState(false);
  const [canvaDesignId, setCanvaDesignId] = useState(() => localStorage.getItem('compass_canva_design_id') || 'DAHIju6R95s');

  const exportToCanva = async () => {
    // If no design ID saved, prompt the user
    if (!canvaDesignId) {
      const id = prompt(
        'Enter your Canva design template ID to autofill.\n\n' +
        'To get this:\n' +
        '1. Create a calendar template in Canva\n' +
        '2. Add placeholder tags like {{events_table.title}}, {{calendar_title}}\n' +
        '3. Get the design ID from the URL (the long string after /design/)\n\n' +
        'Design ID:'
      );
      if (!id) return;
      setCanvaDesignId(id);
      localStorage.setItem('compass_canva_design_id', id);
    }

    setCanvaLoading(true);

    try {
      // Gather events for current view
      const viewStart = view === Views.MONTH
        ? moment(date).startOf('month')
        : view === Views.WEEK
          ? moment(date).startOf('week')
          : moment(date).startOf('day');

      const viewEnd = view === Views.MONTH
        ? moment(date).endOf('month')
        : view === Views.WEEK
          ? moment(date).endOf('week')
          : moment(date).endOf('day');

      const filteredEvents = events
        .filter(e => {
          const d = moment(e.start);
          return d.isBetween(viewStart, viewEnd, 'day', '[]') &&
            (wingFilter === 'all' || e.wing === wingFilter || e.wing === 'both');
        })
        .sort((a, b) => new Date(a.start) - new Date(b.start));

      const formattedEvents = filteredEvents.map(e => ({
        date: moment(e.start).format('MMM D'),
        day: moment(e.start).format('ddd'),
        time: `${moment(e.start).format('h:mm A')} - ${moment(e.end).format('h:mm A')}`,
        title: e.title,
        type: e.type,
        wing: e.wing || 'both',
        residents: e.residents || [],
        description: e.description || '',
        month: moment(e.start).format('MMMM YYYY'),
      }));

      const res = await apiFetch(API.canvaAutofill, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designId: canvaDesignId,
          events: formattedEvents.length > 0 ? formattedEvents : [{
            date: moment(date).format('MMM D'),
            day: moment(date).format('ddd'),
            time: 'No events',
            title: 'No events scheduled',
            type: 'custom',
            wing: 'both',
            residents: [],
            description: '',
            month: moment(date).format('MMMM YYYY'),
          }]
        })
      });

      const data = await res.json();

      if (data.success && data.designUrl) {
        // Open the Canva design in a new tab
        window.open(data.designUrl, '_blank');
      } else {
        alert('Could not connect to Canva. ' + (data.error || data.details?.message || ''));
      }
    } catch (err) {
      console.error('Canva export error:', err);
      alert('Failed to export to Canva. Make sure the API server is running.');
    } finally {
      setCanvaLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-violet-700">Calendar</h1>
        <div className="flex items-center gap-2">
          {/* Export dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-violet-500 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors">
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <div className="absolute right-0 mt-1 w-44 bg-violet-50 border border-violet-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
              <button onClick={exportPDF} className="w-full px-4 py-2 text-sm text-gray-900 hover:bg-violet-100 flex items-center gap-2 first:rounded-t-lg">
                <FileText size={14} className="text-amber-400" /> Export as PDF
              </button>
              <button onClick={exportCSV} className="w-full px-4 py-2 text-sm text-gray-900 hover:bg-violet-100 flex items-center gap-2">
                <FileText size={14} className="text-violet-500" /> Export as CSV
              </button>
              <button onClick={exportICal} className="w-full px-4 py-2 text-sm text-gray-900 hover:bg-violet-100 flex items-center gap-2 last:rounded-b-lg">
                <FileText size={14} className="text-violet-500" /> Export as iCal
              </button>
              <div className="border-t border-violet-200 my-1" />
              <button
                onClick={exportToCanva}
                disabled={canvaLoading}
                className="w-full px-4 py-2 text-sm text-gray-900 hover:bg-violet-100 flex items-center gap-2 disabled:opacity-50"
              >
                <ExternalLink size={14} className="text-pink-500" />
                {canvaLoading ? 'Sending to Canva...' : 'Export to Canva ✨'}
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedDate(new Date());
              setFormData({
                title: '',
                start: moment().format('YYYY-MM-DDTHH:mm'),
                end: moment().add(1, 'hour').format('YYYY-MM-DDTHH:mm'),
                description: '',
                residents: [],
                type: 'music',
                wing: 'both',
              });
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors shadow-md"
          >
            <Plus size={16} />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Calendar controls */}
      <div className="flex items-center justify-between mb-4 bg-violet-50 rounded-xl border border-violet-200 px-4 py-2 shadow-md">
        <div className="flex items-center gap-2">
          <button onClick={goBack} className="p-1.5 rounded-lg hover:bg-violet-100 text-violet-500 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
            {view === Views.MONTH
              ? moment(date).format('MMMM YYYY')
              : `${moment(date).startOf(view === Views.WEEK ? 'week' : 'day').format('MMM D')} - ${moment(date).endOf(view === Views.WEEK ? 'week' : 'day').format('MMM D, YYYY')}`
            }
          </h2>
          <button onClick={goForward} className="p-1.5 rounded-lg hover:bg-violet-100 text-violet-500 transition-colors">
            <ChevronRight size={20} />
          </button>
          <button onClick={goToToday} className="ml-2 px-3 py-1 text-xs font-medium text-violet-700 bg-violet-200 rounded-lg hover:bg-violet-300 transition-colors">
            Today
          </button>
        </div>
        <div className="flex rounded-lg border border-violet-200 overflow-hidden">
          {[Views.MONTH, Views.WEEK, Views.DAY].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === v
                  ? 'bg-violet-600 text-white'
                  : 'bg-violet-50 text-gray-500 hover:bg-violet-100'
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Wing filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'Both Calendars', color: 'bg-violet-500', activeBg: 'bg-violet-600', activeText: 'text-white' },
          { value: 'assisted', label: 'Assisted Living', color: 'bg-blue-400', activeBg: 'bg-blue-500', activeText: 'text-white' },
          { value: 'memory', label: 'Memory Care', color: 'bg-purple-400', activeBg: 'bg-purple-500', activeText: 'text-white' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setWingFilter(opt.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              wingFilter === opt.value
                ? `${opt.activeBg} ${opt.activeText} shadow-md`
                : 'bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Calendar */}
      <div className="bg-violet-50 rounded-xl border border-violet-200 shadow-md overflow-hidden" ref={calendarRef}>
        <BigCalendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          view={view}
          date={date}
          onView={setView}
          onNavigate={setDate}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          eventPropGetter={eventPropGetter}
          style={{ height: view === Views.MONTH ? 700 : 600 }}
          popup
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          step={30}
          timeslots={2}
          min={new Date(0, 0, 0, 7, 0, 0)}
          max={new Date(0, 0, 0, 19, 0, 0)}
        />
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {activityTypes.map(t => (
          <div key={t.value} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: t.bg, color: t.color }}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
            {t.label}
          </div>
        ))}
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-violet-50 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-violet-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedDate ? `Add Event - ${moment(selectedDate).format('MMM D, YYYY')}` : 'Add Event'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-violet-100 text-gray-500">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Activity Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Morning Music Circle"
                  className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-violet-100 text-gray-900 placeholder:text-gray-500"
                />
              </div>

              {/* Date/Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Start</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.start}
                    onChange={e => setFormData(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-violet-100 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">End</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.end}
                    onChange={e => setFormData(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-violet-100 text-gray-900"
                  />
                </div>
              </div>

              {/* Activity Type */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Activity Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {activityTypes.map(t => {
                    const Icon = t.icon;
                    const isSelected = formData.type === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: t.value }))}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${
                          isSelected
                            ? 'border-2 shadow-md'
                            : 'border-violet-200 hover:border-violet-300'
                        }`}
                        style={{
                          borderColor: isSelected ? t.color : undefined,
                          backgroundColor: isSelected ? t.bg : 'transparent'
                        }}
                      >
                        <Icon size={18} style={{ color: t.color }} />
                        <span style={{ color: t.color }} className="font-medium">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Wing selection */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Wing</label>
                <div className="flex gap-2">
                  {[
                    { value: 'both', label: 'Both' },
                    { value: 'assisted', label: 'Assisted Living' },
                    { value: 'memory', label: 'Memory Care' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, wing: opt.value }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        formData.wing === opt.value
                          ? 'bg-violet-600 text-white'
                          : 'bg-violet-100 text-violet-700 border border-violet-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add notes, instructions, or details..."
                  rows={3}
                  className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 resize-none"
                />
              </div>

              {/* Residents */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Residents Involved</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={residentInput}
                    onChange={e => setResidentInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addResident(); } }}
                    placeholder="Type a name and press Enter"
                    className="flex-1 px-3 py-2 border border-violet-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                  />
                  <button type="button" onClick={addResident} className="px-3 py-2 text-sm text-violet-700 bg-violet-100 rounded-lg hover:bg-violet-200">
                    Add
                  </button>
                </div>
                {formData.residents.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {formData.residents.map(name => (
                      <span key={name} className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">
                        {name}
                        <button type="button" onClick={() => removeResident(name)} className="hover:text-red-400">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm text-gray-700 bg-violet-100 rounded-lg hover:bg-violet-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-sm text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors shadow-md"
                >
                  Add Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {showDetailModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-violet-50 rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-violet-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Event Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-1 rounded-lg hover:bg-violet-100 text-gray-500">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                {(() => {
                  const cfg = getTypeConfig(selectedEvent.type);
                  const Icon = cfg.icon;
                  return (
                    <span className="activity-badge" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                      <Icon size={14} /> {cfg.label}
                    </span>
                  );
                })()}
                {selectedEvent.wing && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    selectedEvent.wing === 'assisted'
                      ? 'bg-blue-100 text-blue-700'
                      : selectedEvent.wing === 'memory'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-violet-100 text-violet-700'
                  }`}>
                    {selectedEvent.wing === 'assisted' ? 'Assisted Living' : selectedEvent.wing === 'memory' ? 'Memory Care' : 'Both'}
                  </span>
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-900">{selectedEvent.title}</h3>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{moment(selectedEvent.start).format('dddd, MMMM D, YYYY')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{moment(selectedEvent.start).format('h:mm A')} - {moment(selectedEvent.end).format('h:mm A')}</span>
                <span className="text-gray-400">|</span>
                <span>{moment.duration(moment(selectedEvent.end).diff(moment(selectedEvent.start))).humanize()}</span>
              </div>

              {selectedEvent.description && (
                <div className="pt-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</label>
                  <p className="text-sm text-gray-700 mt-1">{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.residents?.length > 0 && (
                <div className="pt-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Residents</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedEvent.residents.map(name => (
                      <span key={name} className="px-2.5 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-violet-200 flex gap-3">
              <button
                onClick={handleDeleteEvent}
                className="px-4 py-2 text-sm text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                Delete Event
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 py-2 text-sm text-gray-700 bg-violet-100 rounded-lg hover:bg-violet-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
