import { useState } from 'react'

import { usersApi } from '../../api/resources'
import FormField from '../../components/ui/FormField'
import Modal from '../../components/ui/Modal'
import useNotify from '../../hooks/useNotify'
import useT from '../../hooks/useT'
import {
  ROLE_OPTIONS,
  buildCreatePayload,
  buildUpdatePayload,
  initialValues,
  validateUserForm,
} from './userForm'

const FORM_ID = 'user-form'

/** Create or edit a personnel account. user is null when creating. */
export default function UserFormModal({ user, onClose, onSaved }) {
  const { t } = useT()
  const notify = useNotify()
  const isCreate = !user
  const [values, setValues] = useState(() => initialValues(user))
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
    const found = validateUserForm(values, { isCreate }, t)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      return
    }

    const request = isCreate
      ? usersApi.create(buildCreatePayload(values))
      : usersApi.update(user.id, buildUpdatePayload(values))
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
      title={t(isCreate ? 'users.createTitle' : 'users.editTitle')}
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
        <FormField
          label={t('users.form.username')}
          error={errors.username}
          hint={isCreate ? t('users.form.usernameHint') : undefined}
        >
          {(props) => (
            <input
              {...props}
              type="text"
              autoComplete="off"
              value={values.username}
              disabled={!isCreate}
              onChange={(event) => update('username', event.target.value)}
            />
          )}
        </FormField>

        <FormField label={t('users.form.displayName')} error={errors.displayName}>
          {(props) => (
            <input
              {...props}
              type="text"
              autoComplete="off"
              value={values.displayName}
              onChange={(event) => update('displayName', event.target.value)}
            />
          )}
        </FormField>

        <FormField label={t('users.form.email')} error={errors.email}>
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

        <FormField label={t('users.form.role')}>
          {(props) => (
            <select {...props} value={values.role} onChange={(event) => update('role', event.target.value)}>
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {t(`common.roles.${role}`)}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField
          label={t('users.form.password')}
          error={errors.password}
          hint={t(isCreate ? 'users.form.passwordHint' : 'users.form.newPasswordHint')}
        >
          {(props) => (
            <input
              {...props}
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={(event) => update('password', event.target.value)}
            />
          )}
        </FormField>

        {!isCreate && (
          <label className="checkbox-row">
            <input type="checkbox" checked={values.enabled} onChange={(event) => update('enabled', event.target.checked)} />
            <span>{t('users.form.enabled')}</span>
          </label>
        )}
      </form>
    </Modal>
  )
}
