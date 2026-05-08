import { useState } from 'react'
import { 
  Search, Ship, Mountain, Plane, Calendar, Users, 
  MapPin, ArrowRight, ExternalLink, Loader2
} from 'lucide-react'

const CRUISE_DESTINATIONS = [
  { value: 'caribbean', label: 'Caribbean' },
  { value: 'alaska', label: 'Alaska' },
  { value: 'bahamas', label: 'Bahamas' },
  { value: 'mexico', label: 'Mexican Riviera' },
  { value: 'europe', label: 'Europe / Mediterranean' },
  { value: 'hawaii', label: 'Hawaii' },
]

const MONTHS = [
  '2026-06', '2026-07', '2026-08', '2026-09',
  '2026-10', '2026-11', '2026-12', '2027-01',
]

const CO_DESTINATIONS = [
  { value: 'DEN', label: 'Denver (DEN)' },
  { value: 'COS', label: 'Colorado Springs (COS)' },
  { value: 'MTJ', label: 'Montrose/Telluride (MTJ)' },
  { value: 'ASE', label: 'Aspen (ASE)' },
]

export default function TravelPortal() {
  const [tab, setTab] = useState('cruise')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  // Cruise form
  const [cruiseDest, setCruiseDest] = useState('caribbean')
  const [cruiseMonth, setCruiseMonth] = useState('2026-07')
  const [cruisePax, setCruisePax] = useState(2)

  // Colorado form
  const [coFrom, setCoFrom] = useState('DFW')
  const [coTo, setCoTo] = useState('DEN')
  const [coDepart, setCoDepart] = useState('')
  const [coReturn, setCoReturn] = useState('')

  const searchCruise = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/travel/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'cruise', destination: cruiseDest, month: cruiseMonth, pax: cruisePax })
      })
      const data = await res.json()
      setResults(data.results || [])
    } catch (e) {
      setError('Search failed. Try again.')
    }
    setLoading(false)
  }

  const searchColorado = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/travel/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'colorado', origin: coFrom, destination: coTo, depart: coDepart, return_date: coReturn })
      })
      const data = await res.json()
      setResults(data.results || [])
    } catch (e) {
      setError('Search failed. Try again.')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">✈️ Travel Portal</h1>
        <p className="text-gray-400 text-sm mt-1">Find the best deals on cruises and Colorado trips</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-dark-card rounded-xl p-1 border border-dark-border">
        <button
          onClick={() => { setTab('cruise'); setResults(null) }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'cruise' ? 'bg-lego-red text-white shadow-lg' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Ship className="w-4 h-4" /> Cruises
        </button>
        <button
          onClick={() => { setTab('colorado'); setResults(null) }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'colorado' ? 'bg-lego-red text-white shadow-lg' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Mountain className="w-4 h-4" /> Colorado
        </button>
      </div>

      {/* Cruise Form */}
      {tab === 'cruise' && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-lego-gold mb-4 flex items-center gap-2">
            <Ship className="w-5 h-5" /> Find a Cruise
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Destination</label>
              <select value={cruiseDest} onChange={e => setCruiseDest(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-lego-red focus:outline-none">
                {CRUISE_DESTINATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Month</label>
              <select value={cruiseMonth} onChange={e => setCruiseMonth(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-lego-red focus:outline-none">
                {MONTHS.map(m => <option key={m} value={m}>{m.replace('-', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Passengers</label>
              <select value={cruisePax} onChange={e => setCruisePax(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-lego-red focus:outline-none">
                {[1,2,3,4].map(n => <option key={n} value={n}>{n} {n === 1 ? 'passenger' : 'passengers'}</option>)}
              </select>
            </div>
          </div>
          <button onClick={searchCruise} disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-lego-red text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Searching...' : 'Search Cruises'}
          </button>
        </div>
      )}

      {/* Colorado Form */}
      {tab === 'colorado' && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-lego-gold mb-4 flex items-center gap-2">
            <Mountain className="w-5 h-5" /> Colorado Trip
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">From</label>
              <input value={coFrom} onChange={e => setCoFrom(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-lego-red focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">To</label>
              <select value={coTo} onChange={e => setCoTo(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-lego-red focus:outline-none">
                {CO_DESTINATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Depart</label>
              <input type="date" value={coDepart} onChange={e => setCoDepart(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-lego-red focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Return</label>
              <input type="date" value={coReturn} onChange={e => setCoReturn(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-lego-red focus:outline-none" />
            </div>
          </div>
          <button onClick={searchColorado} disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-lego-red text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plane className="w-4 h-4" />}
            {loading ? 'Searching...' : 'Search Flights'}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {loading && (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-lego-gold mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Searching Expedia, Travelocity, VacationsToGo...</p>
        </div>
      )}

      {results && !loading && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            {results.length} {results.length === 1 ? 'deal' : 'deals'} found
          </h3>
          {results.length === 0 ? (
            <div className="bg-dark-card border border-dark-border rounded-xl p-8 text-center">
              <p className="text-gray-500">No results found. Try different dates or destination.</p>
            </div>
          ) : results.map((r, i) => (
            <div key={i} className="bg-dark-card border border-dark-border rounded-xl p-5 hover:border-lego-red/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-base mb-1">{r.name}</h4>
                  <p className="text-gray-400 text-sm mb-2">{r.details}</p>
                  {r.source && (
                    <span className="inline-block text-xs text-gray-500 bg-dark-bg px-2 py-1 rounded">
                      {r.source}
                    </span>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  {r.price && <div className="text-xl font-bold text-green-400">{r.price}</div>}
                  {r.link && (
                    <a href={r.link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-lego-red/20 text-lego-red rounded-lg text-xs font-medium hover:bg-lego-red/30 transition-colors">
                      View Deal <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
