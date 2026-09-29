// form
import { useFormContext, useController } from "react-hook-form";
// @chakra-ui
import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Select,
} from "@chakra-ui/react";

// ----------------------------------------------------------------------

/**
 * Props extends from Chakra UI `Select` component
 * @see https://chakra-ui.com/docs/components/select/props
 * @param {Object} props
 * @param {string} props.name
 * @param {?React.ReactNode} props.label
 * @param {?React.ReactNode} props.helperText
 * @param {?Boolean} props.isDisabled
 * @param {?Boolean} props.isReadOnly
 * @param {?Boolean} props.isRequired
 * @param {?string} props.placeholderValue
 * @param {Object[]} props.options
 * @param {string} props.options[].value
 * @param {string} props.options[].label
 * @param {Object} props.rules - react-hook-form validation rules
 * @returns {JSX.Element}
 */
export default function RHFSelect({
  name,
  label,
  helperText,
  isDisabled,
  isReadOnly,
  isRequired,
  placeholderValue = "Pilih opsi...",
  options,
  formLabelProps,
  rules,
  ...rest
}) {
  const {
    control,
    formState: { isSubmitting },
  } = useFormContext();

  const {
    field,
    fieldState: { error },
  } = useController({ name, control, rules });

  return (
    <FormControl
      isReadOnly={isReadOnly || isSubmitting}
      isInvalid={Boolean(error)}
      isDisabled={isDisabled}
      isRequired={isRequired}
    >
      {label && <FormLabel {...formLabelProps}>{label}</FormLabel>}

      <Select {...field} {...rest}>
        {placeholderValue && (
          <option disabled value="">
            {placeholderValue}
          </option>
        )}
        {options.map(
          ({ value: optionValue, label: optionLabel, ...optionRest }) => (
            <option key={optionValue} value={optionValue} {...optionRest}>
              {optionLabel}
            </option>
          ),
        )}
      </Select>

      {error ? (
        <FormErrorMessage>{error?.message}</FormErrorMessage>
      ) : (
        helperText && <FormHelperText>{helperText}</FormHelperText>
      )}
    </FormControl>
  );
}
