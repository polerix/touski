import { useState } from 'react'
import { generateMealPlan } from '../api/mealPlannerAdapter'
import { forgetKey } from '../api/keyStore'

export function useMealPlan() {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [keyNotice, setKeyNotice] = useState(null)

  async function generate({ pantryItems, household, cookingStyle, weekStart }) {
    setLoading(true)
    setError(null)
    setKeyNotice(null)

    try {
      const result = await generateMealPlan({
        pantryItems,
        household,
        cookingStyle,
        weekStart,
      })
      setPlan(result)
    } catch (e) {
      if (e.name === 'ApiKeyError') {
        // A rejected key is unusable, so drop it and let the key panel take over.
        if (e.code === 'INVALID_KEY') forgetKey()
        setKeyNotice(e.message)
      } else {
        setError(e.message || 'Failed to generate meal plan')
      }
    } finally {
      setLoading(false)
    }
  }

  return { plan, loading, error, keyNotice, setKeyNotice, generate }
}
