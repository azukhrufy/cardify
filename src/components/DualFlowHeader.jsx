import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Text,
  VStack,
  HStack,
  Badge,
  Flex,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import {
  fetchSocialProfile,
  isAutoFillDemo,
  SOCIAL_PLATFORMS,
} from "@/lib/socialAutoFill";
import { FaLink } from "react-icons/fa6";

/**
 * Pilihan Dual-Flow di atas form kalkulator.
 *
 * User bisa memilih:
 * 1. "Isi Manual" (default) -> form kosong siap diisi sendiri.
 * 2. "Hubungkan Akun / Auto-Fill" -> masukkan handle/URL -> tombol auto-isi ->
 *    mengisi field form secara instan lewat `methods.setValue`.
 */
export default function DualFlowHeader({ platform, methods, onAutoFilled }) {
  const [mode, setMode] = useState("manual"); // "manual" | "autofill"
  const [handleInput, setHandleInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const platformMeta = SOCIAL_PLATFORMS[platform] || { label: platform };

  const handleFetch = async () => {
    if (!handleInput.trim()) {
      toast({
        title: "Username wajib diisi",
        description: `Masukkan username atau link profil ${platformMeta.label} Anda terlebih dahulu.`,
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchSocialProfile(platform, handleInput);

      // Map data ke rxf fields berdasarkan platform
      if (platform === "tiktok") {
        if (data.fullName) methods.setValue("fullName", data.fullName, { shouldValidate: true });
        if (data.username) methods.setValue("tiktokUsername", `@${data.username.replace(/^@/, "")}`, { shouldValidate: true });
        if (data.followers) methods.setValue("totalFollowers", data.followers, { shouldValidate: true });
        if (data.dataPeriod) methods.setValue("dataPeriod", data.dataPeriod, { shouldValidate: true });
        if (data.totalViews) methods.setValue("totalViews", data.totalViews, { shouldValidate: true });
        if (data.totalLikes) methods.setValue("totalLikes", data.totalLikes, { shouldValidate: true });
        if (data.totalComments) methods.setValue("totalComments", data.totalComments, { shouldValidate: true });
        if (data.totalShares) methods.setValue("totalShares", data.totalShares, { shouldValidate: true });
        if (data.videoCount) methods.setValue("videoCount", data.videoCount, { shouldValidate: true });
      } else if (platform === "instagram") {
        if (data.fullName) methods.setValue("fullName", data.fullName, { shouldValidate: true });
        if (data.username) methods.setValue("instagramUsername", `@${data.username.replace(/^@/, "")}`, { shouldValidate: true });
        if (data.followers) methods.setValue("totalFollowers", data.followers, { shouldValidate: true });
        if (data.dataPeriod) methods.setValue("dataPeriod", data.dataPeriod, { shouldValidate: true });
        if (data.totalReach) methods.setValue("totalReach", data.totalReach, { shouldValidate: true });
        if (data.totalLikes) methods.setValue("totalLikes", data.totalLikes, { shouldValidate: true });
        if (data.totalComments) methods.setValue("totalComments", data.totalComments, { shouldValidate: true });
        if (data.totalSharesSaves) methods.setValue("totalSharesSaves", data.totalSharesSaves, { shouldValidate: true });
        if (data.contentCount) methods.setValue("contentCount", data.contentCount, { shouldValidate: true });
      } else if (platform === "youtube") {
        if (data.fullName) methods.setValue("fullName", data.fullName, { shouldValidate: true });
        if (data.username) methods.setValue("youtubeHandle", `@${data.username.replace(/^@/, "")}`, { shouldValidate: true });
        if (data.followers) methods.setValue("totalSubscribers", data.followers, { shouldValidate: true });
        if (data.dataPeriod) methods.setValue("dataPeriod", data.dataPeriod, { shouldValidate: true });
        if (data.avgViewsPerVideo) methods.setValue("avgViewsPerVideo", data.avgViewsPerVideo, { shouldValidate: true });
        if (data.avgLikesPerVideo) methods.setValue("avgLikesPerVideo", data.avgLikesPerVideo, { shouldValidate: true });
        if (data.avgCommentsPerVideo) methods.setValue("avgCommentsPerVideo", data.avgCommentsPerVideo, { shouldValidate: true });
        if (data.avgSharesPerVideo) methods.setValue("avgSharesPerVideo", data.avgSharesPerVideo, { shouldValidate: true });
      }

      toast({
        title: "Berhasil terhubung!",
        description: `Metrik publik ${platformMeta.label} berhasil disinkronkan ke form. Anda tetap bisa mengubah nilainya.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      if (onAutoFilled) onAutoFilled(data);
    } catch (err) {
      toast({
        title: "Gagal menghubungkan akun",
        description: err.message || "Terjadi kesalahan saat mengambil data.",
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      bg="surfaceInverse"
      borderWidth="1px"
      borderColor="borderInverse"
      borderRadius="card"
      p={6}
      mb={8}
    >
      <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "stretch", md: "center" }} gap={4}>
        <Box>
          <Text fontSize="md" fontWeight="semibold" color="fgInverse">
            Cara Pengisian Data
          </Text>
          <Text fontSize="sm" color="mutedInverse">
            Pilih metode isi manual atau sinkronisasi otomatis dari akun {platformMeta.label}.
          </Text>
        </Box>
        <HStack spacing={2}>
          <Button
            size="sm"
            variant={mode === "manual" ? "solid" : "outline"}
            colorScheme="pink"
            onClick={() => setMode("manual")}
          >
            Isi Manual
          </Button>
          <Button
            size="sm"
            variant={mode === "autofill" ? "solid" : "outline"}
            colorScheme="pink"
            onClick={() => setMode("autofill")}
          >
            Hubungkan Akun (Auto-Fill)
          </Button>
        </HStack>
      </Flex>

      {mode === "autofill" && (
        <Box mt={6} pt={6} borderTopWidth="1px" borderColor="borderInverse">
          <FormControl>
            <FormLabel fontSize="sm" color="fgInverse">
              Username atau URL Profil {platformMeta.label}
            </FormLabel>
            <HStack spacing={3}>
              <Input
                placeholder={`Contoh: @${platform}creator atau https://${platform}.com/@username`}
                value={handleInput}
                onChange={(e) => setHandleInput(e.target.value)}
                bg="white"
                color="black"
              />
              <Button
                colorScheme="pink"
                onClick={handleFetch}
                isLoading={isLoading}
                loadingText="Mengambil..."
                flexShrink={0}
                leftIcon={<FaLink />}
              >
                Auto-Isi Form
              </Button>
            </HStack>
            <HStack spacing={2} mt={2}>
              <Text fontSize="xs" color="mutedInverse">
                Data ditarik secara publik. Anda bebas mengedit hasil auto-fill sebelum di-generate.
              </Text>
              {isAutoFillDemo && (
                <Badge colorScheme="purple" fontSize="10px">
                  Mode Demo Aktif
                </Badge>
              )}
            </HStack>
          </FormControl>
        </Box>
      )}
    </Box>
  );
}
