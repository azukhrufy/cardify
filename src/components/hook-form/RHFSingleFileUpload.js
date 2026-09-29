import { useFormContext, useController } from "react-hook-form";
import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Box,
  Text,
  VisuallyHidden,
} from "@chakra-ui/react";
import { useRef, useState } from "react";

// Mapping tipe file — dijaga di sini agar konsisten di seluruh form
const FILE_TYPE_ACCEPT = {
  // Gambar
  image: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/x-icon",
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

// Ekstensi cadangan saat browser tidak mengisi file.type (mis. file dari OS tertentu)
const MIME_EXTENSIONS = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "image/svg+xml": [".svg"],
  "image/x-icon": [".ico"],
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-powerpoint": [".ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
};

const ALL_TYPES = [...FILE_TYPE_ACCEPT.image, ...FILE_TYPE_ACCEPT.document];

/**
 * RHFSingleFileUpload — input upload file tunggal (satu file per field).
 *
 * Props:
 *   name          — nama field di react-hook-form (wajib)
 *   label         — label di atas area upload (opsional)
 *   helperText    — teks bantuan di bawah (opsional)
 *   typeFile      — array string: ['image'], ['document'], atau [] untuk menerima keduanya.
 *                   Default [] (terima semua).
 *   isRequired    — di-pass ke FormControl (opsional)
 *   isDisabled    — menonaktifkan input secara manual (opsional)
 *
 * Nilai field yang disimpan adalah data URL base64 (mis.
 * "data:image/png;base64,iVBORw0KGgo..."), bukan objek File — jadi bisa langsung
 * dipakai sebagai src gambar atau dikirim ke API. File kosong → null.
 *
 * Contoh pemakaian:
 *   <RHFSingleFileUpload name="displayPicture" label="Display Picture" typeFile={['image']} />
 *   <RHFSingleFileUpload name="document" label="Upload Dokumen" />               // kedua-duanya
 */
