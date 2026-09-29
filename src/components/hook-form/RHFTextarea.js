import { useFormContext, useController } from "react-hook-form";
import { FormControl, FormLabel, Textarea, FormErrorMessage, FormHelperText } from "@chakra-ui/react";

export default function RHFTextarea({ name, label, helperText, ...rest }) {
  const { control, formState } = useFormContext();
  const {
    field,
    fieldState: { error },
  } = useController({ name, control });

  return (
    <FormControl isInvalid={!!error} isDisabled={formState.isSubmitting} isRequired={rest.isRequired}>
      {label && <FormLabel htmlFor={name}>{label}</FormLabel>}
      <Textarea id={name} {...field} {...rest} />
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
      {error && <FormErrorMessage>{error.message}</FormErrorMessage>}
    </FormControl>
  );
}
