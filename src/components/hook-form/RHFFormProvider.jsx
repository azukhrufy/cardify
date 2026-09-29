// RHFFormProvider – wraps Chakra UI form with React Hook Form context
//
// PERINGATAN: RHFFormProvider.js berdampingan dengan file ini dan berisi kode
// yang identik. Build Turbopack me-resolve `.jsx` lebih dulu (diverifikasi:
// menambahkan marker di kedua file, yang muncul di HTML adalah versi `.jsx`),
// sedangkan webpack me-resolve `.js` lebih dulu. Selama keduanya ada, file mana
// yang benar-benar dipakai bergantung pada bundler. Hapus salah satunya.
import { FormProvider } from "react-hook-form";

export default function RHFFormProvider({ children, onSubmit, methods }) {
  return (
    <FormProvider {...methods}>
      {/* noValidate: validasi dimiliki react-hook-form. Tanpa ini, atribut
          `required` bawaan Chakra memicu bubble browser dan pesan error RHF
          tidak pernah tampil. */}
      <form onSubmit={onSubmit} noValidate>
        {children}
      </form>
    </FormProvider>
  );
}
