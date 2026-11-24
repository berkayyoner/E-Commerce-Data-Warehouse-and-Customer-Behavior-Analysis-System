import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import { segmentationApi } from '../../api/resources'
import useNotify from '../../hooks/useNotify'
import { pushToast } from '../../store/uiSlice'
import { isConflict } from '../shop/conflict'

export const RUN_POLL_MS = 3000

/**
 * Starts a segmentation run and follows it. While the run is RUNNING its status is read every three seconds. When
 * it has finished, finishedCount goes up so that the sections of the page load their data again. A second run that
 * is refused because one is already running gets its own message.
 */
export default function useSegmentRun() {
  const dispatch = useDispatch()
  const notify = useNotify()
  const [run, setRun] = useState(null)
  const [starting, setStarting] = useState(false)
  const [pollFailed, setPollFailed] = useState(false)
  const [finishedCount, setFinishedCount] = useState(0)
  const running = run !== null && run.status === 'RUNNING' && !pollFailed

  useEffect(() => {
    if (!running) {
      return undefined
    }
    const timer = setTimeout(() => {
      segmentationApi
        .getRun(run.id)
        .then((detail) => {
          setRun(detail.run)
          if (detail.run.status !== 'RUNNING') {
            setFinishedCount((count) => count + 1)
          }
        })
        .catch(() => setPollFailed(true))
    }, RUN_POLL_MS)
    return () => clearTimeout(timer)
  }, [run, running])

  function start() {
    setStarting(true)
    setPollFailed(false)
    segmentationApi
      .startRun()
      .then(setRun)
      .catch((error) => {
        if (isConflict(error)) {
          dispatch(pushToast('error', 'shop.conflict.alreadyRunning'))
        } else {
          notify.failure(error)
        }
      })
      .finally(() => setStarting(false))
  }

  return { run, busy: starting || running, pollFailed, finishedCount, start }
}
