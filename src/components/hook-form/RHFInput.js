import { useState } from 'react'
import { useFormContext, useController } from 'react-hook-form'
import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  Flex,
  Text,
  InputRightElement
} from '@chakra-ui/react'

/**
 * A reusable input component integrated with React Hook Form.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.name - The name of the input field.
 * @param {string} props.label - The label for the input field.
 * @param {string} props.helperText - The helper text for the input field.
 * @param {boolean} props.isDisabled - Whether the input field is disabled.
 * @param {boolean} props.isReadOnly - Whether the input field is read-only.
 * @param {boolean} props.isRequired - Whether the input field is required.
 * @param {ReactNode} props.leftElement - The element to be rendered on the left side of the input field.
 * @param {ReactNode} props.rightElement - The element to be rendered on the right side of the input field.
 * @param {ReactNode} props.leftAddon - The addon to be rendered on the left side of the input field.
 * @param {ReactNode} props.rightAddon - The addon to be rendered on the right side of the input field.
 * @param {string} props.dir - The direction of the input field layout ('row' or 'column').
 * @param {string} props.justify - The justification of the input field layout.
 * @param {React.Ref} props.innerRef - The ref for the input field.
 * @param {string} props.size - The size of the input field.
 * @param {string} props.variant - The variant of the input field.
 * @param {Object} props.inputGroupProps - Additional props for the input group.
 * @param {number} props.maxLength - The maximum length of the input field (default: 500).
 * @param {any} props.rest - Additional props to be spread on the input field.
 * @returns {JSX.Element} The rendered RHFInput component.
 */
export default function RHFInput({
  name,
  label,
  helperText,
  //
  isDisabled,
  isReadOnly,
  isRequired,
  //
  leftElement,
  rightElement,
  leftAddon,
  rightAddon,
  // additional layouting
  dir,
  justify,
  innerRef,
  // sizing props
  size,
  variant,
  // additional props
  inputGroupProps,
  withCounter = false,
  maxLength = 100, // Set default maxLength
  // label props
  formLabelProps,
  // validasi react-hook-form
  rules,
  ...rest
}) {
  if (leftElement && leftAddon)
    throw new Error('`leftElement` and `leftAddon` cannot be used together')

  if (rightElement && rightAddon)
    throw new Error('`rightElement` and `rightAddon` cannot be used together')

  const {
    control,
    formState: { isSubmitting }
  } = useFormContext()

  const {
    field,
    fieldState: { error }
  } = useController({ name, control, rules })

  // State to track character count
  const [charCount, setCharCount] = useState(field.value?.length || 0)

  // Handle input change
  const handleChange = (e) => {
    setCharCount(e.target.value.length)
    field.onChange(e) // Ensure the change is registered with react-hook-form
  }

  return (
    <FormControl
      isReadOnly={isReadOnly || isSubmitting}
      isInvalid={Boolean(error)}
      isDisabled={isDisabled}
      isRequired={isRequired}
    >
      <Flex
        flexDirection={dir === 'row' ? 'row' : 'column'}
        justifyContent={justify ?? ''}
        alignItems={dir === 'row' && 'center'}
        position='relative'
      >
        {label && <FormLabel {...formLabelProps}>{label}</FormLabel>}

        <InputGroup
          size={size}
          variant={variant}
          {...inputGroupProps}
          bg='white'
        >
          {leftAddon}
          {leftElement}

          <Input
            {...field}
            {...rest}
            // `innerRef` selalu undefined dari pemanggil, dan ref eksplisit
            // menimpa `field.ref` — tanpa fallback ini RHF tidak pernah dapat
            // node input, jadi focus-on-error tidak jalan.
            ref={innerRef ?? field.ref}
            maxLength={maxLength}
            onChange={handleChange}
          />

          {rightElement}
          {rightAddon}

          {withCounter && (
            <InputRightElement>
              <Text
                // position='absolute'
                // bottom='20px'
                // right='2'
                fontSize='10px'
                color='gray.500'
              >
                {charCount}/{maxLength}
              </Text>
            </InputRightElement>
          )}
        </InputGroup>
      </Flex>

      {error ? (
        <FormErrorMessage>{error?.message}</FormErrorMessage>
      ) : (
        helperText && <FormHelperText>{helperText}</FormHelperText>
      )}
    </FormControl>
  )
}
