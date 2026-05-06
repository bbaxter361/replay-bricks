// Dashboard page - Today's overview with quick actions
// Shows: today's schedule, upcoming events, recent chats, quick-add

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Users,
  MessageCircle,
  Plus,
  Search,
  ArrowRight,
  Music,
  Palette,
  Dumbbell,
  Gamepad2,
  MapPin,
  Stethoscope,
  Sparkles
} from 'lucide-react';
import { useStore } from '../stores/useStore';

// Activity type icons and colors
const activityConfig = {
  music: { icon: Music, color: '#D4A855', bg: '#fdf8ed', label: 'Music' },
  art: { icon: Palette, color: '#9B8EC4', bg: '#f4f0fa', label: 'Art' },
  exercise: { icon: Dumbbell, color: '#8CB08C', bg: '#f0f8f0', label: 'Exercise' },
  games: { icon: Gamepad2, color: '#E88D67', bg: '#fdf0e8', label: 'Games' },
  outings: { icon: MapPin, color: '#4A90A2', bg: '#e8f4f8', label: 'Outings' },
  therapy: { icon: Stethoscope, color: '#C47EB4', bg: '#f8eef6', label: 'Therapy' },
  custom: { icon: Sparkles, color: '#8B9DC4', bg: '#eef1f8', label: 'Custom' },
};

function getActivityConfig(type) {
  return activityConfig[type] || activityConfig.custom;
}

