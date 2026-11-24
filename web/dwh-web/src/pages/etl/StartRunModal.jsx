import { useState } from 'react'

import { etlApi } from '../../api/resources'
import Modal from '../../components/ui/Modal'
import useNotify from '../../hooks/useNotify'
import useT from '../../hooks/useT'

const FORM_ID = 'start-run-form'
const RUN_TYPES = ['FULL', 'INCREMENTAL']

/** Chooses Full or Incremental and starts a run. Only administrators see the button that opens this dialog. */
export default function StartRunModal({ onClose, onStarted }) {
  const { t } = useT()
  const notify = useNotify()
  const [runType, setRunType] = useState('INCREMENTAL')
  const [busy, setBusy] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    if (busy) {
      return
    }
    setBusy(true)
    etlApi
      .startRun(runType)
      .then(() => {
        notify.success('etl.start.started')
        onStarted()
      })
      .catch((error) => notify.failure(error))
      .finally(() => setBusy(false))
  }

  return (
    <Modal
      title={t('etl.start.title')}
      onClose={onClose}
      dismissible={!busy}
      footer={
        <>
          <button type="button" className="button button-ghost" onClick={onClose} disabled={busy}>
            {t('common.actions.cancel')}
          </button>
          <button type="submit" form={FORM_ID} className="button button-primary" disabled={busy}>
            {t('etl.start.submit')}
          </button>
        </>
      }
    >
      <form id={FORM_ID} className="form-stack" onSubmit={handleSubmit}>
        <fieldset className="choice-group">
          <legend>{t('etl.start.runTypeLegend')}</legend>
          {RUN_TYPES.map((type) => (
            <label key={type} className={`choice${runType === type ? ' is-selected' : ''}`}>
              <input
                type="radio"
                name="runType"
                value={type}
                checked={runType === type}
                onChange={() => setRunType(type)}
              />
              <span className="choice-text">
                <strong>{t(`etl.start.options.${type}.label`)}</strong>
                <span className="field-hint">{t(`etl.start.options.${type}.description`)}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </form>
    </Modal>
  )
}
