import { useState } from 'react'
import { generateMealPlan } from '../api/mealPlannerAdapter'

export function useMealPlan() {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function generate({ pantryItems, household, cookingStyle, weekStart }) {
    setLoading(true)
    setError(null)

    try {
      const result = await generateMealPlan({
        pantryItems,
        household,
        cookingStyle,
        weekStart,
      })
      setPlan(result)
    } catch (e) {
      setError(e.message || 'Failed to generate meal plan')
    } finally {
      setLoading(false)
    }
  }

  return { plan, loading, error, generate }
}