function formatTime(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function isToday(isoStr) {
  const d = new Date(isoStr);
  const today = new Date();
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { events, contacts, chatHistory, resetAllData } = useStore();
  const [quickSearch, setQuickSearch] = useState('');

  // Events happening today
  const todayEvents = events
    .filter(e => isToday(e.start))
    .sort((a, b) => new Date(a.start) - new Date(b.start));

  // Upcoming events this week
  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

  const upcomingEvents = events
    .filter(e => {
      const d = new Date(e.start);
      return d > now && d <= endOfWeek && !isToday(e.start);
    })
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 5);

  // Recent chat messages
  const recentChats = chatHistory.slice(-3).reverse();

  // Filtered contacts for quick search
  const filteredContacts = quickSearch
    ? contacts.filter(c =>
        c.name.toLowerCase().includes(quickSearch.toLowerCase()) ||
        c.tags?.some(t => t.toLowerCase().includes(quickSearch.toLowerCase()))
      ).slice(0, 5)
    : [];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Welcome header */}
      <div className="mb-6 flex items-center gap-4">
        {/* Axolotl avatar */}
        <div className="w-14 h-14 rounded-full bg-[#1e1e3a] border-2 border-violet-300/30 flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden">
          <svg viewBox="0 0 100 100" className="w-11 h-11">
            <circle cx="50" cy="50" r="45" fill="url(#axolotl-dash)" />
            <defs>
              <radialGradient id="axolotl-dash" cx="50%" cy="40%" r="55%">
                <stop offset="0%" stopColor="#f5c6d0" />
                <stop offset="100%" stopColor="#e8a0b8" />
              </radialGradient>
            </defs>
            <circle cx="35" cy="42" r="5" fill="#1a1a2e" />
            <circle cx="65" cy="42" r="5" fill="#1a1a2e" />
            <circle cx="36" cy="40" r="2" fill="white" />
            <circle cx="66" cy="40" r="2" fill="white" />
            <path d="M35 58 Q50 70 65 58" stroke="#1a1a2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <circle cx="25" cy="52" r="6" fill="#ff9eb5" opacity="0.4" />
            <circle cx="75" cy="52" r="6" fill="#ff9eb5" opacity="0.4" />
            <path d="M12 30 Q5 22 10 15" stroke="#e8a0b8" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M10 35 Q3 30 8 22" stroke="#e8a0b8" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M88 30 Q95 22 90 15" stroke="#e8a0b8" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M90 35 Q97 30 92 22" stroke="#e8a0b8" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-violet-300">
            Good morning, Amanda!
          </h1>
          <p className="text-violet-400 mt-1">
            Here's your day at a glance
          </p>
        </div>
      </div>

      {/* Quick actions row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => navigate('/calendar?add=true')}
          className="flex items-center gap-2 px-4 py-3 bg-violet-50 rounded-xl border border-violet-200 shadow-md hover:shadow-lg hover:border-violet-300 transition-all card-hover text-violet-700 font-medium text-sm"
        >
          <Plus size={18} />
          <span>Add Event</span>
        </button>
        <button
          onClick={() => navigate('/contacts/new')}
          className="flex items-center gap-2 px-4 py-3 bg-violet-50 rounded-xl border border-violet-200 shadow-md hover:shadow-lg hover:border-violet-300 transition-all card-hover text-violet-700 font-medium text-sm"
        >
          <Users size={18} />
          <span>Add Contact</span>
        </button>
        <button
          onClick={() => navigate('/chat')}
          className="flex items-center gap-2 px-4 py-3 bg-violet-50 rounded-xl border border-violet-200 shadow-md hover:shadow-lg hover:border-violet-300 transition-all card-hover text-violet-700 font-medium text-sm"
        >
          <MessageCircle size={18} />
          <span>Ask AI</span>
        </button>
        <button
          onClick={() => navigate('/calendar')}
          className="flex items-center gap-2 px-4 py-3 bg-violet-50 rounded-xl border border-violet-200 shadow-md hover:shadow-lg hover:border-violet-300 transition-all card-hover text-violet-700 font-medium text-sm"
        >
          <Calendar size={18} />
          <span>Full Calendar</span>
        </button>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column: Today's schedule + Upcoming */}
        <div className="lg:col-span-3 space-y-6">
          {/* Today's Schedule */}
          <div className="bg-violet-50 rounded-xl border border-violet-200 shadow-md overflow-hidden">
            <div className="px-5 py-4 border-b border-violet-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-violet-500" />
                <h2 className="font-semibold text-violet-700">Today's Schedule</h2>
              </div>
              <span className="text-xs text-gray-500 bg-violet-100 px-2 py-1 rounded-full">
                {todayEvents.length} activities
              </span>
            </div>

            {todayEvents.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Calendar size={32} className="mx-auto mb-2 opacity-20 text-gray-400" />
                <p className="text-sm text-gray-600">No activities scheduled for today</p>
                <button
                  onClick={() => navigate('/calendar?add=true')}
                  className="mt-3 text-violet-600 text-sm font-medium hover:text-violet-500"
                >
                  Add an activity →
                </button>
              </div>
            ) : (
              <div className="divide-y divide-violet-200">
                {todayEvents.map(event => {
                  const cfg = getActivityConfig(event.type);
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={event.id}
                      className="px-5 py-3 hover:bg-violet-100 transition-colors cursor-pointer"
                      onClick={() => navigate('/calendar')}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: cfg.bg, color: cfg.color }}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 text-sm truncate">
                              {event.title}
                            </h3>
                            <span
                              className="activity-badge"
                              style={{ backgroundColor: cfg.bg, color: cfg.color }}
                            >
                              {cfg.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {formatTime(event.start)} - {formatTime(event.end)}
                            </span>
                            {event.residents?.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Users size={12} />
                                {event.residents.length} residents
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming This Week */}
          <div className="bg-violet-50 rounded-xl border border-violet-200 shadow-md overflow-hidden">
            <div className="px-5 py-4 border-b border-violet-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-violet-500" />
                <h2 className="font-semibold text-violet-700">Upcoming This Week</h2>
              </div>
              <button
                onClick={() => navigate('/calendar')}
                className="text-xs text-violet-600 font-medium hover:text-violet-500 flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </button>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm text-gray-600">No more events this week</p>
              </div>
            ) : (
              <div className="divide-y divide-violet-200">
                {upcomingEvents.map(event => {
                  const cfg = getActivityConfig(event.type);
                  const Icon = cfg.icon;
                  const d = new Date(event.start);
                  const dayName = d.toLocaleDateString([], { weekday: 'short' });
                  const dayNum = d.getDate();
                  return (
                    <div
                      key={event.id}
                      className="px-5 py-3 hover:bg-violet-100 transition-colors cursor-pointer"
                      onClick={() => navigate('/calendar')}
                    >
                      <div className="flex items-start gap-3">
                        {/* Date badge */}
                        <div className="w-10 h-10 rounded-lg border border-violet-200 flex flex-col items-center justify-center flex-shrink-0 bg-violet-100">
                          <span className="text-xs text-violet-600 font-semibold leading-none">{dayName}</span>
                          <span className="text-sm text-violet-700 font-bold leading-none mt-0.5">{dayNum}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 text-sm truncate">
                              {event.title}
                            </h3>
                            <span
                              className="activity-badge"
                              style={{ backgroundColor: cfg.bg, color: cfg.color }}
                            >
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatTime(event.start)} - {formatTime(event.end)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Quick search + Recent chats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Search Contacts */}
          <div className="bg-violet-50 rounded-xl border border-violet-200 shadow-md overflow-hidden">
            <div className="px-5 py-4 border-b border-violet-200">
              <div className="flex items-center gap-2 mb-3">
                <Search size={16} className="text-violet-500" />
                <h2 className="font-semibold text-violet-700 text-sm">Quick Search</h2>
              </div>
              <input
                type="text"
                placeholder="Search residents, family, staff..."
                value={quickSearch}
                onChange={e => setQuickSearch(e.target.value)}
                className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 bg-violet-100 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {filteredContacts.length > 0 && (
              <div className="divide-y divide-violet-200 max-h-56 overflow-y-auto">
                {filteredContacts.map(contact => (
                  <div
                    key={contact.id}
                    className="px-5 py-2.5 hover:bg-violet-100 transition-colors cursor-pointer"
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-violet-500 text-white flex items-center justify-center text-xs font-semibold">
                        {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          contact.relationship === 'resident' ? 'bg-violet-200 text-violet-700' :
                          contact.relationship === 'family' ? 'bg-violet-200 text-violet-700' :
                          contact.relationship === 'doctor' ? 'bg-violet-200 text-violet-700' :
                          'bg-violet-200 text-violet-700'
                        }`}>
                          {contact.relationship}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {quickSearch && filteredContacts.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No contacts found for "{quickSearch}"
              </div>
            )}

            <div className="px-5 py-3 border-t border-violet-200">
              <button
                onClick={() => navigate('/contacts')}
                className="text-xs text-violet-600 font-medium hover:text-violet-500 flex items-center gap-1"
              >
                View all contacts <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Recent AI Chats */}
          <div className="bg-violet-50 rounded-xl border border-violet-200 shadow-md overflow-hidden">
            <div className="px-5 py-4 border-b border-violet-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle size={16} className="text-violet-500" />
                <h2 className="font-semibold text-violet-700 text-sm">Recent Conversations</h2>
              </div>
              <button
                onClick={() => navigate('/chat')}
                className="text-xs text-violet-600 font-medium hover:text-violet-500"
              >
                Open Chat →
              </button>
            </div>

            {recentChats.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <MessageCircle size={24} className="mx-auto mb-2 opacity-20 text-gray-400" />
                <p className="text-sm text-gray-600">No conversations yet</p>
                <button
                  onClick={() => navigate('/chat')}
                  className="mt-2 text-violet-600 text-sm font-medium hover:text-violet-500"
                >
                  Start a conversation →
                </button>
              </div>
            ) : (
              <div className="divide-y divide-violet-200">
                {recentChats.map(msg => (
                  <div
                    key={msg.id}
                    className="px-5 py-3 hover:bg-violet-100 transition-colors cursor-pointer"
                    onClick={() => navigate('/chat')}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                        msg.role === 'assistant'
                          ? 'bg-violet-200 text-violet-600'
                          : 'bg-violet-200 text-violet-600'
                      }`}>
                        {msg.role === 'assistant' ? '🤖' : '👤'}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 flex-1">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reset all data button — small and unobtrusive */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={() => {
            if (window.confirm('This will clear all contacts, events, chats, conversations, and books. This cannot be undone. Continue?')) {
              resetAllData();
              window.location.reload();
            }
          }}
          className="text-xs text-gray-400 hover:text-red-500 hover:underline transition-colors"
        >
          Reset Data
        </button>
      </div>
    </div>
  );
}
