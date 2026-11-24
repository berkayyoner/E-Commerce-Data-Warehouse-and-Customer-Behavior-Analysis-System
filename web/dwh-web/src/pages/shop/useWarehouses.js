import { shopApi } from '../../api/resources'
import useRemoteData from '../../hooks/useRemoteData'

/** The warehouses for select boxes: the first hundred, in id order (the service's largest page). */
const loadWarehouses = () => shopApi.warehouses.list({ page: 0, size: 100 }).then((result) => result.content || [])

/** Warehouses for the filters and the forms. */
export default function useWarehouses() {
  const { data, error, loading, reload } = useRemoteData(loadWarehouses)
  return { warehouses: data || [], error, loading, reload }
}
