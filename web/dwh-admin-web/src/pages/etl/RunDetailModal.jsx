import { useEffect, useState } from 'react'

import { etlApi } from '../../api/resources'
import Icon from '../../components/ui/Icon'
import Modal from '../../components/ui/Modal'
import useT from '../../hooks/useT'
import { formatDateTime, formatDuration, formatNumber } from '../../utils/format'
import RunStatusBadge from './RunStatusBadge'
import { runDurationMs } from './etlRuns'

/** Summary, steps and quality checks of one run. Quality results show an icon and a text, never colour alone. */
export default function RunDetailModal({ runId, onClose }) {
  const { t } = useT()
  const [state, setState] = useState({ loading: true, error: null, detail: null })

  useEffect(() => {
    let active = true
    etlApi
      .getRun(runId)
      .then((detail) => {
        if (active) {
          setState({ loading: false, error: null, detail })
        }
      })
      .catch((error) => {
        if (active) {
          setState({ loading: false, error, detail: null })
        }
      })
    return () => {
      active = false
    }
  }, [runId])

  return (
    <Modal title={t('etl.detail.title', { id: runId })} onClose={onClose} size="large">
      {state.loading && <p className="empty-note">{t('common.table.loading')}</p>}
      {state.error && (
        <p className="form-alert" role="alert">
          {t('etl.detail.loadFailed')}
        </p>
      )}
      {state.detail && <RunDetailBody detail={state.detail} />}
    </Modal>
  )
}

function RunSummary({ run }) {
  const { t, language } = useT()
  return (
    <section className="detail-section">
      <h3>{t('etl.detail.summary')}</h3>
      <dl className="detail-list two-columns">
        <div>
          <dt>{t('etl.columns.status')}</dt>
          <dd>
            <RunStatusBadge status={run.status} />
          </dd>
        </div>
        <div>
          <dt>{t('etl.columns.runType')}</dt>
          <dd>{t(`etl.runTypes.${run.runType}`)}</dd>
        </div>
        <div>
          <dt>{t('etl.detail.startedAt')}</dt>
          <dd>{formatDateTime(run.startedAt, language)}</dd>
        </div>
        <div>
          <dt>{t('etl.detail.finishedAt')}</dt>
          <dd>{run.finishedAt ? formatDateTime(run.finishedAt, language) : t('etl.detail.notFinished')}</dd>
        </div>
        <div>
          <dt>{t('etl.detail.duration')}</dt>
          <dd>{formatDuration(runDurationMs(run))}</dd>
        </div>
        <div>
          <dt>{t('etl.detail.rowsRead')}</dt>
          <dd>{formatNumber(run.rowsRead, language)}</dd>
        </div>
        <div>
          <dt>{t('etl.detail.rowsLoaded')}</dt>
          <dd>{formatNumber(run.rowsLoaded, language)}</dd>
        </div>
        <div>
          <dt>{t('etl.detail.rowsRejected')}</dt>
          <dd>{formatNumber(run.rowsRejected, language)}</dd>
        </div>
        {run.errorMessage && (
          <div className="full-row">
            <dt>{t('etl.detail.errorMessage')}</dt>
            <dd className="error-text">{run.errorMessage}</dd>
          </div>
        )}
      </dl>
    </section>
  )
}

function RunDetailBody({ detail }) {
  const { t, language } = useT()
  const steps = detail.steps || []
  const checks = detail.qualityChecks || []

  return (
    <>
      <RunSummary run={detail.run} />

      <section className="detail-section">
        <h3>{t('etl.detail.steps')}</h3>
        {steps.length === 0 ? (
          <p className="empty-note">{t('etl.detail.noSteps')}</p>
        ) : (
          <div className="data-table-scroll">
            <table className="plain-table">
              <thead>
                <tr>
                  <th scope="col">{t('etl.detail.stepName')}</th>
                  <th scope="col">{t('etl.detail.stepRowsRead')}</th>
                  <th scope="col">{t('etl.detail.stepRowsLoaded')}</th>
                  <th scope="col">{t('etl.detail.stepDuration')}</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((step, index) => (
                  <tr key={`${step.stepName}-${index}`}>
                    <th scope="row">{step.stepName}</th>
                    <td>{formatNumber(step.rowsRead, language)}</td>
                    <td>{formatNumber(step.rowsLoaded, language)}</td>
                    <td>{formatDuration(step.durationMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="detail-section">
        <h3>{t('etl.detail.quality')}</h3>
        {checks.length === 0 ? (
          <p className="empty-note">{t('etl.detail.noChecks')}</p>
        ) : (
          <div className="data-table-scroll">
            <table className="plain-table">
              <thead>
                <tr>
                  <th scope="col">{t('etl.detail.checkName')}</th>
                  <th scope="col">{t('etl.detail.result')}</th>
                  <th scope="col">{t('etl.detail.checkDetail')}</th>
                </tr>
              </thead>
              <tbody>
                {checks.map((check, index) => (
                  <tr key={`${check.checkName}-${index}`}>
                    <th scope="row">{check.checkName}</th>
                    <td>
                      <span className={`check-result ${check.passed ? 'is-passed' : 'is-failed'}`}>
                        <Icon name={check.passed ? 'circleCheck' : 'circleX'} size={16} />
                        <span>{t(check.passed ? 'etl.checks.passed' : 'etl.checks.failed')}</span>
                      </span>
                    </td>
                    <td>{check.detail || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
