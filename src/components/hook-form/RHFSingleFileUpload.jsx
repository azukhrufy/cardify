import { useFormContext, useController } from "react-hook-form";
import { FormControl, FormLabel, FormErrorMessage, FormHelperText, Box, Text } from "@chakra-ui/react";
import { useState } from "react";

// Mapping tipe file — dijaga di sini agar konsisten di seluruh form
const FILE_TYPE_ACCEPT = {
  // Gambar
  image: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/ico",
  ],
  // Dokumen
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
    "text/plain",
    "text/csv",
  ],
};

/**
 * RHFSingleFileUpload — input upload file tunggal (satu file per field).
 *
 * Props:
 *   name          — nama field di react-hook-form (wajib)
 *   label         — label di atas area upload (opsional)
 *   helperText    — teks bantuan di bawah (opsional)
 *   typeFile      — array string: ['image'], ['document'], atau [] untuk menerima keduanya.
 *                   Default [] (terima semua).
 *   isRequired    — dari rest, di-pass ke FormControl (opsional)
 *
 * Contoh pemakaian:
 *   <RHFSingleFileUpload name="displayPicture" label="Display Picture" typeFile={['image']} />
 *   <RHFSingleFileUpload name="document" label="Upload Dokumen" />               // kedua-duanya
 */
export default function RHFSingleFileUpload({ name, label, helperText, typeFile = [], ...rest }) {
  const { control, formState } = useFormContext();
  const { field, fieldState: { error } } = useController({ name, control });
  const [isDragging, setIsDragging] = useState(false);

  // Tentukan jenis file yang di-accept
  const acceptedTypes = typeFile.length > 0
    ? typeFile.flatMap((t) => FILE_TYPE_ACCEPT[t] || [])
    : [...FILE_TYPE_ACCEPT.image, ...FILE_TYPE_ACCEPT.document];

  const acceptValue = acceptedTypes.join(",");

  // Handler: ganti file saat input dipilih
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      field.onChange(file);
    }
  };

  // Drag & drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      // Validasi cepat: pastikan juga include di acceptedTypes
      const isAccepted =
        acceptedTypes.some(
          (t) => file.type === t || file.type.startsWith(t.split("/")[0] + "/")
        ) || acceptedTypes.length === 0;
      if (isAccepted) {
        field.onChange(file);
      }
    }
  };

  const clearFile = () => {
    // Reset value di form
    field.onChange(null);
  };

  const typeLabel =
    typeFile.length > 0 ? typeFile.join(", ").toUpperCase() : "GAMBAR & DOKUMEN";

  return (
    <FormControl isInvalid={!!error} isDisabled={formState.isSubmitting} isRequired={rest.isRequired}>
      {label && <FormLabel htmlFor={name}>{label}</FormLabel>}

      <Box
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        bg={isDragging ? "blue.50" : "gray.50"}
        borderWidth="2px"
        borderColor={isDragging ? "blue.400" : "gray.300"}
        borderStyle="dashed"
        borderRadius="md"
        p={6}
        textAlign="center"
        cursor="pointer"
        transition="all 0.2s"
        _hover={{ bg: "gray.100" }}
      >
        {/* Input file asli — disembunyikan, di-trigger via label */}
        <input
          id={name}
          type="file"
          accept={acceptValue}
          onChange={handleFileChange}
          style={{ display: "none" }}
          ref={field.ref}
        />

        <Text mb={2} color="gray.600">
          {isDragging ? "📁 Lepas file di sini" : "📁 Klik atau drag file ke sini"}
        </Text>
        <Text fontSize="sm" color="gray.500">
          Jenis file diterima: {typeLabel}
        </Text>

        {/* Tampilkan nama file yang sudah di-upload */}
        {field.value && (
          <Box
            mt={3}
            p={3}
            bg="gray.100"
            borderRadius="md"
            borderWidth="1px"
            borderColor="gray.200"
          >
            <Text fontSize="sm" color="gray.700" fontWeight="medium">
              ✅ {field.value.name}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {(field.value.size / 1024).toFixed(1)} KB
            </Text>
            <Text
              as="span"
              mt={1}
              fontSize="xs"
              color="red.500"
              cursor="pointer"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
            >
              [Hapus]
            </Text>
          </Box>
        )}
      </Box>

      {helperText && <FormHelperText>{helperText}</FormHelperText>}
      {error && <FormErrorMessage>{error.message}</FormErrorMessage>}
    </FormControl>
  );
}
