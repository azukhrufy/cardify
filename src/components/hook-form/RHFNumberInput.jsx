import { useEffect, useRef } from "react";
import { useFormContext, useController } from "react-hook-form";
import { FormControl, FormLabel, NumberInput, NumberInputField, FormErrorMessage, FormHelperText } from "@chakra-ui/react";

/**
 * Number input yang menyimpan **number** ke react-hook-form, bukan string.
 *
 * Chakra `NumberInput` memanggil `onChange(valueAsString, valueAsNumber)`, dan
 * `useController` hanya mengambil argumen pertama — jadi nilai yang tersimpan
 * default-nya string. Itu bikin `"12" + "3"` jadi `"123"` saat metrik dijumlah.
 * Nilai kosong tetap disimpan sebagai `""` supaya rule `required` tetap jalan.
 */
export default function RHFNumberInput({ name, label, helperText, rules, placeholder, ...rest }) {
  const { control, formState } = useFormContext();
  const {
    field,
    fieldState: { error },
  } = useController({ name, control, rules });

  // `field.ref` dipasang lewat effect, bukan langsung saat render: aturan
  // `react-hooks/refs` melarang membaca ref selama render, dan ref yang
  // di-spread ke <NumberInput> mendarat di <div> root-nya — bukan di <input>,
  // sehingga focus-on-error milik RHF tidak pernah sampai ke kolomnya.
  const inputRef = useRef(null);

  useEffect(() => {
    field.ref(inputRef.current);
  });

  return (
    <FormControl isInvalid={!!error} isDisabled={formState.isSubmitting} isRequired={rest.isRequired}>
      {label && <FormLabel htmlFor={name}>{label}</FormLabel>}
      <NumberInput
        id={name}
        bg='white'
        {...field}
        value={field.value ?? ""}
        onChange={(_, valueAsNumber) =>
          field.onChange(Number.isNaN(valueAsNumber) ? "" : valueAsNumber)
        }
        {...rest}
      >
        {/* `placeholder` harus di sini — di <NumberInput> ia mendarat di <div>. */}
        <NumberInputField ref={inputRef} placeholder={placeholder} />
      </NumberInput>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
      {error && <FormErrorMessage>{error.message}</FormErrorMessage>}
    </FormControl>
  );
}
