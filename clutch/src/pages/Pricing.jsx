import { useState, useEffect } from 'react'
import { api } from '../api'
import toast from 'react-hot-toast'

export default function Pricing() {
  const [rules, setRules] = useState([])
  const [preview, setPreview] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  const load = () => {
    setLoading(true)
    Promise.all([
      api.getPricingRules(),
      api.getPricingPreview(),
    ]).then(([r, p]) => {
      setRules(r)
      setPreview(p)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const createRule = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    const rule = {
      name: form.get('name'),
      rule_type: form.get('rule_type'),
      markup_percent: parseFloat(form.get('markup_percent')) || null,
      markup_fixed_cents: parseInt(form.get('markup_fixed')) || null,
      condition: form.get('condition') || null,
      min_price_cents: parseInt(form.get('min_price')) || null,
      max_price_cents: parseInt(form.get('max_price')) || null,
    }
    try {
      await api.createPricingRule(rule)
      toast.success('✅ Rule created')
      setShowNew(false)
      load()
    } catch (err) { toast.error(err.message) }
  }

  const deleteRule = async (id) => {
    try {
      await api.deletePricingRule(id)
      toast.success('🗑️ Rule deleted')
      load()
    } catch (err) { toast.error(err.message) }
  }

  const apply = async (changes) => {
    try {
      const r = await api.applyPricing(changes)
      toast.success(`✅ Applied to ${r.applied} items (mode: ${r.push_mode})`)
      load()
    } catch (err) { toast.error(err.message) }
  }

  const ruleTypes = ['all', 'percentage', 'fixed']
  const filteredRules = activeTab === 'all' ? rules : rules.filter(r => r.rule_type === activeTab)

  if (loading) return <div className="win95-loading" style={{ padding: '32px', color: '#808080' }}>⏳ Loading…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <div className="win95-section-title">💰 Auto-Pricing</div>
        <div className="win95-section-desc">Create and manage pricing rules to automatically adjust your inventory prices based on market conditions.</div>
      </div>

      <hr className="win95-divider" />

      {/* ── Action bar + New Rule ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#000' }}>
          📋 {rules.length} rule{rules.length !== 1 ? 's' : ''} configured
        </span>
        <button onClick={() => setShowNew(!showNew)} className="win95-button">
          {showNew ? '✕ Cancel' : '➕ New Rule'}
        </button>
      </div>

      {showNew && (
        <form onSubmit={createRule} className="win95-groupbox">
          <legend>🆕 Create New Rule</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: '#000' }}>Name:</label>
                <input name="name" required className="win95-input" placeholder="e.g. 20% over market" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: '#000' }}>Type:</label>
                <select name="rule_type" className="win95-select">
                  <option value="percentage">📊 Percentage Markup</option>
                  <option value="fixed">💰 Fixed Markup</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: '#000' }}>Markup %:</label>
                <input name="markup_percent" type="number" step="0.1" className="win95-input" style={{ width: '80px' }} placeholder="25" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: '#000' }}>Fixed (¢):</label>
                <input name="markup_fixed" type="number" className="win95-input" style={{ width: '80px' }} placeholder="50" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: '#000' }}>Condition:</label>
                <select name="condition" className="win95-select">
                  <option value="">All</option>
                  <option value="NEW">🆕 New</option>
                  <option value="USED">♻️ Used</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: '#000' }}>Min Price (¢):</label>
                <input name="min_price" type="number" className="win95-input" style={{ width: '80px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: '#000' }}>Max Price (¢):</label>
                <input name="max_price" type="number" className="win95-input" style={{ width: '80px' }} />
              </div>
            </div>
            <button type="submit" className="win95-button">✅ Create Rule</button>
          </div>
        </form>
      )}

      {/* ── Rule Tabs ── */}
      {rules.length > 0 && (
        <>
          <div className="win95-tabs">
            {ruleTypes.map(tab => (
              <div
                key={tab}
                className={`win95-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'all' ? '📋 All' : tab === 'percentage' ? '📊 Percentage' : '💰 Fixed'}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredRules.map(r => (
              <div key={r.id} className="win95-groupbox" style={{ padding: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{r.rule_type === 'percentage' ? '📊' : '💰'}</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#000' }}>{r.name}</div>
                      <div style={{ fontSize: '11px', color: '#404040' }}>
                        {r.rule_type === 'percentage' ? `${r.markup_percent}% markup` : `+$${((r.markup_fixed_cents || 0)/100).toFixed(2)} fixed`}
                        {r.condition ? ` · ${r.condition}` : ''}
                        {r.min_price_cents ? ` · Min: $${(r.min_price_cents/100).toFixed(2)}` : ''}
                        {r.max_price_cents ? ` · Max: $${(r.max_price_cents/100).toFixed(2)}` : ''}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => deleteRule(r.id)} className="win95-button" style={{ fontSize: '11px', padding: '2px 8px' }}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {rules.length === 0 && (
        <div className="win95-window" style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '24px', marginBottom: '8px' }}>📋</p>
          <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>No Pricing Rules Yet</p>
          <p style={{ fontSize: '12px', color: '#404040', marginBottom: '12px' }}>
            Create your first pricing rule to automatically adjust item prices based on market conditions.
          </p>
          <button onClick={() => setShowNew(true)} className="win95-button">
            ➕ Create Your First Rule
          </button>
        </div>
      )}

      {/* ── Price Preview ── */}
      {preview && preview.proposals && (
        <div className="win95-groupbox">
          <legend>👁️ Price Preview ({preview.proposals.length} item{preview.proposals.length !== 1 ? 's' : ''})</legend>
          {preview.proposals.length === 0 ? (
            <div style={{ padding: '8px', textAlign: 'center', fontSize: '12px', color: '#404040' }}>
              ✅ All prices are already optimal — no changes needed.
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto', marginBottom: '8px' }}>
                <table className="win95-table" style={{ width: '100%', fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '4px 8px' }}>Part #</th>
                      <th style={{ textAlign: 'left', padding: '4px 8px' }}>Name</th>
                      <th style={{ textAlign: 'right', padding: '4px 8px' }}>Current</th>
                      <th style={{ textAlign: 'right', padding: '4px 8px' }}>Proposed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.proposals.slice(0, 15).map((p, i) => (
                      <tr key={i}>
                        <td style={{ padding: '4px 8px', fontFamily: '"Courier New", monospace', color: '#000080' }}>{p.part_no}</td>
                        <td style={{ padding: '4px 8px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.part_name || '—'}</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right' }}>${((p.current_price_cents || 0) / 100).toFixed(2)}</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold', color: '#000080' }}>${(p.proposed_price_cents / 100).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => apply(preview.proposals.map(p => ({ inventory_id: p.inventory_id, price_cents: p.proposed_price_cents })))}
                  className="win95-button"
                >
                  ⚡ Apply All ({preview.proposals.length} change{preview.proposals.length !== 1 ? 's' : ''})
                </button>
                <button onClick={load} className="win95-button">
                  🔄 Refresh Preview
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
