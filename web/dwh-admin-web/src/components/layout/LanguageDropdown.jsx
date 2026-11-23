import { useDispatch, useSelector } from 'react-redux'

import useT from '../../hooks/useT'
import { SUPPORTED_LANGUAGES, setLanguage } from '../../store/languageSlice'
import Icon from '../ui/Icon'

/** Language choice. The selection is remembered and sent to the services as Accept-Language. */
export default function LanguageDropdown() {
  const dispatch = useDispatch()
  const selected = useSelector((state) => state.language.selectedLanguage)
  const { t } = useT()

  return (
    <label className="language-dropdown">
      <Icon name="globe" size={16} />
      <select
        value={selected}
        onChange={(event) => dispatch(setLanguage(event.target.value))}
        aria-label={t('common.language.label')}
      >
        {SUPPORTED_LANGUAGES.map((code) => (
          <option key={code} value={code}>
            {t(`common.language.names.${code}`)}
          </option>
        ))}
      </select>
    </label>
  )
}
