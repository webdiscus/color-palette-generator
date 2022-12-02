import styles from './styles.scss';

export default function InputText({
  className = '',
  name = '',
  value = '',
  maxLength = 256,
  placeholder = '',
  onChange,
  refElm,
}) {

  return (
    <input ref={refElm} name={name} defaultValue={value} className={`input-text ${className}`} maxLength={maxLength}
           placeholder={placeholder} aria-label={placeholder} onChange={(event) => onChange(event)} autoCorrect='off'
           autoComplete='off' spellCheck='false' type='text' />
  );
}