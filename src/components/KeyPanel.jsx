import { useState } from 'react'
import { saveKey, forgetKey } from '../api/keyStore'
import { usesProxy } from '../api/mealPlannerAdapter'

export default function KeyPanel({ mode, notice, onSaved }) {
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState(null)

  // A backend proxy holds the credentials, so visitors never need a key.
  if (usesProxy) return null

  function handleSave() {
    const result = saveKey(value, { remember })
    if (!result.ok) {
      setError(result.error)
      return
    }
    setValue('')
    setShow(false)
    setError(null)
    onSaved()
  }

  function handleForget() {
    forgetKey()
    setRemember(false)
  }

  if (mode !== 'none') {
    return (
      <div className="body key-row">
        <span className="field-label key-status">
          API key · {mode === 'device' ? 'remembered on this device' : 'held for this tab only'}
        </span>
        <button className="sm-btn" onClick={handleForget}>
          Forget key
        </button>
      </div>
    )
  }

  // Not a <form>: a password field in a submitted form invites the browser's
  // "save password" prompt, and this key should not go into the password manager.
  return (
    <div className="body key-panel">
      <div className="field-label">Anthropic API key</div>
      <p className="key-help">
        Touski calls Claude with your own key. Paste it once. It stays in this browser and is sent
        only to api.anthropic.com. It is never sent to GitHub or stored in the site's code. Get one
        at console.anthropic.com.
      </p>

      <div className="key-input-row">
        <input
          className="pbox key-input"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(null)
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="sk-ant-…"
          aria-label="Anthropic API key"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <button className="sm-btn" type="button" onClick={() => setShow((s) => !s)}>
          {show ? 'Hide' : 'Show'}
        </button>
        <button className="sm-btn" type="button" onClick={handleSave}>
          Use key
        </button>
      </div>

      <label className="key-remember">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        Remember on this device
        <span className="key-hint">
          {remember
            ? ' — stays until you press Forget key'
            : ' — off: forgotten when this tab closes'}
        </span>
      </label>

      {(error || notice) && (
        <div className="key-err" role="alert">
          {error || notice}
        </div>
      )}
    </div>
  )
}
