import {
  Alert,
  AlertDescription,
  AlertIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  SOCIAL_PLATFORMS,
  buildConnectUrl,
  fetchOAuthStatus,
  fetchConnection,
  fetchConnectedMetrics,
  disconnect,
} from "@/lib/socialAutoFill";
import { FaLink, FaRightFromBracket } from "react-icons/fa6";

function mapMetricsToForm(platform, data, methods) {
  const set = (name, value) => {
    if (value === undefined || value === null) return;
    if (typeof value === "number" && !Number.isFinite(value)) return;
    methods.setValue(name, value, { shouldValidate: true });
  };

  set("fullName", data.fullName);

  if (platform === "tiktok") {
    set("tiktokUsername", data.username ? `@${String(data.username).replace(/^@/, "")}` : undefined);
    set("totalFollowers", data.followers);
    set("dataPeriod", data.dataPeriod);
    set("totalViews", data.totalViews);
    set("totalLikes", data.totalLikes);
    set("totalComments", data.totalComments);
    set("totalShares", data.totalShares);
    set("videoCount", data.videoCount);
    return;
  }

  if (platform === "instagram") {
    set(
      "instagramUsername",
      data.username ? `@${String(data.username).replace(/^@/, "")}` : undefined,
    );
    set("totalFollowers", data.followers);
    set("dataPeriod", data.dataPeriod);
    set("totalReach", data.totalReach);
    set("totalLikes", data.totalLikes);
    set("totalComments", data.totalComments);
    set("totalSharesSaves", data.totalSharesSaves);
    set("contentCount", data.contentCount);
    return;
  }

  set("youtubeHandle", data.username ? `@${String(data.username).replace(/^@/, "")}` : undefined);
  set("totalSubscribers", data.followers);
  set("dataPeriod", data.dataPeriod);
  set("avgViewsPerVideo", data.avgViewsPerVideo);
  set("avgLikesPerVideo", data.avgLikesPerVideo);
  set("avgCommentsPerVideo", data.avgCommentsPerVideo);
  set("avgSharesPerVideo", data.avgSharesPerVideo);
}

/**
 * Pilihan Dual-Flow di atas form kalkulator.
 *
 * "Isi Manual" → form kosong, diisi user sendiri.
 * "Hubungkan Akun" → user login ke platform, Cardify menarik metrik akun itu
 *   langsung dari API resmi. Tidak ada data simulasi di jalur ini.
 */
