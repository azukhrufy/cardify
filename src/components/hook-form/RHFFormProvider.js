// RHFFormProvider – wraps Chakra UI form with React Hook Form context
import { FormProvider } from "react-hook-form";

export default function RHFFormProvider({ children, onSubmit, methods }) {
  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit}>{children}</form>
    </FormProvider>
  );
}
