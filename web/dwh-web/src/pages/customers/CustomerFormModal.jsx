import { useState } from 'react'

import { shopApi } from '../../api/resources'
import FormField from '../../components/ui/FormField'
import Modal from '../../components/ui/Modal'
import useNotify from '../../hooks/useNotify'
import useT from '../../hooks/useT'
import useWarehouses from '../shop/useWarehouses'
import {
  DISTRICT_MAX,
  DISTRICT_MIN,
  buildCreatePayload,
  buildUpdatePayload,
  initialValues,
  validateCustomerForm,
} from './customerForm'

const FORM_ID = 'customer-form'

/** Creates a customer (customer is null) or edits one. The warehouse and the district only change on creation. */
export default function CustomerFormModal({ customer, onClose, onSaved }) {
  const { t } = useT()
  const notify = useNotify()
  const { warehouses } = useWarehouses()
  const isCreate = !customer
  const [values, setValues] = useState(() => initialValues(customer))
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
    const found = validateCustomerForm(values, { isCreate }, t)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      return
    }

    const request = isCreate
      ? shopApi.customers.create(buildCreatePayload(values))
      : shopApi.customers.update(customer, buildUpdatePayload(values))
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
      title={t(isCreate ? 'customers.createTitle' : 'customers.editTitle')}
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
        {!isCreate && <p className="field-hint">{t('customers.form.keyNote')}</p>}

        <FormField label={t('customers.form.warehouse')} error={errors.warehouseId}>
          {(props) => (
            <select
              {...props}
              value={values.warehouseId}
              disabled={!isCreate}
              onChange={(event) => update('warehouseId', event.target.value)}
            >
              <option value="" disabled>
                {t('customers.form.chooseWarehouse')}
              </option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField
          label={t('customers.form.district')}
          error={errors.districtId}
          hint={isCreate ? t('customers.form.districtHint') : undefined}
        >
          {(props) => (
            <input
              {...props}
              type="number"
              inputMode="numeric"
              min={DISTRICT_MIN}
              max={DISTRICT_MAX}
              step={1}
              value={values.districtId}
              disabled={!isCreate}
              onChange={(event) => update('districtId', event.target.value)}
            />
          )}
        </FormField>

        <FormField label={t('customers.form.firstName')} error={errors.firstName}>
          {(props) => (
            <input
              {...props}
              type="text"
              autoComplete="off"
              value={values.firstName}
              onChange={(event) => update('firstName', event.target.value)}
            />
          )}
        </FormField>

        <FormField label={t('customers.form.lastName')} error={errors.lastName}>
          {(props) => (
            <input
              {...props}
              type="text"
              autoComplete="off"
              value={values.lastName}
              onChange={(event) => update('lastName', event.target.value)}
            />
          )}
        </FormField>

        <FormField label={t('customers.form.email')} error={errors.email}>
          {(props) => (
            <input
              {...props}
              type="email"
              autoComplete="off"
              value={values.email}
              onChange={(event) => update('email', event.target.value)}
            />
          )}
        </FormField>

        <FormField label={t('customers.form.city')} error={errors.city}>
          {(props) => (
            <input {...props} type="text" autoComplete="off" value={values.city} onChange={(event) => update('city', event.target.value)} />
          )}
        </FormField>

        <FormField label={t('customers.form.region')} error={errors.region}>
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
