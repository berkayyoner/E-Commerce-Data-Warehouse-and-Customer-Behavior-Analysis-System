import { useState } from 'react'

import { shopApi } from '../../api/resources'
import FormField from '../../components/ui/FormField'
import Modal from '../../components/ui/Modal'
import useNotify from '../../hooks/useNotify'
import useT from '../../hooks/useT'
import { buildPayload, initialValues, validateWarehouseForm } from './warehouseForm'

const FORM_ID = 'warehouse-form'

/** Creates a warehouse (warehouse is null) or edits one. */
export default function WarehouseFormModal({ warehouse, onClose, onSaved }) {
  const { t } = useT()
  const notify = useNotify()
  const isCreate = !warehouse
  const [values, setValues] = useState(() => initialValues(warehouse))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  function update(field, value) {
    setValues((previous) => ({ ...previous, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (saving) {
      return
    }
    const found = validateWarehouseForm(values, t)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      return
    }

    const request = isCreate
      ? shopApi.warehouses.create(buildPayload(values))
      : shopApi.warehouses.update(warehouse.id, buildPayload(values))
    setSaving(true)
    request
      .then(() => {
        notify.success()
        onSaved()
      })
      .catch((error) => notify.failure(error))
      .finally(() => setSaving(false))
  }

  return (
    <Modal
      title={t(isCreate ? 'warehouses.createTitle' : 'warehouses.editTitle')}
      onClose={onClose}
      dismissible={!saving}
      footer={
        <>
          <button type="button" className="button button-ghost" onClick={onClose} disabled={saving}>
            {t('common.actions.cancel')}
          </button>
          <button type="submit" form={FORM_ID} className="button button-primary" disabled={saving}>
            {t(isCreate ? 'common.actions.create' : 'common.actions.save')}
          </button>
        </>
      }
    >
      <form id={FORM_ID} className="form-stack" onSubmit={handleSubmit} noValidate>
        <FormField label={t('warehouses.form.name')} error={errors.name}>
          {(props) => (
            <input {...props} type="text" autoComplete="off" value={values.name} onChange={(event) => update('name', event.target.value)} />
          )}
        </FormField>

        <FormField label={t('warehouses.form.city')} error={errors.city}>
          {(props) => (
            <input {...props} type="text" autoComplete="off" value={values.city} onChange={(event) => update('city', event.target.value)} />
          )}
        </FormField>

        <FormField label={t('warehouses.form.region')} error={errors.region}>
          {(props) => (
            <input
              {...props}
              type="text"
              autoComplete="off"
              value={values.region}
              onChange={(event) => update('region', event.target.value)}
            />
          )}
        </FormField>
      </form>
    </Modal>
  )
}
