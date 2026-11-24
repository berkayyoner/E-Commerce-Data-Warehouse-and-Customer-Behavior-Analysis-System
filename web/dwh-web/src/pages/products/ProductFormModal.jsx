import { useState } from 'react'

import { shopApi } from '../../api/resources'
import FormField from '../../components/ui/FormField'
import Modal from '../../components/ui/Modal'
import useNotify from '../../hooks/useNotify'
import useT from '../../hooks/useT'
import { PRICE_MAX, PRICE_MIN, buildPayload, initialValues, validateProductForm } from './productForm'

const FORM_ID = 'product-form'

/** Creates a product (product is null) or edits one. */
export default function ProductFormModal({ product, onClose, onSaved }) {
  const { t } = useT()
  const notify = useNotify()
  const isCreate = !product
  const [values, setValues] = useState(() => initialValues(product))
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
    const found = validateProductForm(values, t)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      return
    }

    const request = isCreate
      ? shopApi.products.create(buildPayload(values))
      : shopApi.products.update(product.id, buildPayload(values))
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
      title={t(isCreate ? 'products.createTitle' : 'products.editTitle')}
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
        <FormField label={t('products.form.name')} error={errors.name}>
          {(props) => (
            <input {...props} type="text" autoComplete="off" value={values.name} onChange={(event) => update('name', event.target.value)} />
          )}
        </FormField>

        <FormField label={t('products.form.price')} error={errors.price} hint={t('products.form.priceHint')}>
          {(props) => (
            <input
              {...props}
              type="number"
              inputMode="decimal"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step="0.01"
              value={values.price}
              onChange={(event) => update('price', event.target.value)}
            />
          )}
        </FormField>

        <FormField label={t('products.form.category')} error={errors.category}>
          {(props) => (
            <input
              {...props}
              type="text"
              autoComplete="off"
              value={values.category}
              onChange={(event) => update('category', event.target.value)}
            />
          )}
        </FormField>

        <FormField label={t('products.form.brand')} error={errors.brand}>
          {(props) => (
            <input {...props} type="text" autoComplete="off" value={values.brand} onChange={(event) => update('brand', event.target.value)} />
          )}
        </FormField>
      </form>
    </Modal>
  )
}
