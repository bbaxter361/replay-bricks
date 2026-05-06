// Contacts page with search, filter, CRUD operations
// Full contact management for residents, family, doctors, and staff

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Users,
  Phone,
  Mail,
  Tag,
  X,
  Filter
} from 'lucide-react';
import { useStore } from '../stores/useStore';

const relationshipColors = {
  resident: { bg: 'bg-teal-600/20', text: 'text-teal-300', dot: 'bg-teal-500' },
  family: { bg: 'bg-amber-900/30', text: 'text-amber-400', dot: 'bg-amber-500' },
  doctor: { bg: 'bg-purple-900/30', text: 'text-purple-400', dot: 'bg-purple-500' },
  staff: { bg: 'bg-sage-900/30', text: 'text-sage-400', dot: 'bg-sage-500' },
};

export default function ContactsPage() {
  const navigate = useNavigate();
  const { contacts } = useStore();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const relationshipTypes = ['all', 'resident', 'family', 'doctor', 'staff'];

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      // Filter by relationship type
      if (filterType !== 'all' && c.relationship !== filterType) return false;

      // Search by name, notes, tags
      if (search) {
        const q = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.notes?.toLowerCase().includes(q) ||
          c.tags?.some(t => t.toLowerCase().includes(q)) ||
          c.phone?.includes(q) ||
          c.email?.toLowerCase().includes(q)
        );
      }

      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [contacts, search, filterType]);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-teal-300">Contacts</h1>
        <button
          onClick={() => navigate('/contacts/new')}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors shadow-md"
        >
          <Plus size={16} />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-dark-card rounded-xl border border-dark-border shadow-md p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" />
            <input
              type="text"
              placeholder="Search by name, notes, tags, phone, or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-dark-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-500 bg-dark-bg text-dark-text placeholder:text-dark-muted"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-muted hover:text-dark-text">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Filter size={16} className="text-dark-muted self-center" />
          {relationshipTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize ${
                filterType === type
                  ? type === 'all'
                    ? 'bg-teal-500 text-white'
                    : `${relationshipColors[type].bg} ${relationshipColors[type].text} ring-2 ring-offset-2 ring-offset-dark-bg ${relationshipColors[type].text.includes('teal') ? 'ring-teal-600/50' : relationshipColors[type].text.includes('amber') ? 'ring-amber-600/50' : relationshipColors[type].text.includes('purple') ? 'ring-purple-600/50' : 'ring-sage-600/50'}`
                  : 'bg-dark-hover text-dark-muted hover:bg-dark-hover'
              }`}
            >
              {type === 'all' ? 'All Types' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Contact count */}
      <div className="mb-4 text-sm text-dark-muted">
        {filteredContacts.length} {filteredContacts.length === 1 ? 'contact' : 'contacts'}
        {filterType !== 'all' && ` (${filterType}s)`}
        {search && ` matching "${search}"`}
      </div>

      {/* Contact Grid */}
      {filteredContacts.length === 0 ? (
        <div className="bg-dark-card rounded-xl border border-dark-border shadow-md p-12 text-center">
          <Users size={48} className="mx-auto mb-3 text-dark-muted" />
          <h3 className="text-lg font-medium text-dark-muted mb-1">No contacts found</h3>
          <p className="text-sm text-dark-muted mb-4">
            {search ? 'Try a different search term' : 'Get started by adding your first contact'}
          </p>
          <button
            onClick={() => navigate('/contacts/new')}
            className="px-4 py-2 text-sm text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors"
          >
            Add Contact
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredContacts.map(contact => {
            const colors = relationshipColors[contact.relationship] || relationshipColors.staff;
            const initials = contact.name.split(' ').map(n => n[0]).join('').slice(0, 2);

            return (
              <div
                key={contact.id}
                onClick={() => navigate(`/contacts/${contact.id}`)}
                className="bg-dark-card rounded-xl border border-dark-border shadow-md p-4 hover:shadow-lg hover:border-teal-600/30 transition-all card-hover cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
                    contact.relationship === 'resident' ? 'bg-gradient-to-br from-teal-400 to-teal-500' :
                    contact.relationship === 'family' ? 'bg-gradient-to-br from-amber-400 to-amber-500' :
                    contact.relationship === 'doctor' ? 'bg-gradient-to-br from-purple-400 to-purple-500' :
                    'bg-gradient-to-br from-sage-400 to-sage-500'
                  }`}>
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name and badge */}
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-dark-text truncate">{contact.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colors.bg} ${colors.text}`}>
                        {contact.relationship}
                      </span>
                    </div>

                    {/* Contact info */}
                    <div className="space-y-1">
                      {contact.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-dark-muted">
                          <Phone size={12} className="text-dark-muted" />
                          {contact.phone}
                        </div>
                      )}
                      {contact.email && (
                        <div className="flex items-center gap-1.5 text-xs text-dark-muted truncate">
                          <Mail size={12} className="text-dark-muted" />
                          {contact.email}
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {contact.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {contact.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-dark-hover text-teal-300 rounded-full text-[10px] font-medium">
                            <Tag size={8} />
                            {tag}
                          </span>
                        ))}
                        {contact.tags.length > 3 && (
                          <span className="px-2 py-0.5 bg-dark-hover text-dark-muted rounded-full text-[10px]">
                            +{contact.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
