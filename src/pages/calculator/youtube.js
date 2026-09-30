import { useForm, useWatch } from "react-hook-form";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  Text,
  Flex,
  Heading,
  Divider,
  LightMode,
  Image,
  DarkMode,
  IconButton,
  useToast,
} from "@chakra-ui/react";
import RHFFormProvider from "@/components/hook-form/RHFFormProvider";

import { NICHES } from "@/constants/niches";
import { CONTENT_TYPES } from "@/constants/contentTypes";
import {
  calculateRate,
  calculateBaseRate,
  calculateEngagementMultiplier,
  calculateEngagementRate,
  finalizeRate,
  formatFloor,
} from "@/constants/formulas";

import PageMeta from "@/components/PageMeta";

import RHFSingleFileUpload from "@/components/hook-form/RHFSingleFileUpload";
import RHFInput from "@/components/hook-form/RHFInput";
import RHFNumberInput from "@/components/hook-form/RHFNumberInput";
import RHFSelect from "@/components/hook-form/RHFSelect";

import { FaYoutube, FaXmark } from "react-icons/fa6";
import HomeLayout from "@/Layouts/HomePageLayout";
import CalculatorTabLayout from "@/Layouts/CalculatorTabLayout";
import Wordmark from "@/components/Wordmark";
import { SITE_URL } from "@/components/Seo";
import {
  exportElementToPdf,
  sanitizePdfFilename,
} from "@/utils/exportElementToPdf";
import { FiDownload } from "react-icons/fi";
import { YoutubeLogo } from "@/components/CalcHero";
import { FaUsers } from "react-icons/fa";

const formatIDR = (value) =>
  `Rp ${Math.round(Number(value) || 0).toLocaleString("id-ID")}`;

const numberRule = (label, { min = 0 } = {}) => ({
  validate: (value) => {
    if (value === "" || value === undefined || value === null) {
      return `${label} wajib diisi`;
    }
    if (value < min) return `${label} minimal ${min}`;
    return true;
  },
});

Youtube.getLayout = function getLayout(page) {
  return (
    <HomeLayout>
      <CalculatorTabLayout>{page}</CalculatorTabLayout>
    </HomeLayout>
  );
};

