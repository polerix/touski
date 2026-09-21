import { useState } from 'react'
import { useMealPlan } from './hooks/useMealPlan'
import { useApiKey } from './hooks/useApiKey'
import { usesProxy } from './api/mealPlannerAdapter'
import LiquidGlassFilters from './components/LiquidGlassFilters'
import ControlPanel from './components/ControlPanel'
import KeyPanel from './components/KeyPanel'
import PantryInput from './components/PantryInput'
import Carousel from './components/Carousel'
import ShoppingList from './components/ShoppingList'
import './styles/touski.css'

function getThisMonday() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff)).toISOString().split('T')[0]
}

export default function App() {
  const [pantry, setPantry] = useState('')
  const [config, setConfig] = useState({
    household: '2',
    weekStart: getThisMonday(),
    cookingStyle: 'casual',
  })

  const { plan, loading, error, keyNotice, setKeyNotice, generate } = useMealPlan()
  const keyMode = useApiKey()

  function handleGenerate() {
    if (!usesProxy && keyMode === 'none') {
      setKeyNotice('Add your Anthropic API key first, then plan your week.')
      return
    }
    const items = pantry.split('\n').filter((l) => l.trim())
    if (!items.length) {
      alert('Please add some pantry items first')
      return
    }
    generate({
      pantryItems: items,
      household: config.household,
      cookingStyle: config.cookingStyle,
      weekStart: config.weekStart,
    })
  }

  return (
    <>
      <LiquidGlassFilters />

      <div className="shell">
        {/* Header */}
        <div className="top">
          <div>
            <div className="logo">touski</div>
            <div className="logo-tag">tout ce qui reste · meal planner</div>
          </div>
          <div className="logo-right">
            <div className="logo-model">MODEL 3000</div>
            <div className="logo-desc">AI Home Chef Edition</div>
          </div>
        </div>

        {/* Anthropic key: first-run prompt, then a status row with Forget */}
        <KeyPanel mode={keyMode} notice={keyNotice} onSaved={() => setKeyNotice(null)} />

        {/* Control Panel — the four liquid glass buttons */}
        <ControlPanel
          config={config}
          onChange={setConfig}
          onGenerate={handleGenerate}
          loading={loading}
        />

        {/* Pantry input */}
        <PantryInput value={pantry} onChange={setPantry} />

        {/* Error */}
        {error && <div className="err">{error}</div>}

        {/* Results — carousel + shopping list */}
        {plan && (
          <>
            <Carousel plan={plan} weekStart={config.weekStart} />
            <ShoppingList plan={plan} />
          </>
        )}

        {/* Bottom bar */}
        <div className="bar">
          <span className="bar-left">touski Meal Planner · Powered by Claude AI</span>
          <span className="bar-right">v1.0.0 © 2026</span>
        </div>
      </div>
    </>
  )
}
