import { useFormContext, useController } from "react-hook-form";
import { FormControl, FormLabel, NumberInput, NumberInputField, FormErrorMessage, FormHelperText } from "@chakra-ui/react";

export default function RHFNumberInput({ name, label, helperText, ...rest }) {
  const { control, formState } = useFormContext();
  const {
    field,
    fieldState: { error },
  } = useController({ name, control });

  return (
    <FormControl isInvalid={!!error} isDisabled={formState.isSubmitting} isRequired={rest.isRequired}>
      {label && <FormLabel htmlFor={name}>{label}</FormLabel>}
      <NumberInput id={name} {...field} {...rest}>
        <NumberInputField />
      </NumberInput>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
      {error && <FormErrorMessage>{error.message}</FormErrorMessage>}
    </FormControl>
  );
}