export default function RHFSingleFileUpload({
  name,
  label,
  helperText,
  typeFile = [],
  isRequired,
  isDisabled,
  ...rest
}) {
  const { control, formState, setError, clearErrors } = useFormContext();
  const {
    field,
    fieldState: { error },
  } = useController({ name, control });

  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  // Metadata file asli hanya untuk tampilan — nilai field-nya sendiri adalah base64
  const [fileMeta, setFileMeta] = useState(null);
  const [isReading, setIsReading] = useState(false);
  // Token pembacaan: hasil FileReader yang sudah basi (file diganti/dihapus saat
  // masih dibaca) tidak boleh menimpa nilai field.
  const readTokenRef = useRef(0);

  // Tentukan jenis file yang di-accept. typeFile tak dikenal → jangan kirim accept kosong
  // (accept="" berarti "terima semua" di browser).
  const mappedTypes = typeFile.flatMap((t) => FILE_TYPE_ACCEPT[t] || []);
  const acceptedTypes = typeFile.length === 0 ? ALL_TYPES : mappedTypes;
  const acceptValue = acceptedTypes.join(",");

  const disabled = isDisabled || formState.isSubmitting || isReading;

  // Validasi tipe file: cocokkan MIME dulu, lalu ekstensi (untuk file tanpa MIME)
  const isFileAccepted = (file) => {
    if (acceptedTypes.length === 0) return true;
    if (file.type && acceptedTypes.includes(file.type)) return true;
    const ext = `.${(file.name.split(".").pop() || "").toLowerCase()}`;
    return acceptedTypes.some((t) => (MIME_EXTENSIONS[t] || []).includes(ext));
  };

  const typeLabel =
    typeFile.length > 0 ? typeFile.join(", ").toUpperCase() : "GAMBAR & DOKUMEN";

  // FileReader membungkus hasil dalam Promise supaya alur baca bisa di-await
  const readFileAsDataURL = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  // Terima file: validasi tipe, baca sebagai data URL base64, baru simpan ke form.
  // File ditolak / gagal dibaca → tampilkan error di bawah field.
  const acceptFile = async (file) => {
    if (!file) return;
    if (!isFileAccepted(file)) {
      setError(name, {
        type: "manual",
        message: `Tipe file tidak didukung. Format yang diterima: ${typeLabel}.`,
      });
      return;
    }
    clearErrors(name);
    const token = ++readTokenRef.current;
    setIsReading(true);
    try {
      const dataUrl = await readFileAsDataURL(file);
      if (token !== readTokenRef.current) return; // file sudah diganti/dihapus
      setFileMeta({ name: file.name, size: file.size });
      field.onChange(dataUrl);
    } catch {
      if (token !== readTokenRef.current) return;
      setError(name, {
        type: "manual",
        message: "Gagal membaca file. Silakan pilih ulang.",
      });
    } finally {
      if (token === readTokenRef.current) setIsReading(false);
    }
  };

  const openFileDialog = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  // Handler: ganti file saat input dipilih
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      acceptFile(file);
    } else {
      // User membatalkan dialog — kosongkan agar pemilihan berikutnya tetap memicu onChange
      e.target.value = "";
    }
  };

  // Drag & drop. dragenter/dragleave ikut terpicu oleh elemen anak, jadi baru
  // dianggap keluar kalau kursor benar-benar meninggalkan area drop.
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (disabled) return;
    e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    acceptFile(e.dataTransfer?.files?.[0]);
  };

  const clearFile = () => {
    // Reset value di form DAN elemen input, supaya file yang sama bisa dipilih lagi.
    // Token di-bump agar pembacaan yang masih jalan tidak mengisi ulang field.
    readTokenRef.current += 1;
    clearErrors(name);
    setFileMeta(null);
    setIsReading(false);
    field.onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  // Ada isi kalau field sudah berisi string data URL (mis. dari defaultValues hasil restore)
  const hasFile = typeof field.value === "string" && field.value.length > 0;
  const fileValue = fileMeta || (hasFile ? { name: "File tersimpan", size: null } : null);

  return (
    <FormControl
      isInvalid={!!error}
      isDisabled={disabled}
      isRequired={isRequired}
      {...rest}
    >
      {label && <FormLabel htmlFor={name}>{label}</FormLabel>}

      <Box
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openFileDialog();
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        bg={isDragging ? "blue.50" : "gray.50"}
        borderWidth="2px"
        borderColor={isDragging ? "blue.400" : "gray.300"}
        borderStyle="dashed"
        borderRadius="md"
        p={6}
        textAlign="center"
        cursor={disabled ? "not-allowed" : "pointer"}
        opacity={disabled ? 0.6 : 1}
        transition="all 0.2s"
        _hover={disabled ? undefined : { bg: "gray.100" }}
        _focusVisible={{ outline: "2px solid", outlineColor: "blue.400", outlineOffset: "2px" }}
      >
        {/* Input file asli — disembunyikan secara visual, dibuka lewat klik/keyboard Box */}
        <VisuallyHidden>
          <input
            id={name}
            name={name}
            type="file"
            accept={acceptValue}
            onChange={handleFileChange}
            disabled={disabled}
            tabIndex={-1}
            ref={(el) => {
              inputRef.current = el;
              field.ref(el);
            }}
          />
        </VisuallyHidden>

        <Text mb={2} color="gray.600">
          {isReading
            ? "⏳ Membaca file..."
            : isDragging
              ? "📁 Lepas file di sini"
              : "📁 Klik atau drag file ke sini"}
        </Text>
        <Text fontSize="sm" color="gray.500">
          Jenis file diterima: {typeLabel}
        </Text>

        {/* Tampilkan nama file yang sudah di-upload */}
        {fileValue && (
          <Box
            mt={3}
            p={3}
            bg="gray.100"
            borderRadius="md"
            borderWidth="1px"
            borderColor="gray.200"
          >
            <Text
              fontSize="sm"
              color="gray.700"
              fontWeight="medium"
              noOfLines={1}
              title={fileValue.name}
            >
              ✅ {fileValue.name}
            </Text>
            {typeof fileValue.size === "number" && (
              <Text fontSize="xs" color="gray.500">
                {(fileValue.size / 1024).toFixed(1)} KB
              </Text>
            )}
            <Text
              as="span"
              display="inline-block"
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