export default function DualFlowHeader({ platform, methods, onAutoFilled }) {
  // `modeOverride` = pilihan manual user; `null` berarti "belum memilih", dan
  // mode diturunkan dari URL supaya redirect OAuth (?connected / ?oauth_error)
  // langsung membuka panel connect tanpa setState di dalam effect.
  const [modeOverride, setModeOverride] = useState(null);
  const [providerStatus, setProviderStatus] = useState(null);
  const [sessionConfigured, setSessionConfigured] = useState(true);
  const [connection, setConnection] = useState({ connected: false });
  const [isLoading, setIsLoading] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const toast = useToast();
  const router = useRouter();

  const platformMeta = SOCIAL_PLATFORMS[platform] || { label: platform };

  const oauthError =
    router.isReady && router.query.oauth_error
      ? decodeURIComponent(String(router.query.oauth_error))
      : null;
  const justConnected = router.isReady && router.query.connected === "1";
  const mode = modeOverride ?? (oauthError || justConnected ? "autofill" : "manual");
  const setMode = setModeOverride;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [status, me] = await Promise.all([fetchOAuthStatus(), fetchConnection()]);
        if (cancelled) return;

        setSessionConfigured(status.sessionConfigured);
        setProviderStatus(
          (status.providers || []).find((p) => p.id === platform) || {
            configured: false,
            requiredEnv: [],
          },
        );

        if (me.connected && me.platform === platform) {
          setConnection(me);
        } else {
          setConnection({ connected: false });
        }
      } finally {
        if (!cancelled) setIsBooting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [platform]);

  useEffect(() => {
    if (!router.isReady) return;

    if (oauthError) {
      toast({
        title: "Gagal menghubungkan akun",
        description: oauthError,
        status: "error",
        duration: 9000,
        isClosable: true,
      });
      router.replace(router.pathname, undefined, { shallow: true });
      return;
    }

    if (justConnected) {
      toast({
        title: "Akun berhasil terhubung!",
        description: `Klik "Auto-Isi Form" untuk menarik metrik ${platformMeta.label} Anda.`,
        status: "success",
        duration: 6000,
        isClosable: true,
      });
      router.replace(router.pathname, undefined, { shallow: true });
    }
  }, [router.isReady, router.query.connected, router.query.oauth_error, router, platformMeta.label, toast, oauthError, justConnected]);

  const startConnect = useCallback(() => {
    window.location.href = buildConnectUrl(platform, `/calculator/${platform}`);
  }, [platform]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    setConnection({ connected: false });
    toast({
      title: "Akun terputus",
      description: `${platformMeta.label} sudah tidak terhubung lagi.`,
      status: "info",
      duration: 4000,
      isClosable: true,
    });
  }, [platformMeta.label, toast]);

  const handleAutoFill = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchConnectedMetrics();
      mapMetricsToForm(platform, data, methods);

      toast({
        title: "Data berhasil ditarik!",
        description: `Metrik ${platformMeta.label} asli sudah masuk ke form. Anda tetap bisa mengubahnya.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      if (onAutoFilled) onAutoFilled(data);
    } catch (err) {
      if (err.code === "NOT_CONNECTED" || err.code === "REAUTH_REQUIRED") {
        setConnection({ connected: false });
      }
      toast({
        title: "Gagal menarik data",
        description: err.message || "Terjadi kesalahan saat mengambil data.",
        status: "error",
        duration: 7000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [methods, onAutoFilled, platform, platformMeta.label, toast]);

  const notConfigured = providerStatus && !providerStatus.configured;
  const blocked = notConfigured || !sessionConfigured;

  return (
    <Box
      bg="surfaceInverse"
      borderWidth="1px"
      borderColor="borderInverse"
      borderRadius="card"
      p={6}
      mb={8}
    >
      <Flex
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "stretch", md: "center" }}
        gap={4}
      >
        <Box>
          <Text fontSize="md" fontWeight="semibold" color="fgInverse">
            Cara Pengisian Data
          </Text>
          <Text fontSize="sm" color="mutedInverse">
            Isi manual sendiri, atau hubungkan akun {platformMeta.label} Anda untuk menarik
            metrik aslinya.
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
            Hubungkan Akun
          </Button>
        </HStack>
      </Flex>

      {mode === "autofill" && (
        <Box mt={6} pt={6} borderTopWidth="1px" borderColor="borderInverse">
          {isBooting ? (
            <HStack spacing={3}>
              <Spinner size="sm" color="pink.400" />
              <Text fontSize="sm" color="mutedInverse">
                Memeriksa status koneksi…
              </Text>
            </HStack>
          ) : blocked ? (
            <Alert status="warning" borderRadius="md" bg="orange.50">
              <AlertIcon />
              <AlertDescription fontSize="sm" color="black">
                {!sessionConfigured
                  ? "Sesi OAuth belum diatur di server (SOCIAL_SESSION_SECRET kosong). Hubungi admin."
                  : `Integrasi ${platformMeta.label} belum aktif di server. Kredensial yang dibutuhkan: ${
                      (providerStatus?.requiredEnv || []).join(", ") || "-"
                    }. Untuk sementara silakan pakai Isi Manual.`}
              </AlertDescription>
            </Alert>
          ) : connection.connected ? (
            <Flex
              direction={{ base: "column", sm: "row" }}
              align={{ base: "stretch", sm: "center" }}
              justify="space-between"
              gap={4}
            >
              <HStack spacing={3}>
                <Avatar
                  size="sm"
                  name={connection.profile?.fullName || platformMeta.label}
                  src={connection.profile?.avatarUrl || undefined}
                />
                <Box>
                  <HStack spacing={2}>
                    <Text fontSize="sm" fontWeight="semibold" color="fgInverse">
                      {connection.profile?.fullName || platformMeta.label}
                    </Text>
                    <Badge colorScheme="green" fontSize="10px">
                      Terhubung
                    </Badge>
                  </HStack>
                  {connection.profile?.username && (
                    <Text fontSize="xs" color="mutedInverse">
                      @{String(connection.profile.username).replace(/^@/, "")}
                    </Text>
                  )}
                </Box>
              </HStack>

              <HStack spacing={2}>
                <Button
                  colorScheme="pink"
                  onClick={handleAutoFill}
                  isLoading={isLoading}
                  loadingText="Menarik data..."
                  leftIcon={<FaLink />}
                >
                  Auto-Isi Form
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  color="mutedInverse"
                  onClick={handleDisconnect}
                  leftIcon={<FaRightFromBracket />}
                >
                  Putuskan
                </Button>
              </HStack>
            </Flex>
          ) : (
            <Flex
              direction={{ base: "column", sm: "row" }}
              align={{ base: "stretch", sm: "center" }}
              justify="space-between"
              gap={4}
            >
              <Text fontSize="sm" color="mutedInverse" maxW="lg">
                Login ke akun {platformMeta.label} Anda lewat halaman resmi platform. Cardify
                menarik metrik akun Anda langsung dari API resmi — bukan data simulasi.
              </Text>
              <Button
                colorScheme="pink"
                onClick={startConnect}
                flexShrink={0}
                leftIcon={<FaLink />}
              >
                {platformMeta.connectLabel}
              </Button>
            </Flex>
          )}
        </Box>
      )}
    </Box>
  );
}