export default function Youtube() {
  const [results, setResults] = useState(null);
  const methods = useForm({
    defaultValues: {
      fullName: "",
      youtubeHandle: "",
      displayPicture: null,
      analyticsScreenshot: null,
      dataPeriod: "",
      avgViewsPerVideo: "",
      avgLikesPerVideo: "",
      avgCommentsPerVideo: "",
      avgSharesPerVideo: "",
      niche: "",
      totalSubscribers: "",
    },
    mode: "onSubmit",
  });

  const onSubmit = (data) => {
    const nicheConfig = NICHES.find((n) => n.id === data.niche);
    if (!nicheConfig) return;

    const avgViews = Number(data.avgViewsPerVideo);
    
    const engagementRate = calculateEngagementRate({
      views: avgViews,
      likes: data.avgLikesPerVideo,
      comments: data.avgCommentsPerVideo,
      shares: data.avgSharesPerVideo,
    });

    const youtubeCpm = nicheConfig.platformCPMs.youtube;

    const rateFor = (cpm, durationMultiplier = 1) =>
      calculateRate({
        impressions: avgViews,
        cpm,
        engagementRate,
        nicheERBenchmark: nicheConfig.youtubeERBenchmark,
        nicheMultiplier: nicheConfig.engagementMultiplier,
        durationMultiplier,
      });

    const contentTypes = CONTENT_TYPES.youtube
      .map((ct) => {
        const cpm = youtubeCpm[ct.cpmRef];
        if (!cpm) return null;

        const floor = formatFloor(cpm, youtubeCpm.dedicatedVideo);
        const rawRate = rateFor(cpm);
        const rate = finalizeRate(rawRate, floor);
        return {
          id: ct.id,
          label: ct.label,
          description: ct.description,
          cpm,
          floor,
          rate,
          durations: (ct.durationOptions || []).map((dur) => ({
            label: dur.label,
            rate: finalizeRate(rawRate * dur.multiplierExtra, floor),
          })),
        };
      })
      .filter(Boolean);

    const primary =
      contentTypes.find((ct) => ct.id === "dedicatedVideo") ?? contentTypes[0];

    setResults({
      niche: nicheConfig.label,
      displayPicture: data.displayPicture,
      fullName: data.fullName,
      username: data.youtubeHandle,
      dataPeriod: data?.dataPeriod,
      totalSubscribers: Number(data.totalSubscribers) || 0,
      avgViews,
      engagementRate,
      engagementMult: calculateEngagementMultiplier(
        engagementRate,
        nicheConfig.youtubeERBenchmark,
      ),
      nicheMultiplier: nicheConfig.engagementMultiplier,
      baseRate: calculateBaseRate(avgViews, primary.cpm),
      cpm: primary.cpm,
      ratePerVideo: primary.rate,
      youtubeERBenchmark: nicheConfig.youtubeERBenchmark,
      contentTypes,
    });
  };

  const handleReset = () => {
    methods.reset();
    setResults(null);
  };

  const [isExporting, setIsExporting] = useState(false);
  const exportLockRef = useRef(false);
  const abortRef = useRef(null);
  const mountedRef = useRef(true);
  const toast = useToast();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    if (exportLockRef.current) return;
    exportLockRef.current = true;
    setIsExporting(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const element = document.getElementById("youtube-results");
      if (!element) throw new Error("Blok hasil belum dirender.");

      const name =
        sanitizePdfFilename(results?.username) ||
        sanitizePdfFilename(results?.fullName) ||
        "creator";

      await exportElementToPdf(element, {
        filename: `Rate Card Youtube ${name}.pdf`,
        linkSelectors: ["#document-watermark"],
        signal: controller.signal,
      });
    } catch (error) {
      if (error?.name === "AbortError") return;
      console.error("[youtube] PDF export failed", error);
      if (mountedRef.current) {
        toast({
          title: "Gagal membuat PDF",
          description:
            "Gambar hasil perhitungan tidak bisa diproses. Coba lagi sebentar lagi.",
          status: "error",
          duration: 6000,
          isClosable: true,
        });
      }
    } finally {
      abortRef.current = null;
      exportLockRef.current = false;
      setIsExporting(false);
    }
  }, [results, toast]);

  const nicheOptions = NICHES.map((n) => ({
    value: n.id,
    label: n.label,
  }));

  return (
    <>
      <PageMeta title="Youtube Calculator" />
      <RHFFormProvider
        methods={methods}
        onSubmit={methods.handleSubmit(onSubmit)}
      >
        <LightMode>
          <Box bg="bgInverse" color="fgInverse" minH="100vh" py={12}>
            <Container maxW="container.xl">
              <Box mb={8} textAlign="center">
                <Heading as="h1" size="xl" mb={2}>
                  {results
                    ? "Hasil Perhitungan Rate Card YouTube"
                    : "YouTube Rate Card Calculator"}
                </Heading>
                <Text color="mutedInverse" fontSize="lg">
                  Hitung estimasi harga konten YouTube Anda berdasarkan data
                  analytics.
                </Text>
              </Box>

              {!results && (
                <Box
                  bg="surfaceInverse"
                  borderWidth="1px"
                  borderColor="borderInverse"
                  borderRadius="card"
                  p={8}
                >
                  <Box mb={8}>
                    <Heading size="md" color="fgInverse" mb={4}>
                      Bagian 1: Identitas Channel
                    </Heading>
                    <Grid
                      templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                      gap={6}
                    >
                      <RHFInput
                        name="fullName"
                        label="Nama Lengkap / Channel"
                        placeholder="Nama asli kreator / Nama channel"
                        isRequired
                        rules={{ required: "Nama lengkap wajib diisi" }}
                      />
                      <RHFInput
                        name="youtubeHandle"
                        label="Channel Handle / Username"
                        placeholder="@channelname"
                        isRequired
                        rules={{ required: "Username YouTube wajib diisi" }}
                      />
                      <Box gridColumn={{ base: "span 1", md: "span 2" }}>
                        <RHFNumberInput
                          name="totalSubscribers"
                          label="Total Subscribers"
                          placeholder="0"
                          isRequired
                          min={0}
                          rules={numberRule("Total subscribers", { min: 1 })}
                        />
                      </Box>
                      <Box gridColumn={{ base: "span 1", md: "span 2" }}>
                        <RHFSingleFileUpload
                          name="displayPicture"
                          label="Channel Avatar / Banner (opsional)"
                          typeFile={["image"]}
                          helperText="Upload foto profil atau banner channel YouTube Anda (JPG, PNG)."
                        />
                      </Box>
                    </Grid>
                  </Box>

                  <Divider borderColor="borderInverse" my={8} />

                  <Box mb={8}>
                    <Heading size="md" color="fgInverse" mb={4}>
                      Bagian 2: Data Performa Video (Rata-rata per Video)
                    </Heading>
                    <Grid
                      templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                      gap={6}
                    >
                      <RHFSelect
                        name="dataPeriod"
                        label="Periode Data"
                        placeholder="Pilih periode data"
                        bg="white"
                        options={[
                          { value: "7", label: "7 hari terakhir" },
                          { value: "14", label: "14 hari terakhir" },
                          { value: "30", label: "30 hari terakhir" },
                          { value: "90", label: "90 hari terakhir" },
                        ]}
                        isRequired
                        rules={{ required: "Periode data wajib diisi" }}
                      />
                      <RHFNumberInput
                        name="avgViewsPerVideo"
                        label="Rata-rata Views per Video"
                        placeholder="0"
                        isRequired
                        min={0}
                        rules={numberRule("Rata-rata views", { min: 1 })}
                        helperText="Jumlah rata-rata views per video dalam periode tersebut."
                      />
                      <RHFNumberInput
                        name="avgLikesPerVideo"
                        label="Rata-rata Likes per Video"
                        placeholder="0"
                        isRequired
                        min={0}
                        rules={numberRule("Rata-rata likes")}
                        helperText="Jumlah rata-rata likes per video."
                      />
                      <RHFNumberInput
                        name="avgCommentsPerVideo"
                        label="Rata-rata Comments per Video"
                        placeholder="0"
                        isRequired
                        min={0}
                        rules={numberRule("Rata-rata comments")}
                        helperText="Jumlah rata-rata komentar per video."
                      />
                      <RHFNumberInput
                        name="avgSharesPerVideo"
                        label="Rata-rata Shares per Video"
                        placeholder="0"
                        isRequired
                        min={0}
                        rules={numberRule("Rata-rata shares")}
                        helperText="Jumlah rata-rata share per video."
                      />
                    </Grid>
                  </Box>

                  <Divider borderColor="borderInverse" my={8} />

                  <Box mb={8}>
                    <Heading size="md" color="fgInverse" mb={4}>
                      Bagian 3: Parameter Kalkulasi
                    </Heading>
                    <Grid
                      templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                      gap={6}
                    >
                      <RHFSelect
                        name="niche"
                        label="Niche / Kategori Konten"
                        placeholderValue="Pilih niche"
                        isRequired
                        bg="white"
                        color="black"
                        options={nicheOptions}
                        rules={{ required: "Niche wajib dipilih" }}
                      />
                      <Box gridColumn={{ base: "span 1", md: "span 2" }}>
                        <Text fontSize="xs" color="mutedInverse">
                          Tipe konten dan durasi akan dihitung secara otomatis untuk menampilkan estimasi semua format YouTube (Integration & Dedicated Video).
                        </Text>
                      </Box>
                    </Grid>
                  </Box>

                  <Box mt={8} mb={8} textAlign="center">
                    <Button
                      type="submit"
                      colorScheme="youtubeRed"
                      size="lg"
                      px={10}
                      py={3}
                    >
                      <FaYoutube style={{ marginInlineEnd: "0.5rem" }} />
                      Hitung Rate Card
                    </Button>
                  </Box>
                </Box>
              )}

              {results && (
                <Box
                  id="youtube-results"
                  bg="surfaceInverse"
                  borderWidth="1px"
                  borderColor="borderInverse"
                  borderRadius="2xl"
                  overflow="hidden"
                  p={8}
                  mt={8}
                >
                  <Box
                    bg="youtubeRed.500"
                    mt={-8}
                    mx={-8}
                    p={10}
                    position="relative"
                  >
                    <DarkMode>
                      <Grid
                        gridGap={10}
                        templateColumns={{base: '1fr', lg: "max-content 1fr"}}
                        alignItems="center"
                      >
                        <Box position="relative" w='max-content' h='max-content'>
                          <Box
                            rounded="full"
                            overflow="hidden"
                            w={{base:'10ch', lg: "25ch"}}
                            h={{base:'10ch', lg: "25ch"}}
                          >
                            {results?.displayPicture ? (
                              <Image
                                src={results?.displayPicture}
                                alt="Display Picture"
                                objectFit="cover"
                              />
                            ) : (
                              <YoutubeLogo />
                            )}
                          </Box>
                          <IconButton
                            icon={<FaYoutube />}
                            colorScheme="youtubeRed"
                            aria-label="YouTube"
                            position="absolute"
                            bottom="0"
                            right="0"
                            size={{base:'xs', lg:'md'}}
                          />
                        </Box>
                        <Box>
                          <Text
                            as="h1"
                            fontSize="4xl"
                            fontWeight="bold"
                            color="bgInverse"
                          >
                            {results.fullName}
                          </Text>
                          <Text
                            color="muted"
                            as="h1"
                            fontSize="2xl"
                            fontWeight="bold"
                          >
                            {results.username}
                          </Text>
                          <Button leftIcon={<FaUsers />} mt={2}>
                            {results?.totalSubscribers.toLocaleString("id-ID")}{" "}
                            Subscribers
                          </Button>
                        </Box>
                      </Grid>
                    </DarkMode>
                    <Button
                      leftIcon={<FiDownload />}
                      onClick={handleDownloadPdf}
                      isLoading={isExporting}
                      data-html2canvas-ignore="true"
                      position="absolute"
                      top="5"
                      right="5"
                    >
                      Unduh PDF
                    </Button>
                  </Box>

                  <Grid
                    templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                    gap={6}
                    mb={8}
                    mt={8}
                  >
                    <Box>
                      <Text color="mutedInverse" fontSize="sm">
                        Niche
                      </Text>
                      <Text color="fgInverse" fontWeight="bold" fontSize="lg">
                        {results.niche}
                      </Text>
                    </Box>
                    <Box>
                      <Text color="mutedInverse" fontSize="sm">
                        Avg Views per Video
                      </Text>
                      <Text color="fgInverse" fontWeight="bold" fontSize="lg">
                        {results.avgViews.toLocaleString("id-ID")}
                      </Text>
                      <Text color="mutedInverse" fontSize="xs">
                        Metrik utama driver tarif
                      </Text>
                    </Box>
                    <Box>
                      <Text color="mutedInverse" fontSize="sm">
                        Engagement Rate (per video)
                      </Text>
                      <Text color="fgInverse" fontWeight="bold" fontSize="lg">
                        {results.engagementRate.toFixed(2)}%
                      </Text>
                      <Text color="mutedInverse" fontSize="xs">
                        total interaksi ÷ avg views
                      </Text>
                    </Box>
                    <Box>
                      <Text color="mutedInverse" fontSize="sm">
                        CPM Acuan (Dedicated Video)
                      </Text>
                      <Text color="fgInverse" fontWeight="bold" fontSize="lg">
                        {formatIDR(results.cpm)} / 1000 views
                      </Text>
                      <Text color="mutedInverse" fontSize="xs">
                        base rate {formatIDR(results.baseRate)} sebelum multiplier
                      </Text>
                    </Box>
                    <Box>
                      <Text color="mutedInverse" fontSize="sm">
                        Multiplier Engagement
                      </Text>
                      <Text color="fgInverse" fontWeight="bold" fontSize="lg">
                        {results.engagementMult.toFixed(2)}x
                      </Text>
                      <Text color="mutedInverse" fontSize="xs">
                        benchmark niche {results.youtubeERBenchmark}%
                      </Text>
                    </Box>
                    <Box>
                      <Text color="mutedInverse" fontSize="sm">
                        Multiplier Niche
                      </Text>
                      <Text color="fgInverse" fontWeight="bold" fontSize="lg">
                        {results.nicheMultiplier}x
                      </Text>
                    </Box>
                  </Grid>

                  <Divider borderColor="borderInverse" my={6} />

                  <Heading size="md" color="fgInverse" mb={4}>
                    Estimasi Harga per Content Type
                  </Heading>
                  <Grid
                    templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                    gap={4}
                  >
                    {results.contentTypes.map((ct) => (
                      <Box
                        key={ct.id}
                        bg="bgInverse"
                        borderWidth="1px"
                        borderColor="borderInverse"
                        borderRadius="card"
                        p={4}
                      >
                        <Text color="fgInverse" fontWeight="bold" fontSize="md">
                          {ct.label}
                        </Text>
                        <Text color="mutedInverse" fontSize="sm" mt={1}>
                          {ct.description}
                        </Text>
                        <Box mt={3}>
                          <Text color="mutedInverse" fontSize="xs">
                            Harga per video
                          </Text>
                          <Text
                            color="fgInverse"
                            fontWeight="bold"
                            fontSize="lg"
                          >
                            {formatIDR(ct.rate)}
                          </Text>
                          <Text color="mutedInverse" fontSize="xs" mt={1}>
                            CPM {formatIDR(ct.cpm)}/1000 views · minimum{" "}
                            {formatIDR(ct.floor)}
                          </Text>
                        </Box>
                        {ct.durations.length > 0 && (
                          <Box mt={2}>
                            <Text
                              color="mutedInverse"
                              fontSize="xs"
                              textTransform="uppercase"
                            >
                              Breakdown per durasi
                            </Text>
                            {ct.durations.map((dur) => (
                              <Flex
                                key={dur.label}
                                justify="space-between"
                                mt={1}
                              >
                                <Text color="mutedInverse" fontSize="sm">
                                  {dur.label}
                                </Text>
                                <Text color="fgInverse" fontSize="sm">
                                  {formatIDR(dur.rate)}
                                </Text>
                              </Flex>
                            ))}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Grid>

                  <Box mt={6} textAlign="center">
                    <Button
                      id="document-watermark"
                      as="a"
                      href={SITE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="lg"
                      colorScheme="youtubeRed"
                    >
                      <Box>
                        <Text fontSize="sm">Made with </Text>
                        <Wordmark />
                      </Box>
                    </Button>
                  </Box>
                </Box>
              )}
            </Container>
            {results && (
              <Box mt={6} textAlign="center">
                <Button
                  onClick={handleReset}
                  colorScheme="gray"
                  variant="outline"
                >
                  <FaXmark style={{ marginInlineEnd: "0.5rem" }} />
                  Hitung Ulang
                </Button>
              </Box>
            )}
          </Box>
        </LightMode>
      </RHFFormProvider>
    </>
  );
}
